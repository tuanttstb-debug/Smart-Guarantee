# SESSION HANDOVER — Smart Guarantee

## ⭐ Tổng kết phiên 2026-08-18 #8 (Claude Code) — Dify DSL import-ready
- **Task completed:** [TT] chọn hướng "Dify DSL import-ready". Tạo **`dify/smart-guarantee.workflow.yml`** — DSL Dify (mode workflow) dựng sẵn **8 node** (start→classify(LLM)→route(code)→segment(LLM)→extract(LLM)→validate(LLM)→assemble(code)→end) + 7 edge linear + prompt/JSON-schema từ spec. LLM trả JSON-text; code node strip ```json fences rồi parse; assemble xuất 5 khoá khớp `API_CONTRACT`/`Dify.gs`. **YAML valid** (js-yaml: 8 node/7 edge). Thêm mục "Import nhanh" vào `WORKFLOW_SPEC.md`.
- **Files changed:** *(chưa commit khi ghi)* mới `dify/smart-guarantee.workflow.yml`; sửa `dify/WORKFLOW_SPEC.md`; cập nhật `AI_CONTEXT/{TODO_NEXT,SESSION_HANDOVER}.md`.
- **Decision:** (1) LLM node xuất **text (JSON string)** + code node parse (không phụ thuộc feature structured-output theo version Dify) → bền hơn khi import. (2) Model để **`openai/gpt-4o` placeholder** — [TT] đổi sang provider đã cấu hình sau import. (3) DSL là đường nhanh; `WORKFLOW_SPEC.md` là fallback dựng tay nếu schema Dify lệch.
- **Blocker:** [TT] *Import DSL* → đổi model → publish → đặt `DIFY_BASE_URL`/`DIFY_API_KEY` → xoá `DIFY_STUB`. Rủi ro: format DSL theo version Dify → có thể cần chỉnh nhẹ khi import (đã ghi trong file + spec).
- **Next step:** [TT] import + publish Dify → chạy `docs/UAT.md`. [CC] theo kết quả: fix `$ND` OOXML nếu cần; tinh chỉnh prompt/schema; (backlog) Admin UI config-driven / Expansion blueprint.
- **Regression risk:** không — chỉ thêm file DSL + doc; không đụng code runtime.

---

## ⭐ Tổng kết phiên 2026-08-18 #7 (Claude Code) — 4 file GAS live + root README + UAT runbook
- **Task completed:** [TT] re-paste 4 file GAS (`Generate/Process/Dify/SheetConfig.gs`) — **live**, URL không đổi. [CC]: (1) root **`README.md`** — kiến trúc, cấu trúc repo, **bảng trạng thái** (FE/GAS/generator/Sheet/Drive ✅, Dify ⏳), how-to-run, data-boundary. (2) **`docs/UAT.md`** — runbook Phase 4: tiền đề, 6 ca test T1–T6 (phủ OFFLINE/ONLINE_B8ZB/KH_UPLOAD), quy trình test qua FE, bảng đo 6 KPI, cách tinh chỉnh qua Sheet (không sửa code), rủi ro theo dõi (đặc biệt `$ND` field-code).
- **Files changed:** *(chưa commit khi ghi)* mới `README.md`, `docs/UAT.md`; cập nhật `AI_CONTEXT/{TODO_NEXT,SESSION_HANDOVER}.md`.
- **Decision:** Toàn bộ **code đã xong & deploy**; mắt xích runtime duy nhất còn lại = **Dify Workflow** (việc [TT] trong Dify UI theo `dify/WORKFLOW_SPEC.md`). Không test thêm generate OFFLINE/ONLINE được từ CC vì stub luôn route KH_UPLOAD (cần Dify thật để classify ra route khác); POST tới GAS không test được bằng curl (302 redirect) → nghiệm thu qua FE/browser.
- **Blocker:** Dify Workflow chưa dựng (chặn: test thật 3 route, tắt stub, đo KPI). Bộ dữ liệu demo (thư KH + kết quả mong muốn) cần [TT].
- **Next step:** [TT] dựng Dify (spec) → tắt `DIFY_STUB` → chạy `docs/UAT.md` (T1–T6) → báo KPI + lỗi. [CC] chờ kết quả: fix `$ND` OOXML nếu replaceText không bắt field-code; tinh chỉnh prompt/alias/placeholder theo UAT; (backlog) Admin UI config-driven.
- **Regression risk:** không — phiên này chỉ thêm tài liệu (README + UAT); không đụng code runtime.

---

## ⭐ Tổng kết phiên 2026-08-18 #6 (Claude Code) — DOCX generator đầy đủ (Phase 3 #13–14)
- **Task completed:** Rewrite `gas/Generate.gs` từ bản PoC (dựng lại text) → **generator đầy đủ giữ format**: (1) `selectTemplate_` đọc TEMPLATE_REGISTRY (Sheet) chọn mẫu theo classification (scored: guarantee_type bắt buộc + template_type/method/JV/sector/envelope; ONLINE ưu tiên TT79). (2) 3 route: **OFFLINE** replace `[...]`; **ONLINE_B8ZB** replace `«$NDxxx»`+`$NDxxx`; **KH_UPLOAD** dùng chính thư KH `/INPUT` làm khung, chỉ thay đoạn BIEN đã user-edit (đối chiếu segments `/EXTRACTED`, giữ nguyên KHUNG). (3) Cơ chế: `.docx`→Google Doc (`Drive.Files.insert convert`) → `replaceText` (escape regex) → export `.docx`→`/OUTPUT`. (4) **Kiểm sót biến** `leftoverVars_` (`[...]`/`«$ND»`) → trả `warnings`; FE tab 5 hiển thị cảnh báo.
- **Files changed:** *(chưa commit khi ghi)* `gas/Generate.gs` (rewrite), `assets/js/app.js` (hiển thị warnings); `AI_CONTEXT/*`.
- **Decision:** (1) **KH_UPLOAD** = dùng thư KH gốc làm khung (thay giá trị BIEN cũ→mới) thay vì dựng lại từ segments → "sát thư KH" thực sự, giữ format. (2) Chọn template ở **GAS** (không ở Dify) — GAS đọc registry. (3) `$ND` thử cả 2 dạng (`«$ND»` field-display và `$ND` literal) vì chưa chắc dạng lưu trong template. (4) Template upload **phẳng** vào `/TEMPLATE` — trùng tên giấy/điện tử thì lấy file đầu (nội dung gần giống, chấp nhận PoC).
- **Blocker:** cần [TT] **re-paste `Generate.gs` + `Process.gs` + `Dify.gs` + `SheetConfig.gs`** vào Apps Script (đang chỉ ở git). Generate route OFFLINE/ONLINE cần **Sheet đã import** (registry) + **template đã upload** đúng tên `template_file`. `«$ND»` MERGEFIELD có thể là field-code (không phải text) → replaceText có thể không bắt; cần thử template thật (rủi ro TD).
- **Next step:** [TT] re-paste 4 file GAS; test generate cả 3 route với template thật (đặc biệt kiểm `$ND` field vs text). [CC] nếu `$ND` là field-code không thay được → chuyển sang thao tác XML OOXML (mở docx như zip) — chờ kết quả test thật.
- **Regression risk:** trung bình — `Generate.gs` thay toàn bộ; route KH_UPLOAD phụ thuộc segments/EXTRACTED; OFFLINE/ONLINE phụ thuộc registry+template. FE chỉ thêm hiển thị warnings. Stub generate cũ không còn (giờ generate luôn cần template/thư thật) → test sau khi re-paste.

---

## ⭐ Tổng kết phiên 2026-08-18 #5 (Claude Code) — Dify spec + GAS truyền config
- **Task completed:** [TT] xác nhận **FE↔GAS chạy E2E trên browser** (network log: `generate` 302→echo 200) + import 8 CSV xong. [CC]: (1) **`gas/SheetConfig.gs`** — đọc CONFIG_SHEET_ID → bundle config nhẹ (`canonical_fields, field_aliases, placeholder_map, nd_variable_map, field_requirements, selection_rules, prompts`; KHÔNG gồm registry 285 dòng), cache/execution. (2) **`Dify.gs`** truyền `config_json` vào inputs (bỏ `config_ref`) — GAS là nơi duy nhất chạm Sheet, Dify nhận config qua input. (3) **`dify/WORKFLOW_SPEC.md`** — spec dựng workflow paste-ready: 6 node (Classify→Route→Segment→Extract+Map→Validate→Assemble) + prompt + JSON schema từng node + wiring biến + output 5 khoá khớp `API_CONTRACT`.
- **Files changed:** *(chưa commit khi ghi)* mới `gas/SheetConfig.gs`, `dify/WORKFLOW_SPEC.md`; sửa `gas/Dify.gs`; cập nhật `AI_CONTEXT/*`. Đã push tới `8cb274f` trước đó.
- **Decision:** (1) Dify **không tự đọc Sheet** — GAS đọc & truyền `config_json` (giữ gateway là điểm chạm dữ liệu duy nhất). (2) Registry KHÔNG vào Dify — GAS chọn template ở `generate`. (3) Workflow **4 LLM + 2 Code** (gộp Extract+Normalize+Map) cho rẻ/nhanh; prompt đặt trong node v1 (config-driven hoàn toàn để sau). (4) Route suy bằng Code deterministic (khớp SELECTION_RULES R1–R99).
- **Blocker:** **Dựng Dify Workflow** theo spec + đặt `DIFY_BASE_URL`/`DIFY_API_KEY` + xoá `DIFY_STUB` — việc [TT] trong Dify UI. `Process.gs`+`Dify.gs`+`SheetConfig.gs` mới cần **re-paste vào GAS** để có hiệu lực.
- **Next step:** [TT] dựng workflow (`dify/WORKFLOW_SPEC.md`) → publish → lấy key → GAS Properties → tắt stub → test PDF thật. Re-paste 3 file GAS. [CC] hỗ trợ: DOCX generator đầy đủ (#13, điền template thật thay vì dựng lại từ segments); tinh chỉnh prompt/schema sau khi có kết quả thật.
- **Regression risk:** thấp — `SheetConfig.gs` chỉ đọc Sheet; `Dify.gs` đổi inputs (chỉ ảnh hưởng khi tắt stub); FE không đổi.

---

## ⭐ Tổng kết phiên 2026-08-18 #4 (Claude Code) — Wiring FE↔GAS live + verify
- **Task completed:** [TT] deploy GAS Web App + tạo Sheet + Drive + upload template + đặt Script Properties (`CONFIG_SHEET_ID`, `DRIVE_ROOT_ID`, `DIFY_STUB=true`). [CC] nối FE: `config.js` → `GAS_WEB_APP_URL` (exec URL) + `USE_MOCK=false`. **Verify:** `GET ?action=ping` ✅ `{ok:true,service:...}`; `GET ?action=config` ✅ (đọc được Property, không còn "chưa đặt"). Phát hiện & sửa **bug** `handleConfig_` đọc sai tên tab (`TPB_VARIABLE_MAPPING`→`ND_VARIABLE_MAP`, cột tpb_var). Đọc Sheet qua Drive connector → xác nhận **8 tab mới có header, CHƯA import dữ liệu** (registry 285 dòng chưa nạp).
- **Files changed:** *(chưa commit khi ghi)* `assets/js/config.js` (URL + USE_MOCK=false), `gas/Process.gs` (fix tên tab), `AI_CONTEXT/*`.
- **Decision:** Với `DIFY_STUB=true`, `process`/`generate` **bỏ qua Sheet** (dữ liệu stub) → FE chạy end-to-end với GAS thật ngay, **không chờ** import Sheet. Sheet chỉ cần khi Dify thật đọc config. **POST không test được bằng curl** (GAS 302 redirect tới googleusercontent, curl không resend body đúng) — client đúng là browser `fetch` (FE) → [TT] nghiệm thu trên trình duyệt.
- **Blocker:** (1) [TT] **import 8 CSV** vào Sheet (File▸Import▸Replace từng tab) — cần trước khi Dify đọc config. (2) `handleConfig_` fix cần **re-paste `Process.gs`** vào GAS (thấp — FE hiện không gọi `config`). (3) **Dify Workflow chưa dựng** (mắt xích lớn). (4) Verify POST end-to-end phải chạy FE trên browser (extension Chrome ở đây chưa kết nối).
- **Next step:** [TT] mở FE (đã trỏ GAS thật) trên Chrome → upload PDF → chạy 5 tab (stub) để nghiệm thu wiring; import 8 CSV; re-paste Process.gs. [CC] draft **Dify Workflow spec** (prompt + JSON schema từng node) — mắt xích còn lại.
- **Regression risk:** thấp — chỉ đổi config FE + 1 dòng tên tab GAS; mock vẫn fallback nếu URL rỗng.

---

## ⭐ Tổng kết phiên 2026-08-18 #3 (Claude Code) — Registry + Sheet config (Phase 0 #3–4)
- **Task completed:** (1) **Generator** `tools/build-registry.js` parse corpus thật `Tham khao/` → `config/TEMPLATE_REGISTRY.csv` **285 mẫu** (96 offline + 189 B8ZB non-archive; **active=168** = 96 offline + 72 TT79; TT06-07/TT22/TT40 `active=false`; Archive/old-thô loại; parse tên file → 9–11 chiều theo `TEMPLATE_SELECTION §3/§7`). (2) **7 CSV seed** từ doc: `CANONICAL_FIELDS`(25), `FIELD_ALIASES`(28), `PLACEHOLDER_MAP`(26), `ND_VARIABLE_MAP`(15), `SELECTION_RULES`(7, route §2), `FIELD_REQUIREMENTS`(27), `PROMPTS`(5). (3) **`gas/Setup.gs`**: `setupDrive()` (dựng cây Drive + in ROOT id) + `setupConfigSheet()` (tạo Spreadsheet 8 tab + header). (4) `config/README.md` — quy trình import Sheet + dựng Drive + upload template.
- **Files changed:** *(repo SG, chưa commit)* mới `tools/build-registry.js`, `config/*.csv` (8) + `config/README.md`, `gas/Setup.gs`; cập nhật `AI_CONTEXT/{TODO_NEXT,SESSION_HANDOVER,PROJECT_STATE}.md`. *(Corpus `Tham khao/` vẫn để ngoài git — binary, [TT] quyết định.)*
- **Decision:** (1) Registry **tự sinh** từ filename (reproducible, config-driven) — không hand-type; chạy lại khi corpus đổi. (2) Chỉ **TT79 active**; các circular cũ giữ `active=false` để classify. (3) `joint_venture=LD` gộp DD/DDN/ĐL (template không phân biệt subtype). (4) 8 file B8ZB ngoài thư mục TTxx → `circular` rỗng → `active=false`. (5) Config = **CSV trong git** (reviewable) + import thủ công vào Google Sheet (GAS không đọc được CSV trên đĩa local).
- **Blocker:** GAS Setup + import Sheet + upload template + **dựng Dify Workflow** cần [TT] (Google auth + Dify). Không tự chạy được ở đây. Generator + Setup.gs `node --check` OK; số liệu khớp doc (221−32=189 B8ZB, 96 offline).
- **Next step:** [TT] GAS editor: `setupConfigSheet` → import 8 CSV → `CONFIG_SHEET_ID`; `setupDrive` → `DRIVE_ROOT_ID` → upload `/TEMPLATE` (96+72). Rồi **dựng Dify Workflow** (Step 1–8, đọc `sheet://CONFIG`) → tắt `DIFY_STUB`/`USE_MOCK`. [CC] hỗ trợ khi cần: DOCX generator đầy đủ (#13), tinh chỉnh prompt/alias.
- **Regression risk:** không — `config/` + `tools/` + `Setup.gs` là tài sản mới độc lập, chưa nối runtime; generator chỉ đọc corpus, ghi CSV.

---

## ⭐ Tổng kết phiên 2026-08-18 #2 (Claude Code) — GAS gateway (Phase 1 #6–7)
- **Task completed:** Dựng **GAS gateway** trong `gas/`: `appsscript.json` (bật Advanced Drive v2 + scope + Web App) và 8 `.gs` — `Code` (router `?action=` + parse body + JSON/error chuẩn), `Config` (Script Properties), `Drive` (cây thư mục + `doc_id` SG-YYYYMMDD-NNN + log metadata), `Upload` (`/INPUT/<id>`), `Text` (bóc text Drive OCR → `{raw_text,paragraphs}`), `Dify` (gọi `/v1/workflows/run` blocking, chuẩn hoá output theo contract), `Process` (`process`+`config`, có `DIFY_STUB`), `Generate` (PoC: dựng lại từ `segments` → `.docx` thật ở `/OUTPUT`). + `gas/README.md` (setup/deploy/test). Sửa FE `api.js` → POST `text/plain` (né CORS preflight GAS).
- **Files changed:** *(repo SG, chưa commit)* mới `gas/{appsscript.json, Code, Config, Drive, Upload, Text, Dify, Process, Generate}.gs + README.md`; sửa `assets/js/api.js`; cập nhật `AI_CONTEXT/{TODO_NEXT,SESSION_HANDOVER,PROJECT_STATE}.md`.
- **Decision:** (1) **Bóc text ở GAS** (Drive OCR) rồi gửi `raw_text` cho Dify — khớp `API_CONTRACT` (`inputs.raw_text`); điểm swap duy nhất `Text.gs`+`Dify.gs` nếu muốn để Dify tự bóc (pdfplumber). (2) **Secret ở Script Properties**, không hard-code. (3) `DIFY_STUB` để test GAS↔FE khi Dify chưa có. (4) FE↔GAS dùng `text/plain` + Web App access **Anyone** (ràng buộc CORS của GAS). (5) `Generate` bản tối giản để chạy end-to-end; templating đầy đủ = Phase 3 #13.
- **Blocker:** **Chưa deploy** → chưa có Web App URL thật; **Dify Workflow chưa dựng** (Step 1–8). Verify runtime cần [TT] deploy + cấp quyền Google (không tự chạy được ở đây). Syntax 8/8 `.gs` `node --check` OK.
- **Next step:** [TT] tạo GAS project (dán `gas/`) → Script Properties → Deploy Web App (Anyone) → dán URL vào `config.js` + `USE_MOCK=false`; test `?action=ping` rồi bật `DIFY_STUB=true` chạy FE end-to-end; dựng Dify Workflow → tắt stub. [CC] Phase 0 #3–4 (REGISTRY/Sheet/Drive) để Dify có config.
- **Regression risk:** không — `gas/` là code mới độc lập chưa deploy; FE chỉ đổi content-type header (mock vẫn chạy như cũ).

---

## ⭐ Tổng kết phiên 2026-08-18 (Claude Code) — FE scaffold Bootstrap 5-tab
- **Task completed:** Dựng **FE scaffold** (Phase 1 #5) theo `DESIGN_SYSTEM.md`: `index.html` + `assets/css/theme.css` + `assets/js/{config,mock,api,app}.js`. 5-tab step-gated (mở khoá tab sau khi phân tích): ①Upload (drag&drop + validate ext/size), ②Phân loại (9 chiều + badge route), ③Dữ liệu (bảng field **edit được** + highlight confidence <80%), ④Biến&Khung (segmentation KHUNG vs BIEN, cập nhật realtime khi sửa field), ⑤Xuất (Generate + Download). Giữ nhận diện "TPBank BIZ": tím `#7B2CBF`, card radius 20, shadow tối thiểu, Bootstrap 5 CDN override bằng token. **Lớp `api.js`** gọi GAS đúng `API_CONTRACT.md` (`upload/process/generate`), **fallback `mock.js`** cùng shape để demo khi chưa có backend.
- **Files changed:** *(repo SG, chưa commit)* mới `index.html`, `assets/css/theme.css`, `assets/js/config.js|mock.js|api.js|app.js`; cập nhật `AI_CONTEXT/{TODO_NEXT,SESSION_HANDOVER,PROJECT_STATE}.md`.
- **Decision:** (1) Demo trước bằng **mock** (USE_MOCK auto-on khi `GAS_WEB_APP_URL` rỗng) → FE nghiệm thu được ngay, không chờ GAS/Dify. (2) Cấu hình tập trung 1 file `config.js`; đổi backend chỉ cần dán URL + tắt mock, **không sửa `app.js`**. (3) Ngưỡng highlight confidence thấp = **<80%**. (4) Token primary theo DESIGN_SYSTEM `#7B2CBF` (SHTD thật là `#4B1FAF` — chỉ mượn nhận diện, không copy).
- **Blocker:** **Verify Chrome chưa chạy được** — Claude browser extension chưa kết nối (đã mở `index.html` bằng trình duyệt mặc định để [TT] xem thủ công). GAS Web App **chưa deploy** → chưa có URL thật để tắt mock.
- **Next step:** [TT] xem FE + duyệt UI; deploy GAS Web App lấy URL. [CC] Phase 1 #6–7 (GAS gateway `upload/process` + nối Dify) **hoặc** Phase 0 #3–4 (REGISTRY/ND_MAP/PLACEHOLDER_MAP + Sheet + Drive) — chọn theo ưu tiên [TT]; khi có GAS URL → `config.js`: `USE_MOCK=false`.
- **Regression risk:** không — toàn file FE mới, độc lập; chưa nối backend; chưa commit.

---

## ⭐ Tổng kết phiên 2026-08-17 (kết phiên) — Cho: phiên tiếp (Phase 0)
- **Task completed:** Onboard PRJ-SG từ brief + scan toàn bộ nguồn tham khảo. Dựng **đủ bộ context thiết kế** (5 lõi + DESIGN_SYSTEM + 9 doc). Parse `Logic hiển thị.xlsx` (logic chọn mẫu **9 chiều**) + **96 mẫu offline** + **221 mẫu online B8ZB** (theo vòng đời thông tư). **Hoà giải 2 hệ biến** (`$ND` MERGEFIELD online ↔ `[...]` offline). Chốt trọng tâm = **segmentation khung/biến trên thư KH upload**. Đồng bộ AIOS hub.
- **Files changed:** `AI_CONTEXT/` — 5 lõi + DESIGN_SYSTEM (cập nhật) + 9 doc thiết kế (`SYSTEM_ARCHITECTURE`, `DATA_MODEL`, `TEMPLATE_SELECTION`, `VARIABLE_SEGMENTATION`, `TPB_VARIABLES`, `DIFY_WORKFLOW`, `API_CONTRACT`, `DRIVE_STRUCTURE`, `DOCX_GENERATOR`); `CLAUDE.md`. (AIOS) `PRJ-SG.md` (v4), `PORTFOLIO.md`, `projects.json`. *(Chưa commit: `Tham khao/`, `Prompt mo dau.MD`, `Tổng quan.MD` — chờ [TT] quyết định.)*
- **Decision:** FE Bootstrap 5-tab (giữ nhận diện tím, bỏ dashboard) · **hỗ trợ cả 2 hệ biến theo route** (ONLINE_B8ZB→`$ND`, OFFLINE/KH_UPLOAD→`[...]`) · scope = **Phát hành** · BLDT: **classify 4 circular, sinh chỉ TT79** · archive/old-thô = inactive · **TT79 chỉ áp BLDT** (Bộ KH&ĐT → Bộ Tài chính).
- **Blocker:** **[CHỜ NỘI DUNG]** — rule validity 1–5 chi tiết · bộ test chính thức (thư KH + kết quả mong muốn) · danh mục `$ND` cho các loại BL khác (online). *(Remote đã tạo — hết blocker cũ.)*
- **Next step:** Phase 0 — auto-build **TEMPLATE_REGISTRY + ND_VARIABLE_MAP + PLACEHOLDER_MAP** từ offline + B8ZB (chỉ TT79 active) → Google Sheet + cây Drive; rồi Phase 1 (FE scaffold Bootstrap + GAS upload + Dify extract). Xem `TODO_NEXT.md`.
- **Regression risk:** không — mới ở tầng tài liệu context, chưa có code.

*(Chi tiết từng chặng ở các delta bên dưới, mới nhất trên cùng.)*

---

**Từ phiên:** 2026-08-17 (Claude Code — nạp bộ BLDT online B8ZB) · **Cho:** phiên tiếp (Phase 0–1)

## Delta phiên (2026-08-17 — scan `Tham khao/B8ZB/` + hệ biến $ND)
- **Việc xong:** Scan `B8ZB/` (221 file BLDT **online** theo vòng đời thông tư TT06-07→TT22→TT40→**TT79**). Phát hiện **hệ biến $ND thứ 2** (Word MERGEFIELD `«$ND001»`, rút 15 biến + context) song song `[...]` của mẫu offline → **hoà giải mâu thuẫn $ND vs [...]**: cả hai đều thật, khác hệ. Tạo `TPB_VARIABLES.md` (danh mục $ND). Bổ sung `TEMPLATE_SELECTION.md` §7 (B8ZB, circular, quy trình đấu thầu, quy ước tên). Cập nhật `DATA_MODEL` (dim 10 Circular + 11 Bidding, ND_VARIABLE_MAP, registry +source/circular/envelope), `DIFY_WORKFLOW`/`DOCX_GENERATOR`/`API_CONTRACT`/`VARIABLE_SEGMENTATION`/`PROJECT_OVERVIEW`/`PROJECT_STATE`/`TODO_NEXT`. Đồng bộ AIOS card v4.
- **File đổi:** `AI_CONTEXT/*` (+`TPB_VARIABLES.md`, cập nhật 9 doc); (AIOS) `04_Knowledge/projects/PRJ-SG.md`.
- **Quyết định (note [TT] + hỏi):** (1) **hỗ trợ cả 2 hệ biến** theo route (ONLINE_B8ZB→$ND, OFFLINE/KH_UP→`[...]`); (2) BLDT: **classify cả 4 circular, sinh chỉ TT79**; (3) **archive/old-thô = active=false** (giữ tham chiếu). **Đính chính:** TT79 CÓ thật, **chỉ áp BLDT** (Bộ KH&ĐT → Bộ Tài chính) — sửa bản trước.
- **Blocker:** chưa có GitHub remote. **[CHỜ NỘI DUNG]:** rule validity 1–5 chi tiết; bộ test; $ND cho các loại BL khác (online).
- **Bước kế:** Phase 0 — dựng REGISTRY từ offline+B8ZB (chỉ TT79 active) + PLACEHOLDER_MAP + ND_VARIABLE_MAP; Drive; remote.
- **Rủi ro hồi quy:** không (chưa có code).

---

## Delta phiên (2026-08-17 — nạp logic chọn mẫu thật)
**Từ phiên:** 2026-08-17 (Claude Code — nạp logic chọn mẫu thật) · **Cho:** phiên tiếp (Phase 0–1)

## Delta phiên (2026-08-17 — scan `Tham khao/` + nạp logic chọn mẫu)
- **Việc xong:** Scan ổ tham khảo `Tham khao/`: parse `Logic hiển thị.xlsx` (7 sheet) + 96 template .docx. Rút **logic chọn mẫu 9 chiều** + bảng quyết định + quy tắc fall-through "Mẫu KH up" + từ điển placeholder `[...]`. **Chốt lại trọng tâm PoC** (theo note [TT]): bài toán lõi = **segmentation khung/biến trên thư KH tự upload → trả thư sát thư KH**, không chỉ chọn 1 template. Tạo 2 doc mới `TEMPLATE_SELECTION.md` + `VARIABLE_SEGMENTATION.md`; cập nhật `PROJECT_OVERVIEW`/`DATA_MODEL`/`DIFY_WORKFLOW`/`DOCX_GENERATOR`/`API_CONTRACT`/`SYSTEM_ARCHITECTURE`/`PROJECT_STATE`/`TODO_NEXT`/`TECH_DEBT`. Đồng bộ AIOS card.
- **File đổi:** `AI_CONTEXT/*` (+2 doc mới, cập nhật 8 doc); (AIOS) `04_Knowledge/projects/PRJ-SG.md`.
- **Quyết định (note [TT]):** (1) biến = placeholder `[...]` template thật, **bỏ $ND001**; (2) scope = **Phát hành** (bỏ Sửa đổi); (3) `Tham khao/` = nguồn chính thức dựng TEMPLATE_REGISTRY (96 file); (4) trọng tâm = **segmentation + reproduce thư KH** (kể cả case "Mẫu KH up").
- **Đính chính mô hình:** 9 chiều (không phải 6); 6 loại BL (thêm BLBH/BLKH); bộ mẫu **TT22/TT07/TT40** (KHÔNG phải "TT79"); BYT = TT07/TT40.
- **Blocker:** chưa có GitHub remote. **[CHỜ NỘI DUNG]** còn: rule validity 1–5 chi tiết; bộ test (thư KH vào + kết quả mong muốn).
- **Bước kế:** Phase 0 — dựng TEMPLATE_REGISTRY + PLACEHOLDER_MAP từ 96 file; dựng Sheet 7 sheet + Drive; tạo remote. Xem `TODO_NEXT.md`.
- **Rủi ro hồi quy:** không (chưa có code).

---

## Delta phiên (2026-08-17 — chốt phạm vi phiên 1)
**Từ phiên:** 2026-08-17 (Claude Code — chốt phạm vi phiên 1) · **Cho:** phiên tiếp (bắt tay code Phase 1)

## Delta phiên (2026-08-17 — chốt phạm vi + dựng bộ context thiết kế)
- **Việc xong:** Nạp brief (`Prompt mo dau.MD`/`Tổng quan.MD`), **chốt phạm vi** (PoC/Demo TPBank: AI đọc PDF → classify → extract → normalize → map biến TPBank → sinh DOCX; 4 loại BL × 5 bộ mẫu, >160 mẫu theo tư duy **Template+Dimension+Rule Engine**) và **kiến trúc** (FE HTML+Bootstrap 5-tab giữ nhận diện tím "TPBank BIZ" bỏ dashboard · GAS gateway · **Dify Workflow** 9 step ép JSON Schema · Google Sheet 6 sheet config · Drive 6 thư mục). Rewrite `PROJECT_OVERVIEW`/`PROJECT_STATE`/`TODO_NEXT`/`DESIGN_SYSTEM`, cập nhật `TECH_DEBT`; **tạo mới** 6 doc: `SYSTEM_ARCHITECTURE`, `DATA_MODEL`, `DIFY_WORKFLOW`, `API_CONTRACT`, `DRIVE_STRUCTURE`, `DOCX_GENERATOR`. Đồng bộ AIOS hub (thẻ PRJ-SG v2, PORTFOLIO). Đính chính token SHTD: file thật `tokens.css` (không phải `variables.css`).
- **File đổi:** `AI_CONTEXT/*` (5 lõi + DESIGN_SYSTEM update; +6 doc mới); (AIOS) `04_Knowledge/projects/PRJ-SG.md`, `00_System/PORTFOLIO.md`.
- **Quyết định:** UI giữ nhận diện tím nhưng **Bootstrap 5-tab** (bỏ sidebar/dashboard SHTD); doc depth = **đủ bộ thiết kế**; đồng bộ AIOS hub; hạ tầng (Dify + Google Workspace + template .docx + PDF mẫu) **đã có sẵn**.
- **Blocker:** chưa có GitHub remote (chỉ local). Còn **[CHỜ NỘI DUNG]** dữ liệu thực: danh mục biến ND, rule thời hạn, tập template chính thức, bộ test.
- **Bước kế:** Phase 0 (remote + dựng Sheet/Drive + nạp template) → Phase 1 (FE scaffold Bootstrap + GAS upload + Dify extract). Xem `TODO_NEXT.md`.
- **Rủi ro hồi quy:** không (chưa có code; chỉ tài liệu context).

---

## Delta phiên (2026-08-17 — khởi tạo dự án)
**Từ phiên:** 2026-08-17 (Claude Code — khởi tạo) · **Cho:** phiên 1 (bắt đầu làm dự án)

## Delta phiên (2026-08-17 — khởi tạo dự án)
- **Việc xong:** Khởi tạo dự án qua skill AIOS `init-project`: `git init` (nhánh `main`), scaffold `AI_CONTEXT/` (OVERVIEW/STATE/TODO/HANDOVER/TECH_DEBT) + `CLAUDE.md` bootstrap; tạo **`DESIGN_SYSTEM.md` kế thừa UI/UX từ PRJ-SHTD** ("TPBank BIZ" — tím-first, card-driven, token-based, breakpoints 1440/1280/1024/768/480); điền OVERVIEW/STATE/TODO khởi điểm (đánh dấu [CHỜ XÁC NHẬN] các mục nghiệp vụ). Đăng ký AIOS registry (thẻ PRJ-SG, PORTFOLIO, INDEX, portfolio-digest).
- **File đổi:** `AI_CONTEXT/*` (5 khung + DESIGN_SYSTEM), `CLAUDE.md`; (AIOS) thẻ + PORTFOLIO/INDEX/projects.json.
- **Quyết định:** UI/UX **kế thừa SHTD**; nghiệp vụ tham chiếu `SYS-BLOL`; stack/phạm vi **chưa chốt** (để phiên 1).
- **Blocker:** chưa có GitHub remote (chỉ local); phạm vi nghiệp vụ chưa xác nhận.
- **Bước kế:** [TT] chốt phạm vi + stack + tạo remote (TODO_NEXT mục Cao); [CC] dựng scaffold FE theo `DESIGN_SYSTEM.md`.
- **Rủi ro hồi quy:** không (dự án mới, chưa có code).

## Cách bắt đầu một phiên (bắt buộc)
1. `git pull` (sau khi có remote).
2. Đọc `AI_CONTEXT/PROJECT_OVERVIEW.md` → `PROJECT_STATE.md` → `TODO_NEXT.md` → file này → `TECH_DEBT.md`. UI: `DESIGN_SYSTEM.md`.
3. Làm việc nhỏ → commit nhỏ → cập nhật context → push. Kết phiên: ghi delta 6 trường.

## Gotchas
- Tên thư mục có dấu cách ("Smart Guarantee") → quote path khi chạy lệnh.
- Repo chưa có remote → `git push` chỉ được sau khi `git remote add origin`.
