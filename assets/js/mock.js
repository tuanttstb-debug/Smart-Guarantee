/* ═══════════════════════════════════════════════════════════════
   Smart Guarantee — mock.js
   Dữ liệu giả lập KHỚP API_CONTRACT.md để demo luồng 5-tab khi chưa có
   GAS/Dify. Route ví dụ = KH_UPLOAD (giá trị lõi: segmentation khung/biến).
   Thay bằng phản hồi thật khi bật USE_MOCK=false — cùng shape, không đổi UI.
   ═══════════════════════════════════════════════════════════════ */
window.SG_MOCK = {
  upload(file) {
    const id = 'SG-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-001';
    return { ok: true, doc_id: id, input_path: '/INPUT/' + id + '.pdf' };
  },

  process(doc_id) {
    return {
      ok: true,
      doc_id,
      classification: {
        currency: 'VND', guarantee_type: 'BLTH', method: 'ĐT', language: 'TV',
        template_type: 'T22', sector: 'HH', validity_type: '1',
        joint_venture: 'KO', contract_status: 'ĐK',
      },
      route: 'KH_UPLOAD',
      segments: [
        { text: 'NGÂN HÀNG TMCP TIÊN PHONG', kind: 'KHUNG' },
        { text: 'THƯ BẢO LÃNH THỰC HIỆN HỢP ĐỒNG', kind: 'KHUNG' },
        { text: 'Kính gửi:', kind: 'KHUNG' },
        { text: 'Công ty Cổ phần Xây dựng ABC', kind: 'BIEN', field: 'BENEFICIARY_NAME', placeholder: '[ghi tên bên nhận bảo lãnh]', confidence: 95 },
        { text: 'Theo đề nghị của', kind: 'KHUNG' },
        { text: 'Công ty TNHH Thương mại XYZ', kind: 'BIEN', field: 'APPLICANT_NAME', placeholder: '[ghi tên bên được bảo lãnh]', confidence: 92 },
        { text: 'chúng tôi đồng ý bảo lãnh với số tiền', kind: 'KHUNG' },
        { text: '2.500.000.000 VND', kind: 'BIEN', field: 'GUARANTEE_AMOUNT', placeholder: '[ghi số tiền bảo lãnh]', confidence: 88 },
        { text: '(Bằng chữ: Hai tỷ năm trăm triệu đồng)', kind: 'BIEN', field: 'GUARANTEE_AMOUNT_TEXT', placeholder: '[ghi số tiền bằng chữ]', confidence: 71 },
        { text: 'cho gói thầu', kind: 'KHUNG' },
        { text: 'Xây dựng hạ tầng KCN giai đoạn 2', kind: 'BIEN', field: 'CONTRACT_NAME', placeholder: '[ghi tên hợp đồng/gói thầu]', confidence: 90 },
        { text: 'Thư bảo lãnh có hiệu lực kể từ ngày', kind: 'KHUNG' },
        { text: '20/08/2026', kind: 'BIEN', field: 'VALID_FROM', placeholder: '[ghi ngày hiệu lực]', confidence: 96 },
        { text: 'đến hết ngày', kind: 'KHUNG' },
        { text: '20/02/2027', kind: 'BIEN', field: 'VALID_TO', placeholder: '[ghi ngày hết hiệu lực]', confidence: 64 },
        { text: '.', kind: 'KHUNG' },
      ],
      variables: {
        '[ghi tên bên nhận bảo lãnh]':  { value: 'Công ty Cổ phần Xây dựng ABC', confidence: 95 },
        '[ghi tên bên được bảo lãnh]':  { value: 'Công ty TNHH Thương mại XYZ', confidence: 92 },
        '[ghi số tiền bảo lãnh]':        { value: '2.500.000.000 VND', confidence: 88 },
        '[ghi số tiền bằng chữ]':        { value: 'Hai tỷ năm trăm triệu đồng', confidence: 71 },
        '[ghi tên hợp đồng/gói thầu]':   { value: 'Xây dựng hạ tầng KCN giai đoạn 2', confidence: 90 },
        '[ghi ngày hiệu lực]':           { value: '20/08/2026', confidence: 96 },
        '[ghi ngày hết hiệu lực]':       { value: '20/02/2027', confidence: 64 },
      },
      validation: {
        missing: [],
        warnings: ['Số tiền bằng chữ cần đối chiếu với số tiền bảo lãnh', 'Ngày hết hiệu lực có độ tin cậy thấp'],
      },
    };
  },

  generate(payload) {
    return {
      ok: true,
      output_path: '/OUTPUT/' + payload.doc_id + '.docx',
      download_url: '#mock-download', // GAS sẽ trả link Drive thật
    };
  },
};
