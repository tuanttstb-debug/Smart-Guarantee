# Config — Google Sheet + Drive (Phase 0 #3–4)

8 sheet cấu hình cho pipeline (DATA_MODEL.md §C). **Configuration-driven**: sửa dữ liệu ở đây (không deploy code) là đổi hành vi classify/segment/extract/generate.

## File CSV
| CSV | Sheet | Nội dung | Nguồn |
|---|---|---|---|
| `TEMPLATE_REGISTRY.csv` | TEMPLATE_REGISTRY | **285 mẫu** (96 offline + 189 B8ZB) — chiều + đường dẫn file + `active` | **Tự sinh** từ `Tham khao/` bằng `tools/build-registry.js` |
| `CANONICAL_FIELDS.csv` | CANONICAL_FIELDS | 25 field chuẩn + kiểu dữ liệu | Doc |
| `FIELD_ALIASES.csv` | FIELD_ALIASES | Bí danh → canonical (normalize, Risk 1) | Doc |
| `PLACEHOLDER_MAP.csv` | PLACEHOLDER_MAP | canonical ↔ `[...]` (offline/KH) | VARIABLE_SEGMENTATION §4 |
| `ND_VARIABLE_MAP.csv` | ND_VARIABLE_MAP | canonical ↔ `$ND` (online B8ZB) | TPB_VARIABLES.md |
| `SELECTION_RULES.csv` | SELECTION_RULES | Bảng định tuyến OFFLINE/ONLINE_B8ZB/KH_UPLOAD | TEMPLATE_SELECTION §2 |
| `FIELD_REQUIREMENTS.csv` | FIELD_REQUIREMENTS | Field bắt buộc theo loại BL | DATA_MODEL §D |
| `PROMPTS.csv` | PROMPTS | Prompt seed cho các node Dify | DIFY_WORKFLOW |

> `TEMPLATE_REGISTRY` là bản **tự sinh** — đừng sửa tay. Chạy lại khi corpus đổi:
> ```
> node tools/build-registry.js
> ```
> Quy tắc: chỉ **TT79 active=true**; TT06-07/TT22/TT40 giữ `active=false` (để classify, không sinh); Archive/old-thô loại khỏi registry. Ghi chú cột: `joint_venture=LD` = liên danh (gồm DD/DDN/ĐL); `template_type=B8ZB` = BLDT online; 8 file B8ZB không nằm trong thư mục TTxx có `circular` rỗng → `active=false`.

## Dựng Google Sheet (#3)
1. Trong GAS editor mở `gas/Setup.gs` ▸ chạy **`setupConfigSheet`** → tạo Spreadsheet "Smart-Guarantee CONFIG" (8 tab + header). Copy **Spreadsheet id** (xem Executions ▸ Logs) → dán vào Script Property **`CONFIG_SHEET_ID`**.
2. Nạp dữ liệu từng tab: mở Sheet ▸ chọn tab ▸ **File ▸ Import ▸ Upload** `config/<TÊN>.csv` ▸ **Replace current sheet** ▸ Import. (Hoặc mở CSV rồi copy–paste vào ô A1.) Làm cho cả 8 tab.

## Dựng Drive (#4)
1. GAS editor ▸ chạy **`setupDrive`** → tạo cây `Smart-Guarantee/{INPUT,EXTRACTED,OUTPUT,TEMPLATE,CONFIG,LOGS}`. Copy **ROOT id** từ Logs → dán vào Script Property **`DRIVE_ROOT_ID`**.
2. **Upload template** `.docx` vào folder `TEMPLATE`: tối thiểu nạp bản **active** (96 offline + 72 TT79). Tên file phải khớp cột `template_file` của REGISTRY để `generate` tìm được. *(Kéo–thả từ `Tham khao/` — dữ liệu binary không nằm trong git.)*

## Sau khi xong
- Dify Workflow đọc config qua `config_ref` (GAS truyền `sheet://<CONFIG_SHEET_ID>`); prompt lấy từ tab `PROMPTS`.
- Đổi template/alias/placeholder/prompt = sửa Sheet, **không deploy lại code** (Risk 2).
