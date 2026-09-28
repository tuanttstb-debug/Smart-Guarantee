/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — api.js
   Lớp gọi GAS gateway (API_CONTRACT.md v2). Tự gắn token phiên.
   USE_MOCK=true hoặc chưa có URL → dùng SG_MOCK (cùng shape phản hồi).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const cfg = window.SG_CONFIG;
  const useMock = () => cfg.USE_MOCK || !cfg.GAS_WEB_APP_URL;
  const TOKEN_KEY = 'sg_token';

  const store = {
    get() { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } },
    set(t) { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (_) {} },
  };

  class ApiError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }

  async function call(action, body) {
    const payload = Object.assign({}, body || {}, { token: store.get() });
    let data;
    if (useMock()) {
      data = await window.SG_MOCK.handle(action, payload);
    } else {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), cfg.TIMEOUT_MS || 330000);
      let res;
      try {
        // text/plain = "simple request" → không kích CORS preflight (GAS không trả header OPTIONS).
        res = await fetch(cfg.GAS_WEB_APP_URL + '?action=' + encodeURIComponent(action), {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload), signal: ctrl.signal,
        });
      } catch (e) {
        throw new ApiError('NETWORK', e.name === 'AbortError' ? 'Quá thời gian chờ máy chủ — thử lại.' : 'Không kết nối được máy chủ — kiểm tra mạng.');
      } finally { clearTimeout(timer); }
      if (!res.ok) throw new ApiError('HTTP_' + res.status, 'Máy chủ trả lỗi HTTP ' + res.status);
      data = await res.json();
    }
    if (!data.ok) {
      if (data.error_code === 'AUTH_REQUIRED') { store.set(''); window.dispatchEvent(new Event('sg:auth-required')); }
      throw new ApiError(data.error_code || 'ERROR', data.message || 'Lỗi không xác định');
    }
    return data;
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(',')[1]);
      fr.onerror = () => reject(new ApiError('FILE', 'Không đọc được tệp'));
      fr.readAsDataURL(file);
    });
  }

  window.SG_API = {
    ApiError,
    isMock: useMock,
    hasToken: () => !!store.get(),
    async login(username, password) {
      const r = await call('login', { username, password });
      store.set(r.token);
      return r;
    },
    async logout() { try { await call('logout'); } catch (_) {} store.set(''); },
    me: () => call('me'),
    catalog: () => call('catalog'),
    history: () => call('history'),
    load: (doc_id) => call('load', { doc_id }),
    async upload(file) { return call('upload', { filename: file.name, content_base64: await toBase64(file) }); },
    process: (doc_id, method) => call('process', { doc_id, method }),
    generate: (payload) => call('generate', payload),
    rebuildTemplates: () => call('rebuild_templates'),
  };
})();
