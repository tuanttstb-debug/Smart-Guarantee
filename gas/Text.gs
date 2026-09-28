/**
 * Text.gs — bóc text từ thư KH trong /INPUT.
 *
 * Dùng chuyển đổi Drive (PDF/Word → Google Doc, có OCR cho PDF scan) rồi đọc body.
 * Xử lý được cả PDF có lớp chữ, PDF scan/ảnh chụp và Word. Đây là ĐIỂM SWAP duy nhất
 * nếu sau này chuyển sang OCR/vision nội bộ (chỉ đổi hàm này).
 */
function extractText_(docId) {
  var file = inputFileFor_(docId);
  if (!file) throw err_('NOT_FOUND', 'Không thấy file gốc cho ' + docId);

  var tempDocId = null;
  try {
    tempDocId = docxToGdoc_(file.getBlob(), docId + '__ocr');
    var raw = DocumentApp.openById(tempDocId).getBody().getText() || '';
    raw = raw.replace(/\r/g, '').replace(/[ \t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (raw.length < 80) {
      throw err_('PARSE_ERROR', 'Không đọc được nội dung thư (ảnh quá mờ hoặc tệp rỗng). Hãy dùng bản PDF rõ hơn.');
    }
    return raw.slice(0, SG.MAX_TEXT_CHARS);
  } finally {
    if (tempDocId) { try { DriveApp.getFileById(tempDocId).setTrashed(true); } catch (_) {} }
  }
}
