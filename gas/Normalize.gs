/**
 * Normalize.gs — THUẦN: chuẩn hoá 1 mẫu thư gốc (.docx) thành "mẫu có slot" (DOCX_GENERATOR.md v2).
 * Chạy trong GAS (Templates.gs::rebuildTemplates) và trên Node (tools/normalize.js) — cùng 1 mã.
 *
 *   - Gỡ comment review, chấp nhận tracked changes, gỡ MERGEFIELD thành text «NAME».
 *   - Nhận diện mọi chỗ trống (BLANK_RE) → gắn SLOT theo NGỮ CẢNH (RULES: chữ chỗ trống + ~80 ký tự bên trái).
 *   - Thay bằng token {{SLOT}} trong run riêng, bỏ định dạng placeholder (nghiêng/tô nền/màu).
 *
 * Giao diện: normalizeParts(parts) — parts = { '<tên part>': xmlString } gồm word/document|header*|footer*.xml,
 * [Content_Types].xml, word/_rels/document.xml.rels (caller tự giải nén/nén).
 * Trả { parts, slots:[…], preview:[{t,a,b}], report:[{blank,left,right,slot}], unmapped:n }.
 */
var SGNormalize = (function () {
  'use strict';

  var BLANK_RE_SRC =
    '(ngày\\s*[_….]{2,}\\s*tháng\\s*[_….]{2,}\\s*năm\\s*(?:_{2,}|…+|\\.{3,}))' +
    '|(BG 0000000)' +
    '|(«[^»\\n]{1,40}»)' +
    '|((?:_{2,}\\s*)?\\[[^\\]\\n]{1,160}\\])' +
    '|([….]+\\s*/\\s*[….]+\\s*/\\s*[….]+)' +
    '|(…{2,}[….]*|…\\.{1,}|\\.{4,}|…(?=\\s*[;,()]))' +
    '|(_{3,})';

  // (regex trên CHỮ chỗ trống, regex trên NGỮ CẢNH TRÁI | null, SLOT) — khớp luật đầu tiên.
  var RULES = [
    ['«\\$ND001»', null, 'BEN_NAME'], ['«\\$ND002»', null, 'BEN_ADDR'], ['«\\$ND005»', null, 'AMT_NUM'],
    ['«\\$ND006»', null, 'CURRENCY'], ['«\\$ND007»', null, 'AMT_WORDS'], ['«\\$ND008»', null, 'VALIDITY_TEXT'],
    ['«\\$ND012»', null, 'ISSUE_DATE'], ['«\\$ND013»', null, 'GUARANTEE_NO'], ['«\\$ND014»', null, 'JV_NAME'],
    ['«\\$ND033»', null, 'PROJECT'], ['«\\$ND034»', null, 'BID_PACKAGE'], ['«\\$ND035»', null, 'BID_NOTICE_NO'],
    ['«\\$TPB001»', null, 'BRANCH_LABEL'], ['«\\$TPB002»', null, 'BANK_ADDR'], ['«\\$KH001»', null, 'APP_NAME'],
    ['«OF_PROJECT_NAME»', null, 'OF_PROJECT'],
    ['^ngày', null, 'EXPIRY_DATE_VN'],
    ['tiền tạm ứng|tạm ứng', null, 'ADV_FULL'],
    ['giá trị|số tiền bằng số|ghi số tiền bảo lãnh', 'tạm ứng\\s*$', 'ADV_FULL'],
    ['giá trị|số tiền bằng số|ghi số tiền bảo lãnh', null, 'AMT_FULL'],
    ['^\\[bằng số\\]$', null, 'AMT_NUM_CCY'],
    ['^[….]+$', 'bằng chữ:\\s*$', 'AMT_WORDS'],
    ['^[….]+$', '(?:không vượt quá|là)\\s*$', 'AMT_NUM'],
    ['ghi tên Chủ đầu tư|bên nhận bảo lãnh|cơ sở.y tế', null, 'BEN_NAME'],
    ['Địa chỉ Chủ đầu tư|^\\[địa chỉ\\]$', null, 'BEN_ADDR'],
    ['ghi tên và địa chỉ của nhà thầu', null, 'APP_NAME_ADDR'],
    ['ghi đầy đủ tên của nhà thầu liên danh', null, 'JV_NAME'],
    ['ghi tên (?:của )?[Nn]hà thầu|tên khách hàng được bảo lãnh', null, 'APP_NAME'],
    ['địa chỉ của khách hàng', null, 'APP_ADDR'],
    ['^\\[[….]+\\]$', 'đăng ký kinh doanh số\\s*$', 'APP_REG_NO'],
    ['ghi tên của ngân hàng', null, 'BANK_NAME'],
    ['ghi địa chỉ của ngân hàng|địa chỉ chi nhánh', null, 'BANK_ADDR'],
    ['^\\[[….]+\\]$', 'chi nhánh\\s*$', 'BRANCH_NAME'],
    ['quốc gia|Quốc gia', null, 'BANK_COUNTRY'],
    ['ghi tên hợp đồng, số hợp đồng', null, 'CONTRACT_NAME_NO'],
    ['^\\[Hợp đồng\\]$', null, 'CONTRACT_NAME'],
    ['^\\[số hợp đồng\\]$', null, 'CONTRACT_NO'],
    ['^\\[[….]+\\]$', '(?:Hợp đồng|\\[Hợp đồng\\]) số\\s*$', 'CONTRACT_NO'],
    ['/', 'mời thầu số \\S+ ngày\\s*$', 'BID_NOTICE_DATE'],
    ['^BG 0000000$', null, 'GUARANTEE_NO'],
    ['/', 'BG 0000000 ngày\\s*$', 'ISSUE_DATE'],
    ['^…$', 'Chi nhánh\\s*$', 'BRANCH_NAME'],
    ['/|^\\[ngày ký\\]$|^\\[…\\]$|^…$', '(?:ký )?ngày\\s*$', 'CONTRACT_DATE'],
    ['nội dung mời thầu hoặc số hiệu gói thầu', null, 'BID_PACKAGE_FULL'],
    ['ghi tên gói thầu', null, 'BID_PACKAGE'],
    ['ghi tên dự án', null, 'PROJECT'],
    ['^\\[[….]+\\]$', 'mời thầu số\\s*$', 'BID_NOTICE_NO'],
    ['ghi số trích yếu của Thư mời thầu', null, 'BID_NOTICE_NO'],
    ['ghi số trích yếu của Bảo lãnh', null, 'GUARANTEE_NO'],
    ['ghi ngày phát hành bảo lãnh', null, 'ISSUE_DATE'],
    ['^\\[ngày…tháng…năm\\]$', null, 'EXPIRY_DATE_VN_BARE'],
    ['^[….]+$', '17 giờ 00 ngày\\s*$', 'EXPIRY_DATE'],
    ['^[….]+$', 'hiệu lực kể từ ngày\\s*$', 'EFFECTIVE_DATE'],
    ['^[….]+$', 'tài khoản số\\s*$', 'ACCOUNT_NO'],
    ['ghi tên, chức danh, ký tên', null, 'SIGNATORY'],
  ].map(function (r) { return [new RegExp(r[0]), r[1] ? new RegExp(r[1]) : null, r[2]]; });

  var TEXT_PARTS = /^word\/(document|header\d*|footer\d*)\.xml$/;
  var DROP_PARTS = /^word\/(comments|commentsExtended|commentsIds|commentsExtensible|people)\.xml$/;
  var DROP_TARGETS = '(?:comments|commentsExtended|commentsIds|commentsExtensible|people)\\.xml';
  var ALNUM = /[\p{L}\p{N}]/u;
  var T_RE = /<w:t(\s[^>]*)?>([^<]*)<\/w:t>/g;
  var RUN_RE = /<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>/g;
  var P_RE = /<w:p\b[^>]*>(?:(?!<w:p\b)[\s\S])*?<\/w:p>/g;

  function slotFor(blank, left) {
    left = left.replace(/\s+/g, ' ').slice(-80);
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(blank) && (!RULES[i][1] || RULES[i][1].test(left))) return RULES[i][2];
    }
    return null;
  }

  function decode(s) {
    return s.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, function (m, e) {
      if (e === 'amp') return '&';
      if (e === 'lt') return '<';
      if (e === 'gt') return '>';
      if (e === 'quot') return '"';
      if (e === 'apos') return "'";
      return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    });
  }
  function encode(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function paraText(p) {
    var s = '', m;
    T_RE.lastIndex = 0;
    while ((m = T_RE.exec(p))) s += decode(m[2]);
    return s;
  }

  /** Gỡ comment review + chấp nhận tracked changes. */
  function cleanPart(xml) {
    return xml
      .replace(/<w:commentRange(?:Start|End)\b[^>]*\/>/g, '')
      .replace(/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:commentReference\b[^>]*\/>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>/g, '')
      .replace(/<w:del\b[^>]*\/>/g, '').replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/g, '')
      .replace(/<w:(rPrChange|pPrChange)\b[^>]*\/>/g, '').replace(/<w:(rPrChange|pPrChange)\b[^>]*>[\s\S]*?<\/w:\1>/g, '')
      .replace(/<w:ins\b[^>]*\/>/g, '').replace(/<w:ins\b[^>]*>/g, '').replace(/<\/w:ins>/g, '');
  }

  /** MERGEFIELD phức (fldChar begin…end) → 1 run «NAME» giữ rPr của run begin. */
  function collapseFields(p) {
    var re = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g, runs = [], m;
    while ((m = re.exec(p))) runs.push({ s: m.index, e: m.index + m[0].length, x: m[0] });
    var out = [], last = 0;
    for (var i = 0; i < runs.length; i++) {
      if (!/w:fldCharType="begin"/.test(runs[i].x)) continue;
      var depth = 0, instr = '', j = i;
      for (; j < runs.length; j++) {
        if (/w:fldCharType="begin"/.test(runs[j].x)) depth++;
        var it = runs[j].x.match(/<w:instrText\b[^>]*>([^<]*)<\/w:instrText>/);
        if (it) instr += it[1];
        if (/w:fldCharType="end"/.test(runs[j].x)) { depth--; if (depth === 0) break; }
      }
      var mf = instr.match(/MERGEFIELD\s+(\S+)/);
      if (!mf || j >= runs.length) continue;
      var rpr = (runs[i].x.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0];
      out.push(p.slice(last, runs[i].s), '<w:r>' + rpr + '<w:t>«' + encode(mf[1]) + '»</w:t></w:r>');
      last = runs[j].e;
      i = j;
    }
    out.push(p.slice(last));
    return out.join('');
  }

  /** Bỏ định dạng placeholder khỏi rPr của run token. */
  function cleanTokenRpr(rpr) {
    return rpr.replace(/<w:(?:i|iCs|highlight|shd|color)\b[^>]*\/>/g, '').replace('<w:rPr></w:rPr>', '');
  }

  /** Tách mỗi {{TOKEN}} thành 1 run riêng; phần chữ còn lại giữ rPr gốc. */
  function isolateTokens(p) {
    return p.replace(RUN_RE, function (run) {
      if (run.indexOf('{{') < 0) return run;
      var m = run.match(/^(<w:r\b[^>]*>)((?:<w:rPr>[\s\S]*?<\/w:rPr>)?)<w:t(?:\s[^>]*)?>([^<]*)<\/w:t><\/w:r>$/);
      if (!m) return run; // run có tab/br… (hiếm) — giữ nguyên, fillXml vẫn thay được
      var open = m[1], rpr = m[2];
      return m[3].split(/(\{\{[A-Z0-9_]+\}\})/).filter(Boolean).map(function (x) {
        var tok = /^\{\{[A-Z0-9_]+\}\}$/.test(x);
        return open + (tok ? cleanTokenRpr(rpr) : rpr) + '<w:t xml:space="preserve">' + x + '</w:t></w:r>';
      }).join('');
    });
  }

  /** 1 đoạn văn: tìm chỗ trống → token theo ngữ cảnh. */
  function tokenizeParagraph(p, report, slotsOut) {
    p = collapseFields(p);
    var nodes = [], m;
    T_RE.lastIndex = 0;
    while ((m = T_RE.exec(p))) nodes.push({ s: m.index, e: m.index + m[0].length, attrs: m[1] || '', text: decode(m[2]) });
    if (!nodes.length) return p;
    var texts = nodes.map(function (n) { return n.text; });
    var full = texts.join(''), starts = [], pos = 0;
    texts.forEach(function (t) { starts.push(pos); pos += t.length; });

    var matches = [], re = new RegExp(BLANK_RE_SRC, 'g'), bm;
    while ((bm = re.exec(full))) {
      var blank = bm[0], ms = bm.index, me = ms + blank.length, left = full.slice(0, ms);
      var key = slotFor(blank, left);
      // "(bằng chữ: …………..đồng)" — mẫu đã có sẵn "đồng" → bỏ đơn vị khi render
      if (key === 'AMT_WORDS' && /^\s*đồng/.test(full.slice(me))) key = 'AMT_WORDS_NOUNIT';
      report.push({ blank: blank, left: left.replace(/\s+/g, ' ').slice(-60), right: full.slice(me, me + 30), slot: key || '' });
      if (!key) continue;
      // mẫu hay viết dính "tại____" / "số….của" → chèn khoảng trắng để giá trị không dính chữ
      var prev = ms > 0 ? full[ms - 1] : '', nxt = me < full.length ? full[me] : '';
      var pre = prev && !/\s/.test(prev) && '(“"/['.indexOf(prev) < 0 ? ' ' : '';
      var post = nxt && ALNUM.test(nxt) ? ' ' : '';
      matches.push({ s: ms, e: me, token: pre + '{{' + key + '}}' + post, key: key });
    }
    for (var q = matches.length - 1; q >= 0; q--) {
      var mt = matches[q], i0 = 0;
      for (var k = 0; k < nodes.length; k++) if (starts[k] <= mt.s) i0 = k;
      for (var k2 = i0; k2 < nodes.length; k2++) {
        var ns = starts[k2], ne = ns + nodes[k2].text.length;
        if (ns >= mt.e) break;
        var a = Math.max(mt.s, ns) - ns, b = Math.min(mt.e, ne) - ns, t = texts[k2];
        texts[k2] = k2 === i0 ? t.slice(0, a) + mt.token + t.slice(b) : t.slice(0, a) + t.slice(b);
      }
    }
    matches.forEach(function (x) { slotsOut.push(x.key); });
    for (var n = nodes.length - 1; n >= 0; n--) {
      if (texts[n] === nodes[n].text) continue;
      var attrs = /xml:space=/.test(nodes[n].attrs) ? nodes[n].attrs : nodes[n].attrs + ' xml:space="preserve"';
      p = p.slice(0, nodes[n].s) + '<w:t' + attrs + '>' + encode(texts[n]) + '</w:t>' + p.slice(nodes[n].e);
    }
    return matches.length ? isolateTokens(p) : p;
  }

  /** Bản xem trước cho FE: [{t: text có token, a: ''|'c'|'r', b: 0|1}], gộp dòng trống liên tiếp. */
  function previewOf(xml) {
    var out = [];
    (xml.match(P_RE) || []).forEach(function (p) {
      var t = paraText(p);
      var jc = (p.match(/<w:pPr>(?:(?!<\/w:pPr>)[\s\S])*?<w:jc w:val="([a-z]+)"/) || [])[1] || '';
      var runs = (p.match(RUN_RE) || []).filter(function (r) { return /\S/.test(paraText(r)); });
      var bold = runs.length > 0 && runs.every(function (r) { return /<w:rPr>(?:(?!<\/w:rPr>)[\s\S])*?<w:b(?:\/>|\s[^>]*\/>)/.test(r); });
      out.push({ t: t, a: jc === 'center' ? 'c' : (jc === 'right' || jc === 'end' ? 'r' : ''), b: bold ? 1 : 0 });
    });
    var slim = [], blank = 0;
    out.forEach(function (x) {
      if (!x.t.trim()) { blank++; if (blank > 1) return; } else blank = 0;
      slim.push(x);
    });
    return slim;
  }

  function normalizeParts(parts) {
    var out = {}, report = [], slotsAll = [], preview = [];
    Object.keys(parts).forEach(function (name) {
      var x = parts[name];
      if (name === '[Content_Types].xml') {
        x = x.replace(new RegExp('<Override[^>]*PartName="/word/' + DROP_TARGETS + '"[^>]*/>', 'g'), '');
      } else if (name === 'word/_rels/document.xml.rels') {
        x = x.replace(new RegExp('<Relationship[^>]*Target="' + DROP_TARGETS + '"[^>]*/>', 'g'), '');
      } else if (TEXT_PARTS.test(name)) {
        x = cleanPart(x).replace(P_RE, function (p) { return tokenizeParagraph(p, report, slotsAll); });
        if (name === 'word/document.xml') preview = previewOf(x);
      }
      out[name] = x;
    });
    var slots = [];
    slotsAll.forEach(function (s) { if (slots.indexOf(s) < 0) slots.push(s); });
    return {
      parts: out, slots: slots, preview: preview, report: report,
      unmapped: report.filter(function (r) { return !r.slot; }).length,
    };
  }

  /** Part cần đưa vào normalizeParts (dạng text). */
  function wantsPart(name) {
    return TEXT_PARTS.test(name) || name === '[Content_Types].xml' || name === 'word/_rels/document.xml.rels';
  }
  /** Part bỏ khỏi file chuẩn hoá (comment review). */
  function dropsPart(name) { return DROP_PARTS.test(name); }

  return { normalizeParts: normalizeParts, wantsPart: wantsPart, dropsPart: dropsPart, slotFor: slotFor };
})();

if (typeof module !== 'undefined') module.exports = SGNormalize;
