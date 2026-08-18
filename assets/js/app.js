/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — app.js
   Điều phối luồng 5-tab: Upload → Phân loại → Dữ liệu → Biến&Khung → Xuất.
   State-driven; mở khoá tab khi bước trước hoàn tất. UI theo DESIGN_SYSTEM.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CONF_LOW = 80; // ngưỡng highlight độ tin cậy thấp

  // ── Từ điển nhãn 9 chiều phân loại (TEMPLATE_SELECTION.md) ──
  const DIMS = [
    { key: 'guarantee_type', label: 'Loại bảo lãnh',   map: { BLDT: 'Dự thầu', BLBH: 'Bảo hành', BLTH: 'Thực hiện HĐ', BLTU: 'Tạm ứng', BLTT: 'Thanh toán', BLKH: 'Khác/Hoàn quyết toán' } },
    { key: 'template_type',  label: 'Bộ mẫu',           map: { TPB: 'TPBank', T22: 'TT22 (KH&ĐT)', TT22: 'TT22 (KH&ĐT)', TT07: 'TT07 (Y tế)', TT40: 'TT40 (Y tế)', EVN: 'EVN', VIT: 'Viettel', MK: 'Mẫu khác' } },
    { key: 'method',         label: 'Phương thức',      map: { 'ĐT': 'Điện tử', GT: 'Giấy', ONL: 'Online' } },
    { key: 'currency',       label: 'Loại tiền',        map: {} },
    { key: 'language',       label: 'Ngôn ngữ',         map: { TV: 'Tiếng Việt', EN: 'English', ST: 'Song ngữ' } },
    { key: 'sector',         label: 'Lĩnh vực',         map: { HH: 'Hàng hóa', XL: 'Xây lắp', DV: 'Dịch vụ', TV: 'Tư vấn' } },
    { key: 'validity_type',  label: 'Kiểu hiệu lực',    map: { 1: 'Kiểu 1', 2: 'Kiểu 2', 3: 'Kiểu 3', 4: 'Kiểu 4', 5: 'Kiểu 5' } },
    { key: 'joint_venture',  label: 'Liên danh',        map: { CO: 'Có', KO: 'Không' } },
    { key: 'contract_status',label: 'Trạng thái HĐ',    map: { 'ĐK': 'Đã ký', CK: 'Chưa ký' } },
  ];
  const ROUTE_LABEL = {
    KH_UPLOAD:    'Route: Thư KH tự upload',
    OFFLINE:      'Route: Mẫu chuẩn offline',
    STANDARD:     'Route: Mẫu chuẩn offline',
    ONLINE_B8ZB:  'Route: BLDT online (B8ZB · TT79)',
  };

  // ── State ──
  const state = { file: null, docId: null, result: null };
  const $ = (sel) => document.querySelector(sel);
  const el = {
    fileInput: $('#fileInput'), dropzone: $('#dropzone'), fileMeta: $('#fileMeta'),
    fileName: $('#fileName'), fileSize: $('#fileSize'), fileClear: $('#fileClear'),
    analyzeBtn: $('#analyzeBtn'), uploadStatus: $('#uploadStatus'), docIdLabel: $('#docIdLabel'),
    classifyGrid: $('#classifyGrid'), routeBadge: $('#routeBadge'),
    extractBody: $('#extractBody'), segView: $('#segView'),
    generateBtn: $('#generateBtn'), generateStatus: $('#generateStatus'),
    downloadBox: $('#downloadBox'), downloadLink: $('#downloadLink'), outputName: $('#outputName'),
    modeTag: $('#modeTag'),
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  const spinner = (txt) => '<span class="sg-spinner"></span> ' + esc(txt);

  function setStep(n, enabled) {
    const btn = document.querySelector('.sg-steps .nav-link[data-step="' + n + '"]');
    if (btn) btn.disabled = !enabled;
  }
  function gotoStep(n) {
    const btn = document.querySelector('.sg-steps .nav-link[data-step="' + n + '"]');
    if (btn && !btn.disabled) bootstrap.Tab.getOrCreateInstance(btn).show();
  }

  // ── Chọn tệp ──
  function acceptFile(file) {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!SG_CONFIG.ACCEPT.includes(ext)) {
      el.uploadStatus.textContent = 'Định dạng không hỗ trợ (' + ext + ').';
      return;
    }
    if (file.size > SG_CONFIG.MAX_FILE_MB * 1048576) {
      el.uploadStatus.textContent = 'Tệp vượt quá ' + SG_CONFIG.MAX_FILE_MB + ' MB.';
      return;
    }
    state.file = file;
    el.fileName.textContent = file.name;
    el.fileSize.textContent = fmtSize(file.size);
    el.fileMeta.classList.remove('d-none');
    el.dropzone.classList.add('d-none');
    el.analyzeBtn.disabled = false;
    el.uploadStatus.textContent = '';
  }
  function clearFile() {
    state.file = null; el.fileInput.value = '';
    el.fileMeta.classList.add('d-none'); el.dropzone.classList.remove('d-none');
    el.analyzeBtn.disabled = true; el.uploadStatus.textContent = '';
  }

  // ── Chặng Phân tích: upload + process ──
  async function analyze() {
    if (!state.file) return;
    el.analyzeBtn.disabled = true;
    try {
      el.uploadStatus.innerHTML = spinner('Đang tải tệp lên…');
      const up = await SG_API.upload(state.file);
      state.docId = up.doc_id;
      el.docIdLabel.textContent = up.doc_id;

      el.uploadStatus.innerHTML = spinner('AI đang phân loại & bóc tách…');
      const res = await SG_API.process(state.docId);
      state.result = res;

      renderClassification(res);
      renderExtracted(res);
      renderSegments(res);
      [2, 3, 4, 5].forEach((n) => setStep(n, true));
      el.uploadStatus.innerHTML = '<span style="color:var(--sg-ok)">✓ Hoàn tất phân tích.</span>';
      gotoStep(2);
    } catch (err) {
      el.uploadStatus.innerHTML = '<span style="color:var(--sg-danger)">✕ Lỗi: ' + esc(err.message) + '</span>';
      el.analyzeBtn.disabled = false;
    }
  }

  // ── Tab 2: Classification ──
  function renderClassification(res) {
    const c = res.classification || {};
    el.routeBadge.textContent = ROUTE_LABEL[res.route] || ('Route: ' + (res.route || '—'));
    el.classifyGrid.innerHTML = DIMS.map((d) => {
      const code = c[d.key];
      const val = (code != null && d.map[code]) ? d.map[code] : (code != null ? code : '—');
      const showCode = code != null && d.map[code] && String(d.map[code]) !== String(code);
      return '<div class="sg-dim"><div class="sg-dim__label">' + esc(d.label) + '</div>' +
        '<div class="sg-dim__value">' + esc(val) +
        (showCode ? ' <span class="sg-dim__code">(' + esc(code) + ')</span>' : '') +
        '</div></div>';
    }).join('');
  }

  // ── Tab 3: Extracted fields (editable) ──
  function renderExtracted(res) {
    const vars = res.variables || {};
    const rows = Object.keys(vars).map((ph) => {
      const v = vars[ph];
      const low = (v.confidence ?? 100) < CONF_LOW;
      const field = fieldOf(res, ph);
      return '<tr class="' + (low ? 'is-low' : '') + '" data-ph="' + esc(ph) + '">' +
        '<td><span class="sg-field-label">' + esc(field || ph) + '</span>' +
          (field ? '<span class="sg-field-code">' + esc(ph) + '</span>' : '') + '</td>' +
        '<td><input class="form-control sg-var-input" value="' + esc(v.value ?? '') + '" /></td>' +
        '<td class="text-center"><span class="sg-conf sg-conf--' + (low ? 'low' : 'ok') + '">' +
          (v.confidence ?? '—') + '%</span></td></tr>';
    });
    el.extractBody.innerHTML = rows.join('') ||
      '<tr><td colspan="3" class="text-muted text-center py-3">Không có biến nào được bóc tách.</td></tr>';

    // Sync chỉnh sửa → state + segmentation view
    el.extractBody.querySelectorAll('.sg-var-input').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const ph = e.target.closest('tr').dataset.ph;
        if (state.result.variables[ph]) state.result.variables[ph].value = e.target.value;
        renderSegments(state.result);
      });
    });
  }
  // tìm field name (từ segments) cho 1 placeholder
  function fieldOf(res, ph) {
    const seg = (res.segments || []).find((s) => s.placeholder === ph && s.field);
    return seg ? seg.field : null;
  }

  // ── Tab 4: Segmentation (khung vs biến) ──
  function renderSegments(res) {
    const segs = res.segments || [];
    el.segView.innerHTML = segs.map((s) => {
      if (s.kind === 'BIEN') {
        const low = (s.confidence ?? 100) < CONF_LOW;
        const cur = (s.placeholder && res.variables[s.placeholder]) ? res.variables[s.placeholder].value : s.text;
        const tip = (s.field ? s.field + ' · ' : '') + (s.confidence != null ? s.confidence + '%' : '');
        return '<span class="sg-seg-bien ' + (low ? 'is-low' : '') + '" title="' + esc(tip) + '">' + esc(cur) + '</span>';
      }
      return '<span class="sg-seg-khung">' + esc(s.text) + '</span>';
    }).join(' ');
  }

  // ── Tab 5: Generate ──
  async function generate() {
    el.generateBtn.disabled = true;
    el.downloadBox.classList.add('d-none');
    try {
      el.generateStatus.innerHTML = spinner('Đang soạn thư & xuất DOCX…');
      const flatVars = {};
      Object.keys(state.result.variables).forEach((k) => { flatVars[k] = state.result.variables[k].value; });
      const payload = {
        doc_id: state.docId,
        route: state.result.route,
        classification: state.result.classification,
        variables: flatVars,
      };
      const out = await SG_API.generate(payload);
      el.outputName.textContent = (state.docId || 'thu-bao-lanh') + '.docx';
      el.downloadLink.href = out.download_url || '#';
      el.downloadBox.classList.remove('d-none');
      const warns = (out.warnings || []);
      el.generateStatus.innerHTML = '<span style="color:var(--sg-ok)">✓ Đã sinh thư.</span>' +
        (warns.length ? ' <span style="color:var(--sg-warn)">⚠ ' + esc(warns.join(' · ')) + '</span>' : '');
    } catch (err) {
      el.generateStatus.innerHTML = '<span style="color:var(--sg-danger)">✕ Lỗi: ' + esc(err.message) + '</span>';
    } finally {
      el.generateBtn.disabled = false;
    }
  }

  // ── Wiring ──
  function init() {
    el.modeTag.textContent = SG_API.isMock() ? 'chế độ DEMO (dữ liệu giả lập)' : 'kết nối GAS';

    el.fileInput.addEventListener('change', (e) => acceptFile(e.target.files[0]));
    el.fileClear.addEventListener('click', clearFile);
    el.analyzeBtn.addEventListener('click', analyze);
    el.generateBtn.addEventListener('click', generate);

    // Drag & drop
    ['dragenter', 'dragover'].forEach((ev) => el.dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); el.dropzone.classList.add('is-drag');
    }));
    ['dragleave', 'drop'].forEach((ev) => el.dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); el.dropzone.classList.remove('is-drag');
    }));
    el.dropzone.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) acceptFile(e.dataTransfer.files[0]); });

    // Nút "Tiếp tục →" trong các tab
    document.querySelectorAll('[data-goto]').forEach((b) =>
      b.addEventListener('click', () => gotoStep(+b.dataset.goto)));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
