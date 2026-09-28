/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — app.js (v2)
   Đăng nhập → 1 Tải thư → 2 Rà soát dữ liệu & chọn mẫu → 3 Xem trước & xuất.
   Logic nghiệp vụ dùng chung với backend qua SGCore (assets/js/core.js ← gas/Core.gs).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const C = window.SGCore;
  const CONF_LOW = 80;
  const $ = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => Array.from((root || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtSize = (b) => (b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB');
  const spinner = (t) => '<span class="sg-spinner"></span> ' + esc(t);
  const okMsg = (t) => '<span class="sg-ok">✓ ' + esc(t) + '</span>';
  const errMsg = (e) => '<span class="sg-err">✕ ' + esc(e && e.message ? e.message : e) + '</span>';

  const LABELS = {
    guarantee_type: { BLDT: 'Dự thầu', BLTH: 'Thực hiện HĐ', BLTU: 'Tạm ứng', BLBH: 'Bảo hành', BLTT: 'Thanh toán', BLKH: 'Khác' },
    form_family: { TT79: 'Mẫu TT79', T22: 'Mẫu TT22', T07: 'Mẫu Bộ Y tế', EVN: 'Mẫu EVN', VIT: 'Mẫu Viettel', TPB: 'Mẫu TPBank', OTHER: 'Mẫu riêng của KH' },
    joint_venture: { LD: 'Liên danh', KO: 'Độc lập' },
    method: { 'ĐT': 'Thư điện tử', TG: 'Thư giấy' },
  };
  const STATUS = { UPLOADED: 'Đã tải', PROCESSED: 'Đã phân tích', GENERATED: 'Đã xuất thư', GENERATED_INCOMPLETE: 'Xuất (còn trống)' };

  const state = {
    user: null, branches: [], catalog: null, byId: {},
    file: null, method: 'ĐT', docId: null, rec: null, fields: {}, meta: {}, templateId: '', step: 1,
  };

  // ── Khởi động ──
  async function init() {
    $('#modeTag').textContent = SG_API.isMock() ? 'CHẾ ĐỘ DEMO (dữ liệu giả lập)' : 'kết nối máy chủ';
    if (SG_API.isMock()) $('#envBadge').textContent = 'DEMO';
    bindUI();
    window.addEventListener('sg:auth-required', () => showLogin('Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại.'));
    if (!SG_API.hasToken()) return showLogin();
    try {
      const me = await SG_API.me();
      await enterApp(me);
    } catch (_) { showLogin(); }
  }

  function showLogin(msg) {
    $('#appView').classList.add('d-none');
    $('#userBox').classList.add('d-none');
    $('#loginView').classList.remove('d-none');
    $('#loginStatus').innerHTML = msg ? '<span class="sg-warn">' + esc(msg) + '</span>' : '';
    setTimeout(() => $('#loginUser').focus(), 50);
  }

  async function enterApp(me) {
    state.user = me.user; state.branches = me.branches || [];
    $('#userName').textContent = me.user.display_name + (me.user.branch_name ? ' · CN ' + me.user.branch_name : '');
    $('#loginView').classList.add('d-none');
    $('#appView').classList.remove('d-none');
    $('#userBox').classList.remove('d-none');
    $('#rebuildBtn').classList.toggle('d-none', me.user.role !== 'admin');
    gotoStep(1);
    loadHistory();
    loadCatalog().catch((e) => { $('#uploadStatus').innerHTML = errMsg('Không tải được danh mục mẫu: ' + e.message); });
  }

  async function loadCatalog() {
    if (state.catalog) return state.catalog;
    const r = await SG_API.catalog();
    state.catalog = r.catalog.templates;
    state.byId = {};
    state.catalog.forEach((t) => { state.byId[t.id] = t; });
    return state.catalog;
  }

  // ── Đăng nhập ──
  async function doLogin(ev) {
    ev.preventDefault();
    const btn = $('#loginBtn');
    btn.disabled = true;
    $('#loginStatus').innerHTML = spinner('Đang đăng nhập…');
    try {
      const r = await SG_API.login($('#loginUser').value.trim(), $('#loginPass').value);
      $('#loginPass').value = '';
      $('#loginStatus').innerHTML = '';
      await enterApp(r);
    } catch (e) {
      $('#loginStatus').innerHTML = errMsg(e);
    } finally { btn.disabled = false; }
  }

  // ── Điều hướng bước ──
  function gotoStep(n) {
    if (n > 1 && !state.rec) return;
    if (n === 3) renderPreview();
    state.step = n;
    [1, 2, 3].forEach((i) => $('#step' + i).classList.toggle('d-none', i !== n));
    $$('#stepper li').forEach((li) => {
      const s = +li.dataset.step;
      li.classList.toggle('is-active', s === n);
      li.classList.toggle('is-done', s < n || (s > n && !!state.rec));
      li.tabIndex = state.rec || s === 1 ? 0 : -1;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetCase() {
    state.file = null; state.docId = null; state.rec = null; state.fields = {}; state.meta = {}; state.templateId = '';
    $('#docIdLabel').textContent = '';
    clearFile();
    $('#uploadStatus').innerHTML = '';
    gotoStep(1);
    loadHistory();
  }

  // ── Bước 1: tệp + phân tích ──
  function acceptFile(file) {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!SG_CONFIG.ACCEPT.includes(ext)) { $('#uploadStatus').innerHTML = errMsg('Định dạng không hỗ trợ (' + ext + ')'); return; }
    if (file.size > SG_CONFIG.MAX_FILE_MB * 1048576) { $('#uploadStatus').innerHTML = errMsg('Tệp vượt quá ' + SG_CONFIG.MAX_FILE_MB + ' MB'); return; }
    state.file = file;
    $('#fileName').textContent = file.name;
    $('#fileSize').textContent = fmtSize(file.size);
    $('#fileMeta').classList.remove('d-none');
    $('#dropzone').classList.add('d-none');
    $('#analyzeBtn').disabled = false;
    $('#uploadStatus').innerHTML = '';
  }
  function clearFile() {
    state.file = null; $('#fileInput').value = '';
    $('#fileMeta').classList.add('d-none'); $('#dropzone').classList.remove('d-none');
    $('#analyzeBtn').disabled = true;
  }

  async function analyze() {
    if (!state.file) return;
    const btn = $('#analyzeBtn');
    btn.disabled = true;
    const t0 = Date.now();
    let phase = 'Đang tải tệp lên…';
    const tick = setInterval(() => { $('#uploadStatus').innerHTML = spinner(phase + ' ' + Math.round((Date.now() - t0) / 1000) + 's'); }, 500);
    try {
      await loadCatalog();
      const up = await SG_API.upload(state.file);
      state.docId = up.doc_id;
      $('#docIdLabel').textContent = up.doc_id;
      phase = 'Đang đọc thư & AI phân tích (thường 20–60 giây)…';
      const rec = await SG_API.process(up.doc_id, state.method);
      clearInterval(tick);
      openRecord(rec);
      $('#uploadStatus').innerHTML = okMsg('Phân tích xong sau ' + Math.round((Date.now() - t0) / 1000) + ' giây');
    } catch (e) {
      clearInterval(tick);
      $('#uploadStatus').innerHTML = errMsg(e) + (state.docId ? ' <span class="text-muted small">(hồ sơ ' + esc(state.docId) + ' — có thể mở lại ở “Hồ sơ gần đây” để thử lại)</span>' : '');
      btn.disabled = false;
    }
  }

  /** Nạp kết quả phân tích (hoặc hồ sơ mở lại) vào trạng thái & chuyển sang bước 2. */
  function openRecord(rec) {
    state.rec = rec;
    state.docId = rec.doc_id;
    $('#docIdLabel').textContent = rec.doc_id;
    const fin = rec.final;
    state.fields = Object.assign({}, rec.fields, fin ? fin.fields : {});
    state.meta = Object.assign({}, rec.meta);
    state.templateId = (fin && fin.template_id) || rec.template_id || '';
    const draft = readDraft(rec.doc_id);
    if (draft) { Object.assign(state.fields, draft.fields); state.templateId = draft.templateId || state.templateId; }
    renderTemplatePicker();
    renderClassification();
    renderAlerts();
    renderSource();
    renderForm();
    gotoStep(2);
  }

  // ── Nháp chỉnh sửa (per-viewer, phòng lỡ tải lại trang) ──
  function saveDraft() {
    try { localStorage.setItem('sg_draft_' + state.docId, JSON.stringify({ fields: state.fields, templateId: state.templateId, at: Date.now() })); } catch (_) {}
  }
  function readDraft(id) {
    try { const d = JSON.parse(localStorage.getItem('sg_draft_' + id) || 'null'); return d && Date.now() - d.at < 7 * 864e5 ? d : null; } catch (_) { return null; }
  }
  function clearDraft(id) { try { localStorage.removeItem('sg_draft_' + id); } catch (_) {} }

  // ── Bước 2: chọn mẫu ──
  function currentTpl() { return state.byId[state.templateId] || null; }

  function renderTemplatePicker() {
    const sel = $('#tplSelect');
    const cands = (state.rec.candidates || []).filter((c) => state.byId[c.id]);
    if (state.templateId && !cands.some((c) => c.id === state.templateId) && state.byId[state.templateId]) {
      cands.unshift({ id: state.templateId, label: state.byId[state.templateId].label, reasons: ['chọn tay'] });
    }
    sel.innerHTML = cands.length
      ? cands.map((c, i) => '<option value="' + esc(c.id) + '">' + (i === 0 && c.id === state.rec.template_id ? '★ ' : '') + esc(c.label) + '</option>').join('')
      : '<option value="">— Không có mẫu đề xuất, chọn trong thư viện —</option>';
    if (!state.templateId && cands[0]) state.templateId = cands[0].id;
    sel.value = state.templateId;
    const c = cands.find((x) => x.id === state.templateId);
    $('#tplWhy').innerHTML = state.templateId
      ? '<span class="text-muted small">Mã mẫu ' + esc(state.templateId) + (c && c.reasons && c.reasons.length ? ' · khớp: ' + esc(c.reasons.join(', ')) : '') + '</span>'
      : '';
    // bộ lọc thư viện
    const types = Array.from(new Set(state.catalog.map((t) => t.guarantee_type)));
    $('#browseType').innerHTML = types.map((t) => '<option value="' + t + '">' + esc((LABELS.guarantee_type[t] || t) + ' (' + t + ')') + '</option>').join('');
    $('#browseType').value = (state.rec.classification && state.rec.classification.guarantee_type) || types[0];
    renderBrowse();
  }

  function renderBrowse() {
    const type = $('#browseType').value;
    const q = $('#browseQ').value.toLowerCase().split(/\s+/).filter(Boolean);
    const list = state.catalog.filter((t) => t.guarantee_type === type && q.every((w) => t.label.toLowerCase().includes(w)));
    $('#browseList').innerHTML = list.map((t) => '<li><button type="button" data-id="' + esc(t.id) + '" class="' + (t.id === state.templateId ? 'is-on' : '') + '">' + esc(t.label) + '</button></li>').join('') ||
      '<li class="text-muted small p-2">Không có mẫu khớp bộ lọc.</li>';
  }

  function setTemplate(id) {
    state.templateId = id;
    saveDraft();
    renderTemplatePicker();
    renderForm();
  }

  function renderClassification() {
    const c = state.rec.classification || {};
    const chips = [];
    ['guarantee_type', 'form_family', 'joint_venture', 'method'].forEach((k) => {
      if (c[k]) chips.push((LABELS[k] && LABELS[k][c[k]]) || c[k]);
    });
    if (c.sector) chips.push('Lĩnh vực ' + c.sector);
    if (c.envelope) chips.push(c.envelope);
    $('#clsChips').innerHTML = '<div class="small text-muted mb-1">AI nhận diện thư' + (c.confidence ? ' (' + c.confidence + '%)' : '') + ':</div>' +
      chips.map((x) => '<span class="sg-chip">' + esc(x) + '</span>').join('');
  }

  function renderAlerts() {
    const w = state.rec.warnings || [], n = state.rec.notes || [];
    $('#alerts').innerHTML =
      w.map((x) => '<div class="sg-alert sg-alert--warn">⚠ ' + esc(x) + '</div>').join('') +
      n.map((x) => '<div class="sg-alert sg-alert--info">ℹ ' + esc(x) + '</div>').join('');
  }

  function renderSource(highlight) {
    const text = state.rec.text || '';
    const pre = $('#sourceText');
    if (!highlight) { pre.textContent = text || '(không có văn bản)'; return; }
    const i = text.indexOf(highlight);
    if (i < 0) { pre.textContent = text; return; }
    pre.innerHTML = esc(text.slice(0, i)) + '<mark id="srcHit">' + esc(highlight) + '</mark>' + esc(text.slice(i + highlight.length));
    $('#sourceBox').open = true;
    const hit = $('#srcHit');
    if (hit) pre.scrollTop = hit.offsetTop - pre.offsetTop - 40;
  }

  // ── Bước 2: form dữ liệu ──
  function requiredFields() {
    const t = currentTpl();
    if (!t) return [];
    const req = [];
    t.slots.forEach((s) => {
      const d = C.SLOTS[s];
      if (d && !d.optional) d.deps.forEach((k) => { if (!req.includes(k)) req.push(k); });
    });
    return req;
  }

  function renderForm() {
    const t = currentTpl();
    const needed = t ? C.fieldsForSlots(t.slots) : C.FIELD_KEYS;
    const showAll = $('#showAll').checked;
    const req = requiredFields();
    const keys = C.FIELD_KEYS.filter((k) => showAll || needed.includes(k));
    const groups = {};
    C.FIELDS.forEach((f) => { if (keys.includes(f.key)) (groups[f.group] = groups[f.group] || []).push(f); });
    const branchOpts = state.branches.map((b) => '<option value="' + esc(b.branch_name) + '">').join('');
    $('#fieldForm').innerHTML = Object.keys(C.GROUPS).filter((g) => groups[g]).map((g) =>
      '<fieldset class="sg-fgroup"><legend>' + esc(C.GROUPS[g]) + '</legend>' + groups[g].map((f) => fieldHtml(f, req, needed)).join('') + '</fieldset>'
    ).join('') + '<datalist id="branchList">' + branchOpts + '</datalist>' +
      (!showAll && t ? '<p class="small text-muted mt-2">Đang hiện ' + keys.length + ' trường mẫu “' + esc(t.id) + '” cần. Bật “Hiện mọi trường” để xem toàn bộ dữ liệu AI bóc được.</p>' : '');
    $$('#fieldForm [data-k]').forEach(updateFieldState);
  }

  function fieldHtml(f, req, needed) {
    const v = state.fields[f.key] == null ? '' : state.fields[f.key];
    const m = state.meta[f.key] || {};
    const conf = m.confidence;
    const isReq = req.includes(f.key);
    const id = 'f_' + f.key;
    let input;
    if (f.type === 'currency') {
      input = '<select class="form-select" id="' + id + '" data-k="' + f.key + '">' + ['VND', 'USD', 'EUR'].map((c) => '<option' + (c === (v || 'VND') ? ' selected' : '') + '>' + c + '</option>').join('') + '</select>';
    } else {
      const shown = f.type === 'amount' ? C.formatAmount(v, state.fields.currency || 'VND') : v;
      const attrs = f.type === 'date' ? ' placeholder="dd/mm/yyyy" inputmode="numeric"' : (f.type === 'amount' ? ' inputmode="decimal"' : '');
      const list = f.key === 'branch_name' ? ' list="branchList"' : '';
      const tag = !f.type && (f.key.endsWith('_addr') || f.key === 'validity_text' || f.key === 'bid_package' || f.key === 'project');
      input = tag
        ? '<textarea class="form-control" rows="1" id="' + id + '" data-k="' + f.key + '">' + esc(shown) + '</textarea>'
        : '<input class="form-control" id="' + id + '" data-k="' + f.key + '" value="' + esc(shown) + '"' + attrs + list + ' />';
    }
    const badge = conf != null && v !== ''
      ? '<span class="sg-conf ' + (conf < CONF_LOW ? 'sg-conf--low' : 'sg-conf--ok') + '" title="Độ tin cậy AI">' + conf + '%</span>' : '';
    const ev = m.evidence ? '<button type="button" class="sg-ev" data-ev="' + esc(m.evidence) + '" title="Trích thư gốc: ' + esc(m.evidence) + '">🔎</button>' : '';
    const helper = f.type === 'amount' ? '<div class="sg-words small" data-words="' + f.key + '"></div>' : '';
    return '<div class="sg-field" data-row="' + f.key + '"><label for="' + id + '">' + esc(f.label) + (isReq ? ' <span class="sg-req" title="Mẫu thư cần trường này">*</span>' : '') +
      (!needed.includes(f.key) ? ' <span class="sg-muted-tag">không dùng trong mẫu này</span>' : '') + '</label>' +
      '<div class="sg-field__row">' + input + badge + ev + '</div>' + helper + '</div>';
  }

  function updateFieldState(el) {
    const k = el.dataset.k;
    const row = el.closest('.sg-field');
    const v = state.fields[k];
    const req = requiredFields();
    const m = state.meta[k] || {};
    row.classList.toggle('is-miss', req.includes(k) && !v);
    row.classList.toggle('is-low', !!v && m.confidence != null && m.confidence < CONF_LOW && !m.edited);
    const def = C.FIELDS.find((f) => f.key === k);
    if (def && def.type === 'date') row.classList.toggle('is-bad', !!v && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v) && !C.isValidDate(v));
    const w = $('[data-words="' + k + '"]', row);
    if (w) w.textContent = v ? '→ ' + C.amountToWords(v, state.fields.currency || 'VND') : '';
  }

  function onFieldInput(ev) {
    const el = ev.target.closest('[data-k]');
    if (!el) return;
    const k = el.dataset.k;
    const def = C.FIELDS.find((f) => f.key === k) || {};
    let v = el.value.trim();
    if (def.type === 'amount') v = C.normalizeAmount(v, state.fields.currency || 'VND');
    state.fields[k] = v;
    state.meta[k] = Object.assign({}, state.meta[k], { edited: true });
    if (k === 'branch_name') {
      const b = state.branches.find((x) => x.branch_name.toLowerCase() === v.toLowerCase());
      if (b && b.branch_addr) {
        state.fields.branch_addr = b.branch_addr;
        const a = $('#f_branch_addr'); if (a) { a.value = b.branch_addr; updateFieldState(a); }
      }
    }
    if (k === 'currency') $$('[data-k="amount"],[data-k="advance_amount"]').forEach(updateFieldState);
    updateFieldState(el);
    saveDraft();
  }
  function onFieldBlur(ev) {
    const el = ev.target.closest('[data-k]');
    if (!el) return;
    const def = C.FIELDS.find((f) => f.key === el.dataset.k) || {};
    if (def.type === 'amount') el.value = C.formatAmount(state.fields[el.dataset.k], state.fields.currency || 'VND');
    if (def.type === 'date' && el.value) { state.fields[el.dataset.k] = C.formatDate(el.value); el.value = state.fields[el.dataset.k]; updateFieldState(el); saveDraft(); }
  }

  // ── Bước 3: xem trước & xuất ──
  function renderPreview() {
    const t = currentTpl();
    if (!t) { $('#paper').innerHTML = '<p class="text-muted">Chưa chọn mẫu thư.</p>'; return; }
    const n = C.normalizeFields(state.fields);
    const rs = C.renderSlots(t.slots, n.fields);
    const labelOf = (slot) => {
      const d = C.SLOTS[slot]; const f = d && d.deps[0] && C.FIELDS.find((x) => x.key === d.deps[0]);
      return f ? f.label : slot;
    };
    $('#paper').innerHTML = (t.preview || []).map((p) => {
      const html = esc(p.t).replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => {
        if (rs.missing.includes(k)) return '<span class="sg-pv-miss" title="Thiếu: ' + esc(labelOf(k)) + '">…………</span>';
        const val = rs.values[k];
        return val ? '<span class="sg-pv-val" title="' + esc(labelOf(k)) + '">' + esc(val) + '</span>' : '';
      });
      return '<p class="' + (p.a === 'c' ? 'text-center ' : p.a === 'r' ? 'text-end ' : '') + (p.b ? 'fw-bold' : '') + '">' + (html || '&nbsp;') + '</p>';
    }).join('');
    $('#paperTpl').textContent = t.label + ' (' + t.id + ')';
    const warns = n.warnings.concat((state.rec && state.rec.warnings || []).filter((w) => /KHÔNG khớp/.test(w)));
    const uniq = Array.from(new Set(warns));
    $('#checkList').innerHTML =
      (rs.missing.length
        ? '<div class="sg-alert sg-alert--err">Còn ' + rs.missing.length + ' chỗ trống: ' + esc(rs.missing.map(labelOf).join('; ')) + '</div>'
        : '<div class="sg-alert sg-alert--ok">✓ Đã đủ dữ liệu cho mọi chỗ trống của mẫu.</div>') +
      uniq.map((w) => '<div class="sg-alert sg-alert--warn">⚠ ' + esc(w) + '</div>').join('');
    $('#allowMissingBox').classList.toggle('d-none', !rs.missing.length);
    $('#allowMissing').checked = false;
    $('#confirmReview').checked = false;
    $('#generateStatus').innerHTML = '';
    state.missing = rs.missing;
    syncGenerateBtn();
  }

  function syncGenerateBtn() {
    $('#generateBtn').disabled = !$('#confirmReview').checked || (state.missing.length > 0 && !$('#allowMissing').checked);
  }

  async function generate() {
    const btn = $('#generateBtn');
    btn.disabled = true;
    $('#generateStatus').innerHTML = spinner('Đang soạn thư…');
    try {
      const r = await SG_API.generate({
        doc_id: state.docId, template_id: state.templateId, fields: state.fields, allow_missing: $('#allowMissing').checked,
      });
      downloadBase64(r.content_base64, r.file_name, r.mime || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      clearDraft(state.docId);
      state.rec.final = { template_id: state.templateId, fields: Object.assign({}, state.fields) };
      $('#generateStatus').innerHTML = okMsg('Đã tải ' + r.file_name) +
        (r.missing && r.missing.length ? '<div class="sg-warn small mt-1">File còn ' + r.missing.length + ' ô trống tô vàng — bổ sung trước khi ký/phát hành.</div>' : '');
      loadHistory();
    } catch (e) {
      $('#generateStatus').innerHTML = errMsg(e);
    } finally { syncGenerateBtn(); }
  }

  function downloadBase64(b64, name, mime) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ── Lịch sử ──
  async function loadHistory() {
    const ul = $('#historyList');
    try {
      const r = await SG_API.history();
      ul.innerHTML = r.items.length ? r.items.map((x) =>
        '<li><button type="button" data-doc="' + esc(x.doc_id) + '"' + (x.status === 'UPLOADED' ? ' data-retry="1"' : '') + '>' +
        '<span class="sg-history__id">' + esc(x.doc_id) + '</span>' +
        '<span class="sg-badge sg-badge--' + esc(String(x.status).toLowerCase()) + '">' + esc(STATUS[x.status] || x.status) + '</span>' +
        '<span class="sg-history__name">' + esc(x.file_name || '') + (x.guarantee_type ? ' · ' + esc(LABELS.guarantee_type[x.guarantee_type] || x.guarantee_type) : '') + '</span>' +
        '</button></li>').join('') : '<li class="text-muted small">Chưa có hồ sơ.</li>';
    } catch (e) { ul.innerHTML = '<li class="small">' + errMsg(e) + '</li>'; }
  }

  async function openHistory(btn) {
    const docId = btn.dataset.doc;
    $('#uploadStatus').innerHTML = spinner('Đang mở ' + docId + '…');
    try {
      await loadCatalog();
      let rec;
      if (btn.dataset.retry) {
        $('#uploadStatus').innerHTML = spinner('Hồ sơ ' + docId + ' chưa phân tích xong — đang phân tích lại…');
        rec = await SG_API.process(docId, state.method);
      } else {
        rec = await SG_API.load(docId);
      }
      $('#uploadStatus').innerHTML = '';
      openRecord(rec);
    } catch (e) { $('#uploadStatus').innerHTML = errMsg(e); }
  }

  // ── Quản trị: cập nhật thư viện mẫu (quét TEMPLATE_GOC → chuẩn hoá mẫu đã sửa → danh mục) ──
  async function rebuildTemplates() {
    const btn = $('#rebuildBtn');
    btn.disabled = true;
    gotoStep(1);
    $('#uploadStatus').innerHTML = spinner('Đang cập nhật thư viện mẫu (có thể 1–4 phút khi nhiều mẫu thay đổi)…');
    try {
      const s = await SG_API.rebuildTemplates();
      state.catalog = null;
      await loadCatalog();
      $('#uploadStatus').innerHTML = okMsg('Thư viện mẫu: ' + s.active_in_catalog + ' mẫu đang dùng · chuẩn hoá lại ' + s.rebuilt +
        ' · mẫu mới ' + s.added) + (s.warnings ? ' <span class="sg-warn">⚠ ' + s.warnings + ' mẫu cần xem cột trang_thai trong bảng MAU_THU</span>' : '') +
        (s.pending ? ' <span class="text-muted small">(còn ' + s.pending + ' mẫu — hệ thống tự chạy tiếp sau 1 phút)</span>' : '');
    } catch (e) {
      $('#uploadStatus').innerHTML = errMsg(e);
    } finally { btn.disabled = false; }
  }

  // ── Gắn sự kiện ──
  function bindUI() {
    $('#loginForm').addEventListener('submit', doLogin);
    $('#logoutBtn').addEventListener('click', async () => { await SG_API.logout(); state.catalog = null; resetCase(); showLogin(); });
    $('#newBtn').addEventListener('click', resetCase);
    $('#rebuildBtn').addEventListener('click', rebuildTemplates);

    $('#fileInput').addEventListener('change', (e) => acceptFile(e.target.files[0]));
    $('#fileClear').addEventListener('click', clearFile);
    $('#analyzeBtn').addEventListener('click', analyze);
    const dz = $('#dropzone');
    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-drag'); }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-drag'); }));
    dz.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) acceptFile(e.dataTransfer.files[0]); });
    dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#fileInput').click(); } });

    $('#methodSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      state.method = b.dataset.v;
      $$('#methodSeg button').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); });
    });

    $('#historyReload').addEventListener('click', loadHistory);
    $('#historyList').addEventListener('click', (e) => { const b = e.target.closest('button[data-doc]'); if (b) openHistory(b); });

    $('#tplSelect').addEventListener('change', (e) => setTemplate(e.target.value));
    $('#tplBrowseBtn').addEventListener('click', () => $('#tplBrowse').classList.toggle('d-none'));
    $('#browseType').addEventListener('change', renderBrowse);
    $('#browseQ').addEventListener('input', renderBrowse);
    $('#browseList').addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (b) { setTemplate(b.dataset.id); $('#tplBrowse').classList.add('d-none'); } });

    $('#showAll').addEventListener('change', renderForm);
    $('#fieldForm').addEventListener('input', onFieldInput);
    $('#fieldForm').addEventListener('change', onFieldInput);
    $('#fieldForm').addEventListener('focusout', onFieldBlur);
    $('#fieldForm').addEventListener('click', (e) => { const b = e.target.closest('.sg-ev'); if (b) renderSource(b.dataset.ev); });

    $('#confirmReview').addEventListener('change', syncGenerateBtn);
    $('#allowMissing').addEventListener('change', syncGenerateBtn);
    $('#generateBtn').addEventListener('click', generate);

    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => gotoStep(+b.dataset.goto)));
    $('#stepper').addEventListener('click', (e) => { const li = e.target.closest('li[data-step]'); if (li) gotoStep(+li.dataset.step); });
    $('#stepper').addEventListener('keydown', (e) => { const li = e.target.closest('li[data-step]'); if (li && e.key === 'Enter') gotoStep(+li.dataset.step); });
    window.addEventListener('beforeunload', (e) => { if (state.rec && state.step > 1 && !(state.rec.final)) { e.preventDefault(); e.returnValue = ''; } });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
