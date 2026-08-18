/**
 * Convert.gs — chuyển đổi file qua Drive REST API bằng UrlFetchApp.
 * KHÔNG dùng Advanced Drive Service (tránh "Drive is not defined") — chỉ cần
 * scope drive (đã cấp, vì upload DriveApp chạy được) + external_request.
 */

/**
 * docxToGdoc_ — upload blob (PDF/Word) và convert → Google Doc (OCR nếu PDF scan).
 * Trả gdocId. Dùng multipart upload Drive v3, target mimeType = google-apps.document.
 */
function docxToGdoc_(blob, title) {
  var boundary = '----sg' + Utilities.getUuid();
  var meta = { name: title, mimeType: 'application/vnd.google-apps.document' };
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
    throw err_('INTERNAL', 'Convert→Doc lỗi HTTP ' + code + ': ' + res.getContentText().slice(0, 200));
  }
  return JSON.parse(res.getContentText()).id;
}

/** gdocToDocxBlob_ — export Google Doc → blob .docx. */
function gdocToDocxBlob_(gdocId, name) {
  var url = 'https://docs.google.com/feeds/download/documents/export/Export?id=' + gdocId + '&exportFormat=docx';
  return UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  }).getBlob().setName(name);
}
