# SYSTEM ARCHITECTURE — Smart Guarantee

> PoC/Demo TPBank. Nguyên tắc: nhanh · rẻ · không over-engineering · đủ khả năng mở rộng. Chi tiết lớp dữ liệu/AI/API: `DATA_MODEL.md`, `DIFY_WORKFLOW.md`, `API_CONTRACT.md`, `DRIVE_STRUCTURE.md`, `DOCX_GENERATOR.md`.

## 1. Sơ đồ tổng thể

```
┌───────────────────────────┐
│  FRONTEND (HTML+Bootstrap)│  5 tab: Upload → Classify → Data → Vars → Generate
│  - upload PDF             │  - review/edit, highlight confidence thấp
└─────────────┬─────────────┘
              │ HTTPS (JSON / multipart)
              ▼
┌───────────────────────────┐
│  GATEWAY (Google Apps      │  KHÔNG xử lý AI. Chỉ điều phối:
│  Script — Web App)        │   • nhận upload → lưu /INPUT (Drive)
│                           │   • đọc CONFIG (Google Sheet)
│                           │   • gọi Dify Workflow API
│                           │   • nhận kết quả → trả FE
│                           │   • Generate DOCX từ TEMPLATE
└───┬───────────┬───────────┬─┘
    │           │           │
    ▼           ▼           ▼
┌────────┐ ┌──────────┐ ┌───────────────┐
│ Google │ │  Google  │ │  Dify         │
│ Drive  │ │  Sheet   │ │  Workflow     │
│ storage│ │ (config/ │ │  (AI layer)   │
│        │ │  metadata│ │ 9 step:       │
│/INPUT  │ │  /KB)    │ │ extract→class │
│/OUTPUT │ │ 6 sheet  │ │ →extract→norm │
│/TEMPLATE│ │          │ │ →map→validate │
│/EXTRACTED│ │         │ │ →confidence   │
│/CONFIG │ │          │ │ (LLM: Qwen/   │
│/LOGS   │ │          │ │  Gemini/…)    │
└────────┘ └──────────┘ └───────────────┘
```

## 2. Trách nhiệm từng lớp

| Lớp | Làm | KHÔNG làm |
|---|---|---|
| **FE** | Upload, hiển thị 4 tầng phân loại, edit field, xem biến ND, trigger generate/download, highlight confidence thấp | Gọi Dify trực tiếp; giữ secret; xử lý AI |
| **GAS Gateway** | Điều phối luồng, lưu/đọc Drive, đọc config Sheet, gọi Dify (giữ API key), replace biến → DOCX | Chạy model/AI; hard-code business logic (đọc từ Sheet) |
| **Dify Workflow** | Document Understanding: classify(9 chiều) → **segment(khung/biến)** → extract → normalize → map(placeholder) → validate → confidence; ép **JSON Schema** | Lưu trạng thái phiên; generate DOCX |
| **Google Sheet** | Metadata Repository / Configuration / Knowledge Base (6 sheet) | Không dùng như DB giao dịch |
| **Google Drive** | Lưu file theo thư mục chức năng | — |

## 3. Luồng end-to-end (happy path)

```
1. FE upload thư KH (PDF/Word) ──► GAS lưu /INPUT/<id>
2. GAS đọc CONFIG (prompts, canonical fields, aliases, placeholder_map, registry, rules) từ Sheet
3. GAS gọi Dify Workflow (input: raw_text/paragraphs)
4. Dify: extract text → classify (9 chiều) → **segment (khung/biến, đối chiếu corpus)**
       → extract fields → normalize (alias→canonical) → map (→ placeholder [...])
       → validate → confidence  ──► JSON (route: STANDARD_TEMPLATE | KH_UPLOAD)
5. GAS nhận JSON → lưu /EXTRACTED/<id>.json → trả FE
6. FE hiển thị (tab 2/3/4), user review/edit; span/biến confidence thấp = highlight
7. FE gửi biến (đã duyệt) → GAS: route A chọn template REGISTRY · route B dùng chính thư KH
8. GAS điền biến vào placeholder (giữ khung) → xuất DOCX → /OUTPUT/<id>.docx
9. FE download DOCX (thư sát thư KH)
```

## 4. Nguyên tắc kiến trúc chốt
- **Không tập trung OCR** — PDF text là chủ yếu, OCR không phải nút thắt.
- **Configuration-driven** — thêm template/field/alias/prompt = sửa Google Sheet, **không deploy code**.
- **Ép JSON Schema** ở mọi node LLM để chống format bất ổn (Risk 3).
- **Tách rule khỏi template** — validity logic là Rule, không phải template (Dimension 6).
- **GAS chỉ là gateway** — mọi tri thức nghiệp vụ nằm ở Sheet + Dify prompts.

## 5. Ranh giới dữ liệu (RULE-data-boundary)
Dữ liệu khách hàng / thư bảo lãnh thật: xử lý trong Google Workspace của dự án. **KHÔNG đưa nội dung KH nhạy cảm lên cloud/artifact công khai** hoặc chia sẻ ra ngoài phạm vi PoC.
