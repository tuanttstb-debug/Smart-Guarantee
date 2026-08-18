/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — config.js
   Điểm cấu hình duy nhất cho FE. Khi GAS gateway sẵn sàng (Phase 1 #6):
   1) dán URL Web App vào GAS_WEB_APP_URL
   2) đặt USE_MOCK = false
   FE không giữ secret Dify — mọi lời gọi AI đi qua GAS (API_CONTRACT.md).
   ═══════════════════════════════════════════════════════════════ */
window.SG_CONFIG = {
  // URL Google Apps Script Web App (?action=upload|process|generate|config)
  GAS_WEB_APP_URL: '',

  // true = chạy bằng dữ liệu giả lập (mock.js) để demo FE trước khi có backend.
  // Tự động bật khi GAS_WEB_APP_URL rỗng.
  USE_MOCK: true,

  MAX_FILE_MB: 20,
  ACCEPT: ['.pdf', '.doc', '.docx'],
};
