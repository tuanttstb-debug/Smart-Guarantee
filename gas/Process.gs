/**
 * Process.gs — action=process (API_CONTRACT §process).
 * doc_id → bóc text (Text.gs) → gọi Dify (Dify.gs) → lưu /EXTRACTED/<id>.json → trả FE.
 *
 * DIFY_STUB=true → bỏ qua Dify, trả dữ liệu mẫu (test GAS↔FE khi Dify chưa sẵn).
 *
 * Request:  { doc_id }
 * Response: { ok, doc_id, classification, route, segments, variables, validation }
 */
function handleProcess_(body) {
  var docId = body.doc_id || '';
  if (!docId) throw err_('PARSE_ERROR', 'Thiếu doc_id');

  var result;
  if (SG.difyStub()) {
    result = stubProcess_();
    logLine_('process STUB doc_id=' + docId);
  } else {
    var extracted = extractText_(docId);
    result = callDify_(docId, extracted);
    // Lưu kèm raw_text để truy vết/generate route KH_UPLOAD.
    result._raw_text = extracted.raw_text;
    logLine_('process doc_id=' + docId + ' route=' + result.route);
  }

  writeJson_('EXTRACTED', docId + '.json', result);
  delete result._raw_text; // không trả raw_text về FE

  return {
    ok: true,
    doc_id: docId,
    classification: result.classification,
    route: result.route,
    segments: result.segments,
    variables: result.variables,
    validation: result.validation,
  };
}

/** Dữ liệu mẫu khớp API_CONTRACT (route KH_UPLOAD) để kiểm thử wiring. */
function stubProcess_() {
  return {
    classification: {
      currency: 'VND', guarantee_type: 'BLTH', method: 'ĐT', language: 'TV',
      template_type: 'T22', sector: 'HH', validity_type: '1', joint_venture: 'KO', contract_status: 'ĐK',
    },
    route: 'KH_UPLOAD',
    segments: [
      { text: 'Kính gửi:', kind: 'KHUNG' },
      { text: 'Công ty Cổ phần ABC', kind: 'BIEN', field: 'BENEFICIARY_NAME', placeholder: '[ghi tên bên nhận bảo lãnh]', confidence: 95 },
      { text: 'với số tiền', kind: 'KHUNG' },
      { text: '2.500.000.000 VND', kind: 'BIEN', field: 'GUARANTEE_AMOUNT', placeholder: '[ghi số tiền bảo lãnh]', confidence: 72 },
    ],
    variables: {
      '[ghi tên bên nhận bảo lãnh]': { value: 'Công ty Cổ phần ABC', confidence: 95 },
      '[ghi số tiền bảo lãnh]': { value: '2.500.000.000 VND', confidence: 72 },
    },
    validation: { missing: [], warnings: ['(STUB) dữ liệu mẫu — chưa gọi Dify'] },
  };
}

/**
 * handleConfig_ — GET action=config (API_CONTRACT §config, tuỳ chọn).
 * Trả canonical fields / danh sách biến cho FE render. PoC: đọc Sheet nếu có,
 * ngược lại trả rỗng (FE hiện chưa phụ thuộc config).
 */
function handleConfig_(body) {
  var sheetId = SG.configSheetId();
  if (!sheetId) return { ok: true, canonical_fields: [], nd_variables: [], note: 'CONFIG_SHEET_ID chưa đặt' };
  var out = { ok: true, canonical_fields: [], nd_variables: [] };
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    out.canonical_fields = readColumn_(ss, 'CANONICAL_FIELDS', 0);
    out.nd_variables = readColumn_(ss, 'TPB_VARIABLE_MAPPING', 0);
  } catch (e) { out.note = 'Đọc config lỗi: ' + e.message; }
  return out;
}

function readColumn_(ss, sheetName, colIdx) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  return values.slice(1).map(function (r) { return r[colIdx]; }).filter(function (v) { return v !== '' && v != null; });
}
