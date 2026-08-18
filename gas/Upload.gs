/**
 * Upload.gs — action=upload (API_CONTRACT §upload).
 * Nhận PDF/Word (base64) → lưu /INPUT/<doc_id>.<ext> → trả doc_id.
 *
 * Request:  { filename, content_base64 }
 * Response: { ok, doc_id, input_path }
 */
function handleUpload_(body) {
  var filename = body.filename || '';
  var b64 = body.content_base64 || '';
  if (!b64) throw err_('PARSE_ERROR', 'Thiếu content_base64');

  var ext = (filename.split('.').pop() || 'pdf').toLowerCase();
  if (['pdf', 'doc', 'docx'].indexOf(ext) === -1) {
    throw err_('PARSE_ERROR', 'Định dạng không hỗ trợ: .' + ext);
  }

  var mime = ext === 'pdf' ? 'application/pdf'
    : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/msword';

  var docId = nextDocId_();
  var bytes = Utilities.base64Decode(b64);
  var blob = Utilities.newBlob(bytes, mime, docId + '.' + ext);
  saveBlob_('INPUT', docId + '.' + ext, blob);

  logLine_('upload doc_id=' + docId + ' ext=' + ext + ' bytes=' + bytes.length);
  return { ok: true, doc_id: docId, input_path: '/INPUT/' + docId + '.' + ext };
}
