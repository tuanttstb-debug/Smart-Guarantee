/**
 * Config.gs — cấu hình gateway đọc từ Script Properties (không hard-code secret).
 * Thiết lập: Project Settings ▸ Script Properties (xem gas/README.md).
 *
 *   DIFY_BASE_URL   Host Dify (vd https://api.dify.ai) — chấp nhận cả dạng có /v1[/workflows/run].
 *   DIFY_API_KEY    Bearer key của Workflow app (app-xxxx).
 *   DIFY_STUB       'true' → bỏ qua LLM, trả dữ liệu mẫu (kiểm thử wiring). Mặc định false.
 *   DRIVE_ROOT_ID   Folder id gốc "Smart-Guarantee" (setupDrive in ra).
 *   OPS_SHEET_ID    Spreadsheet vận hành: USERS · BRANCHES · JOBS · AUDIT (setupOpsSheet in ra).
 *   OCR_LANG        Ngôn ngữ OCR khi bóc text PDF (mặc định 'vi').
 *   SESSION_HOURS   Thời hạn phiên đăng nhập, giờ (mặc định 6 — trần CacheService).
 */
var SG = {
  ROOT_NAME: 'Smart-Guarantee',
  FOLDERS: ['INPUT', 'EXTRACTED', 'OUTPUT', 'TEMPLATE', 'CONFIG'],
  MAX_UPLOAD_MB: 20,
  MAX_TEXT_CHARS: 60000,

  prop: function (key, dflt) {
    var v = PropertiesService.getScriptProperties().getProperty(key);
    return (v === null || v === undefined || v === '') ? (dflt === undefined ? '' : dflt) : v;
  },
  bool: function (key) { return String(this.prop(key, 'false')).toLowerCase() === 'true'; },

  difyBaseUrl: function () {
    return this.prop('DIFY_BASE_URL').trim()
      .replace(/\/+$/, '')
      .replace(/\/v1\/workflows\/run$/, '')
      .replace(/\/+$/, '')
      .replace(/\/v1$/, '');
  },
  difyKey: function () { return this.prop('DIFY_API_KEY'); },
  difyStub: function () { return this.bool('DIFY_STUB'); },
  driveRootId: function () { return this.prop('DRIVE_ROOT_ID'); },
  opsSheetId: function () { return this.prop('OPS_SHEET_ID') || this.prop('CONFIG_SHEET_ID'); },
  ocrLang: function () { return this.prop('OCR_LANG', 'vi'); },
  sessionSeconds: function () { return Math.min(6, Number(this.prop('SESSION_HOURS', '6')) || 6) * 3600; },
};
