# UAT & Demo Runbook — Smart Guarantee (Phase 4)

> Nghiệm thu PoC + đo KPI. Chạy sau khi **Dify Workflow** đã dựng và `DIFY_STUB` đã tắt. KPI mục tiêu: `AI_CONTEXT/PROJECT_OVERVIEW.md`.

## 1. Điều kiện tiên quyết
- [ ] GAS Web App live; Script Properties `DIFY_BASE_URL`/`DIFY_API_KEY` đặt, `DIFY_STUB` **đã xoá**.
- [ ] Sheet 8 tab đã import (đặc biệt `TEMPLATE_REGISTRY` 285 dòng); `CONFIG_SHEET_ID` đặt.
- [ ] Drive `/TEMPLATE` đã upload template active (96 offline + 72 TT79), tên khớp `template_file`.
- [ ] FE `config.js`: `USE_MOCK:false`.

## 2. Bộ dữ liệu demo (cần [TT] chuẩn bị)
Mỗi ca test = **1 thư KH đầu vào (PDF/Word)** + **kết quả mong muốn** (khung/biến + thư sinh) để đối chiếu.
Bao phủ tối thiểu:

| # | Loại BL | Bộ mẫu | Route kỳ vọng | Ghi chú |
|---|---|---|---|---|
| T1 | BLTH | TT22 (HH) | OFFLINE | mẫu chuẩn `[...]` |
| T2 | BLDT | — (online) | ONLINE_B8ZB | sinh theo TT79, `$ND` |
| T3 | BLBH | TPB | OFFLINE | |
| T4 | BLTU | EVN/VIT | OFFLINE | validity 1–5 |
| T5 | (bất kỳ) | mẫu KH tự do / NGT / song ngữ | KH_UPLOAD | **case lõi** — segmentation khung/biến |
| T6 | BLTH | liên danh (LD) | OFFLINE | prefix LD_, JOINT_VENTURE_INFO |

## 3. Quy trình test 1 ca (qua FE)
1. Tab **Upload** → chọn thư KH → **Phân tích**.
2. Tab **Phân loại**: đối chiếu 9 chiều + **route** với kỳ vọng.
3. Tab **Dữ liệu**: kiểm giá trị field; sửa các field confidence thấp (highlight vàng).
4. Tab **Biến & Khung**: kiểm ranh giới KHUNG vs BIEN (đúng chỗ cần điền?).
5. Tab **Xuất**: **Sinh thư** → tải `.docx` → mở, đối chiếu "sát thư KH"; kiểm cảnh báo biến sót (⚠).

## 4. Bảng đo KPI
| KPI | Cách đo | Mục tiêu | Kết quả |
|---|---|---|---|
| Classification | # chiều đúng / tổng, trên bộ test | ≥95% | |
| Segmentation (khung/biến) | # span đúng loại / tổng | cao (giá trị lõi) | |
| Field Extraction | # field đúng / tổng field áp dụng | 90–95% | |
| Placeholder/ND Mapping | # biến map đúng / tổng | ≥95% | |
| Reproduction | thư sinh chạy được + sát thư KH (định tính) | 100% chạy được | |
| Giảm nhập tay | ước lượng field auto-fill / tổng field | >70% | |

## 5. Ghi nhận & tinh chỉnh (không sửa code)
Lỗi phân loại/segmentation/mapping → tinh chỉnh **trong Google Sheet**:
- Sai alias → thêm dòng `FIELD_ALIASES`.
- Sai placeholder/$ND → sửa `PLACEHOLDER_MAP` / `ND_VARIABLE_MAP`.
- Sai route → chỉnh `SELECTION_RULES`.
- LLM lệch → sửa prompt trong tab `PROMPTS` (hoặc node Dify).
- Template mới → thêm vào `/TEMPLATE` + chạy lại `tools/build-registry.js` (nếu offline/B8ZB) → re-import `TEMPLATE_REGISTRY`.

## 6. Rủi ro cần theo dõi khi test thật
- **`$ND` MERGEFIELD** (route ONLINE_B8ZB): nếu template lưu `$ND` là **field-code** (không phải text `«$ND»`), `replaceText` không bắt → biến còn sót. Nếu gặp → báo [CC] chuyển sang thao tác OOXML (sửa XML trong .docx).
- **Trùng tên template** giấy/điện tử khi upload phẳng vào `/TEMPLATE` → generate lấy file đầu; kiểm nội dung đúng phương thức.
- **process** blocking > vài phút (thư dài + Dify chậm) có thể chạm giới hạn ~6 phút/execution GAS.
