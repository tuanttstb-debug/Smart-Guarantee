# TODO NEXT — Smart Guarantee

Ưu tiên trên xuống. Owner: [CC]=Claude Code · [TT]=Tuân. Roadmap demo **5–7 ngày**, 4 phase.

> **Delta (2026-08-18 — FE scaffold):** Phase 1 #5 XONG (Bootstrap 5-tab, chạy demo bằng mock). **Việc kế tiếp** = (a) [CC] Phase 0 #3–4 (auto-build REGISTRY/ND_MAP/PLACEHOLDER_MAP + Sheet + Drive) và/hoặc (b) [CC] Phase 1 #6–7 (GAS gateway `action=upload|process` + nối Dify) rồi bật `USE_MOCK=false`. Chờ [TT]: rule validity 1–5, bộ test, deploy GAS Web App lấy URL.

> **Delta (2026-08-17 — kết phiên):** context thiết kế đã đủ (gồm B8ZB + 2 hệ biến); remote đã tạo & push. Phase 0 mục 3–4 (auto-build REGISTRY/ND_MAP/PLACEHOLDER_MAP + Sheet + Drive). Chờ [TT]: rule validity 1–5, bộ test.

## Phase 0 — Chuẩn bị (ngay)
1. [TT] **Tạo GitHub remote** `Smart-Guarantee` → `git remote add origin … && git push -u origin main`.
2. [TT] Cung cấp **[CHỜ NỘI DUNG]** còn lại: (a) rule thời hạn (validity 1–5) chi tiết, (b) bộ test (thư KH vào + kết quả mong muốn).
3. [CC] **Dựng TEMPLATE_REGISTRY** từ **offline `Tham khao/` (96)** + **online `B8ZB/` (theo circular, chỉ TT79 active=true, archive/old-thô=false)** → parse tên file → các chiều. + **PLACEHOLDER_MAP** (`[...]`) + **ND_VARIABLE_MAP** (`$ND`, `TPB_VARIABLES.md`) → Google Sheet.
4. [CC/TT] Dựng cây **Drive** (`DRIVE_STRUCTURE.md`); nạp template .docx vào `/TEMPLATE` (offline + B8ZB TT79).

## Phase 1 — MVP Upload + Extract
5. ✅ [CC] **FE scaffold** Bootstrap 5-tab — DONE (2026-08-18): `index.html` + `assets/{css/theme.css, js/config.js|mock.js|api.js|app.js}`. Topbar tím + 5 nav-tabs step-gated; tab Upload (drag&drop, validate ext/size), classification 9 chiều + route, bảng field edit + highlight confidence <80%, segmentation khung/biến (cập nhật realtime khi edit), Generate + Download. Lớp `api.js` gọi GAS theo `API_CONTRACT.md`, **fallback `mock.js`** (cùng shape) để demo khi chưa có backend. Cấu hình 1 chỗ: `config.js` (`GAS_WEB_APP_URL` + `USE_MOCK`). JS `node --check` OK. *(Verify Chrome: chưa chạy được — extension chưa kết nối; đã mở bằng trình duyệt mặc định để [TT] xem.)*
6. [CC] **GAS gateway**: `action=upload` (lưu /INPUT), khung `action=process`. Xem `API_CONTRACT.md`.
7. [CC] **Dify** Step 1–2 Extract Text (pdfplumber/PyPDF) → `{raw_text, paragraphs}`; nối GAS→Dify (blocking).

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
