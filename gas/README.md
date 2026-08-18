# GAS Gateway — Smart Guarantee

Google Apps Script Web App làm **gateway** (không xử lý AI): nhận upload → lưu Drive → gọi Dify → trả FE → sinh DOCX. Hợp đồng API: `../AI_CONTEXT/API_CONTRACT.md`. Kiến trúc: `../AI_CONTEXT/SYSTEM_ARCHITECTURE.md`.

## File
| File | Vai trò |
|---|---|
| `appsscript.json` | Manifest: bật Advanced Drive Service (v2), scope, cấu hình Web App |
| `Code.gs` | `doGet`/`doPost` router theo `?action=`; parse body; JSON response + error chuẩn |
| `Config.gs` | Đọc Script Properties (secret không hard-code) |
| `Drive.gs` | Cây thư mục, `doc_id`, đọc/ghi file, log |
| `Upload.gs` | `action=upload` → `/INPUT/<doc_id>.<ext>` |
| `Text.gs` | Bóc text PDF/Word (Drive OCR) → `{raw_text, paragraphs}` — **điểm swap Extraction** |
| `Dify.gs` | Gọi Dify Workflow API (blocking), giữ key |
| `Process.gs` | `action=process` (+ `action=config`, `DIFY_STUB`) |
| `Generate.gs` | `action=generate` — **PoC placeholder**, DOCX đầy đủ = Phase 3 (`DOCX_GENERATOR.md`) |

## Cài đặt (lần đầu)
1. **Tạo project GAS**: [script.google.com](https://script.google.com) → New project. Dán 8 file `.gs` + đặt nội dung `appsscript.json` (bật "Show appsscript.json" trong Project Settings). *(Hoặc dùng `clasp push` nếu đã cài clasp.)*
2. **Script Properties** (Project Settings ▸ Script Properties):
   | Key | Bắt buộc | Giá trị |
   |---|---|---|
   | `DIFY_BASE_URL` | khi dùng Dify | vd `https://api.dify.ai` (không `/` cuối) |
   | `DIFY_API_KEY` | khi dùng Dify | Bearer key của Workflow app (`app-...`) |
   | `DIFY_STUB` | không | `true` để test GAS↔FE **không cần Dify** (trả dữ liệu mẫu) |
   | `DRIVE_ROOT_ID` | không | folder id gốc `Smart-Guarantee`; bỏ trống → tự tạo theo tên |
   | `CONFIG_SHEET_ID` | không | Spreadsheet ID 6 sheet config |
   | `OCR_LANG` | không | mặc định `vi` |
3. **Deploy** ▸ New deployment ▸ type **Web app** ▸ Execute as **Me** ▸ Who has access **Anyone** → copy **Web app URL**.
4. **Nối FE**: mở `../assets/js/config.js`, dán URL vào `GAS_WEB_APP_URL`, đặt `USE_MOCK: false`.
5. **Cấp quyền**: lần chạy đầu GAS xin quyền Drive/Docs/External request → Allow.

## Kiểm thử nhanh
- `GET  <URL>?action=ping` → `{ ok:true, service:"smart-guarantee-gas" }`.
- Bật `DIFY_STUB=true` → chạy FE (mock off): upload PDF bất kỳ → `process` trả dữ liệu mẫu → xem 5 tab + Generate ra `.docx` thật trong `/OUTPUT`.
- Tắt stub + cấu hình Dify → chạy pipeline thật.

## Extraction — điểm swap
`Text.gs::extractText_` bóc text tại GAS (Drive OCR) rồi gửi `raw_text` cho Dify — khớp `API_CONTRACT` (`inputs.raw_text`). Nếu muốn để **Dify** bóc text (node pdfplumber/PyPDF, `DIFY_WORKFLOW.md` Step 1): đổi `Text.gs` sang upload file lên `/v1/files/upload` và truyền `upload_file_id` trong `Dify.gs`. Chỉ sửa 2 hàm này, phần còn lại không đổi.

## Ranh giới dữ liệu
Nội dung KH chỉ ở Drive dự án (`INPUT/EXTRACTED/OUTPUT`). `LOGS` chỉ ghi metadata (doc_id, timing, error) — **không** dán nội dung thư. Không đưa dữ liệu KH ra ngoài phạm vi PoC (RULE-data-boundary).

## Giới hạn đã biết (PoC)
- Web App phải deploy access **Anyone** để FE gọi cross-origin; FE POST bằng `text/plain` để tránh CORS preflight.
- `process` chạy đồng bộ (blocking) — thư dài + Dify chậm có thể chạm giới hạn ~6 phút/execution của GAS.
- `Generate.gs` là bản tối giản (dựng lại từ `segments`); chưa điền vào TEMPLATE .docx thật.
