/**
 * Text.gs — bóc text từ file /INPUT (DIFY_WORKFLOW Step 1).
 *
 * PoC: dùng Drive OCR conversion (PDF/Word → Google Doc) rồi đọc body →
 * { raw_text, paragraphs }. Xử lý được cả PDF text lẫn scan. Đây là **điểm
 * swap duy nhất**: nếu chuyển bóc text sang node pdfplumber trong Dify thì chỉ
 * đổi hàm này (gửi file thay vì raw_text) — xem gas/README.md §Extraction.
 */
function extractText_(docId) {
  var file = inputFileFor_(docId);
  if (!file) throw err_('PARSE_ERROR', 'Không thấy file INPUT cho ' + docId);

  var tempDocId = null;
  try {
    // Convert sang Google Doc (OCR) qua Advanced Drive Service (v2).
    var inserted = Drive.Files.insert(
      { title: docId + '__tmp', mimeType: 'application/vnd.google-apps.document' },
      file.getBlob(),
      { ocr: true, ocrLanguage: SG.ocrLang(), convert: true }
    );
    tempDocId = inserted.id;

    var doc = DocumentApp.openById(tempDocId);
    var raw = doc.getBody().getText() || '';
    var paragraphs = raw.split(/\n+/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });

    logLine_('extract doc_id=' + docId + ' chars=' + raw.length + ' paras=' + paragraphs.length);
    return { raw_text: raw, paragraphs: paragraphs };
  } finally {
    if (tempDocId) { try { DriveApp.getFileById(tempDocId).setTrashed(true); } catch (_) {} }
  }
}

/** Tìm file INPUT theo doc_id với đuôi pdf/docx/doc. */
function inputFileFor_(docId) {
  var exts = ['pdf', 'docx', 'doc'];
  for (var i = 0; i < exts.length; i++) {
    var f = findFile_('INPUT', docId + '.' + exts[i]);
    if (f) return f;
  }
  return null;
}
