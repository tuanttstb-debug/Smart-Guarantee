#!/usr/bin/env node
/**
 * test-core.js — kiểm thử lõi gas/Core.gs (đọc số, chuẩn hoá, render slot, xếp hạng, điền XML).
 * Chạy: node tools/test-core.js   (thoát mã 1 nếu có ca sai)
 * Nếu có build/catalog.json (sinh bởi tools/normalize.js) → kiểm thêm: mọi slot trong catalog
 * đều có luật render, và điền thử toàn bộ mẫu build/templates/*.docx không còn token sót.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require(path.join(__dirname, '..', 'gas', 'Core.gs'));

let fail = 0, pass = 0;
function eq(name, got, want) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; return; }
  fail++; console.log('✗', name, '\n   got :', JSON.stringify(got), '\n   want:', JSON.stringify(want));
}

// ── Đọc số ──
eq('words 0', C.amountToWords('0', 'VND'), 'Không đồng');
eq('words 15', C.amountToWords('15', 'VND'), 'Mười lăm đồng');
eq('words 21', C.amountToWords('21', 'VND'), 'Hai mươi mốt đồng');
eq('words 105', C.amountToWords('105', 'VND'), 'Một trăm linh năm đồng');
eq('words 1005', C.amountToWords('1005', 'VND'), 'Một nghìn không trăm linh năm đồng');
eq('words 110000', C.amountToWords('110000', 'VND'), 'Một trăm mười nghìn đồng');
eq('words 1000000', C.amountToWords('1.000.000', 'VND'), 'Một triệu đồng');
eq('words 7654321000', C.amountToWords('7,654,321,000 VNĐ', 'VND'),
  'Bảy tỷ sáu trăm năm mươi bốn triệu ba trăm hai mươi mốt nghìn đồng');
eq('words 2000050000', C.amountToWords('2000050000', 'VND'), 'Hai tỷ không trăm năm mươi nghìn đồng');
eq('words 1000000000000', C.amountToWords('1000000000000', 'VND'), 'Một nghìn tỷ đồng');
eq('words 5000000001', C.amountToWords('5000000001', 'VND'), 'Năm tỷ không trăm linh một đồng');
eq('words 25 noUnit', C.amountToWords('25', 'VND', true), 'Hai mươi lăm');
eq('words USD', C.amountToWords('1,250.50', 'USD'), 'Một nghìn hai trăm năm mươi đô la Mỹ và năm mươi xu');

// ── Số tiền ──
eq('norm vnd dots', C.normalizeAmount('7.654.321.000 VNĐ', 'VND'), '7654321000');
eq('norm vnd commas', C.normalizeAmount('7,654,321,000', 'VND'), '7654321000');
eq('norm usd', C.normalizeAmount('1,234,567.89', 'USD'), '1234567.89');
eq('norm usd eu', C.normalizeAmount('1.234.567,89', 'USD'), '1234567.89');
eq('fmt vnd', C.formatAmount('7654321000', 'VND'), '7.654.321.000');
eq('fmt usd', C.formatAmount('1234567.5', 'USD'), '1.234.567,50');
eq('words match', C.wordsMatch('Bảy tỷ, sáu trăm năm mươi tư triệu, ba trăm hai mốt nghìn đồng', '7654321000', 'VND'), false);
eq('words match ok', C.wordsMatch('Bảy tỷ, sáu trăm năm mươi tư triệu, ba trăm hai mươi mốt nghìn đồng chẵn', '7654321000', 'VND'), true);
eq('words match lẻ/tư', C.wordsMatch('Một trăm lẻ tư triệu đồng', '104000000', 'VND'), true);

// ── Ngày ──
eq('date iso', C.formatDate('2026-08-11'), '11/08/2026');
eq('date vn', C.formatDate('ngày 11 tháng 8 năm 2026'), '11/08/2026');
eq('date dash', C.formatDate('1-8-2026'), '01/08/2026');
eq('date text passthrough', C.formatDate('ngày Nhà thầu nhận tạm ứng'), 'ngày Nhà thầu nhận tạm ứng');
eq('dateVN', C.dateVN('31/12/2026', true), 'ngày 31 tháng 12 năm 2026');
eq('invalid date', C.isValidDate('31/02/2026'), false);

// ── Chuẩn hoá trường + kiểm tra chéo ──
const n = C.normalizeFields({
  amount: { value: '7,654,321,000', confidence: 90 }, currency: 'VNĐ', branch_name: 'Chi nhánh Hà Nội',
  contract_date: '11/8/2026', issue_date: '20/08/2026', expiry_date: '01/08/2026', advance_amount: '100',
}, { amountWordsInLetter: 'Bảy tỷ sáu trăm năm mươi tư triệu ba trăm hai mốt nghìn đồng' });
eq('nf amount', n.fields.amount, '7654321000');
eq('nf currency', n.fields.currency, 'VND');
eq('nf branch', n.fields.branch_name, 'Hà Nội');
eq('nf date', n.fields.contract_date, '11/08/2026');
eq('nf warnings', n.warnings.length, 3); // chữ lệch · hết hạn trước phát hành · BL > tạm ứng

// ── Render slot ──
const f = n.fields;
f.app_name = 'Công ty A'; f.app_addr = 'Hà Nội'; f.contract_no = '05/2026/HĐ-DEMO';
const r = C.renderSlots(['AMT_FULL', 'APP_NAME_ADDR', 'CONTRACT_NAME_NO', 'BANK_NAME', 'EXPIRY_DATE_VN', 'SIGNATORY', 'BEN_NAME', 'OF_PROJECT'], f);
eq('slot AMT_FULL', r.values.AMT_FULL, '7.654.321.000 VND (Bằng chữ: Bảy tỷ sáu trăm năm mươi bốn triệu ba trăm hai mươi mốt nghìn đồng)');
eq('slot APP_NAME_ADDR', r.values.APP_NAME_ADDR, 'Công ty A, địa chỉ: Hà Nội');
eq('slot CONTRACT_NAME_NO', r.values.CONTRACT_NAME_NO, 'Hợp đồng số 05/2026/HĐ-DEMO ngày 11/08/2026');
eq('slot BANK_NAME', r.values.BANK_NAME, 'Ngân hàng TMCP Tiên Phong – Chi nhánh Hà Nội');
eq('slot EXPIRY_DATE_VN', r.values.EXPIRY_DATE_VN, 'ngày 01 tháng 08 năm 2026');
eq('slot missing', r.missing, ['BEN_NAME']);
eq('fieldsForSlots', C.fieldsForSlots(['AMT_FULL', 'BEN_NAME', 'CONTRACT_NAME_NO']), ['ben_name', 'contract_no', 'amount', 'currency']);

// ── Xếp hạng ──
const tpls = [
  { id: 'A', label: 'a', guarantee_type: 'BLTU', template_type: 'T22', joint_venture: 'LD', method: 'ĐT', sector: 'XL' },
  { id: 'B', label: 'b', guarantee_type: 'BLTU', template_type: 'T22', joint_venture: 'KO', method: 'ĐT', sector: 'XL' },
  { id: 'C', label: 'c', guarantee_type: 'BLTU', template_type: 'TPB', joint_venture: 'KO', method: 'ĐT', sector: '' },
  { id: 'D', label: 'd', guarantee_type: 'BLTH', template_type: 'T22', joint_venture: 'LD', method: 'ĐT', sector: 'XL' },
];
eq('rank', C.rankTemplates(tpls, { guarantee_type: 'BLTU', form_family: 'TT22', joint_venture: 'LD', method: 'ĐT', sector: 'XL' }).map((x) => x.id), ['A', 'B', 'C']);

// ── Điền XML ──
const xml = '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Kính gửi: {{BEN_NAME}} và {{APP_NAME}}.</w:t></w:r><w:r><w:t>khác</w:t></w:r></w:p>';
const fx = C.fillXml(xml, { BEN_NAME: 'A & B <X>', APP_NAME: '' }, ['APP_NAME']);
eq('fillXml', fx.xml, '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Kính gửi: </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">A &amp; B &lt;X&gt;</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve"> và </w:t></w:r><w:r><w:rPr><w:b/><w:highlight w:val="yellow"/></w:rPr><w:t xml:space="preserve">…………</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">.</w:t></w:r><w:r><w:t>khác</w:t></w:r></w:p>');

// ── Kiểm theo catalog thật (nếu đã build) ──
const catPath = path.join(__dirname, '..', 'build', 'catalog.json');
if (fs.existsSync(catPath)) {
  const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  const unknown = new Set();
  cat.templates.forEach((t) => t.slots.forEach((s) => { if (!C.SLOTS[s]) unknown.add(s); }));
  eq('catalog: mọi slot có luật render', [...unknown], []);
  // điền thử toàn bộ mẫu đã chuẩn hoá (build/templates/<mã>.docx — sinh bởi tools/normalize.js)
  const tplDir = path.join(__dirname, '..', 'build', 'templates');
  if (fs.existsSync(tplDir)) {
    const AdmZip = require(path.join(__dirname, 'gas-sim', 'node_modules', 'adm-zip'));
    let leftovers = 0, files = 0;
    const full = {};
    C.FIELD_KEYS.forEach((k) => { full[k] = 'X'; });
    full.amount = '1000000'; full.advance_amount = '2000000'; full.currency = 'VND';
    cat.templates.forEach((t) => {
      const z = new AdmZip(path.join(tplDir, t.id + '.docx'));
      const rs = C.renderSlots(t.slots, full);
      z.getEntries().filter((e) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(e.entryName)).forEach((e) => {
        const out = C.fillXml(e.getData().toString('utf8'), rs.values, rs.missing).xml;
        files++;
        if (/\{\{[A-Z0-9_]+\}\}/.test(out)) { leftovers++; console.log('  token sót:', t.id, e.entryName); }
      });
    });
    eq('catalog: điền ' + cat.templates.length + ' mẫu (' + files + ' part) không sót token', leftovers, 0);
  }
}

console.log((fail ? '✗ ' : '✓ ') + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
