---
id: PRJ-SG
type: project-card
title: Smart Guarantee — Nền tảng AI xử lý & sinh thư bảo lãnh (PoC/Demo TPBank)
status: active
owner: PER-TTT
tags: [guarantee, bao-lanh, ai, dify, document-understanding, poc, gas]
related: [SYS-BLOL, PRJ-SHTD, PER-TTT]
created: 2026-08-17
updated: 2026-08-17
version: 2
source: https://github.com/tuanttstb-debug/Smart-Guarantee.git
---

> **Bản đã chốt phạm vi (2026-08-17, phiên 1).** Thay bản khởi tạo. Nguồn brief gốc: `Prompt mo dau.MD` / `Tổng quan.MD` (repo root). Các mục còn treo đánh dấu **[CHỜ NỘI DUNG]** — cần dữ liệu thực (danh mục biến ND, rule thời hạn, tập template chính thức, bộ test) chứ không phải chờ chốt kiến trúc.

## Tóm tắt điều hành
**Smart Guarantee** là **PoC/Demo cho TPBank** chứng minh khả năng dùng **AI để tự động hoá xử lý thư bảo lãnh**. **Trọng tâm** (chốt qua "Logic hiển thị.xlsx" + 96 template thật): nhận **file thư khách hàng tự upload** → **bóc tách đâu là khung mẫu cố định, đâu là biến cần điền** → chuẩn hoá → **trả lại thư soạn sát với thư khách hàng** với biến đã nhận diện/điền. Không chỉ là "chọn 1 template TPBank rồi điền". Bài toán lõi: `VARIABLE_SEGMENTATION.md`.

**Mục tiêu hiện tại KHÔNG phải production** — là demo chứng minh giá trị + khả năng mở rộng để TPBank ra quyết định đầu tư chính thức. Nguyên tắc: **ra demo nhanh nhất · chi phí thấp nhất · không over-engineering · kiến trúc đủ để mở rộng**.

## Bối cảnh nghiệp vụ
| | Hiện tại (thủ công) | PoC mong muốn |
|---|---|---|
| Đầu vào | KH cung cấp thư/mẫu | Upload PDF |
| Xử lý | Cán bộ đọc + nhập liệu tay | AI nhận diện → bóc tách → map biến |
| Kiểm soát | — | User review/chỉnh sửa (highlight confidence thấp) |
| Đầu ra | Tạo thư TPBank → xuất → ký số/in | Generate Word → Download |

Kế thừa nghiệp vụ **Bảo lãnh online** — tri thức AIOS `SYS-BLOL` (`04_Knowledge/products/SYS-BLOL.md`).

## Phạm vi Demo
**Không chỉ bảo lãnh dự thầu.** Nghiệp vụ: **Phát hành** (issuance) — Sửa đổi/Hủy ngoài phạm vi PoC.

- **6 loại bảo lãnh** `goType`: dự thầu (BLDT) · bảo hành (BLBH) · thực hiện HĐ (BLTH) · tạm ứng (BLTU) · thanh toán (BLTT) · hoàn quyết toán/khác (BLKH).
- **Bộ mẫu (template type):** TPB · **TT22** (Bộ KH&ĐT) · **TT07/TT40** (Bộ Y tế) · EVN · VIT (Viettel) · MK (mẫu khác).
- **BLDT online (B8ZB)** theo **vòng đời thông tư**: TT06-07 → TT22 → TT40 → **TT79** (hiện hành). *(TT79 chỉ điều chỉnh BLDT, đánh dấu chuyển quản lý đấu thầu Bộ KH&ĐT → **Bộ Tài chính**; loại BL khác giữ nguyên. Đính chính bản trước: BYT = TT07/TT40.)*
- **Quy mô:** offline `Tham khao/` (96 file) + online `Tham khao/B8ZB/` (221 file, gồm ~32 archive).

> **Tư duy cốt lõi:** KHÔNG coi là template rời. Thiết kế **`Template + Dimension + Rule Engine`** — nhận diện **9 chiều** chung (+ circular & quy trình đấu thầu cho BLDT). Chi tiết: `DATA_MODEL.md` · logic chọn mẫu: `TEMPLATE_SELECTION.md`.

