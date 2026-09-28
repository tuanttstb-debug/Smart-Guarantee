# Smart Guarantee v2

**Công cụ nội bộ TPBank (pilot)** — cán bộ tác nghiệp bảo lãnh tải thư/mẫu bảo lãnh khách hàng cung cấp (PDF, kể cả bản scan, hoặc Word) → AI nhận diện loại thư và bóc tách dữ liệu → hệ thống chọn **mẫu thư viện TPBank** phù hợp (168 mẫu: TPB · TT22 · TT07 · EVN · Viettel · TT79) → cán bộ rà soát → xuất **thư .docx đúng chuẩn mẫu**, giữ nguyên định dạng.

## Kiến trúc
```
FE (HTML + Bootstrap, GitHub Pages)  — đăng nhập · 3 bước: Tải thư → Rà soát & chọn mẫu → Xem trước & xuất
   │  POST text/plain + token phiên
   ▼
GAS Web App (gateway + bộ máy sinh thư)
   ├── Drive   INPUT · EXTRACTED · OUTPUT · TEMPLATE (mẫu có slot) · CONFIG (catalog.json)
   ├── Sheet   USERS · BRANCHES · JOBS · AUDIT
   ├── OCR     Drive convert (PDF text/scan, Word)
   └── Dify    1 node LLM — prompt có version ở gas/Prompt.gs
```
Chi tiết: [`AI_CONTEXT/API_CONTRACT.md`](AI_CONTEXT/API_CONTRACT.md) · [`AI_CONTEXT/DOCX_GENERATOR.md`](AI_CONTEXT/DOCX_GENERATOR.md) · [`AI_CONTEXT/DIFY_WORKFLOW.md`](AI_CONTEXT/DIFY_WORKFLOW.md).

## Cấu trúc repo
| Đường dẫn | Nội dung |
|---|---|
| `index.html`, `assets/` | FE. `assets/js/core.js` **sinh tự động** từ `gas/Core.gs` |
| `gas/` | Backend GAS — [runbook triển khai](gas/README.md) |
| `dify/smart-guarantee.workflow.yml` | Workflow Dify v2 (import) |
| `config/TEMPLATE_REGISTRY.csv` | Danh mục mẫu gốc (`node tools/build-registry.js`) |
| `tools/normalize.js` | Chạy bộ chuẩn hoá mẫu (cùng mã GAS) trên máy → kiểm strict + gói chuyển đổi `sg_goc.zip` |
| `docs/QUAN_LY_MAU.md` | Hướng dẫn BA quản lý thư viện mẫu trên Drive + bảng MAU_THU |
| `tools/check.sh` | Toàn bộ kiểm thử (mẫu strict · lõi · giả lập GAS e2e · UI) |
| `tools/render_local.py`, `tools/docx2png.ps1` | Sinh/chụp thư cục bộ để UAT định dạng |
| `docs/UAT.md` | Kế hoạch UAT pilot + KPI |

## Chạy thử giao diện
`python -m http.server 8765` → mở `http://localhost:8765/index.html?mock=1` (backend giả lập, mẫu DEMO). Bỏ `?mock=1` để gọi GAS thật.

## Ranh giới dữ liệu
Repo **công khai**: không commit thư KH (`Test/`), thư viện mẫu gốc (`Tham khao/`), sản phẩm build (`build/`), `.clasp.json`, mật khẩu. Thư KH chỉ nằm trong Drive dự án và được gửi LLM qua Dify (pilot trên hạ tầng hiện tại — đã chốt 2026-09-28).
