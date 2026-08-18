/**
 * Generate.gs — action=generate (API_CONTRACT §generate, DOCX_GENERATOR.md).
 * Sinh DOCX theo 3 route, giữ format bằng Google Doc + replaceText → export .docx.
 *
 *   OFFLINE      → chọn template offline (TEMPLATE_REGISTRY) → replace [...] bằng giá trị.
 *   ONLINE_B8ZB  → chọn template B8ZB TT79 → replace MERGEFIELD «$NDxxx» bằng giá trị.
 *   KH_UPLOAD    → dùng CHÍNH thư KH (/INPUT) làm khung → thay đoạn BIEN đã user-edit,
 *                  giữ nguyên KHUNG ("sát thư khách hàng").
 *
 * Request:  { doc_id, route, classification, variables }
 * Response: { ok, output_path, download_url, warnings, leftover_vars }
 */
function handleGenerate_(body) {
  var docId = body.doc_id;
  if (!docId) throw err_('PARSE_ERROR', 'Thiếu doc_id');
  var route = body.route || 'KH_UPLOAD';
  var variables = body.variables || {};
  var classification = body.classification || {};

  var built = (route === 'KH_UPLOAD')
    ? reproduceCustomer_(docId, variables)
    : fillTemplate_(route, classification, variables);

  // Xuất DOCX → /OUTPUT
  var docxBlob = gdocToDocxBlob_(built.gdocId, docId + '.docx');
  try { DriveApp.getFileById(built.gdocId).setTrashed(true); } catch (_) {}
  var existing = findFile_('OUTPUT', docId + '.docx');
  if (existing) existing.setTrashed(true);
  var outFile = subFolder_('OUTPUT').createFile(docxBlob);

  logLine_('generate doc_id=' + docId + ' route=' + route +
    ' template=' + (built.template || '-') + ' leftover=' + built.leftover.length);

  return {
    ok: true,
    output_path: '/OUTPUT/' + docId + '.docx',
    download_url: outFile.getDownloadUrl() || outFile.getUrl(),
    warnings: built.leftover.length ? ['Còn biến chưa điền trong thư: ' + built.leftover.join(', ')] : [],
    leftover_vars: built.leftover,
  };
}

/** Route OFFLINE / ONLINE_B8ZB — điền template chuẩn. */
function fillTemplate_(route, classification, variables) {
  var row = selectTemplate_(classification, route);
  if (!row) throw err_('TEMPLATE_NOT_FOUND', 'Không tìm mẫu phù hợp trong REGISTRY (route=' + route + ')');
  var tplFile = findFile_('TEMPLATE', row.template_file);
  if (!tplFile) throw err_('TEMPLATE_NOT_FOUND', 'Chưa upload template vào /TEMPLATE: ' + row.template_file);

  var gdocId = docxToGdoc_(tplFile.getBlob(), row.template_id + '__gen');
  var doc = DocumentApp.openById(gdocId);
  var b = doc.getBody();

  Object.keys(variables).forEach(function (key) {
    var val = String(variables[key] == null ? '' : variables[key]);
    replaceLiteral_(b, key, val);                 // [ghi ...] hoặc $ND001
    if (key.charAt(0) === '$') replaceLiteral_(b, '«' + key + '»', val); // MERGEFIELD dạng «$ND001»
  });
  doc.saveAndClose();

  return { gdocId: gdocId, template: row.template_file, leftover: leftoverVars_(gdocId) };
}

/** Route KH_UPLOAD — dựng lại trên chính thư KH, chỉ thay BIEN đã đổi. */
function reproduceCustomer_(docId, variables) {
  var input = inputFileFor_(docId);
  if (!input) throw err_('TEMPLATE_NOT_FOUND', 'Không thấy thư KH trong /INPUT: ' + docId);
  var gdocId = docxToGdoc_(input.getBlob(), docId + '__gen');
  var doc = DocumentApp.openById(gdocId);
  var b = doc.getBody();

  var extracted = readExtracted_(docId);
  var segs = (extracted && extracted.segments) || [];
  segs.forEach(function (s) {
    if (s.kind !== 'BIEN' || !s.placeholder) return;
    var v = variables[s.placeholder];
    if (v == null || String(v) === String(s.text)) return; // không đổi → giữ nguyên
    replaceLiteral_(b, s.text, String(v)); // thay giá trị gốc bằng giá trị đã user-edit
  });
  doc.saveAndClose();

  return { gdocId: gdocId, template: '(thư KH)', leftover: [] };
}

/**
 * selectTemplate_ — chọn 1 mẫu từ TEMPLATE_REGISTRY (Sheet) theo classification.
 * Ràng buộc: cùng guarantee_type + source + active; xếp hạng theo template_type/method/JV/sector/envelope.
 */
function selectTemplate_(c, route) {
  var id = SG.configSheetId();
  if (!id) throw err_('TEMPLATE_NOT_FOUND', 'CONFIG_SHEET_ID chưa đặt — không đọc được REGISTRY');
  var ss = SpreadsheetApp.openById(id);
  var rows = readTable_(ss, 'TEMPLATE_REGISTRY').filter(function (r) {
    return String(r.active).toLowerCase() === 'true' && r.source === route;
  });
  if (!rows.length) return null;

  var jv = (c.joint_venture && c.joint_venture !== 'KO') ? 'LD' : 'KO';
  function score(r) {
    if (r.guarantee_type !== c.guarantee_type) return -1; // BL phải khớp
    var s = 100;
    if (route === 'ONLINE_B8ZB') { if (r.circular === 'TT79') s += 10; }
    else if (r.template_type === c.template_type) s += 20;
    if (r.method === c.method) s += 5;
    if (r.joint_venture === jv) s += 5;
    if (c.sector && r.sector === c.sector) s += 8;
    if (c.envelope && r.envelope === c.envelope) s += 8;
    return s;
  }
  var best = null, bs = -1;
  rows.forEach(function (r) { var sc = score(r); if (sc > bs) { bs = sc; best = r; } });
  return bs >= 0 ? best : null;
}

// ── Helpers ──
// docxToGdoc_ / gdocToDocxBlob_ → gas/Convert.gs (Drive REST, không cần Advanced Service).

/** replaceText an toàn: escape regex trong chuỗi cần tìm. */
function replaceLiteral_(body, find, value) {
  if (!find) return;
  var esc = String(find).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  body.replaceText(esc, value == null ? '' : String(value));
}

/** Quét biến còn sót ([...] hoặc «$ND...») trong doc. */
function leftoverVars_(gdocId) {
  var text = DocumentApp.openById(gdocId).getBody().getText();
  var out = [];
  (text.match(/\[[^\]\n]{1,60}\]/g) || []).forEach(function (m) { if (out.indexOf(m) < 0) out.push(m); });
  (text.match(/«[^»\n]{1,40}»/g) || []).forEach(function (m) { if (out.indexOf(m) < 0) out.push(m); });
  return out;
}

function readExtracted_(docId) {
  var f = findFile_('EXTRACTED', docId + '.json');
  if (!f) return null;
  try { return JSON.parse(f.getBlob().getDataAsString()); } catch (_) { return null; }
}
