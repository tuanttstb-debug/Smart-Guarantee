/**
 * Dify.gs — gọi Dify Workflow API (blocking). GAS giữ API key (API_CONTRACT §2).
 *
 * POST {DIFY_BASE_URL}/v1/workflows/run
 *   Authorization: Bearer {DIFY_API_KEY}
 *   { inputs:{ raw_text, paragraphs_json, config_ref }, response_mode:'blocking', user }
 *
 * Trả về object outputs của workflow (kỳ vọng shape DIFY_WORKFLOW §Output tổng):
 *   { classification, route, segments, variables, validation }
 */
function callDify_(docId, extracted) {
  var base = SG.difyBaseUrl();
  var key = SG.difyKey();
  if (!base || !key) throw err_('DIFY_TIMEOUT', 'Chưa cấu hình DIFY_BASE_URL/DIFY_API_KEY');

  // GAS đọc Sheet config và truyền vào Dify (Dify không tự đọc Sheet).
  var cfg = loadSheetConfig_();
  var payload = {
    inputs: {
      raw_text: extracted.raw_text,
      paragraphs_json: JSON.stringify(extracted.paragraphs || []),
      config_json: JSON.stringify(cfg),
    },
    response_mode: 'blocking',
    user: 'sg-poc',
  };

  var res = UrlFetchApp.fetch(base + '/v1/workflows/run', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + key },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code < 200 || code >= 300) {
    logLine_('dify HTTP ' + code + ' doc_id=' + docId);
    throw err_('DIFY_TIMEOUT', 'Dify trả HTTP ' + code + ': ' + text.slice(0, 300));
  }

  var body = JSON.parse(text);
  // Dify blocking: { data: { status, outputs, ... } }
  var data = body.data || body;
  if (data.status && data.status !== 'succeeded') {
    throw err_('DIFY_TIMEOUT', 'Workflow status=' + data.status + ' ' + (data.error || ''));
  }
  var outputs = data.outputs || {};

  // Một số setup Dify bọc kết quả trong 1 field (vd 'result') dạng JSON string.
  if (outputs.result && typeof outputs.result === 'string') {
    try { outputs = JSON.parse(outputs.result); } catch (_) {}
  }
  return normalizeDify_(outputs);
}

/** Chuẩn hoá về đúng shape API_CONTRACT (đủ khoá, không undefined). */
function normalizeDify_(o) {
  o = o || {};
  return {
    classification: o.classification || {},
    route: o.route || 'KH_UPLOAD',
    segments: o.segments || [],
    variables: o.variables || {},
    validation: o.validation || { missing: [], warnings: [] },
  };
}
