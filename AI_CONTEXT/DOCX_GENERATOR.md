# DOCX GENERATOR v2 — "mẫu có slot" (2026-09-28)

> Thay hoàn toàn v1 (Google Docs replaceText) — nguyên nhân gốc của output tệ (xem SESSION_HANDOVER 2026-09-28).

## Vì sao v1 hỏng
1. Vòng docx→Google Doc→docx làm mất định dạng Word (font, header, logo, bảng); luồng thư KH còn OCR PDF → bố cục vỡ.
2. Điền theo **chữ placeholder**: cùng `[ghi rõ giá trị bằng số…]` mang 2 nghĩa (tạm ứng vs bảo lãnh) trong 1 mẫu; `[……]` chung chung; chỗ trống không ngoặc (`ngày___ tháng__ năm___`, `…………`) không điền được; `___` sót trước giá trị.
3. MERGEFIELD `$ND` thật (field code) + `$TPB001/$TPB002/$KH001/OF_PROJECT_NAME` không có trong map.
4. Mẫu gốc còn comment review của BA + định dạng placeholder (nghiêng, tô màu) truyền sang giá trị.

## Thiết kế v2
**Bước chuẩn hoá (`gas/Normalize.gs` — chạy trong GAS khi BA sửa mẫu ở Drive `TEMPLATE_GOC`, và trên máy qua `tools/normalize.js`; cùng 1 mã, đã đối chiếu trùng 100% với bản Python cũ trên 168 mẫu):**
- Gỡ comment review, chấp nhận tracked changes, gỡ MERGEFIELD thành text.
- Nhận diện mọi chỗ trống (regex `BLANK_RE`) → gắn **slot theo ngữ cảnh** (bảng `RULES`: chữ chỗ trống + ~80 ký tự bên trái). Ví dụ `…khoản tiền tạm ứng ___[ghi rõ giá trị…]` → `ADV_FULL`; `…không vượt quá ___[ghi rõ giá trị…]` → `AMT_FULL`; `hết 17 giờ 00 ngày ……` → `EXPIRY_DATE`.
- Thay bằng token `{{SLOT}}` trong **run riêng**, xoá định dạng placeholder (i/highlight/shd/color), tự chèn khoảng trắng khi mẫu viết dính ("tại____").
- Hiện 2.366/2.366 chỗ trống / 168 mẫu đã gắn slot, 0 sót (`node tools/normalize.js --strict`).
- GAS ghi `TEMPLATE/<mã mẫu>.docx`, `CONFIG/catalog.json`, tab SLOT_REVIEW. Mẫu còn chỗ trống chưa nhận diện → ⚠ trong MAU_THU, giữ bản đang chạy.
- **Bảng mã hoá mẫu** (tab MAU_THU): mã ổn định `BLTU-T22-XL-LD-E`, khoá theo file ID Drive; chiều nghiệp vụ tự suy từ tên file/thư mục (`gas/Registry.gs`) rồi BA quản lý. Hướng dẫn BA: `docs/QUAN_LY_MAU.md`.

**Bước sinh (runtime, `gas/Generate.gs` + `gas/Core.gs`)**: dữ liệu nguyên tử → `renderSlots` (tiền bằng số + chữ do code sinh, ngày `dd/mm/yyyy` hoặc `ngày dd tháng mm năm yyyy`, tên NH "Ngân hàng TMCP Tiên Phong – Chi nhánh X"…) → `Utilities.unzip` → `fillXml` trên document/header/footer → `Utilities.zip`. Slot thiếu → `…………` **tô vàng**. Giữ nguyên 100% định dạng.

## Slot (36)
BEN_NAME · BEN_ADDR · APP_NAME · APP_ADDR · APP_REG_NO · APP_NAME_ADDR · JV_NAME · BANK_NAME · BRANCH_NAME · BRANCH_LABEL · BANK_ADDR · BANK_COUNTRY · CONTRACT_NAME_NO · CONTRACT_NAME · CONTRACT_NO · CONTRACT_DATE · BID_PACKAGE · BID_PACKAGE_FULL · PROJECT · OF_PROJECT · BID_NOTICE_NO · BID_NOTICE_DATE · AMT_FULL · ADV_FULL · AMT_NUM · AMT_NUM_CCY · CURRENCY · AMT_WORDS · AMT_WORDS_NOUNIT · GUARANTEE_NO · ISSUE_DATE · EFFECTIVE_DATE · EXPIRY_DATE · EXPIRY_DATE_VN(_BARE) · VALIDITY_TEXT · ACCOUNT_NO · SIGNATORY. Luật render: `gas/Core.gs::SLOTS`.

## UAT định dạng cục bộ
`python tools/render_local.py <template_id> <fields.json> out.docx` (dùng chính Core.gs) → `pwsh tools/docx2png.ps1 out.docx` (Word → PDF → PNG).
