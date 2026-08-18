# SESSION HANDOVER — Smart Guarantee

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
