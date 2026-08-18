/**
 * Config.gs — cấu hình gateway đọc từ Script Properties (không hard-code secret).
 * Thiết lập: Project Settings ▸ Script Properties (xem gas/README.md).
 *
 * Properties:
 *   DIFY_BASE_URL   URL Dify (vd https://api.dify.ai) — không có dấu / cuối.
 *   DIFY_API_KEY    Bearer key của Workflow app (app-xxxx).
 *   DIFY_STUB       'true' → Process trả dữ liệu mẫu (test GAS↔FE khi Dify chưa sẵn). Mặc định false.
 *   DRIVE_ROOT_ID   (tuỳ chọn) folder id gốc "Smart-Guarantee"; bỏ trống → tự tìm/ tạo theo tên.
 *   CONFIG_SHEET_ID (tuỳ chọn) Spreadsheet ID chứa 6 sheet config.
 *   OCR_LANG        Ngôn ngữ OCR khi bóc text PDF (mặc định 'vi').
 */

var SG = {
  ROOT_NAME: 'Smart-Guarantee',
  FOLDERS: ['INPUT', 'EXTRACTED', 'OUTPUT', 'TEMPLATE', 'CONFIG', 'LOGS'],

  prop: function (key, dflt) {
    var v = PropertiesService.getScriptProperties().getProperty(key);
    return (v === null || v === undefined || v === '') ? (dflt === undefined ? '' : dflt) : v;
  },
  bool: function (key) { return String(this.prop(key, 'false')).toLowerCase() === 'true'; },

  // Chuẩn hoá: bỏ '/' cuối và '/v1' cuối (Dify.gs sẽ nối '/v1/workflows/run').
  // Chấp nhận cả 'https://api.dify.ai' lẫn 'https://api.dify.ai/v1'.
  difyBaseUrl: function () { return this.prop('DIFY_BASE_URL').replace(/\/+$/, '').replace(/\/v1$/, ''); },
  difyKey: function () { return this.prop('DIFY_API_KEY'); },
  difyStub: function () { return this.bool('DIFY_STUB'); },
  driveRootId: function () { return this.prop('DRIVE_ROOT_ID'); },
  configSheetId: function () { return this.prop('CONFIG_SHEET_ID'); },
  ocrLang: function () { return this.prop('OCR_LANG', 'vi'); },
};
