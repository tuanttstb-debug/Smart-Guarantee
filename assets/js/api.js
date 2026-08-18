/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — api.js
   Lớp gọi GAS gateway (API_CONTRACT.md). Nếu chưa cấu hình URL hoặc
   USE_MOCK=true → dùng SG_MOCK. Cùng shape phản hồi → đổi backend không
   phải sửa app.js.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const cfg = window.SG_CONFIG;
  const useMock = () => cfg.USE_MOCK || !cfg.GAS_WEB_APP_URL;

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  async function post(action, body) {
    const url = cfg.GAS_WEB_APP_URL + '?action=' + action;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error_code + ': ' + (data.message || ''));
    return data;
  }

  // Đọc file → base64 (bỏ prefix data:...;base64,)
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(',')[1]);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  window.SG_API = {
    isMock: useMock,

    async upload(file) {
      if (useMock()) { await delay(600); return window.SG_MOCK.upload(file); }
      const content_base64 = await toBase64(file);
      return post('upload', { filename: file.name, content_base64 });
    },

    async process(doc_id) {
      if (useMock()) { await delay(1400); return window.SG_MOCK.process(doc_id); }
      return post('process', { doc_id });
    },

    async generate(payload) {
      if (useMock()) { await delay(900); return window.SG_MOCK.generate(payload); }
      return post('generate', payload);
    },
  };
})();
