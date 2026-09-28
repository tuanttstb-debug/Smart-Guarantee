/**
 * Upload.gs — action=upload.
 * Request:  { token, filename, content_base64 }
 * Response: { ok, doc_id }
 */
var UPLOAD_MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
};

function handleUpload_(body, user) {
  var filename = String(body.filename || '').slice(0, 200);
  var b64 = body.content_base64 || '';
  if (!b64) throw err_('PARSE_ERROR', 'Thiếu nội dung tệp');
  var ext = (filename.split('.').pop() || '').toLowerCase();
  if (!UPLOAD_MIME[ext]) throw err_('PARSE_ERROR', 'Định dạng không hỗ trợ: .' + ext + ' (chỉ PDF/DOC/DOCX)');

  var bytes = Utilities.base64Decode(b64);
  if (bytes.length > SG.MAX_UPLOAD_MB * 1048576) throw err_('PARSE_ERROR', 'Tệp vượt quá ' + SG.MAX_UPLOAD_MB + ' MB');
  var head = String.fromCharCode.apply(null, bytes.slice(0, 4).map(function (b) { return b & 0xff; }));
  if (ext === 'pdf' && head !== '%PDF') throw err_('PARSE_ERROR', 'Tệp không phải PDF hợp lệ');
  if (ext === 'docx' && head.slice(0, 2) !== 'PK') throw err_('PARSE_ERROR', 'Tệp không phải DOCX hợp lệ');

  var docId = nextDocId_();
  saveBlob_('INPUT', docId + '.' + ext, Utilities.newBlob(bytes, UPLOAD_MIME[ext], docId + '.' + ext));
  upsertJob_(docId, { username: user.username, file_name: filename, status: 'UPLOADED' });
  return { ok: true, doc_id: docId };
}

/** File INPUT theo doc_id. */
function inputFileFor_(docId) {
  var exts = Object.keys(UPLOAD_MIME);
  for (var i = 0; i < exts.length; i++) {
    var f = findFile_('INPUT', docId + '.' + exts[i]);
    if (f) return f;
  }
  return null;
}
