# TECH DEBT — Smart Guarantee

Nợ kỹ thuật & rủi ro thiết kế đã biết. Mới nhất trên cùng. ID: `TD-SG-nn`. *(PoC chưa có code — đây là rủi ro chờ xử lý khi triển khai.)*

> **Delta (2026-08-18 #4 — thông luồng):** phát sinh/khép nợ khi tích hợp thật (TD-SG-05..09). Đã giải quyết: TD-SG-05 (Drive Advanced Service), TD-SG-07 (Dify base URL), TD-SG-08 (sandbox 429). Còn mở: TD-SG-06 ($ND field-code), TD-SG-09 (template trùng tên). TD-SG-01 (JSON ổn định) hiện xử lý ở GAS (`normalizeDify_` strip fences + parse an toàn) thay vì ép JSON Schema ở Dify.

## TD-SG-09 — Template trùng tên giấy/điện tử khi upload phẳng /TEMPLATE (2026-08-18) · MỞ
**Hiện tượng:** offline giấy vs điện tử cùng tên file (khác method) → upload phẳng vào `/TEMPLATE` bị đè/nhập nhằng; `Generate.gs::findFile_` lấy file đầu.
**Hướng trả nợ:** namespace theo method khi upload (thư mục con), hoặc thêm hậu tố; hoặc `selectTemplate_` ưu tiên method. · **Ưu tiên:** trung bình (nội dung 2 bản gần giống, chấp nhận PoC).

## TD-SG-08 — Dify Cloud sandbox 429 (code node) (2026-08-18) · ĐÃ XỬ LÝ
**Hiện tượng:** workflow status=failed "sandbox ... 429" khi chạy Python code node trên Dify Cloud.
**Xử lý:** bỏ 2 code node (route/assemble) → workflow **LLM-only**; route deterministic + parse + assemble chuyển sang **GAS** (`Dify.gs`). Không còn phụ thuộc sandbox.

## TD-SG-07 — DIFY_BASE_URL sai gây 404 (2026-08-18) · ĐÃ XỬ LÝ
**Hiện tượng:** `DIFY_TIMEOUT 404` do property đặt cả path `/v1/workflows/run` → double path.
**Xử lý:** `Config.gs::difyBaseUrl` chuẩn hoá về host gốc (strip `/v1[/workflows/run]` + `/` cuối). Chấp nhận mọi dạng.

## TD-SG-06 — `$ND` MERGEFIELD có thể là field-code (2026-08-18) · MỞ
**Hiện tượng (dự kiến):** route ONLINE_B8ZB — nếu template lưu `$ND` là Word field-code (không phải text `«$ND»`), `Generate.gs::replaceLiteral_` không thay được → biến còn sót.
**Hướng trả nợ:** nếu gặp khi test route ONLINE thật → thao tác OOXML (mở .docx như zip, sửa `word/document.xml`). Hiện `Generate.gs` thử cả `«$ND»` và `$ND` literal. · **Ưu tiên:** cao khi demo BLDT online. **Chưa test template B8ZB thật.**

## TD-SG-05 — "Drive is not defined" (Advanced Drive Service) (2026-08-18) · ĐÃ XỬ LÝ
**Hiện tượng:** `process`/`generate` lỗi `Drive is not defined` — Advanced Drive Service không nhận ở deployment dù đã bật.
**Xử lý:** bỏ Advanced Service; convert PDF/Word→Doc + export docx qua **Drive REST (UrlFetchApp + OAuth token)** — `gas/Convert.gs`. Chỉ cần scope `drive`.

> **Delta (2026-08-17 — kết phiên):** không phát sinh nợ mới ngoài TD-SG-01..04. Lưu ý thêm: **duy trì đồng bộ 2 hệ biến** (`$ND` online ↔ `[...]` offline) qua ND_VARIABLE_MAP/PLACEHOLDER_MAP — nếu lệch sẽ sinh sai biến (theo dõi khi build registry).

## TD-SG-04 — Segmentation sai ranh giới khung/biến (2026-08-17)
**Hiện tượng:** thư KH diễn đạt lệch corpus → máy gán nhầm đâu là khung, đâu là biến.
**Nguyên nhân:** bài toán lõi (thư KH tự do, không theo template chuẩn).
**Hướng trả nợ:** đối chiếu corpus 96 template (fuzzy/semantic) + để user review/chỉnh (highlight confidence thấp). Xem `VARIABLE_SEGMENTATION.md`. · **Ưu tiên:** cao (giá trị demo cốt lõi).

## TD-SG-03 — Template mới phát sinh (2026-08-17)
**Hiện tượng:** >160 mẫu, sẽ có mẫu/bộ mẫu mới ngoài dự kiến.
**Nguyên nhân:** không thể hard-code từng template.
**Hướng trả nợ:** configuration-driven — admin cập nhật TEMPLATE_REGISTRY/ALIAS/MAPPING/PROMPT trong Google Sheet, không sửa code. · **Ưu tiên:** cao (nguyên tắc kiến trúc).

## TD-SG-02 — Một field nhiều cách gọi (2026-08-17)
**Hiện tượng:** "Bên thụ hưởng / Bên nhận bảo lãnh / Beneficiary / Chủ đầu tư / Employer" cùng trỏ 1 canonical field.
**Nguyên nhân:** khác biệt cách diễn đạt giữa các bộ mẫu.
**Hướng trả nợ:** Sheet `FIELD_ALIASES` (Step 5 Normalization); bổ sung alias dần khi gặp mẫu mới. · **Ưu tiên:** cao.

## TD-SG-01 — LLM trả JSON không ổn định (2026-08-17)
**Hiện tượng:** output LLM có thể lệch format → vỡ pipeline.
**Nguyên nhân:** bản chất sinh của LLM.
**Hướng trả nợ:** ép **JSON Schema** ở mọi node Dify + validation Step 7. · **Ưu tiên:** cao.

## Ghi chú
- OCR **không** đầu tư trong PoC (PDF text là chủ yếu) — nợ tiềm năng nếu gặp PDF scan; để lại cho giai đoạn sau.
- Repo chưa có remote → chưa backup cloud (xem PROJECT_STATE §Đang treo).
