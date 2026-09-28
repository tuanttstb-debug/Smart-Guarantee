/**
 * Templates.gs — quản lý THƯ VIỆN MẪU trên Drive (nghiệp vụ tự vận hành, không cần máy dev).
 *
 *   Smart-Guarantee/TEMPLATE_GOC/…   ← NƠI DUY NHẤT sửa mẫu (Word). BA sửa/thêm file tự do.
 *   Smart-Guarantee/TEMPLATE/<mã>.docx  ← máy sinh (mẫu có slot) — KHÔNG sửa tay.
 *   Sheet OPS › MAU_THU               ← BẢNG MÃ HOÁ MẪU: mã ổn định ↔ file (theo file ID, đổi tên file không sao),
 *                                         chiều nghiệp vụ (BA sửa được), active, trạng thái chuẩn hoá.
 *   Sheet OPS › SLOT_REVIEW           ← từng chỗ trống của từng mẫu được gắn slot gì (để nghiệp vụ rà).
 *
 * rebuildTemplates(): quét TEMPLATE_GOC → file mới tự thêm vào MAU_THU (suy chiều từ tên/thư mục) →
 * chuẩn hoá lại file đã sửa kể từ lần trước → mẫu còn chỗ trống lạ: đánh dấu ⚠, GIỮ bản đang chạy →
 * dựng lại CONFIG/catalog.json. Chạy: nút admin trên FE, trigger hằng đêm, hoặc editor.
 */
var GOC_FOLDER = 'TEMPLATE_GOC';
var MAU_COLS = ['ma_mau', 'ten_mau', 'loai_bl', 'bo_mau', 'linh_vuc', 'so_tui', 'bien_the', 'lien_danh', 'hinh_thuc',
  'active', 'file_id', 'duong_dan', 'trang_thai', 'so_slot', 'chuan_hoa_luc', 'ghi_chu'];
var SLOT_REVIEW_COLS = ['ma_mau', 'slot', 'ngu_canh_trai', 'cho_trong', 'ngu_canh_phai'];
var REBUILD_BUDGET_MS = 270000;   // 4,5' — chừa biên trước trần 6' của GAS

// ── Drive helpers ──
function gocFolder_() {
  var root = rootFolder_(), it = root.getFoldersByName(GOC_FOLDER);
  return it.hasNext() ? it.next() : root.createFolder(GOC_FOLDER);
}

/** Duyệt đệ quy TEMPLATE_GOC → [{file, id, name, path, updated}] (bỏ file khoá Word ~$). */
function listGocFiles_() {
  var out = [];
  (function walk(folder, prefix) {
    var files = folder.getFiles();
    while (files.hasNext()) {
      var f = files.next(), name = f.getName();
      if (/\.docx$/i.test(name) && name.indexOf('~$') !== 0) {
        out.push({ file: f, id: f.getId(), name: name, path: prefix, updated: f.getLastUpdated().getTime() });
      }
    }
    var subs = folder.getFolders();
    while (subs.hasNext()) { var s = subs.next(); walk(s, prefix ? prefix + '/' + s.getName() : s.getName()); }
  })(gocFolder_(), '');
  return out;
}

function ensureFolderPath_(base, relPath) {
  var f = base;
  relPath.split('/').filter(Boolean).forEach(function (name) {
    var it = f.getFoldersByName(name);
    f = it.hasNext() ? it.next() : f.createFolder(name);
  });
  return f;
}

/** Chuẩn hoá 1 blob .docx → { blob, slots, preview, report, unmapped } (SGNormalize — cùng mã với tools/normalize.js). */
function normalizeDocxBlob_(blob, outName) {
  var entries = Utilities.unzip(blob.copyBlob().setContentType('application/zip'));
  var parts = {};
  entries.forEach(function (b) { if (SGNormalize.wantsPart(b.getName())) parts[b.getName()] = b.getDataAsString('UTF-8'); });
  var r = SGNormalize.normalizeParts(parts);
  var out = [];
  entries.forEach(function (b) {
    var n = b.getName();
    if (SGNormalize.dropsPart(n)) return;
    out.push(r.parts[n] != null ? Utilities.newBlob('', 'application/xml', n).setDataFromString(r.parts[n], 'UTF-8') : b);
  });
  r.blob = Utilities.zip(out, outName).setContentType(DOCX_MIME);
  return r;
}

