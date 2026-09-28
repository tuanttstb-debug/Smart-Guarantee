# PROJECT STATE — Smart Guarantee (snapshot)

**Cập nhật:** 2026-09-28 · **Version:** 2.0.0 (đại tu: sinh thư theo mẫu thư viện, có xác thực, pilot) · **Repo:** https://github.com/tuanttstb-debug/Smart-Guarantee (CÔNG KHAI) · FE: https://tuanttstb-debug.github.io/Smart-Guarantee/

## Tóm tắt
Công cụ nội bộ cho **cán bộ tác nghiệp BL**: tải thư KH → AI phân loại + bóc tách → chọn **mẫu thư viện TPBank** (168 mẫu) → rà soát → xuất .docx **đúng định dạng mẫu**. Mục tiêu hiện tại: **pilot vận hành thật trên hạ tầng hiện tại** (GAS + Drive + Dify Cloud), kiến trúc tách lớp để sau chuyển on-prem chỉ thay OCR/LLM.

## Quyết định 2026-09-28 (anh Tuân)
1. Pilot trên hạ tầng hiện tại (Google + Dify Cloud + OpenAI) — không làm on-prem đợt này.
2. Đầu ra **luôn là mẫu thư viện TPBank**; thư KH không khớp mẫu nào → cảnh báo, cán bộ chọn tay. (Bỏ route KH_UPLOAD "sát thư KH".)
3. Phạm vi: cả 4 bộ — TPB · TT22 + TT07 · TT79 (B8ZB) · EVN + Viettel.
4. Người dùng: cán bộ tác nghiệp BL, **có đăng nhập + lịch sử + audit**, không maker-checker trong app.

## Kiến trúc v2
- **Thư viện mẫu do nghiệp vụ tự vận hành** (quyết định 28/09 chiều): Drive `TEMPLATE_GOC/` = nơi DUY NHẤT sửa mẫu · tab **MAU_THU** = bảng mã hoá mẫu (mã ổn định `BLTU-T22-XL-LD-E`, khoá theo file ID, tự nạp từ tên file/thư mục, BA sửa được) · GAS `rebuildTemplates` (nút admin ⟳, trigger 2h) tự chuẩn hoá mẫu đã sửa, mẫu có chỗ trống lạ → ⚠ giữ bản cũ · tab SLOT_REVIEW cho BA rà. Chuẩn hoá: `gas/Normalize.gs` (2.366/2.366 chỗ trống, 0 sót; trùng 100% bản Python cũ). Hướng dẫn BA: `docs/QUAN_LY_MAU.md`.
- **Sinh thư** = điền token trong XML docx (không qua Google Docs) → giữ 100% định dạng; ô thiếu tô vàng.
- **Lõi dùng chung** `gas/Core.gs` (→ `assets/js/core.js`): 24 trường nguyên tử, 36 slot, đọc số thành chữ, chuẩn hoá tiền/ngày, kiểm số chữ trong thư ⇄ số, xếp hạng mẫu.
- **AI**: Dify 1 node LLM, prompt ở `gas/Prompt.gs` (`v2.1-2026-09-28`). OCR: Drive convert (PDF text/scan, Word).
- **Bảo mật/vận hành**: tài khoản ứng dụng (USERS, SHA-256+salt, khoá brute-force), phiên 6h, chủ hồ sơ mới xem/sinh được, AUDIT metadata, JOBS lịch sử, doc_id có khoá.
- **FE** 3 bước: Tải thư → Rà soát & chọn mẫu (form theo trường mẫu cần, độ tin cậy, trích dẫn thư gốc, đổi mẫu) → Xem trước (tờ A4) & xuất (bắt xác nhận đối chiếu).

## Kiểm thử (`bash tools/check.sh`)
Mẫu strict ✓ · lõi 44/44 · **giả lập GAS e2e 55/55** (gồm vòng đời thư viện mẫu: chuyển đổi, sửa mẫu hợp lệ/lỗi, thêm file mới, tắt mẫu) · UI demo desktop+mobile ✓ · render Word thật ✓.

## Triển khai (28/09)
Code đã đẩy lên project GAS `17xyUZ…` bằng clasp (18 file); bản cũ sao lưu `build/gas_backup_20260928/`. Deployment production `AKfycbxCBF…Z0` (@9) **chưa cập nhật** — chờ setupAll + Dify.

## Đang treo — [TT]
1. **Triển khai v2**: upload `build/sg_goc.zip` vào Drive CONFIG → chạy `setupAll` (cấp quyền, lưu mật khẩu admin) → import Dify v2 + key → báo [CC] cập nhật deployment.
2. Bộ **UAT 20 thư** + đáp án (`docs/UAT.md`) → đo KPI → [CC] tinh chỉnh prompt.
3. Chốt chính sách lưu trữ Drive (đề xuất xoá INPUT/OUTPUT sau 90 ngày).

## Rủi ro đã biết
- Chưa chạy với LLM thật sau đại tu (prompt mới) — độ chính xác bóc tách chưa đo (UAT).
- OCR Drive với PDF scan chất lượng thấp (TD-SG-10).
- Dify Cloud / OpenAI xử lý thư KH thật — chấp nhận cho pilot, cần phê duyệt trước khi mở rộng (TD-SG-11).
- GAS UrlFetch ~60s/lần gọi: thư rất dài + model chậm có thể timeout (đã thử lại 1 lần).
