/**
 * Extract.gs — gọi LLM (qua Dify Workflow, blocking) để phân loại + bóc tách thư.
 * Dify workflow v2 (dify/smart-guarantee.workflow.yml) = 1 node LLM, nhận:
 *   inputs: { system_prompt, raw_text, today }  → outputs: { result: "<JSON text>" }
 * Prompt nằm ở Prompt.gs (có version). Trả object đã kiểm/chuẩn hoá enum.
 */
var ENUMS = {
  guarantee_type: ['BLDT', 'BLTH', 'BLTU', 'BLBH', 'BLTT', 'BLKH'],
  form_family: ['TT79', 'T22', 'T07', 'EVN', 'VIT', 'TPB', 'OTHER'],
  joint_venture: ['LD', 'KO'],
  method: ['TG', 'ĐT'],
  language: ['TV', 'TA', 'SN'],
};

function callExtractor_(docId, rawText) {
  if (SG.difyStub()) return stubExtraction_();
  var base = SG.difyBaseUrl(), key = SG.difyKey();
  if (!base || !key) throw err_('NOT_CONFIGURED', 'Chưa cấu hình DIFY_BASE_URL / DIFY_API_KEY');

  var tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
  var payload = {
    inputs: {
      system_prompt: extractionPrompt_(),
      raw_text: rawText,
      today: Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy'),
    },
    response_mode: 'blocking',
    user: 'sg-' + docId,
  };
  var res, lastErr;
  for (var attempt = 0; attempt < 2; attempt++) {           // thử lại 1 lần khi lỗi mạng/5xx/429
    try {
      res = UrlFetchApp.fetch(base + '/v1/workflows/run', {
        method: 'post', contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + key },
        payload: JSON.stringify(payload), muteHttpExceptions: true,
      });
      var code = res.getResponseCode();
      if (code === 429 || code >= 500) { lastErr = 'HTTP ' + code; Utilities.sleep(2000); continue; }
      if (code < 200 || code >= 300) throw err_('LLM_FAILED', 'Dify trả HTTP ' + code + ': ' + res.getContentText().slice(0, 300));
      lastErr = null;
      break;
    } catch (e) {
      if (e.errorCode) throw e;
      lastErr = String(e.message || e);
      Utilities.sleep(2000);
    }
  }
  if (lastErr) throw err_('LLM_FAILED', 'Không gọi được dịch vụ AI (' + lastErr + '). Thử lại sau ít phút.');

  var body = JSON.parse(res.getContentText());
  var data = body.data || body;
  if (data.status && data.status !== 'succeeded') throw err_('LLM_FAILED', 'Workflow ' + data.status + ': ' + (data.error || ''));
  var outputs = data.outputs || {};
  var parsed = parseJsonLoose_(outputs.result != null ? outputs.result : outputs.text);
  if (!parsed || !parsed.fields) throw err_('LLM_FAILED', 'AI trả kết quả không đúng định dạng — thử lại.');
  return sanitizeExtraction_(parsed);
}

/** Parse JSON chịu lỗi: bỏ ```fences, cắt từ { đầu tới } cuối. */
function parseJsonLoose_(v) {
  if (v && typeof v === 'object') return v;
  if (typeof v !== 'string') return null;
  var s = v.trim().replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '');
  var i = s.indexOf('{'), j = s.lastIndexOf('}');
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(s.slice(i, j + 1)); } catch (_) { return null; }
}

/** Ép enum hợp lệ, cắt độ dài, đảm bảo đủ khoá field. */
function sanitizeExtraction_(p) {
  var c = p.classification || {};
  var cls = {};
  Object.keys(ENUMS).forEach(function (k) {
    var val = String(c[k] || '').trim().toUpperCase();
    if (k === 'method' && val === 'DT') val = 'ĐT';
    cls[k] = ENUMS[k].indexOf(val) >= 0 ? val : '';
  });
  cls.sector = String(c.sector || '').trim().toUpperCase().slice(0, 20);
  cls.envelope = String(c.envelope || '').trim().slice(0, 30);
  cls.variant = String(c.variant || '').trim().slice(0, 40);
  cls.confidence = clampNum_(c.confidence);

  var fields = {};
  SGCore.FIELD_KEYS.forEach(function (k) {
    var x = (p.fields || {})[k];
    if (x == null) { fields[k] = { value: '', confidence: 0, evidence: '' }; return; }
    if (typeof x !== 'object') x = { value: x };
    fields[k] = {
      value: String(x.value == null ? '' : x.value).slice(0, 500),
      confidence: clampNum_(x.confidence),
      evidence: String(x.evidence || '').slice(0, 160),
    };
  });
  return {
    classification: cls,
    fields: fields,
    amount_words_in_letter: String(p.amount_words_in_letter || '').slice(0, 300),
    notes: (Array.isArray(p.notes) ? p.notes : []).slice(0, 5).map(function (n) { return String(n).slice(0, 300); }),
  };
}

function clampNum_(x) { var n = Number(x); return isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0; }

/** Dữ liệu mẫu (DIFY_STUB=true) — kiểm wiring FE↔GAS↔Generate không cần LLM. */
function stubExtraction_() {
  var f = function (v, c) { return { value: v, confidence: c, evidence: '(STUB)' }; };
  return sanitizeExtraction_({
    classification: { guarantee_type: 'BLTU', form_family: 'T22', joint_venture: 'LD', method: 'ĐT', sector: 'XL', confidence: 90 },
    fields: {
      ben_name: f('CÔNG TY MẪU A', 95), ben_addr: f('', 0), app_name: f('Công ty Cổ phần Mẫu B', 92),
      jv_name: f('Liên danh Mẫu B - C', 88), branch_name: f('Hà Nội', 80), contract_name: f('Hợp đồng thi công xây dựng', 85),
      contract_no: f('01/2026/HĐXD', 93), contract_date: f('11/08/2026', 90),
      amount: f('1,000,000,000', 94), currency: f('VND', 99), advance_amount: f('1,000,000,000', 90),
    },
    amount_words_in_letter: 'Một tỷ đồng',
    notes: ['(STUB) dữ liệu mẫu — chưa gọi AI'],
  });
}