// ── Bảng MAU_THU ──
function readMauThu_() {
  var sh = opsSheet_('MAU_THU');
  var values = sh.getDataRange().getValues();
  var header = values[0].map(function (h) { return String(h).trim(); });
  var rows = values.slice(1).map(function (r) {
    var o = {};
    header.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  }).filter(function (o) { return String(o.ma_mau || '').trim(); });
  return { sheet: sh, header: header, rows: rows };
}

function writeMauThu_(t) {
  var sh = t.sheet, header = t.header;
  var data = t.rows.map(function (o) { return header.map(function (h) { return o[h] == null ? '' : o[h]; }); });
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, header.length).clearContent();
  if (data.length) sh.getRange(2, 1, data.length, header.length).setValues(data);
}

function isActive_(v) { return v === true || /^(true|x|1|có|co)$/i.test(String(v).trim()); }

function metaOfRow_(o) {
  return {
    loai_bl: String(o.loai_bl || ''), bo_mau: String(o.bo_mau || ''), linh_vuc: String(o.linh_vuc || ''),
    so_tui: String(o.so_tui || ''), bien_the: String(o.bien_the || ''),
    lien_danh: String(o.lien_danh || 'KO'), hinh_thuc: String(o.hinh_thuc || 'TG'),
  };
}

