/**
 * Core.gs — lõi nghiệp vụ THUẦN (không gọi dịch vụ Google) dùng chung GAS ⇄ FE.
 *   - FIELDS: mô hình dữ liệu nguyên tử (cán bộ rà soát/sửa trên FE).
 *   - SLOTS : cách render từng slot `{{KEY}}` trong mẫu chuẩn hoá (gas/Normalize.gs).
 *   - Chuẩn hoá số tiền / ngày, đọc số thành chữ tiếng Việt, xếp hạng mẫu theo phân loại.
 *
 * NGUỒN CHUẨN: gas/Core.gs. FE dùng bản sao assets/js/core.js — sinh bằng `node tools/sync-core.js`.
 * Test: `node tools/test-core.js`.
 */
var SGCore = (function () {
  'use strict';

  var BLANK = '…………';

  // ── Trường nguyên tử (group → hiển thị FE) ──
  var FIELDS = [
    { key: 'ben_name', label: 'Tên bên nhận bảo lãnh (Chủ đầu tư / Bên thụ hưởng)', group: 'ben' },
    { key: 'ben_addr', label: 'Địa chỉ bên nhận bảo lãnh', group: 'ben' },
    { key: 'app_name', label: 'Tên bên được bảo lãnh (Nhà thầu / Khách hàng)', group: 'app' },
    { key: 'app_addr', label: 'Địa chỉ bên được bảo lãnh', group: 'app' },
    { key: 'app_reg_no', label: 'Số đăng ký kinh doanh', group: 'app' },
    { key: 'jv_name', label: 'Tên liên danh (đầy đủ)', group: 'app' },
    { key: 'branch_name', label: 'Chi nhánh TPBank phát hành (vd: Hà Nội)', group: 'bank' },
    { key: 'branch_addr', label: 'Địa chỉ chi nhánh', group: 'bank' },
    { key: 'contract_name', label: 'Tên/loại hợp đồng', group: 'contract' },
    { key: 'contract_no', label: 'Số hợp đồng', group: 'contract' },
    { key: 'contract_date', label: 'Ngày ký hợp đồng', group: 'contract', type: 'date' },
    { key: 'bid_package', label: 'Tên gói thầu', group: 'bid' },
    { key: 'project', label: 'Tên dự án / dự toán mua sắm', group: 'bid' },
    { key: 'bid_notice_no', label: 'Số thông báo mời thầu / E-TBMT', group: 'bid' },
    { key: 'bid_notice_date', label: 'Ngày thông báo mời thầu', group: 'bid', type: 'date' },
    { key: 'amount', label: 'Số tiền bảo lãnh', group: 'money', type: 'amount' },
    { key: 'currency', label: 'Loại tiền', group: 'money', type: 'currency' },
    { key: 'advance_amount', label: 'Số tiền tạm ứng', group: 'money', type: 'amount' },
    { key: 'guarantee_no', label: 'Số bảo lãnh', group: 'term' },
    { key: 'issue_date', label: 'Ngày phát hành', group: 'term', type: 'date' },
    { key: 'effective_date', label: 'Ngày bắt đầu hiệu lực', group: 'term', type: 'date' },
    { key: 'expiry_date', label: 'Ngày hết hiệu lực', group: 'term', type: 'date' },
    { key: 'validity_text', label: 'Thời hạn hiệu lực (diễn đạt, vd: 120 ngày kể từ ngày đóng thầu)', group: 'term' },
    { key: 'account_no', label: 'Số tài khoản nhận tiền ứng trước tại TPBank', group: 'term' },
  ];
  var GROUPS = {
    ben: 'Bên nhận bảo lãnh', app: 'Bên được bảo lãnh', bank: 'Ngân hàng phát hành',
    contract: 'Hợp đồng', bid: 'Gói thầu / Dự án', money: 'Số tiền', term: 'Số hiệu & hiệu lực',
  };
  var FIELD_KEYS = FIELDS.map(function (f) { return f.key; });

  var CCY_UNIT = { VND: 'đồng', USD: 'đô la Mỹ', EUR: 'euro' };

  // ── Slot → (hàm render, các trường phụ thuộc, bắt buộc?) ──
  function v(f, k) { return (f[k] == null ? '' : String(f[k])).trim(); }
  function amt(f, k) { return formatAmount(v(f, k), v(f, 'currency') || 'VND'); }
  function amtFull(f, k) {
    var n = amt(f, k); if (!n) return '';
    var ccy = v(f, 'currency') || 'VND';
    return n + ' ' + ccy + ' (Bằng chữ: ' + amountToWords(v(f, k), ccy) + ')';
  }
  var SLOTS = {
    BEN_NAME: { deps: ['ben_name'], r: function (f) { return v(f, 'ben_name'); } },
    BEN_ADDR: { deps: ['ben_addr'], r: function (f) { return v(f, 'ben_addr'); } },
    APP_NAME: { deps: ['app_name'], r: function (f) { return v(f, 'app_name'); } },
    APP_ADDR: { deps: ['app_addr'], r: function (f) { return v(f, 'app_addr'); } },
    APP_REG_NO: { deps: ['app_reg_no'], r: function (f) { return v(f, 'app_reg_no'); } },
    APP_NAME_ADDR: { deps: ['app_name', 'app_addr'], r: function (f) {
      var n = v(f, 'app_name'), a = v(f, 'app_addr');
      return n && a ? n + ', địa chỉ: ' + a : n;
    } },
    JV_NAME: { deps: ['jv_name'], r: function (f) { return v(f, 'jv_name') || v(f, 'app_name'); } },
    BANK_NAME: { deps: ['branch_name'], r: function (f) {
      var b = v(f, 'branch_name');
      return b ? 'Ngân hàng TMCP Tiên Phong – Chi nhánh ' + b : '';
    } },
    BRANCH_NAME: { deps: ['branch_name'], r: function (f) { return v(f, 'branch_name'); } },
    BRANCH_LABEL: { deps: ['branch_name'], r: function (f) { var b = v(f, 'branch_name'); return b ? 'Chi nhánh ' + b : ''; } },
    BANK_ADDR: { deps: ['branch_addr'], r: function (f) { return v(f, 'branch_addr'); } },
    BANK_COUNTRY: { deps: [], r: function () { return 'Việt Nam'; } },
    CONTRACT_NAME_NO: { deps: ['contract_no'], r: function (f) {
      var no = v(f, 'contract_no'); if (!no) return '';
      var s = (v(f, 'contract_name') || 'Hợp đồng') + ' số ' + no;
      var d = formatDate(v(f, 'contract_date'));
      return d ? s + ' ngày ' + d : s;
    } },
    CONTRACT_NAME: { deps: [], r: function (f) { return v(f, 'contract_name') || 'Hợp đồng'; } },
    CONTRACT_NO: { deps: ['contract_no'], r: function (f) { return v(f, 'contract_no'); } },
    CONTRACT_DATE: { deps: ['contract_date'], r: function (f) { return formatDate(v(f, 'contract_date')); } },
    // mẫu đã có sẵn chữ "gói thầu"/"thuộc dự án" trước slot → bỏ tiền tố trùng trong giá trị
    BID_PACKAGE: { deps: ['bid_package'], r: function (f) { return v(f, 'bid_package').replace(/^gói thầu\s*/i, ''); } },
    BID_PACKAGE_FULL: { deps: ['bid_package'], r: function (f) {
      var b = v(f, 'bid_package'); return b && !/^gói thầu/i.test(b) ? 'gói thầu ' + b : b;
    } },
    PROJECT: { deps: [], r: function (f) { return v(f, 'project').replace(/^dự án\s*/i, ''); }, optional: true },
    OF_PROJECT: { deps: [], r: function (f) { return v(f, 'project') ? 'thuộc dự án' : ''; }, optional: true },
    BID_NOTICE_NO: { deps: ['bid_notice_no'], r: function (f) { return v(f, 'bid_notice_no'); } },
    BID_NOTICE_DATE: { deps: ['bid_notice_date'], r: function (f) { return formatDate(v(f, 'bid_notice_date')); } },
    AMT_FULL: { deps: ['amount'], r: function (f) { return amtFull(f, 'amount'); } },
    ADV_FULL: { deps: ['advance_amount'], r: function (f) { return amtFull(f, 'advance_amount'); } },
    AMT_NUM: { deps: ['amount'], r: function (f) { return amt(f, 'amount'); } },
    AMT_NUM_CCY: { deps: ['amount'], r: function (f) { var n = amt(f, 'amount'); return n ? n + ' ' + (v(f, 'currency') || 'VND') : ''; } },
    CURRENCY: { deps: [], r: function (f) { return v(f, 'currency') || 'VND'; } },
    AMT_WORDS: { deps: ['amount'], r: function (f) { return v(f, 'amount') ? amountToWords(v(f, 'amount'), v(f, 'currency') || 'VND') : ''; } },
    AMT_WORDS_NOUNIT: { deps: ['amount'], r: function (f) {
      return v(f, 'amount') ? amountToWords(v(f, 'amount'), v(f, 'currency') || 'VND', true) : '';
    } },
    GUARANTEE_NO: { deps: ['guarantee_no'], r: function (f) { return v(f, 'guarantee_no'); } },
    ISSUE_DATE: { deps: ['issue_date'], r: function (f) { return formatDate(v(f, 'issue_date')); } },
    EFFECTIVE_DATE: { deps: ['effective_date'], r: function (f) { return formatDate(v(f, 'effective_date')); } },
    EXPIRY_DATE: { deps: ['expiry_date'], r: function (f) { return formatDate(v(f, 'expiry_date')); } },
    EXPIRY_DATE_VN: { deps: ['expiry_date'], r: function (f) { return dateVN(v(f, 'expiry_date'), true); } },
    EXPIRY_DATE_VN_BARE: { deps: ['expiry_date'], r: function (f) { return dateVN(v(f, 'expiry_date'), true); } },
    VALIDITY_TEXT: { deps: ['validity_text'], r: function (f) { return v(f, 'validity_text'); } },
    ACCOUNT_NO: { deps: ['account_no'], r: function (f) { return v(f, 'account_no'); } },
    SIGNATORY: { deps: [], r: function () { return ''; }, optional: true },
  };

  /** Trường nguyên tử mà 1 mẫu cần (theo slot). */
  function fieldsForSlots(slots) {
    var out = [];
    (slots || []).forEach(function (s) {
      ((SLOTS[s] && SLOTS[s].deps) || []).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); });
    });
    if (out.indexOf('amount') >= 0 && out.indexOf('currency') < 0) out.push('currency');
    return FIELD_KEYS.filter(function (k) { return out.indexOf(k) >= 0; }); // giữ thứ tự FIELDS
  }

  /** Render toàn bộ slot → { values:{KEY:text}, missing:[KEY] } (giá trị rỗng = thiếu, trừ slot optional). */
  function renderSlots(slots, fields) {
    var values = {}, missing = [];
    (slots || []).forEach(function (s) {
      var def = SLOTS[s];
      var val = def ? def.r(fields || {}) : '';
      values[s] = val;
      if (!val && def && !def.optional && missing.indexOf(s) < 0) missing.push(s);
    });
    return { values: values, missing: missing };
  }

  // ── Số tiền ──
  /** "8,785,621,000 VNĐ" | "8.785.621.000" | "1,234.50" → chuỗi số chuẩn "8785621000" | "1234.5". */
  function normalizeAmount(raw, currency) {
    var s = String(raw == null ? '' : raw).replace(/[^\d.,]/g, '');
    if (!s) return '';
    var ccy = (currency || 'VND').toUpperCase();
    if (ccy === 'VND') return s.replace(/[.,]/g, '').replace(/^0+(?=\d)/, '');
    var lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
    var dec = '';
    if (lastSep >= 0 && s.length - lastSep - 1 <= 2) { dec = s.slice(lastSep + 1); s = s.slice(0, lastSep); }
    s = s.replace(/[.,]/g, '').replace(/^0+(?=\d)/, '');
    dec = dec.replace(/0+$/, '');
    return dec ? s + '.' + dec : s;
  }

  /** "8785621000" → "8.785.621.000"; USD "1234.5" → "1.234,50". */
  function formatAmount(norm, currency) {
    var s = normalizeAmount(norm, currency === 'VND' ? 'VND' : 'USD');
    if (!s) return '';
    var parts = s.split('.');
    var intp = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (parts[1]) return intp + ',' + (parts[1] + '0').slice(0, 2);
    return intp;
  }

  var DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function read3(n, full) {
    var h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10, out = [];
    if (full || h > 0) out.push(DIGITS[h] + ' trăm');
    if (t === 0) { if (u > 0 && (full || h > 0)) out.push('linh'); }
    else if (t === 1) out.push('mười');
    else out.push(DIGITS[t] + ' mươi');
    if (u > 0) {
      if (u === 1 && t > 1) out.push('mốt');
      else if (u === 5 && t > 0) out.push('lăm');
      else out.push(DIGITS[u]);
    }
    return out.join(' ');
  }
  /** Đọc số nguyên (chuỗi chữ số, tới hàng tỷ tỷ) thành chữ. */
  function intToWords(digits) {
    digits = String(digits).replace(/\D/g, '').replace(/^0+/, '');
    if (!digits) return 'không';
    return readBig(digits, false);
  }
  // > 9 chữ số: phần cao đọc đệ quy + "tỷ", 9 chữ số thấp đọc đủ ("không trăm …").
  function readBig(d, full) {
    if (d.length > 9) {
      var hi = d.slice(0, -9).replace(/^0+/, ''), lo = d.slice(-9);
      var w = readBig(hi, full) + ' tỷ';
      if (/[1-9]/.test(lo)) w += ' ' + read9(lo, true);
      return w;
    }
    return read9(d, full);
  }
  function read9(d, full) {
    d = ('000000000' + d).slice(-9);
    var units = [' triệu', ' nghìn', ''], out = [], started = false;
    for (var i = 0; i < 3; i++) {
      var g = parseInt(d.substr(i * 3, 3), 10);
      if (g === 0) continue;
      out.push(read3(g, started || full) + units[i]);
      started = true;
    }
    return out.join(' ');
  }
  /** Số tiền → chữ, viết hoa chữ đầu. noUnit: bỏ đơn vị ("đồng"). */
  function amountToWords(raw, currency, noUnit) {
    var ccy = (currency || 'VND').toUpperCase();
    var s = normalizeAmount(raw, ccy);
    if (!s) return '';
    var parts = s.split('.');
    var w = intToWords(parts[0]);
    var unit = CCY_UNIT[ccy] || ccy;
    if (!noUnit) w += ' ' + unit;
    if (parts[1] && parseInt(parts[1], 10) > 0) {
      var cents = (parts[1] + '0').slice(0, 2);
      w += (noUnit ? ' phẩy ' : ' và ') + intToWords(cents) + (noUnit ? '' : ' xu');
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  /** So khớp số chữ trong thư với số tiền (bỏ dấu, khoảng trắng, dấu câu, đơn vị). */
  function wordsMatch(lettersWords, raw, currency) {
    if (!lettersWords) return true;
    var norm = function (s) {
      return String(s).toLowerCase().normalize('NFC')
        .replace(/đồng|vnđ|vnd|chẵn|đô la mỹ|usd|euro|eur/g, '')
        .replace(/lẻ/g, 'linh').replace(/tư(?=\s|$)/g, 'bốn').replace(/ngàn/g, 'nghìn').replace(/một mươi/g, 'mười')
        .replace(/[^a-zà-ỹđ]/g, '');
    };
    return norm(lettersWords) === norm(amountToWords(raw, currency, true));
  }

  // ── Ngày ──
  /** Nhiều dạng → "dd/mm/yyyy"; không nhận ra → trả nguyên văn (đã trim). */
  function formatDate(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return pad(m[3]) + '/' + pad(m[2]) + '/' + m[1];
    m = s.match(/^(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})$/);
    if (m) return pad(m[1]) + '/' + pad(m[2]) + '/' + m[3];
    m = s.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
    if (m) return pad(m[1]) + '/' + pad(m[2]) + '/' + m[3];
    return s;
  }
  function pad(x) { return ('0' + x).slice(-2); }
  /** "dd/mm/yyyy" → "ngày dd tháng mm năm yyyy" (withPrefix) ; khác dạng → nguyên văn. */
  function dateVN(raw, withPrefix) {
    var d = formatDate(raw);
    var m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return d;
    return (withPrefix ? 'ngày ' : '') + m[1] + ' tháng ' + m[2] + ' năm ' + m[3];
  }
  function isValidDate(raw) {
    var m = formatDate(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    return d.getFullYear() === +m[3] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[1];
  }
  function toTime(raw) {
    var m = formatDate(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]).getTime() : null;
  }

  /**
   * Chuẩn hoá bộ trường sau bóc tách + kiểm tra chéo → { fields, warnings[] }.
   * fieldsIn: { key: value | {value, confidence, evidence} }.
   */
  function normalizeFields(fieldsIn, opts) {
    opts = opts || {};
    var f = {}, meta = {}, warnings = [];
    FIELD_KEYS.forEach(function (k) {
      var x = fieldsIn ? fieldsIn[k] : null;
      var val = (x && typeof x === 'object') ? x.value : x;
      f[k] = val == null ? '' : String(val).replace(/\s+/g, ' ').trim();
      if (x && typeof x === 'object') meta[k] = { confidence: x.confidence, evidence: x.evidence || '' };
    });
    f.currency = (f.currency || 'VND').toUpperCase().replace('VNĐ', 'VND');
    if (!CCY_UNIT[f.currency]) warnings.push('Loại tiền "' + f.currency + '" chưa hỗ trợ đọc chữ — kiểm tra tay.');
    ['amount', 'advance_amount'].forEach(function (k) { f[k] = normalizeAmount(f[k], f.currency); });
    FIELDS.forEach(function (d) {
      if (d.type === 'date' && f[d.key]) {
        f[d.key] = formatDate(f[d.key]);
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(f[d.key]) && !isValidDate(f[d.key])) warnings.push(d.label + ' không hợp lệ: ' + f[d.key]);
      }
    });
    if (f.branch_name) f.branch_name = f.branch_name.replace(/^(chi nhánh|CN)\s*/i, '').trim();
    if (opts.amountWordsInLetter && f.amount && !wordsMatch(opts.amountWordsInLetter, f.amount, f.currency)) {
      warnings.push('Số tiền bằng chữ trong thư KH ("' + opts.amountWordsInLetter + '") KHÔNG khớp số ' +
        formatAmount(f.amount, f.currency) + ' — kiểm tra lại số tiền.');
    }
    var ts = toTime(f.effective_date || f.issue_date), te = toTime(f.expiry_date);
    if (ts && te && te <= ts) warnings.push('Ngày hết hiệu lực không sau ngày bắt đầu/phát hành.');
    if (f.advance_amount && f.amount && Number(f.amount) > Number(f.advance_amount)) {
      warnings.push('Số tiền bảo lãnh lớn hơn số tiền tạm ứng — kiểm tra lại.');
    }
    return { fields: f, meta: meta, warnings: warnings };
  }

  // ── Xếp hạng mẫu ──
  var FAMILY_TO_TYPE = { TPB: 'TPB', T22: 'T22', TT22: 'T22', T07: 'T07', TT07: 'T07', EVN: 'EVN', VIT: 'VIT', TT79: 'TT79', B8ZB: 'TT79' };
  // lĩnh vực viết dài (thư/TT79) → mã ngắn của bảng MAU_THU
  var SECTOR_ALIAS = { 'HANG HOA': 'HH', 'XAY LAP': 'XL', 'PHI TU VAN': 'PTV', 'MUON MAY': 'MM', 'THUOC CU': 'TC', 'THUOC MOI': 'TM' };
  function normSector(s) { s = norm(s); return SECTOR_ALIAS[s] || s.replace(/^CGTT-/, ''); }
  function norm(s) { return String(s || '').toUpperCase().replace(/\s+/g, ' ').trim(); }

  /**
   * rankTemplates(catalog.templates, cls) → [{ id, label, score, reasons[] }] giảm dần.
   * cls: { guarantee_type, form_family, method, joint_venture, sector, envelope, variant }
   * guarantee_type là ràng buộc cứng (nếu có); các chiều khác cộng điểm.
   */
  function rankTemplates(templates, cls) {
    cls = cls || {};
    var gt = norm(cls.guarantee_type), fam = FAMILY_TO_TYPE[norm(cls.form_family)] || '';
    var out = [];
    (templates || []).forEach(function (t) {
      if (gt && t.guarantee_type !== gt) return;
      var s = 0, why = [];
      if (fam) { if (t.template_type === fam) { s += 50; why.push('đúng bộ mẫu'); } else s -= 20; }
      if (cls.joint_venture) { if (t.joint_venture === norm(cls.joint_venture)) { s += 20; why.push(t.joint_venture === 'LD' ? 'liên danh' : 'độc lập'); } else s -= 10; }
      if (cls.method) { if (t.method === norm(cls.method)) { s += 10; why.push(t.method === 'TG' ? 'thư giấy' : 'thư điện tử'); } }
      if (cls.sector && t.sector) { if (normSector(t.sector) === normSector(cls.sector)) { s += 15; why.push('đúng lĩnh vực'); } else s -= 5; }
      if (cls.envelope && t.envelope) { if (norm(t.envelope).charAt(0) === norm(cls.envelope).charAt(0)) { s += 10; why.push(t.envelope); } }
      if (cls.variant && t.variant) { if (norm(t.variant).indexOf(norm(cls.variant)) >= 0) { s += 8; why.push(t.variant); } }
      out.push({ id: t.id, label: t.label, score: s, reasons: why });
    });
    out.sort(function (a, b) { return b.score - a.score || (a.id < b.id ? -1 : 1); });
    return out;
  }

  // ── Điền XML docx ──
  function escXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /**
   * fillXml(xml, values, missing) — thay {{KEY}} trong document/header/footer XML.
   * Token luôn nằm trọn trong 1 <w:t> (do Normalize.gs bảo đảm). Run chứa token được tách
   * thành nhiều run cùng rPr; slot THIẾU giá trị → "…………" tô vàng để cán bộ thấy ngay.
   * Trả { xml, used:[KEY] }.
   */
  function fillXml(xml, values, missing) {
    var used = [];
    var runRe = /<w:r(?:\s[^>]*)?>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>/g;
    var out = xml.replace(runRe, function (run) {
      if (run.indexOf('{{') < 0) return run;
      var m = run.match(/^(<w:r(?:\s[^>]*)?>)((?:<w:rPr>[\s\S]*?<\/w:rPr>)?)<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t><\/w:r>$/);
      if (!m) {
        // cấu trúc lạ (hiếm) → thay text đơn giản, không tách run
        return run.replace(/\{\{([A-Z0-9_]+)\}\}/g, function (_, k) { used.push(k); return escXml(values[k] || BLANK); });
      }
      var open = m[1], rpr = m[2], text = m[3];
      var hl = rpr ? rpr.replace('</w:rPr>', '<w:highlight w:val="yellow"/></w:rPr>') : '<w:rPr><w:highlight w:val="yellow"/></w:rPr>';
      var pieces = text.split(/(\{\{[A-Z0-9_]+\}\})/);
      return pieces.map(function (p) {
        if (!p) return '';
        var k = p.match(/^\{\{([A-Z0-9_]+)\}\}$/);
        if (!k) return open + rpr + '<w:t xml:space="preserve">' + p + '</w:t></w:r>';
        used.push(k[1]);
        var val = values[k[1]];
        var isMissing = (missing || []).indexOf(k[1]) >= 0;
        if (isMissing) return open + hl + '<w:t xml:space="preserve">' + BLANK + '</w:t></w:r>';
        if (!val) return '';
        var lines = String(val).split(/\r?\n/).map(escXml);
        return open + rpr + '<w:t xml:space="preserve">' + lines.join('</w:t><w:br/><w:t xml:space="preserve">') + '</w:t></w:r>';
      }).join('');
    });
    return { xml: out, used: used };
  }

  return {
    BLANK: BLANK, FIELDS: FIELDS, GROUPS: GROUPS, FIELD_KEYS: FIELD_KEYS, SLOTS: SLOTS,
    fieldsForSlots: fieldsForSlots, renderSlots: renderSlots,
    normalizeAmount: normalizeAmount, formatAmount: formatAmount, amountToWords: amountToWords, wordsMatch: wordsMatch,
    formatDate: formatDate, dateVN: dateVN, isValidDate: isValidDate,
    normalizeFields: normalizeFields, rankTemplates: rankTemplates, fillXml: fillXml, escXml: escXml,
  };
})();

if (typeof module !== 'undefined') module.exports = SGCore;
