/**
 * Generate.gs — action=generate (API_CONTRACT §generate).
 *
 * ⚠️ PoC PLACEHOLDER. Ở đây sinh 1 DOCX tối giản: dựng lại thư từ `segments`
 * (KHUNG giữ nguyên, BIEN thay bằng giá trị đã user-edit) — đủ để nối end-to-end
 * FE↔GAS và tải file thật. **Bản đầy đủ** (điền placeholder [...]/$ND vào TEMPLATE
 * .docx thật, giữ định dạng gốc, kiểm sót biến) là Phase 3 #13 — xem DOCX_GENERATOR.md.
 *
 * Request:  { doc_id, route, classification, variables }
 * Response: { ok, output_path, download_url }
 */
function handleGenerate_(body) {
  var docId = body.doc_id || nextDocId_();
  var variables = body.variables || {};

  // Ưu tiên dựng lại từ segments đã lưu ở /EXTRACTED (giữ khung thư KH).
  var extracted = readExtracted_(docId);
  var lines = [];
  if (extracted && extracted.segments && extracted.segments.length) {
    var buf = '';
    extracted.segments.forEach(function (s) {
      var piece = (s.kind === 'BIEN' && s.placeholder && variables[s.placeholder] != null)
        ? variables[s.placeholder]
        : s.text;
      buf += (buf ? ' ' : '') + piece;
    });
    lines.push(buf);
  } else {
    // Fallback: liệt kê biến (khi không có segments).
    Object.keys(variables).forEach(function (k) { lines.push(k + ': ' + variables[k]); });
  }

  var tempDoc = DocumentApp.create(docId + '__gen');
  var b = tempDoc.getBody();
  b.appendParagraph('THƯ BẢO LÃNH — ' + docId).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  lines.forEach(function (ln) { b.appendParagraph(ln); });
  tempDoc.saveAndClose();

  var tempId = tempDoc.getId();
  var docxBlob;
  try {
    var url = 'https://docs.google.com/feeds/download/documents/export/Export?id=' + tempId + '&exportFormat=docx';
    docxBlob = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    }).getBlob().setName(docId + '.docx');
  } finally {
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (_) {}
  }

  var existing = findFile_('OUTPUT', docId + '.docx');
  if (existing) existing.setTrashed(true);
  var outFile = subFolder_('OUTPUT').createFile(docxBlob);

  logLine_('generate doc_id=' + docId + ' route=' + (body.route || '-'));
  return {
    ok: true,
    output_path: '/OUTPUT/' + docId + '.docx',
    download_url: outFile.getDownloadUrl() || outFile.getUrl(),
  };
}

function readExtracted_(docId) {
  var f = findFile_('EXTRACTED', docId + '.json');
  if (!f) return null;
  try { return JSON.parse(f.getBlob().getDataAsString()); } catch (_) { return null; }
}
