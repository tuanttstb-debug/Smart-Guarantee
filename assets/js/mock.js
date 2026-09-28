/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — mock.js
   Backend giả lập (cùng shape API_CONTRACT v2) để demo/kiểm giao diện khi chưa có GAS:
   mở index.html?mock=1 — đăng nhập bất kỳ. Mẫu thư ở đây là MẪU GIẢ (không phải văn bản
   thư viện TPBank thật — thư viện thật chỉ nằm trên Drive, không đưa lên repo công khai).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const P = (t, a, b) => ({ t, a: a || '', b: b ? 1 : 0 });
  const DEMO_TEMPLATES = [
    {
      id: 'DEMO-01', label: 'BL Hoàn trả tạm ứng · Mẫu DEMO · Liên danh · Thư điện tử',
      guarantee_type: 'BLTU', template_type: 'T22', method: 'ĐT', joint_venture: 'LD', sector: 'XL', envelope: '', variant: '',
      slots: ['BEN_NAME', 'BEN_ADDR', 'CONTRACT_NAME_NO', 'APP_NAME', 'ADV_FULL', 'BANK_NAME', 'BANK_ADDR', 'AMT_FULL', 'EXPIRY_DATE_VN'],
      preview: [
        P('(MẪU DEMO — không phải mẫu thư viện thật)', 'c'), P('BẢO LÃNH HOÀN TRẢ TIỀN TẠM ỨNG', 'c', 1), P(''),
        P('Kính gửi: {{BEN_NAME}}', 'c'), P('{{BEN_ADDR}}', 'c'), P('Căn cứ {{CONTRACT_NAME_NO}},', 'c'),
        P('Bên được bảo lãnh {{APP_NAME}} nhận khoản tạm ứng {{ADV_FULL}}.'),
        P('Chúng tôi, {{BANK_NAME}}, trụ sở tại {{BANK_ADDR}}, cam kết thanh toán tối đa {{AMT_FULL}}.'),
        P('Bảo lãnh có hiệu lực đến hết {{EXPIRY_DATE_VN}}.'), P(''), P('Đại diện hợp pháp của ngân hàng', 'r', 1),
      ],
    },
    {
      id: 'DEMO-02', label: 'BL Hoàn trả tạm ứng · Mẫu DEMO · Độc lập · Thư giấy',
      guarantee_type: 'BLTU', template_type: 'TPB', method: 'TG', joint_venture: 'KO', sector: '', envelope: '', variant: '',
      slots: ['BEN_NAME', 'CONTRACT_NO', 'CONTRACT_DATE', 'APP_NAME', 'AMT_NUM_CCY', 'AMT_WORDS', 'EXPIRY_DATE'],
      preview: [
        P('(MẪU DEMO)', 'c'), P('BẢO LÃNH TẠM ỨNG', 'c', 1), P('Kính gửi: {{BEN_NAME}}'),
        P('Căn cứ Hợp đồng số {{CONTRACT_NO}} ký ngày {{CONTRACT_DATE}} với {{APP_NAME}},'),
        P('Số tiền bảo lãnh tối đa: {{AMT_NUM_CCY}} (bằng chữ: {{AMT_WORDS}}).'), P('Hết 17 giờ 00 ngày {{EXPIRY_DATE}}.'),
      ],
    },
  ];
  const f = (value, confidence, evidence) => ({ value, confidence, evidence: evidence || value });
  let seq = 0;

  window.SG_MOCK = {
    async handle(action, body) {
      await delay(action === 'process' ? 1200 : 250);
      const user = { username: 'demo', display_name: 'Người dùng DEMO', branch_name: 'Hà Nội', role: 'admin' };
      const branches = [{ branch_name: 'Hà Nội', branch_addr: 'Địa chỉ chi nhánh (demo)' }];
      switch (action) {
        case 'login': return { ok: true, token: 'demo-token', user, branches };
        case 'me': return { ok: true, user, branches };
        case 'logout': return { ok: true };
        case 'catalog': return { ok: true, version: 1, catalog: { version: 2, templates: DEMO_TEMPLATES } };
        case 'history': return { ok: true, items: [] };
        case 'rebuild_templates': return { ok: true, files: 2, added: 0, rebuilt: 0, warnings: 0, pending: 0, active_in_catalog: 2, seconds: 1 };
        case 'upload': return { ok: true, doc_id: 'SG-DEMO-' + String(++seq).padStart(3, '0') };
        case 'load': return { ok: false, error_code: 'NOT_FOUND', message: 'Chế độ demo không lưu hồ sơ' };
        case 'process': {
          const fields = {
            ben_name: f('CÔNG TY MẪU A', 96), ben_addr: f('', 0), app_name: f('Công ty Cổ phần Mẫu B', 91),
            jv_name: f('Liên danh Mẫu B - C', 74), branch_name: f('Hà Nội', 100, '(mặc định theo chi nhánh của cán bộ)'),
            branch_addr: f('Địa chỉ chi nhánh (demo)', 100, '(danh mục chi nhánh)'),
            contract_name: f('Hợp đồng thi công xây dựng', 88), contract_no: f('01/2026/HĐXD', 95), contract_date: f('11/08/2026', 90),
            amount: f('1500000000', 93, '1,500,000,000 VNĐ'), currency: f('VND', 99), advance_amount: f('1500000000', 70, 'khoản tạm ứng 1,500,000,000'),
          };
          const flat = {}, meta = {};
          Object.keys(fields).forEach((k) => { flat[k] = fields[k].value; meta[k] = { confidence: fields[k].confidence, evidence: fields[k].evidence }; });
          const n = window.SGCore.normalizeFields(flat);
          const candidates = window.SGCore.rankTemplates(DEMO_TEMPLATES, { guarantee_type: 'BLTU', form_family: 'T22', joint_venture: 'LD', method: body.method });
          return {
            ok: true, doc_id: body.doc_id, text: 'BẢO LÃNH HOÀN TRẢ TIỀN TẠM ỨNG (văn bản demo)\nKính gửi: CÔNG TY MẪU A\n…\nkhoản tạm ứng 1,500,000,000 VNĐ …',
            classification: { guarantee_type: 'BLTU', form_family: 'T22', joint_venture: 'LD', method: body.method, sector: 'XL', language: 'TV', confidence: 86 },
            method: body.method, fields: n.fields, meta, warnings: n.warnings.concat(['(DEMO) dữ liệu giả lập']),
            notes: ['Thư không nêu ngày hết hiệu lực cụ thể'], candidates, template_id: candidates[0].id,
          };
        }
        case 'generate': {
          const t = DEMO_TEMPLATES.find((x) => x.id === body.template_id) || DEMO_TEMPLATES[0];
          const rs = window.SGCore.renderSlots(t.slots, window.SGCore.normalizeFields(body.fields).fields);
          if (rs.missing.length && !body.allow_missing) return { ok: false, error_code: 'MISSING_FIELDS', message: 'Còn thiếu: ' + rs.missing.join(', ') };
          const txt = t.preview.map((p) => p.t.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => rs.values[k] || '…………')).join('\n');
          return { ok: true, doc_id: body.doc_id, file_name: 'DEMO-' + body.doc_id + '.txt', mime: 'text/plain',
            content_base64: btoa(unescape(encodeURIComponent(txt))), missing: rs.missing, warnings: [] };
        }
        default: return { ok: false, error_code: 'BAD_ACTION', message: action };
      }
    },
  };
})();
