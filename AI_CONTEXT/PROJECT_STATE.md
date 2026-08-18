# PROJECT STATE — Smart Guarantee

**Cập nhật:** 2026-08-17 · **Version:** 0.3.0 (nạp logic chọn mẫu thật) · **Repo:** https://github.com/tuanttstb-debug/Smart-Guarantee.git *(remote CHƯA tạo — xem Đang treo)*

## Tóm tắt
Đã **chốt phạm vi + kiến trúc** và **nạp logic chọn mẫu thật** từ `Tham khao/` (Logic hiển thị.xlsx + 96 template .docx). **Chưa có code.** Trọng tâm PoC = **segmentation khung/biến trên thư KH upload** → sinh thư sát thư KH (không chỉ chọn 1 template TPBank). Biến = placeholder `[...]`, không phải $ND.

## Kiến trúc đã chốt
- **FE:** HTML + Bootstrap, 5-tab tuyến tính, giữ nhận diện tím "TPBank BIZ" (bỏ dashboard). Xem `DESIGN_SYSTEM.md`.
- **Gateway:** Google Apps Script (không xử lý AI). **AI:** Dify Workflow (classify 9 chiều → segment → extract → normalize → map placeholder → validate). **Config/DB:** Google Sheet (7 sheet). **Storage:** Google Drive (6 thư mục).
- Docs: `SYSTEM_ARCHITECTURE` · `DATA_MODEL` · `TEMPLATE_SELECTION` · `VARIABLE_SEGMENTATION` · `TPB_VARIABLES` · `DIFY_WORKFLOW` · `API_CONTRACT` · `DRIVE_STRUCTURE` · `DOCX_GENERATOR`.

## Đã có
- Bộ context đầy đủ: 5 file lõi + `DESIGN_SYSTEM` + **8 doc thiết kế**.
- **Nguồn tham khảo `Tham khao/`:** `Logic hiển thị.xlsx` (7 sheet: logic chọn mẫu 9 chiều, nhóm giao dịch, product, ma trận field theo loại BL) + **96 template .docx** (4 thư mục Độc lập/Liên danh × giấy/điện tử).
- `CLAUDE.md` bootstrap. `git init` local, nhánh `main`.
- Đăng ký AIOS registry: thẻ `PRJ-SG` (active), PORTFOLIO, INDEX, projects.json.

## Phát hiện then chốt (từ scan Tham khao + B8ZB)
- Chọn mẫu theo **9 chiều** (currency/goType/method/language/type/sector/validity/JV/contract-status) + circular & quy trình đấu thầu cho BLDT.
- **6 loại BL** (thêm BLBH, BLKH). BYT = TT07/TT40; Bộ KH&ĐT = TT22/TT06-07.
- **TT79 CÓ thật** — chỉ áp cho **BLDT** (mới nhất, chuyển Bộ KH&ĐT → **Bộ Tài chính**); loại khác giữ nguyên. *(Sửa bản trước ghi "không phải TT79".)*
- **Hai hệ biến:** online B8ZB dùng `$ND` (MERGEFIELD, 15 biến — `TPB_VARIABLES.md`); offline/KH dùng `[...]`. PoC **hỗ trợ cả hai** theo route.
- BLDT online (B8ZB) theo **vòng đời thông tư** TT06-07→TT22→TT40→**TT79**: classify cả 4, **sinh chỉ TT79**; archive/old-thô = active=false.
- Case **"Mẫu KH up"** = case chính (segmentation khung/biến).

## Hạ tầng / tài sản (đã xác nhận có sẵn — phiên 1)
- ✅ **Dify** instance/account (+ API key). ✅ **Google Workspace** (Apps Script + Sheets + Drive).
- ✅ **Template .docx TPBank** + (một phần) danh mục biến ND. ✅ **Bộ PDF mẫu** để test bóc tách.

## Đang treo
- **Tạo GitHub remote** `Smart-Guarantee` → `git remote add origin … && git push -u origin main` (chỉ local).
- **[CHỜ NỘI DUNG]** còn lại:
  1. Rule thời hạn (validity 1–5) mô tả cách tính chi tiết.
  2. Bộ test chính thức (thư KH vào + kết quả mong muốn: khung/biến + thư sinh) để đo accuracy/segmentation.
  3. Canonical field đầy đủ + alias mở rộng (bổ sung dần).

## Nguồn dữ liệu / tích hợp
- Google Sheet 6 sheet (config/metadata/KB) — `DATA_MODEL.md`.
- Google Drive `/INPUT /OUTPUT /TEMPLATE /EXTRACTED /CONFIG /LOGS` — `DRIVE_STRUCTURE.md`.
- Dify Workflow (LLM: Qwen/Gemini/GPT-4o/DeepSeek — chốt Phase 1–2).

## Rủi ro / hiện tượng đã biết
- LLM trả JSON không ổn định → ép JSON Schema (TD-SG-01).
- Một field nhiều cách gọi → FIELD_ALIASES (TD-SG-02).
- Template mới phát sinh → configuration-driven, không sửa code (TD-SG-03).
- Segmentation sai ranh giới khung/biến (thư KH lệch corpus) → fuzzy match + user review (TD-SG-04).
- Repo chưa có remote → chưa backup cloud.

