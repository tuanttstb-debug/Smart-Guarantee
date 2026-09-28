/**
 * Store.gs — Drive (file) + Sheet vận hành (JOBS, AUDIT) — DRIVE_STRUCTURE.md v2.
 * Cây Drive: Smart-Guarantee/{INPUT,EXTRACTED,OUTPUT,TEMPLATE,CONFIG}
 *   INPUT/<doc_id>.<ext>             thư KH gốc
 *   EXTRACTED/<doc_id>.json          kết quả bóc tách + bản chỉnh cuối (truy vết)
 *   OUTPUT/<doc_id>__<tpl>.docx      thư đã sinh
 *   TEMPLATE/<template_id>.docx      mẫu đã chuẩn hoá (máy sinh từ TEMPLATE_GOC — Templates.gs)
 *   CONFIG/catalog.json              danh mục mẫu + slot + xem trước
 */

// ── Drive ──
var _folderCache = {};

function rootFolder_() {
  var id = SG.driveRootId();
  if (id) return DriveApp.getFolderById(id);
  var it = DriveApp.getFoldersByName(SG.ROOT_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(SG.ROOT_NAME);
}

/** Folder con chức năng (id cache 6h để khỏi duyệt Drive mỗi request). */
function subFolder_(name) {
  if (_folderCache[name]) return _folderCache[name];
  var cache = CacheService.getScriptCache();
  var key = 'sg_folder_' + name;
  var id = cache.get(key);
  var folder = null;
  if (id) { try { folder = DriveApp.getFolderById(id); } catch (_) { folder = null; } }
  if (!folder) {
    var root = rootFolder_();
    var it = root.getFoldersByName(name);
    folder = it.hasNext() ? it.next() : root.createFolder(name);
    cache.put(key, folder.getId(), 21600);
  }
  _folderCache[name] = folder;
  return folder;
}

function saveBlob_(folderName, name, blob) {
  var old = findFile_(folderName, name);
  if (old) old.setTrashed(true);
  return subFolder_(folderName).createFile(blob.setName(name));
}

function findFile_(folderName, name) {
  var it = subFolder_(folderName).getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}

function writeJson_(folderName, name, obj) {
  var existing = findFile_(folderName, name);
  var content = JSON.stringify(obj);
  if (existing) { existing.setContent(content); return existing; }
  return subFolder_(folderName).createFile(name, content, 'application/json');
}

function readJson_(folderName, name) {
  var f = findFile_(folderName, name);
  if (!f) return null;
  return JSON.parse(f.getBlob().getDataAsString('UTF-8'));
}

/** doc_id SG-YYYYMMDD-NNN — bộ đếm theo ngày trong Script Properties, khoá chống trùng. */
function nextDocId_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
    var ymd = Utilities.formatDate(new Date(), tz, 'yyyyMMdd');
    var props = PropertiesService.getScriptProperties();
    var key = 'SEQ_' + ymd;
    var seq = Number(props.getProperty(key) || 0) + 1;
    props.setProperty(key, String(seq));
    return 'SG-' + ymd + '-' + ('00' + seq).slice(-3);
  } finally {
    lock.releaseLock();
  }
}

// ── Sheet vận hành ──
var _opsSS = null;
function opsSheet_(name) {
  var id = SG.opsSheetId();
  if (!id) throw err_('NOT_CONFIGURED', 'Chưa đặt OPS_SHEET_ID (chạy setupOpsSheet)');
  _opsSS = _opsSS || SpreadsheetApp.openById(id);
  var sh = _opsSS.getSheetByName(name);
  if (!sh) throw err_('NOT_CONFIGURED', 'Thiếu tab ' + name + ' trong Sheet vận hành (chạy setupOpsSheet)');
  return sh;
}

/** Đọc 1 tab thành mảng object {header: value}. */
function readTable_(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values[0].map(function (h) { return String(h).trim(); });
  return values.slice(1)
    .filter(function (r) { return r.some(function (c) { return c !== '' && c != null; }); })
    .map(function (r) { var o = {}; header.forEach(function (h, i) { o[h] = r[i]; }); return o; });
}

/** AUDIT: ts | user | action | doc_id | result | ms — chỉ metadata, KHÔNG nội dung thư. */
function audit_(user, action, docId, result, ms) {
  try { opsSheet_('AUDIT').appendRow([new Date(), user || '', action || '', docId || '', result || '', ms || 0]); }
  catch (e) { console.warn('audit fail: ' + e); }
}

var JOB_COLS = ['doc_id', 'created_at', 'username', 'file_name', 'status', 'guarantee_type', 'template_id', 'updated_at', 'output_file'];

/** Ghi/cập nhật 1 dòng JOBS theo doc_id. patch: {status, template_id, ...}. */
function upsertJob_(docId, patch) {
  var sh = opsSheet_('JOBS');
  var found = sh.getRange('A:A').createTextFinder(docId).matchEntireCell(true).findNext();
  var row;
  if (found) {
    row = found.getRow();
  } else {
    sh.appendRow([docId, new Date()]);
    row = sh.getLastRow();
  }
  patch.updated_at = new Date();
  Object.keys(patch).forEach(function (k) {
    var c = JOB_COLS.indexOf(k);
    if (c >= 0) sh.getRange(row, c + 1).setValue(patch[k]);
  });
}

function getJob_(docId) {
  var sh = opsSheet_('JOBS');
  var found = sh.getRange('A:A').createTextFinder(docId).matchEntireCell(true).findNext();
  if (!found) return null;
  var vals = sh.getRange(found.getRow(), 1, 1, JOB_COLS.length).getValues()[0];
  var o = {};
  JOB_COLS.forEach(function (k, i) { o[k] = vals[i]; });
  return o;
}

/** Chỉ chủ hồ sơ hoặc admin được thao tác doc_id. */
function assertOwner_(docId, user) {
  if (!docId || !/^SG-\d{8}-\d{3,}$/.test(docId)) throw err_('PARSE_ERROR', 'doc_id không hợp lệ');
  var job = getJob_(docId);
  if (!job) throw err_('NOT_FOUND', 'Không thấy hồ sơ ' + docId);
  if (user.role !== 'admin' && String(job.username) !== user.username) {
    throw err_('FORBIDDEN', 'Hồ sơ ' + docId + ' thuộc người dùng khác');
  }
  return job;
}

function handleHistory_(body, user) {
  var rows = readTable_(opsSheet_('JOBS'));
  if (user.role !== 'admin' || !body.all) rows = rows.filter(function (r) { return String(r.username) === user.username; });
  rows.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  return {
    ok: true,
    items: rows.slice(0, 50).map(function (r) {
      return {
        doc_id: r.doc_id, created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
        username: r.username, file_name: r.file_name, status: r.status,
        guarantee_type: r.guarantee_type, template_id: r.template_id,
      };
    }),
  };
}
