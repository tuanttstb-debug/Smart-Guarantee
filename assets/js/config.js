/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — config.js
   Điểm cấu hình duy nhất cho FE. FE không giữ secret: mọi lời gọi AI đi qua GAS,
   mọi action cần đăng nhập (token phiên). URL Web App công khai là chấp nhận được
   vì backend tự xác thực (Auth.gs).
   ═══════════════════════════════════════════════════════════════ */
window.SG_CONFIG = {
  // URL Google Apps Script Web App (deploy mới → dán URL mới vào đây)
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxCBF4x3t0FjwQXws1PIrr7dF-Toar4ii5R-75DC5R7jlYEnk-_XOTEXKTQVk7fG_Z0/exec',

  // true = chạy bằng dữ liệu giả lập (mock.js) — demo giao diện không cần backend.
  // Có thể bật tạm bằng tham số URL ?mock=1.
  USE_MOCK: /[?&]mock=1\b/.test(location.search),

  MAX_FILE_MB: 20,
  ACCEPT: ['.pdf', '.doc', '.docx'],
  TIMEOUT_MS: 330000,
};
