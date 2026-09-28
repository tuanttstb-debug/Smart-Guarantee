/**
 * Generate.gs — action=generate (DOCX_GENERATOR.md v2).
 *
 * Mẫu thư viện đã chuẩn hoá (TEMPLATE/<id>.docx) chứa token {{SLOT}} nằm trọn trong 1 run.
 * Sinh thư = giải nén docx → thay token trong document/header/footer XML (SGCore.fillXml)
 * → nén lại. KHÔNG đi qua Google Docs → giữ nguyên 100% định dạng Word (logo, header, bảng, font).
 * Slot thiếu dữ liệu → "…………" tô vàng; chặn xuất nếu còn thiếu mà cán bộ chưa xác nhận.
 *
 * Request:  { token, doc_id, template_id, fields:{...}, allow_missing? }
 * Response: { ok, doc_id, file_name, content_base64, missing[], warnings[] }
 */
var DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
var FILL_PARTS = /^word\/(document|header\d*|footer\d*)\.xml$/;

function handleGenerate_(body, user) {
  var docId = body.doc_id;
  assertOwner_(docId, user);
  var tpl = findTemplateMeta_(body.template_id);
  if (!tpl) throw err_('TEMPLATE_NOT_FOUND', 'Không có mẫu ' + body.template_id + ' trong danh mục');

  var n = SGCore.normalizeFields(body.fields || {});
  var rs = SGCore.renderSlots(tpl.slots, n.fields);
  if (rs.missing.length && !body.allow_missing) {
    var e = err_('MISSING_FIELDS', 'Còn ' + rs.missing.length + ' mục chưa có dữ liệu: ' + rs.missing.join(', '));
    throw e;
  }

  var tplFile = findFile_('TEMPLATE', tpl.id + '.docx');
  if (!tplFile) throw err_('TEMPLATE_NOT_FOUND', 'Chưa nạp file mẫu ' + tpl.id + '.docx — admin bấm ⟳ Cập nhật mẫu (xem MAU_THU)');

  var outName = docId + '__' + tpl.id + '.docx';
  var out = fillDocx_(tplFile.getBlob(), rs.values, rs.missing, outName);
  saveBlob_('OUTPUT', outName, out);

  // Truy vết: lưu bộ dữ liệu cuối cùng đã dùng để sinh thư
  var rec = readJson_('EXTRACTED', docId + '.json') || { doc_id: docId };
  rec.final = {
    template_id: tpl.id, template_label: tpl.label, fields: n.fields, missing: rs.missing,
    generated_at: new Date().toISOString(), generated_by: user.username, output_file: outName,
  };
  writeJson_('EXTRACTED', docId + '.json', rec);
  upsertJob_(docId, { status: rs.missing.length ? 'GENERATED_INCOMPLETE' : 'GENERATED', template_id: tpl.id, output_file: outName });

  return {
    ok: true,
    doc_id: docId,
    file_name: 'BL-' + tpl.guarantee_type + '-' + docId + '.docx',
    content_base64: Utilities.base64Encode(out.getBytes()),
    missing: rs.missing,
    warnings: n.warnings,
  };
}

/** Giải nén docx, điền token trong các part văn bản, nén lại. */
function fillDocx_(blob, values, missing, name) {
  var parts = Utilities.unzip(blob.copyBlob().setContentType('application/zip'));
  var out = parts.map(function (b) {
    var n = b.getName();
    if (!FILL_PARTS.test(n)) return b;
    var x = b.getDataAsString('UTF-8');
    if (x.indexOf('{{') < 0) return b;
    var filled = SGCore.fillXml(x, values, missing).xml;
    return Utilities.newBlob('', 'application/xml', n).setDataFromString(filled, 'UTF-8');
  });
  return Utilities.zip(out, name).setContentType(DOCX_MIME);
}
