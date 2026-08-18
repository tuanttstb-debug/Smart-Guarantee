# TODO NEXT — Smart Guarantee

Ưu tiên trên xuống. Owner: [CC]=Claude Code · [TT]=Tuân. Roadmap demo **5–7 ngày**, 4 phase.

> **Delta (2026-08-18 #3 — Registry + config):** Phase 0 #3–4 XONG phía [CC] (`config/` 8 CSV + generator `tools/build-registry.js` + `gas/Setup.gs`). **Việc kế tiếp** = [TT] chạy `setupConfigSheet`/`setupDrive` → đặt `CONFIG_SHEET_ID`+`DRIVE_ROOT_ID` → import 8 CSV + upload template `/TEMPLATE`; rồi dựng **Dify Workflow** (Step 1–8, đọc config) — mắt xích lớn còn lại để tắt mock/stub.

> **Delta (2026-08-18 #2 — GAS gateway):** Phase 1 #6–7 XONG phía GAS (`gas/`: upload/process/generate/config + Dify blocking + Drive + OCR). [TT] deploy Web App → `config.js` (`USE_MOCK=false`); dựng Dify Workflow rồi tắt `DIFY_STUB`.

> **Delta (2026-08-18 — FE scaffold):** Phase 1 #5 XONG (Bootstrap 5-tab, chạy demo bằng mock). Chờ [TT]: rule validity 1–5, bộ test, deploy GAS Web App lấy URL.

> **Delta (2026-08-17 — kết phiên):** context thiết kế đã đủ (gồm B8ZB + 2 hệ biến); remote đã tạo & push. Phase 0 mục 3–4 (auto-build REGISTRY/ND_MAP/PLACEHOLDER_MAP + Sheet + Drive). Chờ [TT]: rule validity 1–5, bộ test.

## Phase 0 — Chuẩn bị (ngay)
1. [TT] **Tạo GitHub remote** `Smart-Guarantee` → `git remote add origin … && git push -u origin main`.
2. [TT] Cung cấp **[CHỜ NỘI DUNG]** còn lại: (a) rule thời hạn (validity 1–5) chi tiết, (b) bộ test (thư KH vào + kết quả mong muốn).
3. ✅ [CC] **TEMPLATE_REGISTRY + config** — DONE (2026-08-18): generator `tools/build-registry.js` parse `Tham khao/` → `config/TEMPLATE_REGISTRY.csv` (**285 mẫu**: 96 offline + 189 B8ZB; active=168 = 96 offline + 72 TT79; TT06-07/TT22/TT40 `active=false`; archive/old-thô loại). + 7 CSV seed từ doc: `CANONICAL_FIELDS, FIELD_ALIASES, PLACEHOLDER_MAP, ND_VARIABLE_MAP, SELECTION_RULES, FIELD_REQUIREMENTS, PROMPTS`. Import Sheet: `gas/Setup.gs::setupConfigSheet` + `config/README.md`. **Còn [TT]:** chạy `setupConfigSheet` → import 8 CSV → đặt `CONFIG_SHEET_ID`.
4. ✅/⏳ [CC/TT] **Drive** — GAS xong: `gas/Setup.gs::setupDrive` dựng cây `{INPUT,EXTRACTED,OUTPUT,TEMPLATE,CONFIG,LOGS}` + in ROOT id. **Còn [TT]:** chạy `setupDrive` → đặt `DRIVE_ROOT_ID`; **upload template .docx** vào `/TEMPLATE` (96 offline + 72 TT79, tên khớp `template_file`) — binary không nằm trong git.

## Phase 1 — MVP Upload + Extract
5. ✅ [CC] **FE scaffold** Bootstrap 5-tab — DONE (2026-08-18): `index.html` + `assets/{css/theme.css, js/config.js|mock.js|api.js|app.js}`. Topbar tím + 5 nav-tabs step-gated; tab Upload (drag&drop, validate ext/size), classification 9 chiều + route, bảng field edit + highlight confidence <80%, segmentation khung/biến (cập nhật realtime khi edit), Generate + Download. Lớp `api.js` gọi GAS theo `API_CONTRACT.md`, **fallback `mock.js`** (cùng shape) để demo khi chưa có backend. Cấu hình 1 chỗ: `config.js` (`GAS_WEB_APP_URL` + `USE_MOCK`). JS `node --check` OK. *(Verify Chrome: chưa chạy được — extension chưa kết nối; đã mở bằng trình duyệt mặc định để [TT] xem.)*
6. ✅ [CC] **GAS gateway** — DONE (2026-08-18): `gas/` (8 `.gs` + `appsscript.json` + README). Router `?action=upload|process|generate|config|ping`; `upload`→`/INPUT/<doc_id>`; `process` khung đầy đủ (bóc text → Dify → lưu `/EXTRACTED` → trả FE); `generate` PoC (dựng lại từ segments → `.docx` thật ở `/OUTPUT`; bản đầy đủ = #13). Secret ở Script Properties. `DIFY_STUB=true` test GAS↔FE không cần Dify. FE POST `text/plain` (né CORS preflight).
7. ✅/⏳ [CC] **Extract Text + nối GAS→Dify (blocking)** — GAS phía đã xong: `Text.gs` bóc text (Drive OCR) → `Dify.gs` gọi `/v1/workflows/run` blocking, chuẩn hoá output theo `API_CONTRACT`. **Còn [TT]:** deploy Web App lấy URL + dựng **Dify Workflow** thật (Step 1–8) rồi tắt stub. *(Điểm swap nếu để Dify tự bóc text: `Text.gs`+`Dify.gs` — xem `gas/README.md`.)*

## Phase 2 — Classification + Segmentation + Mapping
8. [CC] **Dify** Step 2 Classification (**9 chiều**, `TEMPLATE_SELECTION.md`) + route STANDARD/KH_UPLOAD — ép JSON Schema; prompt từ Sheet `PROMPTS`.
9. [CC] Step 3 **Segmentation** (khung vs biến, đối chiếu corpus 96 template) — *node lõi*.
10. [CC] Step 4 Extraction (điều kiện FIELD_REQUIREMENTS) + Step 5 Normalization (FIELD_ALIASES) + Step 6 Placeholder Mapping (canonical → `[...]`).
11. [CC] Step 7 Validation + Step 8 Confidence; FE tab 2/3/4 hiển thị segmentation + **highlight confidence thấp**, cho edit.
12. [TT] Chốt **LLM** (Qwen/Gemini/GPT-4o/DeepSeek) theo chi phí/độ chính xác.

## Phase 3 — Reproduce / Generate DOCX
13. [CC] **DOCX generator** (GAS, `DOCX_GENERATOR.md`): route ONLINE_B8ZB (điền MERGEFIELD `$ND`, template TT79) · route OFFLINE (replace `[...]`) · route KH_UPLOAD (điền biến trên thư KH, giữ khung) → `/OUTPUT` → download. Kiểm sót biến (`[...]`/`«$ND»`).
14. [CC] Tab 5 Generate + Download nối end-to-end (thư sát thư KH).

## Phase 4 — Demo Dataset + UAT
15. [TT] **Bộ dữ liệu demo**: thư KH mẫu đa loại (TPB/TT22/TT07/TT40/EVN/VIT + mẫu KH tự do) × loại BL.
16. [CC/TT] Đo **KPI**: Classification 95%+ · Segmentation (khung/biến) · Extraction 90–95% · Mapping 95%+ · Reproduction sát thư KH · giảm nhập tay >70%.
17. [CC] Ghi kết quả UAT + tinh chỉnh prompt/alias/placeholder-map (không sửa code).

## Backlog
- Admin UI cập nhật Registry/Alias/Mapping/Prompt (configuration-driven).
- Định hướng mở rộng Production (Document Intelligence Platform).
