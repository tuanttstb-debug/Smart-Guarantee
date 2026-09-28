/**
 * Convert.gs — chuyển PDF/Word → Google Doc qua Drive REST (UrlFetchApp), có OCR.
 * KHÔNG dùng Advanced Drive Service (tránh "Drive is not defined" — TD-SG-05).
 */
function docxToGdoc_(blob, title) {
  var boundary = '----sg' + Utilities.getUuid();
  var meta = { name: title, mimeType: 'application/vnd.google-apps.document', parents: [subFolder_('EXTRACTED').getId()] };
  var pre = '--' + boundary + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(meta) + '\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Type: ' + (blob.getContentType() || 'application/octet-stream') + '\r\n\r\n';
  var post = '\r\n--' + boundary + '--';
  var bytes = Utilities.newBlob(pre).getBytes()
    .concat(blob.getBytes())
    .concat(Utilities.newBlob(post).getBytes());

  var url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&ocrLanguage=' +
    encodeURIComponent(SG.ocrLang());
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'multipart/related; boundary=' + boundary,
    payload: bytes,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw err_('OCR_FAILED', 'Chuyển đổi/OCR lỗi HTTP ' + code + ': ' + res.getContentText().slice(0, 200));
  }
  return JSON.parse(res.getContentText()).id;
}
