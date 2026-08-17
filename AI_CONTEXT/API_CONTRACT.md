# API CONTRACT — Smart Guarantee

> Ba chặng: **FE ↔ GAS (gateway) ↔ Dify**. GAS giữ Dify API key (FE không gọi Dify trực tiếp). Bản nháp PoC — điều chỉnh khi dựng thực tế.

```
Frontend ──(1)──► GAS Web App ──(2)──► Dify Workflow API
         ◄──────           ◄──────
                  (3) GAS ↔ Drive/Sheet nội bộ
```

## 1. FE ↔ GAS (Google Apps Script Web App)

### POST `?action=upload` — upload PDF
- Request: `multipart` file **hoặc** `{ "filename", "content_base64" }`.
- Response:
```json
{ "ok": true, "doc_id": "SG-20260817-001", "input_path": "/INPUT/SG-20260817-001.pdf" }
```

### POST `?action=process` — chạy AI pipeline
- Request: `{ "doc_id": "SG-20260817-001" }`
- Response (GAS proxy kết quả Dify):
```json
{
  "ok": true,
  "doc_id": "SG-20260817-001",
  "classification": { "currency": "VND", "guarantee_type": "BLTH", "method": "ĐT", "language": "TV", "template_type": "T22", "sector": "HH", "validity_type": "1", "joint_venture": "KO", "contract_status": "ĐK" },
  "route": "KH_UPLOAD",
  "segments": [ { "text": "Kính gửi:", "kind": "KHUNG" }, { "text": "Công ty ABC", "kind": "BIEN", "field": "BENEFICIARY_NAME", "confidence": 95 } ],
  "variables": { "[ghi tên Chủ đầu tư]": { "value": "Công ty ABC", "confidence": 95 } },
  "validation": { "missing": [], "warnings": ["amount_text lệch guarantee_amount"] }
}
```

### POST `?action=generate` — sinh DOCX
- Request (biến đã user review/edit):
```json
{ "doc_id": "SG-20260817-001",
  "route": "KH_UPLOAD",
  "classification": { "guarantee_type": "BLTH", "template_type": "T22", "sector": "HH", "joint_venture": "KO" },
  "variables": { "[ghi tên Chủ đầu tư]": "Công ty ABC", "[ghi số tiền bảo lãnh]": "..." } }
```
> Route `ONLINE_B8ZB` → GAS chọn template B8ZB (TT79) trong `/TEMPLATE`, điền MERGEFIELD `«$ND»`. Route `OFFLINE` → chọn mẫu chuẩn offline theo REGISTRY, replace `[...]`. Route `KH_UPLOAD` → điền biến trên chính thư KH (giữ khung) theo `segments`. `variables` keyed bằng `$ND` (online) hoặc `[...]` (offline/KH).
- Response:
```json
{ "ok": true, "output_path": "/OUTPUT/SG-20260817-001.docx", "download_url": "https://drive.google.com/..." }
```

### GET `?action=config` — (tuỳ chọn) lấy metadata cho FE
Trả canonical fields / danh sách biến ND để render tab Variables.

## 2. GAS ↔ Dify

### POST `{DIFY_BASE_URL}/v1/workflows/run`
- Header: `Authorization: Bearer {DIFY_API_KEY}` (lưu trong GAS Script Properties, **không** ở FE).
- Body:
```json
{ "inputs": { "raw_text": "...", "config_ref": "sheet://CONFIG" }, "response_mode": "blocking", "user": "sg-poc" }
```
- Output: xem `DIFY_WORKFLOW.md` §Output tổng.

## 3. GAS nội bộ (Drive / Sheet)
- Drive: đọc/ghi `/INPUT /OUTPUT /TEMPLATE /EXTRACTED` (xem `DRIVE_STRUCTURE.md`).
- Sheet: đọc `DOCUMENT_TYPES · CANONICAL_FIELDS · FIELD_ALIASES · TPB_VARIABLE_MAPPING · TEMPLATE_REGISTRY · PROMPTS` (xem `DATA_MODEL.md`).

## Quy ước lỗi
```json
{ "ok": false, "error_code": "DIFY_TIMEOUT|LOW_CONFIDENCE|TEMPLATE_NOT_FOUND|PARSE_ERROR", "message": "..." }
```

## Bảo mật
- Dify API key: chỉ trong GAS. FE không nắm secret.
- Không log nội dung KH nhạy cảm ra ngoài `/LOGS` nội bộ (RULE-data-boundary).
