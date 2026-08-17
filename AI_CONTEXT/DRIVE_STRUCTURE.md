# GOOGLE DRIVE STRUCTURE — Smart Guarantee

> Storage của PoC. GAS đọc/ghi theo thư mục chức năng. Đặt dưới 1 thư mục gốc dự án (share cho tài khoản chạy GAS).

```
Smart-Guarantee/            ← root (share cho GAS service account/owner)
├── INPUT/                  ← PDF khách hàng upload (nguồn)
│     └── <doc_id>.pdf
├── EXTRACTED/              ← JSON kết quả AI (raw_text + fields + confidence)
│     └── <doc_id>.json
├── TEMPLATE/               ← Word template (.docx) chứa placeholder [...] (nguồn: Tham khao/, 96 file)
│     └── <template_file>.docx   (khớp TEMPLATE_REGISTRY.template_file)
├── OUTPUT/                 ← DOCX đã sinh để download
│     └── <doc_id>.docx
├── CONFIG/                 ← (tuỳ chọn) bản sao/export config, tài liệu mapping
└── LOGS/                   ← log xử lý (không chứa dữ liệu KH nhạy cảm ra ngoài)
      └── <YYYY-MM-DD>.log
```

## Quy ước
- **`doc_id`**: `SG-<YYYYMMDD>-<seq>` (ví dụ `SG-20260817-001`) — dùng xuyên suốt INPUT/EXTRACTED/OUTPUT để truy vết.
- **`template_file`**: tên file trong `/TEMPLATE`, tham chiếu từ Sheet `TEMPLATE_REGISTRY`.
- Google Sheet cấu hình (6 sheet) là file riêng, **không** để trong cây thư mục này (nó là DB/config, không phải storage). Trỏ bằng Spreadsheet ID trong GAS Script Properties.

## Vòng đời file (1 request)
```
upload  → /INPUT/<doc_id>.pdf
process → /EXTRACTED/<doc_id>.json
generate→ /OUTPUT/<doc_id>.docx  (template lấy từ /TEMPLATE)
```

## Ranh giới dữ liệu (RULE-data-boundary)
- INPUT/EXTRACTED/OUTPUT chứa nội dung KH → giữ trong Drive dự án, quyền truy cập tối thiểu.
- **Không** copy nội dung KH ra artifact công khai hay dịch vụ ngoài phạm vi PoC.
- LOGS chỉ ghi metadata/trace (doc_id, timing, error_code) — không dán nội dung thư.
