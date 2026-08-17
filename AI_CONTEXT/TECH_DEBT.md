# TECH DEBT — Smart Guarantee

Nợ kỹ thuật & rủi ro thiết kế đã biết. Mới nhất trên cùng. ID: `TD-SG-nn`. *(PoC chưa có code — đây là rủi ro chờ xử lý khi triển khai.)*

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
