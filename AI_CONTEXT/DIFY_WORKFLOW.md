# DIFY WORKFLOW v2 (2026-09-28)

> Thay v1 (4 node LLM: classify → segment → extract → validate). Bản v1 xem git history.

- **1 node LLM** (`dify/smart-guarantee.workflow.yml`): input `system_prompt` + `raw_text` + `today` → output `result` (JSON text).
- **Prompt KHÔNG nằm trong Dify** — nguồn chuẩn `gas/Prompt.gs` (có `PROMPT_VERSION`), GAS truyền vào mỗi lần gọi → sửa prompt = sửa repo + deploy GAS, có lịch sử, test được.
- Dify chỉ làm proxy model (đổi model/provider trong UI không đụng code). Không Code node (TD-SG-08).
- Mọi việc tất định ở GAS/Core: chuẩn hoá tiền/ngày, đọc số thành chữ, kiểm số chữ trong thư ⇄ số, chọn mẫu (xếp hạng theo catalog), sinh DOCX.
- Lý do bỏ 4 node: mỗi request 4 lần gọi tuần tự (chậm, 4 điểm hỏng), segmentation khung/biến không còn cần vì đầu ra luôn là mẫu thư viện (quyết định 2026-09-28).
