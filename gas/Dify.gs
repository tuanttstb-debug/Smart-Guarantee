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

/**
 * Chuẩn hoá về shape API_CONTRACT. Workflow (không dùng code node — tránh
 * sandbox 429) trả 4 output text: classification/segments/variables/validation.
 * GAS parse JSON + **tự suy route** (deterministic) + map field. Vẫn nhận được
 * dạng object (nếu Dify trả đã parse) hoặc field 'route' có sẵn.
 */
function normalizeDify_(o) {
  o = o || {};
  var classification = parseMaybe_(o.classification, {});
  var segObj = parseMaybe_(o.segments, {});
  var segments = Array.isArray(segObj) ? segObj : (segObj.segments || []);
  segments.forEach(function (s) {
    if (s && s.kind === 'BIEN' && s.field_guess && !s.field) { s.field = s.field_guess; delete s.field_guess; }
  });
  var varObj = parseMaybe_(o.variables, {});
  var variables = varObj.variables || (isPlainVarMap_(varObj) ? varObj : {});
  var validation = parseMaybe_(o.validation, { missing: [], warnings: [] });

  return {
    classification: classification,
    route: o.route || routeFromClassification_(classification),
    segments: segments,
    variables: variables,
    validation: { missing: validation.missing || [], warnings: validation.warnings || [] },
  };
}

/** Suy route deterministic từ classification (TEMPLATE_SELECTION §2). */
function routeFromClassification_(c) {
  c = c || {};
  var cur = c.currency || '', mth = c.method || '', lang = c.language || '';
  var tt = c.template_type || '', gt = c.guarantee_type || '';
  if (cur === 'VND' && lang === 'TV') {
    if (gt === 'BLDT') return 'ONLINE_B8ZB';
    if ((mth === 'TG' || mth === 'ĐT') && ['TPB', 'T22', 'T07', 'T40', 'EVN', 'VIT'].indexOf(tt) >= 0) return 'OFFLINE';
  }
  return 'KH_UPLOAD';
}

/** Parse JSON text (strip ```fences); nếu đã là object thì trả nguyên. */
function parseMaybe_(v, dflt) {
  if (v && typeof v === 'object') return v;
  if (typeof v !== 'string' || !v.trim()) return dflt;
  var s = v.trim();
  if (s.indexOf('```') === 0) { s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, ''); }
  var i = s.indexOf('{'), j = s.lastIndexOf('}');
  if (i > 0 && j > i) s = s.slice(i, j + 1);
  try { return JSON.parse(s); } catch (_) { return dflt; }
}

/** variables dạng { "[...]": {value,confidence} } (không bọc trong .variables). */
function isPlainVarMap_(o) {
  var ks = Object.keys(o || {});
  return ks.length > 0 && ks.every(function (k) { return o[k] && typeof o[k] === 'object' && 'value' in o[k]; });
}
