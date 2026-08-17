# VARIABLE SEGMENTATION — Bài toán lõi Smart Guarantee

> **Trọng tâm dự án** (chốt 2026-08-17). KHÔNG chỉ "chọn 1 template TPBank rồi điền". Mục tiêu: nhận **file thư do khách hàng tự upload** → **bóc tách đâu là văn bản khung (mẫu) cố định, đâu là biến (chỗ cần điền)** → trả lại **thư soạn sát với thư khách hàng**, biến đã nhận diện & điền được.

## 1. Định nghĩa bài toán
Đầu vào: 1 file thư (PDF/Word) của KH — có thể là mẫu chuẩn TPBank, hoặc mẫu riêng của KH ("Mẫu KH up").
Đầu ra:
1. **Segmentation:** phân đoạn văn bản thành **KHUNG (boilerplate cố định)** vs **BIẾN (slot cần điền)**.
2. **Field mapping:** mỗi BIẾN ↔ canonical field (BENEFICIARY_NAME, GUARANTEE_AMOUNT…).
3. **Reproduction:** thư đầu ra **giữ nguyên khung của KH**, chỉ điền/để mở các biến — "sát với thư khách hàng làm".

## 2. Vì sao corpus 96 template là chìa khoá
Trong `Tham khao/` (96 file), **phần khung dùng chung** giữa các mẫu cùng loại; chỉ các cụm `[...]` là khác nhau. Đó chính là **ground truth** để máy học/đối chiếu:
- Cụm xuất hiện **lặp lại nguyên văn** across nhiều thư → **KHUNG**.
- Cụm **biến thiên** (tên, số tiền, ngày, địa chỉ, tên gói thầu…) → **BIẾN**.
- Placeholder thật trong template = **từ điển biến** (xem §4): `[ghi tên Chủ đầu tư]`, `[ghi số tiền bảo lãnh]`, `[bên nhận bảo lãnh]`…

→ Khi gặp thư KH lạ (không khớp template chuẩn), so khớp mờ (fuzzy/semantic) với corpus để **suy ra ranh giới khung/biến** dù KH diễn đạt khác.

## 3. Hai hệ biến (song song)
- **Mẫu offline / KH tự upload** (root `Tham khao/`) → placeholder mô tả `[...]` → **segmentation** (doc này).
- **Mẫu online B8ZB** (`Tham khao/B8ZB/`) → Word MERGEFIELD `«$NDxxx»` → điền trực tiếp, danh mục `TPB_VARIABLES.md`.

PoC **hỗ trợ cả hai** (chốt 2026-08-17, sau khi có B8ZB). Route ONLINE_B8ZB dùng `$ND`; route OFFLINE/KH_UPLOAD dùng `[...]`. Segmentation (bóc tách khung/biến) là bài toán lõi cho nhánh **KH_UPLOAD** — nơi thư không theo mẫu chuẩn.

## 4. Từ điển biến (rút từ 96 template — 30 placeholder, ~15 lõi)

| Canonical field | Placeholder thật (ví dụ) | Ghi chú |
|---|---|---|
| ISSUING_BANK_NAME | `[ghi tên của ngân hàng]` | TPBank (bên bảo lãnh) |
| ISSUING_BANK_ADDR | `[ghi địa chỉ của ngân hàng]`, `[địa chỉ chi nhánh]` | |
| BENEFICIARY_NAME | `[ghi tên Chủ đầu tư]`, `[bên nhận bảo lãnh]` | Chủ đầu tư/Employer/thụ hưởng |
| BENEFICIARY_ADDR | `[Địa chỉ Chủ đầu tư]`, `[địa chỉ]` | |
| CONTRACTOR_NAME | `[ghi tên Nhà thầu]`, `[tên khách hàng được bảo lãnh]`, `[ghi tên của nhà thầu]` | Bên được bảo lãnh |
| CONTRACTOR_ADDR | `[địa chỉ của khách hàng]`, `[ghi tên và địa chỉ của nhà thầu]` | |
| GUARANTEE_AMOUNT | `[ghi số tiền bảo lãnh]`, `[bằng số]` | |
| AMOUNT_TEXT | `[ghi rõ giá trị tương ứng bằng số, bằng chữ]`, `[ghi rõ giá trị bằng số, bằng chữ và đồng tiền sử dụng]` | |
| BID_PACKAGE_NAME | `[ghi tên gói thầu]`, `[nội dung mời thầu hoặc số hiệu gói thầu]` | |
| CONTRACT_REF | `[ghi tên hợp đồng, số hợp đồng]`, `[số hợp đồng]` | |
| ISSUE_DATE / SIGN_DATE | `[ngày…tháng…năm]`, `[ngày ký]`, `[……/……/………]` | |
| BLANK_FILL | `[……]` | ô trống chung, suy field theo ngữ cảnh |
| COUNTRY | `[ghi tên quốc gia hoặc vùng lãnh thổ]`, `[Quốc gia]` | thư có yếu tố nước ngoài |
| HEALTH_FACILITY | `[ghi tên cơ sở y tế ký hợp đồng]` | mẫu TT07/TT40 |

*(Danh mục đầy đủ + canonical hoá: `DATA_MODEL.md`. Cần bổ sung dần khi gặp placeholder mới.)*

## 5. Luồng xử lý (segmentation-first)
```
Thư KH upload (PDF/Word)
      │ extract text (giữ cấu trúc đoạn)
      ▼
CLASSIFY 9 chiều (TEMPLATE_SELECTION.md) ──► đoán họ mẫu gần nhất
      │
SEGMENT: đối chiếu corpus 96 template ──► gán mỗi span = KHUNG | BIẾN
      │
EXTRACT + MAP: mỗi BIẾN ↔ canonical field ↔ placeholder [...]
      │
VALIDATE + CONFIDENCE ──► span/biến độ tin thấp = highlight
      │
REPRODUCE: dựng lại thư giữ KHUNG của KH, điền BIẾN ──► DOCX
```

## 6. KPI theo bài toán này
- **Segmentation** (đúng khung vs biến): mục tiêu cao — đây là giá trị demo cốt lõi.
- Classification 95%+ · Extraction 90–95% · Mapping 95%+ · Reproduction (thư sát KH) — đánh giá định tính + đối chiếu bộ test.

## 7. Rủi ro riêng
- Thư KH diễn đạt lệch corpus → segmentation sai ranh giới. Giảm thiểu: fuzzy/semantic match + để user review/chỉnh (highlight).
- Cùng 1 field nhiều cách gọi → `FIELD_ALIASES` (xem `DATA_MODEL.md`).
- Giữ format gốc khi reproduce (bảng, xuống dòng) → xem `DOCX_GENERATOR.md`.