## Delta (2026-08-18 #3 — Registry + config)
**Config layer đầu tiên.** `tools/build-registry.js` sinh `config/TEMPLATE_REGISTRY.csv` từ corpus thật (285 mẫu; active=168 = 96 offline + 72 TT79; các circular cũ active=false; archive loại) + 7 CSV seed (`CANONICAL_FIELDS/FIELD_ALIASES/PLACEHOLDER_MAP/ND_VARIABLE_MAP/SELECTION_RULES/FIELD_REQUIREMENTS/PROMPTS`). `gas/Setup.gs` (`setupDrive`+`setupConfigSheet`) + `config/README.md` cho [TT] dựng Google Sheet + cây Drive + upload template. Registry **tự sinh** (chạy lại khi corpus đổi). Chưa nối runtime (cần [TT] import Sheet + đặt `CONFIG_SHEET_ID`/`DRIVE_ROOT_ID` + dựng Dify). Regression risk = không. Kế tiếp: Dify Workflow (mắt xích lớn còn lại).

## Delta (2026-08-18 #2 — GAS gateway)
**Backend gateway đầu tiên.** `gas/` — 8 `.gs` + `appsscript.json` + README. Router `?action=upload|process|generate|config|ping`; `upload`→`/INPUT`; `process` = bóc text (Drive OCR, `Text.gs`) → Dify `/v1/workflows/run` blocking (`Dify.gs`, chuẩn hoá output theo `API_CONTRACT`) → lưu `/EXTRACTED` → trả FE; `generate` PoC dựng lại từ `segments` → `.docx` thật ở `/OUTPUT`. Secret ở Script Properties; `DIFY_STUB` test không cần Dify. FE `api.js` chuyển POST `text/plain` (né CORS preflight). Syntax 8/8 OK; **chưa deploy** (cần [TT] tạo GAS project + Web App URL + Dify Workflow thật). Regression risk = không (code mới, chưa deploy).

## Delta (2026-08-18 — FE scaffold)
**Có code đầu tiên.** FE scaffold Bootstrap 5-tab (Phase 1 #5): `index.html` + `assets/css/theme.css` + `assets/js/{config,mock,api,app}.js`. Luồng Upload→Phân loại→Dữ liệu→Biến&Khung→Xuất chạy được **bằng mock** (`mock.js` khớp `API_CONTRACT.md`); `api.js` gọi GAS thật khi `USE_MOCK=false` + có URL. Nhận diện tím `#7B2CBF`, edit field + highlight confidence <80%, segmentation realtime. Verify Chrome chưa chạy (extension chưa kết nối) → mở trình duyệt mặc định để [TT] xem. Chưa commit. Regression risk = không (file mới độc lập). Kế tiếp: GAS gateway (#6–7) hoặc Phase 0 (#3–4).

## Delta (2026-08-17 — kết phiên)
Bộ context thiết kế hoàn chỉnh (15 doc) + đồng bộ AIOS hub v4; commit & push lên remote `Smart-Guarantee`. Sẵn sàng **Phase 0** (build REGISTRY/ND_MAP/PLACEHOLDER_MAP + Sheet + Drive). Chi tiết 6 trường: `SESSION_HANDOVER.md` (mục ⭐ tổng kết). Chưa có code → regression risk = không.

## Delta (2026-08-17 — nạp bộ BLDT online B8ZB)
Scan `Tham khao/B8ZB/` (221 file BLDT online theo vòng đời thông tư). Phát hiện **hệ biến $ND thứ 2** (MERGEFIELD, 15 biến) song song `[...]`. Chốt: **hỗ trợ cả hai** theo route (ONLINE_B8ZB/OFFLINE/KH_UPLOAD); classify cả 4 circular, **sinh chỉ TT79**; archive=false. Đính chính: **TT79 có thật, chỉ áp BLDT** (Bộ Tài chính). Tạo `TPB_VARIABLES.md`; cập nhật TEMPLATE_SELECTION (+§7 B8ZB), DATA_MODEL (+dim 10/11, +ND_VARIABLE_MAP), DIFY/DOCX/API/OVERVIEW/SEGMENTATION.

## Delta (2026-08-17 — nạp logic chọn mẫu thật)
Scan `Tham khao/`: parse `Logic hiển thị.xlsx` (7 sheet) + 96 template .docx. Chốt trọng tâm PoC = **segmentation khung/biến trên thư KH upload**; biến = placeholder `[...]` (bỏ $ND); scope = **Phát hành**. Sửa mô hình: 9 chiều, 6 loại BL, TT22/07/40. Tạo 2 doc mới (`TEMPLATE_SELECTION`, `VARIABLE_SEGMENTATION`); cập nhật OVERVIEW/DATA_MODEL/DIFY_WORKFLOW/DOCX_GENERATOR/API_CONTRACT/SYSTEM_ARCHITECTURE. Chưa có code.

## Delta (2026-08-17 — chốt phạm vi phiên 1)
Nạp brief, chốt phạm vi + kiến trúc (FE Bootstrap + GAS gateway + Dify Workflow + Sheet config + Drive storage). Viết đầy đủ bộ context thiết kế; rewrite OVERVIEW/DESIGN_SYSTEM; xác nhận hạ tầng có sẵn.
