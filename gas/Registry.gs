/**
 * Registry.gs — THUẦN (không gọi dịch vụ Google): suy chiều nghiệp vụ của 1 mẫu từ đường dẫn + tên file
 * do BA đặt, sinh MÃ MẪU ổn định và tên hiển thị. Dùng khi nạp mẫu lần đầu và khi có file mới trong
 * TEMPLATE_GOC. Sau khi đã vào bảng MAU_THU, bảng mới là nguồn chuẩn (BA sửa được) — hàm này chỉ gợi ý.
 *
 * Quy ước tên file hiện có:
 *   Mẫu thường : [LD_]<BL>_<NgônNgữ>_<BộMẫu>[_<LĩnhVực>][ (<biến thể>)].docx   vd LD_BLTU_TV_TT22_XL.docx
 *   TT79 (BLOL): (BLOL) <LĩnhVực> - <MOT|HAI> TUI HO SO - <DOC LAP|LIEN DANH> TT79.docx
 *   Thư mục chứa "Liên danh" → LD; chứa "điện tử" → thư điện tử (ĐT), ngược lại thư giấy (TG).
 */
var SGRegistry = (function () {
  'use strict';

  var FAMILY_NORM = { TT22: 'T22', T22: 'T22', TT07: 'T07', T07: 'T07', TPB: 'TPB', EVN: 'EVN', VIT: 'VIT', TT79: 'TT79' };
  // Lĩnh vực TT79 (tên dài trong file) → mã ngắn thống nhất với mẫu thường
  var SECTOR_NORM = {
    'HANG HOA': 'HH', 'XAY LAP': 'XL', 'PHI TU VAN': 'PTV', 'MUON MAY': 'MM', 'THUOC CU': 'TC', 'THUOC MOI': 'TM',
    'EPC': 'EPC', 'EC': 'EC', 'EP': 'EP', 'PC': 'PC',
  };
  var SECTOR_LABEL = {
    HH: 'Hàng hoá', XL: 'Xây lắp', PTV: 'Phi tư vấn', TBYT: 'Thiết bị y tế', HON_HOP: 'Hỗn hợp', DL: 'Dược liệu',
    MT: 'Mua thuốc', MM: 'Mượn máy', TC: 'Thuốc (cũ)', TM: 'Thuốc (mới)', EC: 'EC', EP: 'EP', EPC: 'EPC', PC: 'PC',
  };
  var GT_LABEL = { BLDT: 'Dự thầu', BLTH: 'Thực hiện hợp đồng', BLTU: 'Hoàn trả tạm ứng', BLBH: 'Bảo hành', BLTT: 'Thanh toán', BLKH: 'Khác' };
  var FAMILY_LABEL = { TPB: 'Mẫu TPBank', T22: 'TT22 (Bộ KH&ĐT)', T07: 'TT07 (Bộ Y tế)', EVN: 'Mẫu EVN', VIT: 'Mẫu Viettel', TT79: 'TT79 (Bộ Tài chính)' };

  function stripAccents(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  /**
   * inferMeta(folderPath, fileName) → { loai_bl, bo_mau, linh_vuc, so_tui, bien_the, lien_danh, hinh_thuc, parsed }
   * parsed=false khi tên file không theo quy ước (BA cần điền tay trong MAU_THU).
   */
  function inferMeta(folderPath, fileName) {
    var p = String(folderPath || ''), name = String(fileName || '').replace(/\.docx$/i, '');
    var pn = stripAccents(p).toUpperCase(), nn = stripAccents(name).toUpperCase();
    var meta = {
      loai_bl: '', bo_mau: '', linh_vuc: '', so_tui: '', bien_the: '',
      lien_danh: /LIEN DANH/.test(pn) || /^LD_/.test(nn) || /LIEN DANH/.test(nn) ? 'LD' : 'KO',
      hinh_thuc: /DIEN TU/.test(pn) ? 'ĐT' : 'TG',
      parsed: false,
    };
    if (/TT79/.test(nn) || /TT79/.test(pn) || /^\((BLOL|IDNES)\)/.test(nn)) {
      meta.loai_bl = 'BLDT'; meta.bo_mau = 'TT79';
      var cg = /CGTT/.test(nn);
      var keys = Object.keys(SECTOR_NORM).sort(function (a, b) { return b.length - a.length; });
      for (var i = 0; i < keys.length; i++) {
        if (new RegExp('(^|[^A-Z])' + keys[i] + '([^A-Z]|$)').test(nn)) { meta.linh_vuc = SECTOR_NORM[keys[i]]; break; }
      }
      if (cg && meta.linh_vuc) meta.linh_vuc = 'CGTT-' + meta.linh_vuc;
      if (/HAI TUI/.test(nn)) meta.so_tui = '2 túi';
      else if (/MOT GIAI DOAN MOT TUI/.test(nn)) meta.so_tui = '1 giai đoạn 1 túi';
      else if (/MOT TUI|MTHS/.test(nn)) meta.so_tui = '1 túi';
      meta.parsed = !!meta.linh_vuc;
      return meta;
    }
    var vm = name.match(/\(([^)]*)\)/);
    meta.bien_the = vm ? vm[1].trim() : '';
    var base = name.replace(/\([^)]*\)/g, '').trim().replace(/_+$/, '').replace(/^LD_/i, '');
    var parts = base.split('_');
    var gt = (parts[0] || '').toUpperCase();
    var fam = FAMILY_NORM[(parts[2] || '').toUpperCase()] || '';
    if (GT_LABEL[gt] && fam) {
      meta.loai_bl = gt; meta.bo_mau = fam;
      meta.linh_vuc = parts.slice(3).join('_').toUpperCase();
      meta.parsed = true;
    }
    return meta;
  }

  function slug(s) {
    return stripAccents(s).toUpperCase().replace(/THOI HAN\s*/g, 'TH').replace(/THU HUONG/g, 'TH')
      .replace(/[^A-Z0-9]+/g, '').slice(0, 8);
  }

  /** Mã mẫu ổn định: <BL>-<Bộ>[-<LĩnhVực>][-<SốTúi>][-<BiếnThể>]-<LD|KO>-<E|G>. Trùng → thêm -2, -3… */
  function makeCode(meta, taken) {
    var parts = [meta.loai_bl || 'MAU', meta.bo_mau || 'KHAC'];
    if (meta.linh_vuc) parts.push(meta.linh_vuc.replace(/_/g, ''));
    if (meta.so_tui) parts.push(meta.so_tui.indexOf('2') >= 0 ? '2T' : (meta.so_tui.indexOf('giai') >= 0 ? '1GD1T' : '1T'));
    if (meta.bien_the) parts.push(slug(meta.bien_the));
    parts.push(meta.lien_danh === 'LD' ? 'LD' : 'KO', meta.hinh_thuc === 'ĐT' ? 'E' : 'G');
    var code = parts.join('-'), c = code, n = 2;
    while (taken && taken[c]) c = code + '-' + (n++);
    if (taken) taken[c] = true;
    return c;
  }

  /** Tên hiển thị cho cán bộ. */
  function labelOf(meta) {
    var parts = ['BL ' + (GT_LABEL[meta.loai_bl] || meta.loai_bl || '?'), FAMILY_LABEL[meta.bo_mau] || meta.bo_mau || '?'];
    if (meta.linh_vuc) {
      var cg = meta.linh_vuc.indexOf('CGTT-') === 0, s = meta.linh_vuc.replace('CGTT-', '');
      parts.push((cg ? 'Chào giá TT · ' : '') + (SECTOR_LABEL[s] || s));
    }
    if (meta.so_tui) parts.push(meta.so_tui);
    if (meta.bien_the) parts.push(meta.bien_the);
    parts.push(meta.lien_danh === 'LD' ? 'Liên danh' : 'Độc lập');
    parts.push(meta.hinh_thuc === 'ĐT' ? 'Thư điện tử' : 'Thư giấy');
    return parts.join(' · ');
  }

  return { inferMeta: inferMeta, makeCode: makeCode, labelOf: labelOf, SECTOR_NORM: SECTOR_NORM, SECTOR_LABEL: SECTOR_LABEL };
})();

if (typeof module !== 'undefined') module.exports = SGRegistry;
