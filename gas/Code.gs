/**
 * Code.gs — Web App entrypoint + router (API_CONTRACT.md).
 *
 * FE ── POST ?action=upload|process|generate ──► doPost
 * FE ── GET  ?action=config ───────────────────► doGet
 *
 * Body gửi bằng text/plain (JSON string) để tránh CORS preflight của GAS Web App.
 * Mọi phản hồi là JSON: { ok, ... } | { ok:false, error_code, message }.
 */

function doPost(e) {
  return route_(e, {
    upload: handleUpload_,
    process: handleProcess_,
    generate: handleGenerate_,
  });
}

function doGet(e) {
  return route_(e, {
    config: handleConfig_,
    ping: function () { return { ok: true, service: 'smart-guarantee-gas', ts: new Date().toISOString() }; },
  });
}

/** Định tuyến theo ?action=; bắt lỗi → JSON error chuẩn. */
function route_(e, handlers) {
  var action = (e && e.parameter && e.parameter.action) || '';
  try {
    var handler = handlers[action];
    if (!handler) return json_({ ok: false, error_code: 'BAD_ACTION', message: 'action="' + action + '" không hợp lệ' });
    var body = parseBody_(e);
    var result = handler(body, e);
    return json_(result);
  } catch (err) {
    logLine_('ERROR action=' + action + ' :: ' + (err && err.stack ? err.stack : err));
    return json_({
      ok: false,
      error_code: (err && err.errorCode) || 'INTERNAL',
      message: String(err && err.message ? err.message : err),
    });
  }
}

/** Đọc body JSON (text/plain) hoặc form field 'payload'. */
function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return (e && e.parameter) ? e.parameter : {};
  }
  var raw = e.postData.contents;
  try {
    return JSON.parse(raw);
  } catch (_) {
    if (e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
    throw err_('PARSE_ERROR', 'Body không phải JSON hợp lệ');
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Tạo Error có errorCode để route_ trả về error_code chuẩn (API_CONTRACT §Quy ước lỗi). */
function err_(code, message) {
  var e = new Error(message || code);
  e.errorCode = code;
  return e;
}
