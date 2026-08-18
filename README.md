# Smart Guarantee

**PoC/Demo cho TPBank** — dùng AI tự động hoá xử lý & sinh **thư bảo lãnh**. Nhận thư khách hàng (PDF/Word) → bóc tách **khung mẫu cố định vs biến cần điền** → chuẩn hoá → soạn lại **thư sát bản gốc** với biến đã nhận diện/điền.

> Trọng tâm không chỉ là "chọn 1 template rồi điền", mà là **segmentation khung/biến trên chính thư KH upload**. Chi tiết nghiệp vụ: [`AI_CONTEXT/`](AI_CONTEXT/).

## Kiến trúc

```
Frontend (HTML+Bootstrap, 5 tab)
   │  fetch text/plain
   ▼
GAS Web App  ── gateway (giữ Dify key) : upload · process · generate · config
   ├── Google Drive   /INPUT /EXTRACTED /OUTPUT /TEMPLATE /CONFIG /LOGS
   ├── Google Sheet   8 tab config (registry, aliases, placeholder/ND map, rules, prompts)
   └── Dify Workflow  classify → segment → extract → normalize → map → validate → confidence
```

5 tab: **Upload → Phân loại (9 chiều) → Dữ liệu (edit + highlight confidence) → Biến&Khung (segmentation) → Xuất (DOCX)**.

## Cấu trúc repo

| Thư mục | Nội dung |
|---|---|
| `index.html`, `assets/` | Frontend — 5-tab, gọi GAS (`assets/js/config.js` = URL + `USE_MOCK`) |
| `gas/` | GAS gateway (`Code/Upload/Process/Generate/Dify/SheetConfig/Drive/Text/Config/Setup.gs`) + `README.md` (deploy) |
| `config/` | 8 CSV config + generator output + `README.md` (import Sheet + dựng Drive) |
| `tools/build-registry.js` | Sinh `config/TEMPLATE_REGISTRY.csv` từ corpus `Tham khao/` |
| `dify/WORKFLOW_SPEC.md` | Spec dựng Dify Workflow (node + prompt + JSON schema) |
| `AI_CONTEXT/` | Context thiết kế + bàn giao phiên (nguồn sự thật) |
| `Tham khao/` | Corpus template thật (offline 96 + B8ZB) — **ngoài git** (binary) |

## Trạng thái (2026-08-18)

| Thành phần | Trạng thái |
|---|---|
| FE 5-tab | ✅ Xong, chạy E2E trên browser |
| GAS gateway (upload/process/generate/config) | ✅ Deploy live |
| DOCX generator (3 route, giữ format) | ✅ Xong (`Generate.gs`) |
| Google Sheet config (8 tab) | ✅ Tạo + import CSV |
| Google Drive + template | ✅ Dựng cây + upload template |
| **Dify Workflow** (classify→…→confidence) | ⏳ **Chưa dựng** — theo `dify/WORKFLOW_SPEC.md`; đang chạy `DIFY_STUB` |
| Bộ test / UAT | ⏳ [`docs/UAT.md`](docs/UAT.md) |

**Mắt xích còn lại để thành demo thật:** dựng Dify Workflow → đặt `DIFY_BASE_URL`/`DIFY_API_KEY` → xoá `DIFY_STUB`.

## Chạy Frontend
Mở `index.html` bằng trình duyệt. Chế độ:
- `assets/js/config.js` `USE_MOCK:true` → dùng dữ liệu giả lập (`mock.js`), không cần backend.
- `USE_MOCK:false` + `GAS_WEB_APP_URL` = URL Web App → gọi GAS thật (cần `DIFY_STUB=true` khi Dify chưa dựng).

## Thiết lập backend
1. GAS: xem [`gas/README.md`](gas/README.md) (deploy Web App, Script Properties).
2. Sheet + Drive: xem [`config/README.md`](config/README.md) (`setupConfigSheet`/`setupDrive`, import CSV, upload template).
3. Dify: xem [`dify/WORKFLOW_SPEC.md`](dify/WORKFLOW_SPEC.md).

## Ranh giới dữ liệu
Nội dung KH (thư bảo lãnh thật) chỉ xử lý trong Google Workspace của dự án (`/INPUT /EXTRACTED /OUTPUT`). **Không** đưa dữ liệu KH ra artifact công khai / dịch vụ ngoài phạm vi PoC. `LOGS` chỉ ghi metadata. Corpus `Tham khao/` không nằm trong git.
