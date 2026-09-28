# GAS Gateway v2 — Smart Guarantee

Google Apps Script Web App là **gateway + bộ máy sinh thư**. Hợp đồng API: `../AI_CONTEXT/API_CONTRACT.md`. Bộ máy sinh thư: `../AI_CONTEXT/DOCX_GENERATOR.md`.

## File
| File | Vai trò |
|---|---|
| `Code.gs` | Router `doPost ?action=`; xác thực token; ghi AUDIT; lỗi chuẩn `{ok:false,error_code,message}` |
| `Auth.gs` | Đăng nhập tài khoản ứng dụng (sheet USERS, SHA-256 + salt), phiên 6h, khoá 15' sau 5 lần sai; `adminSetUser` |
| `Store.gs` | Drive (INPUT/EXTRACTED/OUTPUT/TEMPLATE/CONFIG), `doc_id` có khoá, JOBS/AUDIT, kiểm chủ hồ sơ, lịch sử |
| `Upload.gs` | `upload` — kiểm đuôi + chữ ký tệp (PDF/DOCX), ≤ 20 MB |
| `Text.gs` + `Convert.gs` | Đọc thư: Drive convert + OCR (PDF text, PDF scan, Word) — **điểm swap** OCR |
| `Prompt.gs` | Prompt bóc tách **có version** (nguồn chuẩn — Dify không giữ prompt) |
| `Extract.gs` | Gọi Dify (1 node LLM), thử lại 1 lần, parse JSON chịu lỗi, ép enum |
| `Process.gs` | `process`/`load` — đọc → AI → chuẩn hoá + kiểm tra chéo → xếp hạng mẫu → lưu EXTRACTED |
| `Catalog.gs` | Danh mục mẫu `CONFIG/catalog.json` (cache meta 10') |
| `Generate.gs` | `generate` — điền token trong XML docx (không qua Google Docs) → OUTPUT + trả base64 |
| `Core.gs` | Lõi thuần dùng chung FE (đọc số, chuẩn hoá, render slot, xếp hạng, fillXml) — test bằng Node |
| `Normalize.gs` | Chuẩn hoá mẫu gốc → mẫu có slot (thuần, dùng chung `tools/normalize.js`) |
| `Registry.gs` | Suy chiều nghiệp vụ từ tên file/thư mục, sinh mã mẫu (thuần) |
| `Templates.gs` | TEMPLATE_GOC ⇄ bảng MAU_THU, `rebuildTemplates`, `migrateTemplates`, trigger 2h, action `rebuild_templates` (admin) |
| `Setup.gs` | `setupAll` · `setupOpsSheet` · `checkSetup` |

## Triển khai (code đã đẩy bằng clasp — `cd gas && clasp push -f`)
1. Trên máy có `Tham khao/`: `node tools/normalize.js --strict` → upload **`build/sg_goc.zip`** vào Drive `Smart-Guarantee/CONFIG`.
2. Editor GAS ▸ `Setup.gs` ▸ **`setupAll`** ▸ Run ▸ cấp quyền. Hàm tự: đặt `DRIVE_ROOT_ID` + `OPS_SHEET_ID`, tạo Sheet OPS (MAU_THU · SLOT_REVIEW · USERS · BRANCHES · JOBS · AUDIT), tạo tài khoản **admin** (mật khẩu in ở log), chuyển thư viện mẫu sang `TEMPLATE_GOC` + bảng MAU_THU (thư mục TEMPLATE cũ đổi tên `_TEMPLATE_CU_<ngày>`, không xoá), chuẩn hoá 168 mẫu (quá 4,5' tự chia đợt), cài trigger 2h sáng, `checkSetup`.
3. Điền tab **BRANCHES**; tạo tài khoản cán bộ bằng `adminSetUser(...)`.
4. **Dify**: import `../dify/smart-guarantee.workflow.yml` → chọn model → Publish → key mới → Script Properties `DIFY_API_KEY`, xoá `DIFY_STUB`.
5. `checkSetup` toàn ✓ → `clasp deploy -i <deploymentId production>` (giữ URL FE).

Quản lý mẫu hằng ngày (BA, không cần code): [`../docs/QUAN_LY_MAU.md`](../docs/QUAN_LY_MAU.md).

## Script Properties
| Key | Bắt buộc | Ghi chú |
|---|---|---|
| `DIFY_BASE_URL` | ✓ | `https://api.dify.ai` (chấp nhận cả `/v1…`) |
| `DIFY_API_KEY` | ✓ | key app **v2** |
| `DRIVE_ROOT_ID` | ✓ | từ `setupDrive` |
| `OPS_SHEET_ID` | ✓ | từ `setupOpsSheet` (`CONFIG_SHEET_ID` cũ vẫn được đọc nếu chưa đặt) |
| `DIFY_STUB` | – | `true` = bỏ qua AI, dữ liệu mẫu (kiểm wiring) |
| `OCR_LANG` | – | mặc định `vi` |
| `SESSION_HOURS` | – | ≤ 6 (trần CacheService) |

## Thư viện mẫu
`Templates.gs`: `TEMPLATE_GOC` (BA sửa) → `rebuildTemplates` (nút admin ⟳ trên FE / trigger 2h / editor) → `TEMPLATE/<mã>.docx` + `CONFIG/catalog.json`. Luật nhận diện chỗ trống: `Normalize.gs::RULES` (cùng mã chạy trên máy qua `tools/normalize.js`). Mẫu có chỗ trống chưa nhận diện → ⚠ trong MAU_THU, giữ bản cũ.

## Kiểm thử không cần deploy
`bash tools/check.sh` = chuẩn hoá mẫu (strict) + test lõi + đồng bộ core FE + **backend GAS chạy trên giả lập Node** (`tools/gas-sim/e2e.js`, 55 ca — gồm vòng đời thư viện mẫu) + UI demo (Playwright).

## Ranh giới dữ liệu
Thư KH chỉ nằm trong Drive dự án (INPUT/EXTRACTED/OUTPUT) và được gửi tới Dify/LLM để bóc tách — **pilot đã được chấp nhận ở hạ tầng hiện tại**; chuyển on-prem chỉ thay `Extract.gs` (LLM) + `Text.gs` (OCR). AUDIT chỉ ghi metadata. Repo GitHub **công khai** → không commit `Test/`, `Tham khao/`, `build/`, `.clasp.json`, mật khẩu.
