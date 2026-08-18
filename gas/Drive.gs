/**
 * Drive.gs — helpers Drive theo DRIVE_STRUCTURE.md.
 * Cây: Smart-Guarantee/{INPUT,EXTRACTED,OUTPUT,TEMPLATE,CONFIG,LOGS}
 */

/** Folder gốc dự án (theo DRIVE_ROOT_ID nếu có, ngược lại tìm/tạo theo tên). */
function rootFolder_() {
  var id = SG.driveRootId();
  if (id) return DriveApp.getFolderById(id);
  var it = DriveApp.getFoldersByName(SG.ROOT_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(SG.ROOT_NAME);
}

/** Folder con chức năng (tạo nếu chưa có). */
function subFolder_(name) {
  var root = rootFolder_();
  var it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

/** Sinh doc_id SG-YYYYMMDD-NNN, seq tăng theo ngày (dựa trên số file /INPUT cùng ngày). */
function nextDocId_() {
  var tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
  var ymd = Utilities.formatDate(new Date(), tz, 'yyyyMMdd');
  var prefix = 'SG-' + ymd + '-';
  var input = subFolder_('INPUT');
  var max = 0;
  var files = input.getFiles();
  while (files.hasNext()) {
    var name = files.next().getName();
    var m = name.match(/^SG-\d{8}-(\d{3})/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  var seq = ('00' + (max + 1)).slice(-3);
  return prefix + seq;
}

/** Ghi/đọc file theo doc_id trong 1 folder chức năng. */
function saveBlob_(folderName, name, blob) {
  return subFolder_(folderName).createFile(blob.setName(name));
}

function findFile_(folderName, name) {
  var it = subFolder_(folderName).getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}

function writeJson_(folderName, name, obj) {
  var existing = findFile_(folderName, name);
  if (existing) existing.setTrashed(true);
  return subFolder_(folderName).createFile(name, JSON.stringify(obj, null, 2), 'application/json');
}

/** Ghi 1 dòng trace vào LOGS/<YYYY-MM-DD>.log — chỉ metadata, KHÔNG nội dung KH. */
function logLine_(msg) {
  try {
    var tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
    var day = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
    var ts = Utilities.formatDate(new Date(), tz, 'HH:mm:ss');
    var logs = subFolder_('LOGS');
    var it = logs.getFilesByName(day + '.log');
    var line = '[' + ts + '] ' + msg + '\n';
    if (it.hasNext()) {
      var f = it.next();
      f.setContent(f.getBlob().getDataAsString() + line);
    } else {
      logs.createFile(day + '.log', line, 'text/plain');
    }
  } catch (_) { /* logging không được làm hỏng request */ }
}
