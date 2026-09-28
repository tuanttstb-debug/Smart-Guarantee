#!/usr/bin/env node
/**
 * e2e.js — test tích hợp backend GAS trên bộ giả lập (sim.js), không cần deploy.
 * Kịch bản: setup (Drive/OPS/user/chi nhánh/nạp gói mẫu) → checkSetup → login → upload → process
 * (Dify giả lập trả JSON như LLM thật) → generate → kiểm DOCX → history → phân quyền → lỗi đăng nhập.
 *
 * Tiền đề: đã chạy node tools/normalize.js (build/sg_goc.zip).
 * Chạy: cd tools/gas-sim && npm install && node e2e.js   (thoát 1 nếu có ca sai)
 * Thư test lấy từ Test/ (KHÔNG commit). Không có → dùng văn bản giả.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { createRuntime, Blob } = require('./sim');

const ROOT = path.join(__dirname, '..', '..');
const BUILD = path.join(ROOT, 'build');
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); }
}

const ocrPath = path.join(BUILD, 'uat', 'mau_thu_ky_so.txt');
const OCR = fs.existsSync(ocrPath) ? fs.readFileSync(ocrPath, 'utf8')
  : 'BẢO LÃNH TIỀN TẠM ỨNG\nKính gửi: CÔNG TY A\n' + 'x'.repeat(200);

// Kết quả LLM giả lập (đúng schema Prompt.gs) — mô phỏng cả lỗi thường gặp: bọc ```json, số có dấu phẩy,
// thiếu vài khoá, số chữ đọc "hai mốt".
const LLM_JSON = {
  classification: { guarantee_type: 'BLTU', form_family: 'T22', joint_venture: 'LD', method: 'dt', sector: 'XL', envelope: '', variant: '', language: 'TV', confidence: 88 },
  fields: {
    ben_name: { value: 'CÔNG TY TNHH MẪU A', confidence: 97, evidence: 'Kính gửi: CÔNG TY TNHH MẪU A' },
    app_name: { value: 'Công ty Cổ phần Mẫu B', confidence: 92, evidence: 'Công ty Cổ phần Mẫu B' },
    jv_name: { value: 'Liên danh Mẫu B - C', confidence: 80, evidence: 'Liên danh Mẫu B' },
    branch_name: { value: 'Chi nhánh Hà Nội', confidence: 95, evidence: 'chi nhánh Hà Nội' },
    branch_addr: { value: 'Địa chỉ chi nhánh (giả lập)', confidence: 90, evidence: 'Địa chỉ chi nhánh' },
    contract_name: { value: 'Hợp đồng thi công xây dựng công trình', confidence: 90, evidence: 'Hợp đồng thi công xây dựng công trình' },
    contract_no: { value: '05/2026/HĐ-DEMO', confidence: 96, evidence: 'số 05/2026/HĐ-DEMO' },
    contract_date: { value: 'ngày 11 tháng 08 năm 2026', confidence: 93, evidence: 'ngày 11 tháng 08 năm 2026' },
    amount: { value: '7,654,321,000', confidence: 95, evidence: '7,654,321,000 VNĐ' },
    currency: { value: 'VNĐ', confidence: 99, evidence: 'VNĐ' },
    advance_amount: { value: '7,654,321,000', confidence: 93, evidence: 'khoản tiền tạm ứng 7,654,321,000' },
  },
  amount_words_in_letter: 'Bảy tỷ, sáu trăm năm mươi tư triệu, ba trăm hai mốt nghìn đồng',
  notes: ['Thư không nêu ngày hết hiệu lực cụ thể'],
};
let difyCalls = 0, lastDifyInputs = null;
const dify = (payload) => {
  difyCalls++; lastDifyInputs = payload.inputs;
  return { status: 200, body: { data: { status: 'succeeded', outputs: { result: '```json\n' + JSON.stringify(LLM_JSON) + '\n```' } } } };
};

const rt = createRuntime({ ocrText: OCR, dify, props: { DIFY_BASE_URL: 'https://api.dify.ai/v1', DIFY_API_KEY: 'app-sim' } });
const G = rt.ctx;

console.log('# Setup (mô phỏng Drive hiện tại: đã có thư mục TEMPLATE cũ chứa mẫu upload phẳng)');
G.subFolder_('TEMPLATE').createFile(new Blob(Buffer.from('x'), DOCX, 'LD_BLTH_TV_TT22_HON_HOP.docx'));
G.subFolder_('CONFIG').createFile(new Blob(fs.readFileSync(path.join(BUILD, 'sg_goc.zip')), 'application/zip', 'sg_goc.zip'));
G.setupAll();
const adminLog = rt.logs.find((l) => /Tài khoản quản trị: admin \/ (\w+)/.test(l));
const ADMIN_PW = adminLog && adminLog.match(/admin \/ (\w+)/)[1];
ok('setupAll tạo admin + in mật khẩu', !!ADMIN_PW);
ok('setupAll đặt Script Properties', !!rt.props.DRIVE_ROOT_ID && !!rt.props.OPS_SHEET_ID);
G.adminSetUser('cb01', 'matkhau-01', 'Cán bộ 01', 'Hà Nội', 'user');
G.adminSetUser('cb02', 'matkhau-02', 'Cán bộ 02', 'Thăng Long', 'user');
G.opsSheet_('BRANCHES').appendRow(['Thăng Long', 'Địa chỉ chi nhánh Thăng Long (giả lập)']);
let setupErr = null;
try { G.checkSetup(); } catch (e) { setupErr = e.message; }
ok('checkSetup đạt', !setupErr, rt.logs.slice(-10).join(' | '));

console.log('# Thư viện mẫu: TEMPLATE_GOC + bảng MAU_THU');
const root = G.rootFolder_();
const names = []; { const it = root.getFolders(); while (it.hasNext()) names.push(it.next().getName()); }
ok('TEMPLATE cũ được đổi tên lưu trữ, không xoá', names.some((n) => /^_TEMPLATE_CU_\d{8}$/.test(n)) && names.includes('TEMPLATE_GOC'), names);
let mt = G.readMauThu_();
ok('MAU_THU 168 dòng, tất cả OK', mt.rows.length === 168 && mt.rows.every((o) => o.trang_thai === 'OK'), mt.rows.filter((o) => o.trang_thai !== 'OK').slice(0, 3));
ok('mã mẫu ổn định dạng BL…', mt.rows.some((o) => o.ma_mau === 'BLTU-T22-XL-LD-E') && mt.rows.some((o) => o.ma_mau === 'BLDT-TT79-HH-1T-LD-E'));
ok('SLOT_REVIEW có 2.366 dòng', G.readTable_(G.opsSheet_('SLOT_REVIEW')).length === 2366);
ok('trigger hằng đêm đã cài', rt.triggers.some((t) => t.getHandlerFunction() === 'rebuildTemplatesNightly'));
const s0 = G.rebuildTemplates({});
ok('chạy lại không làm gì khi không có thay đổi', s0.rebuilt === 0 && s0.added === 0 && s0.active_in_catalog === 168, s0);

// BA sửa 1 mẫu gốc: chèn chỗ trống lạ → không nhận diện được → giữ bản đang chạy
const findGoc = (code) => { const row = G.readMauThu_().rows.find((o) => o.ma_mau === code); return rt.drive.files[row.file_id]; };
const gocFile = findGoc('BLTU-T22-XL-LD-E');
const tplBefore = G.findFile_('TEMPLATE', 'BLTU-T22-XL-LD-E.docx').getBlob().buf;
const zb = new AdmZip(gocFile.blob.buf);
zb.updateFile('word/document.xml', Buffer.from(zb.readAsText('word/document.xml').replace('Ngoài ra, chúng tôi', 'Theo [ghi điều khoản lạ] ngoài ra, chúng tôi'), 'utf8'));
gocFile.touch(zb.toBuffer());
const s1 = G.rebuildTemplates({});
const r1 = G.readMauThu_().rows.find((o) => o.ma_mau === 'BLTU-T22-XL-LD-E');
ok('mẫu sửa có chỗ trống lạ → ⚠, giữ bản cũ', s1.rebuilt === 0 && s1.warnings === 1 && /^⚠ 1 chỗ.*đang dùng bản cũ/.test(r1.trang_thai), r1.trang_thai);
ok('file mẫu đang chạy không bị đè', Buffer.compare(G.findFile_('TEMPLATE', 'BLTU-T22-XL-LD-E.docx').getBlob().buf, tplBefore) === 0);
// BA sửa đúng: thay chữ thường (không có chỗ trống lạ)
const zc = new AdmZip(gocFile.blob.buf);
zc.updateFile('word/document.xml', Buffer.from(zc.readAsText('word/document.xml').replace('Theo [ghi điều khoản lạ] ngoài ra', 'Ngoài ra (đã sửa)'), 'utf8'));
gocFile.touch(zc.toBuffer());
const s2 = G.rebuildTemplates({});
ok('BA sửa mẫu hợp lệ → tự chuẩn hoá lại 1 mẫu', s2.rebuilt === 1 && G.readMauThu_().rows.find((o) => o.ma_mau === 'BLTU-T22-XL-LD-E').trang_thai === 'OK', s2);
// BA thả file mới vào TEMPLATE_GOC
const sub = G.ensureFolderPath_(G.gocFolder_(), 'Mẫu thường/Liên danh - Thư điện tử');
sub.createFile(new Blob(gocFile.blob.buf, DOCX, 'LD_BLTU_TV_TT22_XL (mau moi).docx'));
sub.createFile(new Blob(gocFile.blob.buf, DOCX, 'Thu bao lanh dac biet.docx'));
const s3 = G.rebuildTemplates({});
const rows3 = G.readMauThu_().rows;
const nr = rows3.find((o) => /mau moi/.test(o.duong_dan));
const odd = rows3.find((o) => /dac biet/.test(o.duong_dan));
ok('file mới theo quy ước → tự thêm dòng + mã + dùng ngay', s3.added === 2 && nr && nr.ma_mau === 'BLTU-T22-XL-MAUMOI-LD-E' && nr.trang_thai === 'OK' && s3.active_in_catalog === 169, [s3, nr && nr.ma_mau]);
ok('file mới sai quy ước → thêm dòng, active=FALSE chờ BA', odd && odd.active === false && /BA điền/.test(odd.trang_thai), odd);
// BA tắt 1 mẫu
const rowsOff = G.readMauThu_();
rowsOff.rows.find((o) => o.ma_mau === 'BLBH-EVN-LD-G').active = false;
G.writeMauThu_(rowsOff);
const s4 = G.rebuildTemplates({});
ok('BA đặt active=FALSE → mẫu ra khỏi danh mục', s4.active_in_catalog === 168 && !G.loadCatalogMeta_().some((t) => t.id === 'BLBH-EVN-LD-G'));

console.log('# Auth');
ok('ping public', rt.call('ping').ok === true);
ok('upload không token → AUTH_REQUIRED', rt.call('upload', {}).error_code === 'AUTH_REQUIRED');
ok('sai mật khẩu → AUTH_FAILED', rt.call('login', { username: 'cb01', password: 'sai' }).error_code === 'AUTH_FAILED');
const login = rt.call('login', { username: 'CB01', password: 'matkhau-01' });
ok('đăng nhập (không phân biệt hoa thường)', login.ok && login.token && login.user.branch_name === 'Hà Nội', login);
ok('trả danh mục chi nhánh', Array.isArray(login.branches) && login.branches.length === 1, login.branches);
const T = login.token;

console.log('# Catalog');
const cat = rt.call('catalog', { token: T });
ok('catalog 168 mẫu có preview', cat.ok && cat.catalog.templates.length === 168 && cat.catalog.templates[0].preview.length > 5);

console.log('# Upload');
const pdfPath = path.join(ROOT, 'Test', 'MAU THU KY SO.pdf');
const pdf = fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath) : Buffer.from('%PDF-1.4 giả');
ok('chặn file giả mạo đuôi', rt.call('upload', { token: T, filename: 'a.pdf', content_base64: Buffer.from('xxxx').toString('base64') }).error_code === 'PARSE_ERROR');
ok('chặn .exe', rt.call('upload', { token: T, filename: 'a.exe', content_base64: 'AAAA' }).error_code === 'PARSE_ERROR');
const up = rt.call('upload', { token: T, filename: 'MAU THU KY SO.pdf', content_base64: pdf.toString('base64') });
ok('upload → doc_id', up.ok && /^SG-\d{8}-001$/.test(up.doc_id), up);
const up2 = rt.call('upload', { token: T, filename: 'b.pdf', content_base64: pdf.toString('base64') });
ok('doc_id tăng dần không trùng', up2.doc_id && up2.doc_id.endsWith('-002'), up2.doc_id);
const D = up.doc_id;

console.log('# Process');
const pr = rt.call('process', { token: T, doc_id: D, method: 'ĐT' });
ok('process ok', pr.ok, pr);
ok('gửi prompt + text cho Dify (1 lần gọi)', difyCalls === 1 && /TPBank/.test(lastDifyInputs.system_prompt) && lastDifyInputs.raw_text.length > 100);
ok('method "dt" → "ĐT"', pr.classification && pr.classification.method === 'ĐT', pr.classification);
ok('chuẩn hoá số tiền', pr.fields && pr.fields.amount === '7654321000', pr.fields && pr.fields.amount);
ok('chuẩn hoá ngày', pr.fields && pr.fields.contract_date === '11/08/2026');
ok('bỏ chữ "Chi nhánh"', pr.fields && pr.fields.branch_name === 'Hà Nội');
ok('cảnh báo số chữ "hai mốt" lệch', pr.warnings && pr.warnings.some((w) => /KHÔNG khớp/.test(w)), pr.warnings);
const top = pr.candidates && pr.candidates[0];
ok('mẫu top-1 = BLTU TT22 Xây lắp Liên danh Thư điện tử', top && /Hoàn trả tạm ứng · TT22.*Xây lắp · Liên danh · Thư điện tử/.test(top.label), top);
ok('template_id = top-1', pr.template_id === (top && top.id));

console.log('# Generate');
const fields = Object.assign({}, pr.fields);
const g1 = rt.call('generate', { token: T, doc_id: D, template_id: pr.template_id, fields });
ok('thiếu dữ liệu → chặn MISSING_FIELDS', g1.error_code === 'MISSING_FIELDS', g1);
const g2 = rt.call('generate', { token: T, doc_id: D, template_id: pr.template_id, fields, allow_missing: true });
ok('generate (cho phép ô trống) ok', g2.ok && g2.content_base64, g2.error_code);
ok('liệt kê slot thiếu', g2.missing && g2.missing.join() === 'BEN_ADDR,EXPIRY_DATE_VN', g2.missing);
let docText = '';
if (g2.content_base64) {
  const out = path.join(BUILD, 'uat', 'e2e_out.docx');
  fs.writeFileSync(out, Buffer.from(g2.content_base64, 'base64'));
  const z = new AdmZip(out);
  const xml = z.readAsText('word/document.xml');
  docText = xml.replace(/<[^>]+>/g, '');
  ok('DOCX hợp lệ, không còn token', !/\{\{/.test(xml) && xml.startsWith('<?xml'));
  ok('giữ ảnh logo + footer', z.getEntries().some((e) => e.entryName.startsWith('word/media/')) && z.getEntry('word/footer1.xml') != null);
  ok('không còn comment review', !z.getEntries().some((e) => /comments/.test(e.entryName)) && !/commentReference/.test(xml));
  ok('điền số tiền + chữ', docText.includes('7.654.321.000 VND (Bằng chữ: Bảy tỷ sáu trăm năm mươi bốn triệu ba trăm hai mươi mốt nghìn đồng)'));
  ok('điền tên ngân hàng', docText.includes('Ngân hàng TMCP Tiên Phong – Chi nhánh Hà Nội'));
  ok('ô thiếu tô vàng', /<w:highlight w:val="yellow"\/><\/w:rPr><w:t xml:space="preserve">…………/.test(xml));
}
const full = Object.assign({}, fields, { ben_addr: 'Hà Nội', expiry_date: '31/12/2027' });
const g3 = rt.call('generate', { token: T, doc_id: D, template_id: pr.template_id, fields: full });
ok('đủ dữ liệu → generate không cần xác nhận', g3.ok && g3.missing.length === 0, g3.error_code);
const extracted = G.readJson_('EXTRACTED', D + '.json');
ok('lưu vết bộ dữ liệu cuối', extracted.final && extracted.final.generated_by === 'cb01' && extracted.final.fields.expiry_date === '31/12/2027');

console.log('# Lịch sử + phân quyền');
const h = rt.call('history', { token: T });
ok('history có 2 hồ sơ, trạng thái GENERATED', h.ok && h.items.length === 2 && h.items.some((x) => x.doc_id === D && x.status === 'GENERATED'), h.items);
const ld = rt.call('load', { token: T, doc_id: D });
ok('load mở lại hồ sơ', ld.ok && ld.final && ld.template_id === pr.template_id);
const T2 = rt.call('login', { username: 'cb02', password: 'matkhau-02' }).token;
ok('user khác không mở được hồ sơ', rt.call('load', { token: T2, doc_id: D }).error_code === 'FORBIDDEN');
ok('user khác không sinh thư được', rt.call('generate', { token: T2, doc_id: D, template_id: pr.template_id, fields: full }).error_code === 'FORBIDDEN');
ok('history user khác rỗng', rt.call('history', { token: T2 }).items.length === 0);
ok('doc_id bẩn bị chặn', rt.call('load', { token: T, doc_id: '../x' }).error_code === 'PARSE_ERROR');
ok('logout huỷ phiên', rt.call('logout', { token: T2 }).ok && rt.call('history', { token: T2 }).error_code === 'AUTH_REQUIRED');

console.log('# Khoá brute-force');
for (let i = 0; i < 5; i++) rt.call('login', { username: 'cb02', password: 'sai' + i });
ok('sai 5 lần → khoá', rt.call('login', { username: 'cb02', password: 'matkhau-02' }).error_code === 'AUTH_LOCKED');

console.log('# Audit');
const audit = G.opsSheet_('AUDIT').getDataRange().getValues();
ok('AUDIT ghi request, không chứa nội dung thư', audit.length > 10 && !JSON.stringify(audit).includes('MẪU A'));

console.log('# LLM lỗi định dạng');
const rtBad = createRuntime({ ocrText: OCR, dify: () => ({ status: 200, body: { data: { status: 'succeeded', outputs: { result: 'xin lỗi tôi không biết' } } } }), props: { DIFY_BASE_URL: 'x', DIFY_API_KEY: 'k' } });
rtBad.props.DRIVE_ROOT_ID = rtBad.ctx.setupDrive().DRIVE_ROOT_ID;
rtBad.props.OPS_SHEET_ID = rtBad.ctx.setupOpsSheet();
rtBad.ctx.adminSetUser('u', 'matkhau-01', 'U', '', 'user');
const tb = rtBad.call('login', { username: 'u', password: 'matkhau-01' }).token;
const ub = rtBad.call('upload', { token: tb, filename: 'a.pdf', content_base64: pdf.toString('base64') });
ok('LLM trả rác → LLM_FAILED rõ ràng', rtBad.call('process', { token: tb, doc_id: ub.doc_id }).error_code === 'LLM_FAILED');

console.log((fail ? '✗ ' : '✓ ') + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
