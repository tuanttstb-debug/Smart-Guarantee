/**
 * Code.gs — Web App entrypoint + router (AI_CONTEXT/API_CONTRACT.md v2).
 *
 * FE ── POST ?action=<a>  body JSON (text/plain, né CORS preflight) ──► doPost
 * Mọi action (trừ ping/login) cần `token` phiên (Auth.gs). Phản hồi JSON:
 *   { ok:true, ... } | { ok:false, error_code, message }
 * Mỗi request được ghi AUDIT (người dùng, action, doc_id, thời gian) — KHÔNG ghi nội dung thư.
 */
var PUBLIC_ACTIONS = {
  ping: function () { return { ok: true, service: 'smart-guarantee-gas', version: 2, ts: new Date().toISOString() }; },
  login: function (body) { return handleLogin_(body); },
};
var PRIVATE_ACTIONS = {
  me: function (body, user) { return handleMe_(user); },
  logout: function (body) { return handleLogout_(body); },
  catalog: function (body, user) { return handleCatalog_(); },
  upload: function (body, user) { return handleUpload_(body, user); },
  process: function (body, user) { return handleProcess_(body, user); },
  load: function (body, user) { return handleLoad_(body, user); },
  generate: function (body, user) { return handleGenerate_(body, user); },
  history: function (body, user) { return handleHistory_(body, user); },
  rebuild_templates: function (body, user) { return handleRebuildTemplates_(body, user); },
};

function doPost(e) { return route_(e); }
function doGet(e) { return route_(e); }

function route_(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var t0 = Date.now(), user = null, body = {};
  try {
    body = parseBody_(e);
    var result;
    if (PUBLIC_ACTIONS[action]) {
      result = PUBLIC_ACTIONS[action](body);
    } else if (PRIVATE_ACTIONS[action]) {
      user = requireUser_(body);
      result = PRIVATE_ACTIONS[action](body, user);
    } else {
      throw err_('BAD_ACTION', 'action="' + action + '" không hợp lệ');
    }
    if (action !== 'ping' && action !== 'catalog' && action !== 'history') {
      audit_(user ? user.username : (body.username || ''), action, body.doc_id || (result && result.doc_id) || '', 'ok', Date.now() - t0);
    }
    return json_(result);
  } catch (err) {
    var code = (err && err.errorCode) || 'INTERNAL';
    audit_(user ? user.username : (body && body.username) || '', action, (body && body.doc_id) || '', code + ': ' + String(err && err.message || err).slice(0, 200), Date.now() - t0);
    if (code === 'INTERNAL') console.error('action=' + action + ' :: ' + (err && err.stack ? err.stack : err));
    return json_({ ok: false, error_code: code, message: String(err && err.message ? err.message : err) });
  }
}

/** Đọc body JSON (text/plain) hoặc query params. */
function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return (e && e.parameter) ? e.parameter : {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (_) {
    throw err_('PARSE_ERROR', 'Body không phải JSON hợp lệ');
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Error có errorCode để route_ trả error_code chuẩn. */
function err_(code, message) {
  var e = new Error(message || code);
  e.errorCode = code;
  return e;
}
