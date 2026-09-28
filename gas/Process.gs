/**
 * Process.gs — action=process | load.
 * doc_id → bóc text (Text.gs) → LLM phân loại + bóc tách (Extract.gs) → chuẩn hoá + kiểm tra chéo
 * (Core.gs) → xếp hạng mẫu thư viện → lưu EXTRACTED/<doc_id>.json → trả FE.
 *
 * Request:  { token, doc_id, method? ('TG'|'ĐT' — hình thức phát hành cán bộ chọn) }
 * Response: { ok, doc_id, text, classification, fields, meta, warnings, notes, candidates[], template_id }
 */
function handleProcess_(body, user) {
  var docId = body.doc_id;
  assertOwner_(docId, user);

  var text = extractText_(docId);
  var ext = callExtractor_(docId, text);
  var n = SGCore.normalizeFields(ext.fields, { amountWordsInLetter: ext.amount_words_in_letter });
  applyBranchDefaults_(n.fields, n.meta, user);

  var cls = ext.classification;
  var method = body.method === 'TG' || body.method === 'ĐT' ? body.method : cls.method;
  var ranked = SGCore.rankTemplates(loadCatalogMeta_(), {
    guarantee_type: cls.guarantee_type, form_family: cls.form_family, joint_venture: cls.joint_venture,
    method: method, sector: cls.sector, envelope: cls.envelope, variant: cls.variant,
  });

  var warnings = n.warnings.slice();
  if (cls.language && cls.language !== 'TV') warnings.push('Thư không phải tiếng Việt — thư viện hiện chỉ có mẫu tiếng Việt, kiểm tra kỹ bản dịch dữ liệu.');
  if (cls.form_family === 'OTHER') warnings.push('Thư KH không theo bộ mẫu nào trong thư viện — hãy chọn mẫu TPBank phù hợp nhất.');
  if (cls.confidence && cls.confidence < 70) warnings.push('AI chưa chắc chắn về loại thư (' + cls.confidence + '%) — kiểm tra mẫu được chọn.');
  if (!ranked.length) warnings.push('Không có mẫu thư viện cho loại bảo lãnh này — chọn tay trong danh mục.');

  var result = {
    doc_id: docId,
    processed_at: new Date().toISOString(),
    processed_by: user.username,
    prompt_version: PROMPT_VERSION,
    text: text,
    classification: cls,
    method: method,
    fields: n.fields,
    meta: n.meta,
    warnings: warnings,
    notes: ext.notes,
    amount_words_in_letter: ext.amount_words_in_letter,
    candidates: ranked.slice(0, 12),
    template_id: ranked.length ? ranked[0].id : '',
  };
  writeJson_('EXTRACTED', docId + '.json', result);
  upsertJob_(docId, { status: 'PROCESSED', guarantee_type: cls.guarantee_type, template_id: result.template_id });

  result.ok = true;
  return result;
}

/** Thư không nêu chi nhánh → lấy chi nhánh của cán bộ; có tên chi nhánh mà thiếu địa chỉ → tra BRANCHES. */
function applyBranchDefaults_(f, meta, user) {
  var branches = listBranches_();
  if (!f.branch_name && user.branch_name) {
    f.branch_name = user.branch_name;
    meta.branch_name = { confidence: 100, evidence: '(mặc định theo chi nhánh của cán bộ)' };
  }
  if (f.branch_name && !f.branch_addr) {
    var key = f.branch_name.toLowerCase();
    for (var i = 0; i < branches.length; i++) {
      if (branches[i].branch_name.toLowerCase() === key && branches[i].branch_addr) {
        f.branch_addr = branches[i].branch_addr;
        meta.branch_addr = { confidence: 100, evidence: '(danh mục chi nhánh)' };
        break;
      }
    }
  }
}

/** action=load — mở lại hồ sơ đã xử lý (từ lịch sử). */
function handleLoad_(body, user) {
  var docId = body.doc_id;
  var job = assertOwner_(docId, user);
  var rec = readJson_('EXTRACTED', docId + '.json');
  if (!rec) throw err_('NOT_FOUND', 'Hồ sơ ' + docId + ' chưa được phân tích (trạng thái ' + job.status + ')');
  rec.ok = true;
  return rec;
}