// ── Dựng lại thư viện ──
function rebuildTemplates(opts) {
  opts = opts || {};
  var t0 = Date.now();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw err_('BUSY', 'Đang có phiên cập nhật thư viện mẫu khác chạy');
  try {
    var files = listGocFiles_();
    var byId = {};
    files.forEach(function (f) { byId[f.id] = f; });
    var t = readMauThu_();
    var taken = {}, seen = {};
    t.rows.forEach(function (o) { taken[o.ma_mau] = true; seen[o.file_id] = true; });

    // 1) file mới trong TEMPLATE_GOC → thêm dòng (suy chiều từ tên file + thư mục)
    var added = 0;
    files.forEach(function (f) {
      if (seen[f.id]) return;
      var meta = SGRegistry.inferMeta(f.path, f.name);
      t.rows.push({
        ma_mau: SGRegistry.makeCode(meta, taken), ten_mau: SGRegistry.labelOf(meta),
        loai_bl: meta.loai_bl, bo_mau: meta.bo_mau, linh_vuc: meta.linh_vuc, so_tui: meta.so_tui, bien_the: meta.bien_the,
        lien_danh: meta.lien_danh, hinh_thuc: meta.hinh_thuc, active: meta.parsed, file_id: f.id,
        duong_dan: f.path + '/' + f.name, trang_thai: meta.parsed ? 'MỚI' : 'MỚI — tên file không theo quy ước, BA điền các cột chiều rồi đặt active',
        so_slot: '', chuan_hoa_luc: '', ghi_chu: '',
      });
      added++;
    });

    // 2) dữ liệu chuẩn hoá cũ (để giữ bản đang chạy khi không cần/không thể chuẩn hoá lại)
    var old = {};
    var cf = findFile_('CONFIG', 'catalog.json');
    if (cf) JSON.parse(cf.getBlob().getDataAsString('UTF-8')).templates.forEach(function (x) { old[x.id] = x; });
    var have = {}, it = subFolder_('TEMPLATE').getFiles();
    while (it.hasNext()) have[it.next().getName()] = true;

    // 3) chuẩn hoá lại file đã đổi
    var fresh = {}, rebuilt = 0, warn = 0, pending = 0, reviewByCode = {};
    t.rows.forEach(function (o) {
      var f = byId[o.file_id];
      if (!f) { o.trang_thai = 'KHÔNG THẤY FILE trong TEMPLATE_GOC'; return; }
      o.duong_dan = f.path + '/' + f.name;
      var doneAt = o.chuan_hoa_luc ? new Date(o.chuan_hoa_luc).getTime() : 0;
      var need = opts.force || !have[o.ma_mau + '.docx'] || !old[o.ma_mau] || f.updated > doneAt;
      if (!need) return;
      if (Date.now() - t0 > REBUILD_BUDGET_MS) { pending++; return; }
      try {
        var r = normalizeDocxBlob_(f.file.getBlob(), o.ma_mau + '.docx');
        reviewByCode[o.ma_mau] = r.report;
        if (r.unmapped) {
          var ex = r.report.filter(function (x) { return !x.slot; }).slice(0, 3)
            .map(function (x) { return '"…' + x.left.slice(-25) + ' ' + x.blank + '"'; }).join('; ');
          o.trang_thai = '⚠ ' + r.unmapped + ' chỗ trống chưa nhận diện (' + ex + ')' + (old[o.ma_mau] ? ' — đang dùng bản cũ' : ' — CHƯA dùng được');
          warn++;
        } else {
          saveBlob_('TEMPLATE', o.ma_mau + '.docx', r.blob);
          fresh[o.ma_mau] = { slots: r.slots, preview: r.preview };
          o.trang_thai = o.loai_bl && o.bo_mau ? 'OK'
            : 'Chuẩn hoá OK — BA điền loai_bl, bo_mau (và các cột chiều) rồi đặt active=TRUE';
          o.so_slot = r.slots.length;
          rebuilt++;
        }
        o.chuan_hoa_luc = new Date();
      } catch (e) {
        o.trang_thai = 'LỖI: ' + String(e.message || e).slice(0, 150);
        warn++;
      }
    });

    // 4) catalog từ bảng (chiều do BA quản lý) + slot/preview (mới hoặc cũ)
    var catalog = [];
    t.rows.forEach(function (o) {
      var d = fresh[o.ma_mau] || old[o.ma_mau];
      if (!d || !isActive_(o.active) || !byId[o.file_id] || !o.loai_bl || !o.bo_mau) return;
      var m = metaOfRow_(o);
      catalog.push({
        id: o.ma_mau, label: String(o.ten_mau || '') || SGRegistry.labelOf(m),
        guarantee_type: m.loai_bl, template_type: m.bo_mau, method: m.hinh_thuc, joint_venture: m.lien_danh,
        sector: m.linh_vuc, envelope: m.so_tui, variant: m.bien_the, slots: d.slots, preview: d.preview,
      });
    });
    writeJson_('CONFIG', 'catalog.json', { version: 3, built_at: new Date().toISOString(), templates: catalog });
    writeMauThu_(t);
    updateSlotReview_(reviewByCode);
    CacheService.getScriptCache().remove(CATALOG_CACHE_KEY);

    if (pending) scheduleRebuildContinue_(); else clearRebuildContinue_();
    var summary = {
      files: files.length, added: added, rebuilt: rebuilt, warnings: warn, pending: pending,
      active_in_catalog: catalog.length, seconds: Math.round((Date.now() - t0) / 1000),
    };
    console.log('rebuildTemplates ' + JSON.stringify(summary));
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function updateSlotReview_(reviewByCode) {
  var codes = Object.keys(reviewByCode);
  if (!codes.length) return;
  var sh = opsSheet_('SLOT_REVIEW');
  var keep = readTable_(sh).filter(function (r) { return codes.indexOf(String(r.ma_mau)) < 0; })
    .map(function (r) { return SLOT_REVIEW_COLS.map(function (c) { return r[c]; }); });
  codes.forEach(function (c) {
    reviewByCode[c].forEach(function (x) { keep.push([c, x.slot || '⚠ CHƯA NHẬN DIỆN', x.left, x.blank, x.right]); });
  });
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, SLOT_REVIEW_COLS.length).clearContent();
  if (keep.length) sh.getRange(2, 1, keep.length, SLOT_REVIEW_COLS.length).setValues(keep);
}

// ── Chạy tiếp khi hết thời gian / hằng đêm ──
function rebuildTemplatesContinue() { rebuildTemplates({}); }

function scheduleRebuildContinue_() {
  clearRebuildContinue_();
  ScriptApp.newTrigger('rebuildTemplatesContinue').timeBased().after(60 * 1000).create();
}
function clearRebuildContinue_() {
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'rebuildTemplatesContinue') ScriptApp.deleteTrigger(tr);
  });
}

/** Cài trigger cập nhật thư viện mẫu lúc 2h sáng mỗi ngày (chạy 1 lần). */
function installNightlyRebuild() {
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'rebuildTemplatesNightly') ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('rebuildTemplatesNightly').timeBased().everyDays(1).atHour(2).create();
  Logger.log('Đã cài cập nhật thư viện mẫu lúc 2h hằng ngày');
}
function rebuildTemplatesNightly() { rebuildTemplates({}); }

