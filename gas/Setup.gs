/**
 * Setup.gs — tiện ích chạy từ editor GAS (chọn hàm ▸ Run). Không phải Web App action.
 * Lần đầu: upload build/sg_goc.zip vào Drive CONFIG → chạy setupAll → (Dify) → checkSetup.
 */

/**
 * setupAll — chạy sau khi đẩy code (idempotent, chạy lại an toàn):
 * đặt DRIVE_ROOT_ID + OPS_SHEET_ID, tạo các tab vận hành, tạo admin (nếu USERS trống — mật khẩu
 * ngẫu nhiên in ra log, chỉ chủ script xem được), chuyển đổi thư viện mẫu lần đầu (sg_goc.zip)
 * hoặc cập nhật thư viện, cài trigger hằng đêm, checkSetup.
 */
function setupAll() {
  var props = PropertiesService.getScriptProperties();
  var ids = setupDrive();
  props.setProperty('DRIVE_ROOT_ID', ids.DRIVE_ROOT_ID);
  props.setProperty('OPS_SHEET_ID', setupOpsSheet());
  if (!readTable_(opsSheet_('USERS')).length) {
    var pw = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    adminSetUser('admin', pw, 'Quản trị', '', 'admin');
    Logger.log('>>> Tài khoản quản trị: admin / ' + pw + '  (đổi bằng adminSetUser)');
  }
  var s = migrateTemplates();
  Logger.log('>>> Thư viện mẫu: ' + JSON.stringify(s) + (s.pending ? ' — còn ' + s.pending + ' mẫu, tự chạy tiếp sau 1 phút' : ''));
  installNightlyRebuild();
  try { checkSetup(); } catch (e) { Logger.log('>>> checkSetup: ' + e.message); }
}

/** Dựng cây Drive, in DRIVE_ROOT_ID. */
function setupDrive() {
  var root = rootFolder_();
  var ids = { DRIVE_ROOT_ID: root.getId() };
  SG.FOLDERS.forEach(function (name) { ids[name] = subFolder_(name).getId(); });
  ids.TEMPLATE_GOC = gocFolder_().getId();
  Logger.log(JSON.stringify(ids, null, 2));
  return ids;
}

// Hàm (không phải biến top-level) vì JOB_COLS/MAU_COLS ở file khác — thứ tự nạp file GAS không bảo đảm.
function opsTabs_() {
  return {
    MAU_THU: MAU_COLS,
    SLOT_REVIEW: SLOT_REVIEW_COLS,
    USERS: ['username', 'display_name', 'branch_name', 'role', 'active', 'salt', 'pass_hash', 'last_login'],
    BRANCHES: ['branch_name', 'branch_addr'],
    JOBS: JOB_COLS,
    AUDIT: ['ts', 'user', 'action', 'doc_id', 'result', 'ms'],
  };
}

/** Tạo Spreadsheet vận hành (hoặc bổ sung tab thiếu nếu OPS_SHEET_ID đã có). In OPS_SHEET_ID. */
function setupOpsSheet() {
  var id = SG.opsSheetId();
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('Smart-Guarantee OPS');
  var tabs = opsTabs_();
  Object.keys(tabs).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var header = tabs[name];
    if (!String(sh.getRange(1, 1).getValue())) {
      sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  addMauThuValidation_(ss.getSheetByName('MAU_THU'));
  Logger.log('OPS_SHEET_ID = ' + ss.getId() + '\n' + ss.getUrl());
  return ss.getId();
}

/** Danh sách thả xuống cho các cột mã hoá của MAU_THU (BA sửa không gõ sai mã). */
function addMauThuValidation_(sh) {
  if (!sh || typeof SpreadsheetApp.newDataValidation !== 'function') return;
  var lists = {
    loai_bl: ['BLDT', 'BLTH', 'BLTU', 'BLBH', 'BLTT', 'BLKH'],
    bo_mau: ['TPB', 'T22', 'T07', 'EVN', 'VIT', 'TT79'],
    lien_danh: ['KO', 'LD'], hinh_thuc: ['TG', 'ĐT'], active: ['TRUE', 'FALSE'],
  };
  Object.keys(lists).forEach(function (k) {
    var col = MAU_COLS.indexOf(k) + 1;
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(lists[k], true).setAllowInvalid(false).build();
    sh.getRange(2, col, 1000, 1).setDataValidation(rule);
  });
}

/** Kiểm tra cấu hình end-to-end (không gọi LLM). */
function checkSetup() {
  var ok = [], bad = [];
  function chk(name, fn) { try { var r = fn(); ok.push('✓ ' + name + (r ? ' — ' + r : '')); } catch (e) { bad.push('✗ ' + name + ' — ' + e.message); } }
  chk('Drive root', function () { return rootFolder_().getName(); });
  chk('OPS sheet', function () { Object.keys(opsTabs_()).forEach(opsSheet_); return 'đủ ' + Object.keys(opsTabs_()).length + ' tab'; });
  chk('Người dùng', function () { var n = readTable_(opsSheet_('USERS')).length; if (!n) throw new Error('chưa có user — chạy adminSetUser'); return n + ' tài khoản'; });
  chk('Chi nhánh', function () { return listBranches_().length + ' chi nhánh (tab BRANCHES)'; });
  chk('Bảng mã hoá mẫu', function () {
    var rows = readMauThu_().rows;
    var okN = rows.filter(function (o) { return o.trang_thai === 'OK'; }).length;
    var warnN = rows.filter(function (o) { return String(o.trang_thai).charAt(0) === '⚠' || /LỖI|KHÔNG THẤY/.test(o.trang_thai); }).length;
    if (!rows.length) throw new Error('MAU_THU trống — upload sg_goc.zip rồi chạy migrateTemplates');
    return rows.length + ' mẫu · OK ' + okN + (warnN ? ' · cần xem ' + warnN : '');
  });
  chk('Catalog', function () { return loadCatalogMeta_().length + ' mẫu đang dùng'; });
  chk('File mẫu', function () {
    var ids = loadCatalogMeta_().map(function (t) { return t.id + '.docx'; });
    var have = {}, it = subFolder_('TEMPLATE').getFiles();
    while (it.hasNext()) have[it.next().getName()] = 1;
    var miss = ids.filter(function (x) { return !have[x]; });
    if (miss.length) throw new Error('thiếu ' + miss.length + ' file, vd ' + miss.slice(0, 3).join(', '));
    return ids.length + '/' + ids.length;
  });
  chk('Sinh thử 1 mẫu', function () {
    var t = loadCatalogMeta_()[0];
    var rs = SGCore.renderSlots(t.slots, {});
    var out = fillDocx_(findFile_('TEMPLATE', t.id + '.docx').getBlob(), rs.values, rs.missing, 'test.docx');
    return t.id + ' → ' + out.getBytes().length + ' bytes';
  });
  chk('Dify', function () {
    if (SG.difyStub()) return 'DIFY_STUB=true (chưa gọi AI thật)';
    if (!SG.difyBaseUrl() || !SG.difyKey()) throw new Error('thiếu DIFY_BASE_URL/DIFY_API_KEY');
    return SG.difyBaseUrl();
  });
  Logger.log(ok.concat(bad).join('\n'));
  if (bad.length) throw new Error(bad.length + ' mục chưa đạt');
}
