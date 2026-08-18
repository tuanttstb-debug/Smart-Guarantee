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
> ✅ [CC] **Spec + DSL + wiring xong** (2026-08-18): **`dify/smart-guarantee.workflow.yml`** (DSL import-ready, 8 node, YAML valid) + `dify/WORKFLOW_SPEC.md` (spec/fallback) + `gas/SheetConfig.gs` + `Dify.gs` truyền `config_json`. **Còn [TT]:** *Import DSL* vào Dify → đổi model provider → publish → `DIFY_BASE_URL`/`DIFY_API_KEY` → xoá `DIFY_STUB`.
8. ⏳ [TT] **Dựng Dify** node Classify + Route (spec §LLM1/§Code Route).
9. ⏳ [TT] node **Segment** (spec §LLM2) — *node lõi*.
10. ⏳ [TT] node **Extract+Normalize+Map** (spec §LLM3, dùng field_aliases/placeholder_map/nd_variable_map từ config_json).
11. ⏳ [TT] node **Validate** + Assemble (spec §LLM4/§Code Assemble); FE tab 2/3/4 đã sẵn hiển thị + highlight confidence.
12. [TT] Chốt **LLM** (Qwen/Gemini/GPT-4o/DeepSeek) theo chi phí/độ chính xác.

## Phase 3 — Reproduce / Generate DOCX
13. ✅ [CC] **DOCX generator đầy đủ** — DONE (2026-08-18): `gas/Generate.gs` rewrite. `selectTemplate_` chọn mẫu từ TEMPLATE_REGISTRY (Sheet) theo classification (scored: BL bắt buộc + template_type/method/JV/sector/envelope). ONLINE_B8ZB → replace `«$NDxxx»`/`$NDxxx`; OFFLINE → replace `[...]`; KH_UPLOAD → dùng chính thư KH `/INPUT` làm khung, chỉ thay đoạn BIEN đã user-edit (giữ KHUNG). Google Doc + replaceText (escape regex) → export `.docx` → `/OUTPUT`. **Kiểm sót biến** (`leftoverVars_`) → trả `warnings`. **Còn [TT]:** re-paste `Generate.gs` (+ 3 file GAS trước) vào Apps Script.
14. ✅ [CC] Tab 5 Generate + Download + hiển thị cảnh báo biến sót (`app.js`).

## Phase 4 — Demo Dataset + UAT
> ✅ [CC] **Runbook sẵn** (2026-08-18): `docs/UAT.md` — tiền đề, 6 ca test (T1–T6 phủ 3 route), quy trình test qua FE, bảng đo KPI, cách tinh chỉnh (Sheet, không sửa code), rủi ro theo dõi. + root `README.md` (kiến trúc + trạng thái + how-to-run).
15. [TT] **Bộ dữ liệu demo** theo `docs/UAT.md §2`: thư KH mẫu đa loại × loại BL + kết quả mong muốn.
16. [CC/TT] Đo **KPI** theo `docs/UAT.md §4` (sau khi Dify live).
17. [CC] Ghi kết quả UAT + tinh chỉnh prompt/alias/placeholder-map (không sửa code).

## Backlog
- Admin UI cập nhật Registry/Alias/Mapping/Prompt (configuration-driven).
- Định hướng mở rộng Production (Document Intelligence Platform).