/** action=rebuild_templates (chỉ admin) — nút "Cập nhật thư viện mẫu" trên FE. */
function handleRebuildTemplates_(body, user) {
  if (user.role !== 'admin') throw err_('FORBIDDEN', 'Chỉ quản trị viên được cập nhật thư viện mẫu');
  var s = rebuildTemplates({ force: !!body.force });
  s.ok = true;
  return s;
}

// ── Chuyển đổi lần đầu ──
/**
 * migrateTemplates — nạp gói build/sg_goc.zip (upload vào CONFIG) thành TEMPLATE_GOC + bảng MAU_THU:
 *  - tạo cây TEMPLATE_GOC theo gói (Mẫu thường / BLDT TT79 × Độc lập|Liên danh × giấy|điện tử),
 *  - ghi MAU_THU từ manifest (mã mẫu + chiều đã suy sẵn từ dữ liệu hiện có),
 *  - đổi tên thư mục TEMPLATE cũ (mẫu gốc upload phẳng 18/08) → _TEMPLATE_CU_<ngày> (KHÔNG xoá),
 *  - chuẩn hoá toàn bộ (tự chia đợt nếu quá thời gian).
 * Chạy lại an toàn: bỏ qua nếu TEMPLATE_GOC đã có file.
 */
function migrateTemplates() {
  var goc = gocFolder_();
  if (goc.getFiles().hasNext() || goc.getFolders().hasNext()) {
    Logger.log('TEMPLATE_GOC đã có dữ liệu — bỏ qua chuyển đổi, chỉ chạy rebuildTemplates');
    return rebuildTemplates({});
  }
  var zf = findFile_('CONFIG', 'sg_goc.zip');
  if (!zf) throw new Error('Chưa thấy CONFIG/sg_goc.zip — upload file build/sg_goc.zip vào thư mục CONFIG');
  var blobs = Utilities.unzip(zf.getBlob().setContentType('application/zip'));
  var manifest = null, created = {};
  blobs.forEach(function (b) {
    var n = b.getName();
    if (n === 'manifest.json') { manifest = JSON.parse(b.getDataAsString('UTF-8')); return; }
    var m = n.match(/^TEMPLATE_GOC\/(.+)\/([^/]+\.docx)$/);
    if (!m) return;
    var f = ensureFolderPath_(goc, m[1]).createFile(b.setName(m[2]).setContentType(DOCX_MIME));
    created[m[1] + '/' + m[2]] = f.getId();
  });
  if (!manifest) throw new Error('Gói thiếu manifest.json');

  var t = readMauThu_();
  var exists = {};
  t.rows.forEach(function (o) { exists[o.ma_mau] = true; });
  manifest.forEach(function (x) {
    if (exists[x.ma_mau]) return;
    t.rows.push({
      ma_mau: x.ma_mau, ten_mau: x.ten_mau, loai_bl: x.loai_bl, bo_mau: x.bo_mau, linh_vuc: x.linh_vuc,
      so_tui: x.so_tui, bien_the: x.bien_the, lien_danh: x.lien_danh, hinh_thuc: x.hinh_thuc, active: true,
      file_id: created[x.folder + '/' + x.file] || '', duong_dan: x.folder + '/' + x.file,
      trang_thai: 'CHỜ CHUẨN HOÁ', so_slot: '', chuan_hoa_luc: '', ghi_chu: '',
    });
  });
  writeMauThu_(t);

  // Thư mục TEMPLATE cũ chứa mẫu gốc upload phẳng → lưu trữ, tạo TEMPLATE mới (máy sinh)
  var root = rootFolder_(), itT = root.getFoldersByName('TEMPLATE');
  if (itT.hasNext()) {
    var oldT = itT.next();
    var tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
    oldT.setName('_TEMPLATE_CU_' + Utilities.formatDate(new Date(), tz, 'yyyyMMdd'));
  }
  root.createFolder('TEMPLATE');
  _folderCache = {};
  CacheService.getScriptCache().remove('sg_folder_TEMPLATE');
  Logger.log('Đã tạo TEMPLATE_GOC: ' + Object.keys(created).length + ' file; MAU_THU: ' + t.rows.length + ' dòng');
  return rebuildTemplates({});
}