## Bài toán chính — Document Understanding
Không tập trung OCR (PDF text là chủ yếu, `pdfplumber`/`PyPDF`). Năng lực lõi: **Classification (9–11 chiều) · Segmentation (khung/biến) · Extraction · Normalization · Variable Mapping · Reproduction**. **Hai hệ biến:** online B8ZB dùng `$ND` (MERGEFIELD, `TPB_VARIABLES.md`); offline/KH dùng `[...]` + segmentation (`VARIABLE_SEGMENTATION.md`).

## Kiến trúc (đã chốt)
| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Frontend | HTML + Bootstrap (không framework nặng) | 5-tab flow, review/edit |
| Backend | Google Apps Script | **Gateway** — upload, đọc config, gọi Dify, gen DOCX, trả FE. **Không xử lý AI.** |
| AI | **Dify Workflow** (KHÔNG chat agent đơn lẻ) | Classify → Extract → Normalize → Map → Validate → Confidence |
| Config/DB | Google Sheet | Metadata / Configuration / Knowledge Base (KHÔNG dùng như DB truyền thống) |
| Storage | Google Drive | `/INPUT /OUTPUT /TEMPLATE /EXTRACTED /CONFIG /LOGS` |

Chi tiết: `SYSTEM_ARCHITECTURE` · `DATA_MODEL` · `TEMPLATE_SELECTION` · `VARIABLE_SEGMENTATION` · `DIFY_WORKFLOW` · `API_CONTRACT` · `DRIVE_STRUCTURE` · `DOCX_GENERATOR`. Nguồn tham khảo: `Tham khao/` (Logic hiển thị.xlsx + 96 .docx).

**Configuration-driven:** thêm template / field / alias / prompt mới **không cần sửa code** (cập nhật Google Sheet).

## Giao diện — 5 tab
1. **Upload** — upload thư KH (PDF/Word). 2. **AI Classification** — 9 chiều (loại BL/ngôn ngữ/loại thư/lĩnh vực/liên danh…) + route (mẫu chuẩn hay KH upload). 3. **Extracted Data** — biến bóc tách được, cho phép edit. 4. **Biến & Khung** — hiển thị segmentation (khung vs biến, placeholder `[...]`). 5. **Generate** — sinh thư sát thư KH + Download DOCX. Highlight confidence thấp. UI: `DESIGN_SYSTEM.md`.

## KPI Demo (không cam kết 100%)
Classification **95%+** · Segmentation (khung/biến — giá trị lõi) · Field Extraction **90–95%** · Placeholder Mapping **95%+** · Reproduction (thư sát KH) **100% chạy được** · Giảm nhập liệu thủ công **>70%**.

## LLM (ứng viên)
Qwen · Gemini · GPT-4o · DeepSeek — tiêu chí: chi phí thấp · chính xác cao · dễ tích hợp Dify. Chốt trong Phase 1–2.

## Định hướng mở rộng (sau PoC)
Smart Guarantee → Document Intelligence Platform → Trade Finance Docs → Credit Docs → Enterprise Document Automation.

## Quan hệ với dự án khác / AIOS
- `SYS-BLOL` — nguồn tri thức nghiệp vụ bảo lãnh.
- `PRJ-SHTD` — nguồn tham chiếu **UI/UX** (nhận diện "TPBank BIZ") + mẫu kiến trúc **FE + GAS + Sheets**.
- Registry: `04_Knowledge/projects/PRJ-SG.md` · `00_System/PORTFOLIO.md`.

## Nguồn đã có (từ `Tham khao/` — 2026-08-17)
- ✅ **Logic chọn mẫu** (9 chiều + bảng quyết định + fall-through) — `Logic hiển thị.xlsx` → `TEMPLATE_SELECTION.md`.
- ✅ **Template .docx thật**: offline (96 file) + online B8ZB (221 file theo circular) → TEMPLATE_REGISTRY + corpus segmentation.
- ✅ **Từ điển biến — cả hai hệ:** `[...]` (~30, offline) — `VARIABLE_SEGMENTATION.md`; `$ND` (15 biến, online B8ZB) — `TPB_VARIABLES.md`.

## [CHỜ NỘI DUNG] — còn cần
1. **Rule thời hạn (validity 1–5)** mô tả chi tiết cách tính từng kiểu — hiện mới có nhãn.
2. **Bộ test chính thức**: thư KH đầu vào + kết quả mong muốn (khung/biến + thư sinh) — để đo accuracy/segmentation.
3. Danh mục **$ND cho các loại BL khác** (BLBH/BLTH/BLTU/BLTT/BLKH online) + **canonical field**/alias mở rộng — bổ sung dần.
