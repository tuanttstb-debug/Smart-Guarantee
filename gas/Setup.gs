/**
 * Setup.gs — tiện ích chạy 1 lần (từ editor GAS, không phải Web App).
 * Dựng cây Drive (#4) và scaffold Google Sheet config (#3). Chạy: chọn hàm ▸ Run.
 */

/**
 * setupDrive — tạo cây thư mục Smart-Guarantee/{INPUT,EXTRACTED,OUTPUT,TEMPLATE,CONFIG,LOGS}
 * và in folder id gốc để dán vào Script Property DRIVE_ROOT_ID.
 */
function setupDrive() {
  var root = rootFolder_();
  var ids = { ROOT: root.getId() };
  SG.FOLDERS.forEach(function (name) { ids[name] = subFolder_(name).getId(); });
  Logger.log('Drive sẵn sàng. Dán ROOT vào Script Property DRIVE_ROOT_ID:');
  Logger.log(JSON.stringify(ids, null, 2));
  Logger.log('Bước tiếp: upload template .docx vào folder TEMPLATE (id=' + ids.TEMPLATE + ').');
  return ids;
}

/** Tên tab + header cho Sheet config (khớp config/*.csv). */
var CONFIG_TABS = {
  CANONICAL_FIELDS: ['field_code', 'field_name', 'data_type'],
  FIELD_ALIASES: ['field_code', 'alias'],
  PLACEHOLDER_MAP: ['field_code', 'placeholder'],
  ND_VARIABLE_MAP: ['field_code', 'tpb_var'],
  TEMPLATE_REGISTRY: ['template_id', 'source', 'currency', 'guarantee_type', 'method', 'language',
    'template_type', 'sector', 'circular', 'joint_venture', 'envelope', 'validity_allowed',
    'template_file', 'folder', 'active'],
  SELECTION_RULES: ['rule_id', 'priority', 'when_currency', 'when_method', 'when_language',
    'when_template_type', 'when_guarantee_type', 'then_route', 'note'],
  FIELD_REQUIREMENTS: ['guarantee_type', 'field_code', 'required'],
  PROMPTS: ['prompt_key', 'prompt_text'],
};

/**
 * setupConfigSheet — tạo Spreadsheet "Smart-Guarantee CONFIG" với 8 tab + header.
 * In Spreadsheet id để dán vào CONFIG_SHEET_ID. Sau đó nạp dữ liệu từ config/*.csv
 * (File ▸ Import ▸ Upload csv ▸ Replace current sheet — chọn đúng tab) — xem config/README.md.
 */
function setupConfigSheet() {
  var ss = SpreadsheetApp.create('Smart-Guarantee CONFIG');
  var first = ss.getSheets()[0];
  var names = Object.keys(CONFIG_TABS);
  names.forEach(function (name, i) {
    var sh = i === 0 ? first.setName(name) : ss.insertSheet(name);
    var header = CONFIG_TABS[name];
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  Logger.log('Đã tạo Sheet config. Dán id vào Script Property CONFIG_SHEET_ID:');
  Logger.log(ss.getId());
  Logger.log('URL: ' + ss.getUrl());
  Logger.log('Bước tiếp: nạp dữ liệu 8 tab từ config/*.csv (xem config/README.md).');
  return ss.getId();
}
