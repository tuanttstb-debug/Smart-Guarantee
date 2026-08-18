/**
 * SheetConfig.gs — đọc config từ Google Sheet (CONFIG_SHEET_ID) để truyền cho Dify.
 * GAS là nơi duy nhất chạm Sheet; Dify nhận config qua inputs (không tự đọc Sheet).
 * Cache trong 1 execution để không đọc lặp.
 */

var _sheetConfigCache = null;

/** Đọc 1 tab thành mảng object {header: value}. */
function readTable_(ss, sheetName) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values[0].map(function (h) { return String(h).trim(); });
  return values.slice(1)
    .filter(function (r) { return r.some(function (c) { return c !== '' && c != null; }); })
    .map(function (r) {
      var o = {};
      header.forEach(function (h, i) { o[h] = r[i]; });
      return o;
    });
}

/**
 * loadSheetConfig_ — bundle config nhẹ cho Dify (KHÔNG gồm TEMPLATE_REGISTRY 285 dòng;
 * việc chọn template do GAS làm ở generate). Trả object gọn để LLM tham chiếu.
 */
function loadSheetConfig_() {
  if (_sheetConfigCache) return _sheetConfigCache;
  var id = SG.configSheetId();
  if (!id) return { _note: 'CONFIG_SHEET_ID chưa đặt' };
  var ss = SpreadsheetApp.openById(id);

  // canonical: [{field_code, field_name, data_type}]
  var canonical = readTable_(ss, 'CANONICAL_FIELDS');

  // aliases: { field_code: [alias, ...] }
  var aliases = {};
  readTable_(ss, 'FIELD_ALIASES').forEach(function (r) {
    (aliases[r.field_code] = aliases[r.field_code] || []).push(r.alias);
  });

  // placeholder_map: { field_code: [placeholder, ...] }
  var placeholder = {};
  readTable_(ss, 'PLACEHOLDER_MAP').forEach(function (r) {
    (placeholder[r.field_code] = placeholder[r.field_code] || []).push(r.placeholder);
  });

  // nd_map: { field_code: tpb_var }
  var ndMap = {};
  readTable_(ss, 'ND_VARIABLE_MAP').forEach(function (r) { ndMap[r.field_code] = r.tpb_var; });

  // field_requirements: { guarantee_type: [field_code(required=true)] }
  var reqs = {};
  readTable_(ss, 'FIELD_REQUIREMENTS').forEach(function (r) {
    if (String(r.required).toLowerCase() === 'true') {
      (reqs[r.guarantee_type] = reqs[r.guarantee_type] || []).push(r.field_code);
    }
  });

  var rules = readTable_(ss, 'SELECTION_RULES');

  // prompts: { prompt_key: prompt_text }
  var prompts = {};
  readTable_(ss, 'PROMPTS').forEach(function (r) { prompts[r.prompt_key] = r.prompt_text; });

  _sheetConfigCache = {
    canonical_fields: canonical,
    field_aliases: aliases,
    placeholder_map: placeholder,
    nd_variable_map: ndMap,
    field_requirements: reqs,
    selection_rules: rules,
    prompts: prompts,
  };
  return _sheetConfigCache;
}
