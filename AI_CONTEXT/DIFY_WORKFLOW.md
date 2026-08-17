# DIFY WORKFLOW — Smart Guarantee

> **Bắt buộc Workflow, KHÔNG chat agent đơn lẻ.** Mọi node LLM **ép JSON Schema** (Risk 3). Prompt từ Sheet `PROMPTS`. LLM ứng viên: Qwen · Gemini · GPT-4o · DeepSeek.
> Bài toán lõi = **segmentation khung/biến trên thư KH** (`VARIABLE_SEGMENTATION.md`), không chỉ classify+fill. Logic 9 chiều: `TEMPLATE_SELECTION.md`. Biến = placeholder `[...]`, không phải $ND.

## Chuỗi step

### Step 1 — Upload / Extract Text
`pdfplumber`/`PyPDF` (PDF text là chủ yếu, không OCR nặng). Giữ cấu trúc đoạn để phục vụ segmentation.
```json
{ "raw_text": "...", "paragraphs": ["...", "..."] }
```

### Step 2 — Classification (9–11 chiều)  *(prompt: CLASSIFY)*
```json
{
  "currency": "VND", "guarantee_type": "BLDT", "method": "ĐT",
  "language": "TV", "template_type": "T22", "sector": "HH",
  "validity_type": "1", "joint_venture": "KO", "contract_status": "N/A",
  "circular": "TT79", "envelope": "1 túi"
}
```
→ Suy **route** (`ONLINE_B8ZB` / `OFFLINE` / `KH_UPLOAD`) + họ mẫu gần nhất (quy tắc `TEMPLATE_SELECTION.md` §2, §7). `circular`/`envelope` chỉ áp cho **BLDT** (classify cả 4 thế hệ; sinh chỉ TT79).

### Step 3 — Segmentation (KHUNG vs BIẾN)  *(prompt: SEGMENT — lõi)*
Đối chiếu **corpus 96 template** để gán mỗi span:
```json
{
  "segments": [
    { "text": "Kính gửi:", "kind": "KHUNG" },
    { "text": "Công ty ABC", "kind": "BIEN", "field_guess": "BENEFICIARY_NAME" }
  ]
}
```

### Step 4 — Field Extraction  *(prompt: EXTRACT, điều kiện theo FIELD_REQUIREMENTS)*
Chỉ trích field áp dụng cho `guarantee_type` (ma trận `DATA_MODEL.md` §D).
```json
{ "beneficiary_name": "", "contractor_name": "", "guarantee_amount": "", "amount_text": "", "validity": "", "contract_ref": "" }
```

### Step 5 — Normalization  *(alias → canonical, Sheet FIELD_ALIASES)*
`"Bên nhận bảo lãnh"` ⇒ `BENEFICIARY_NAME`.

### Step 6 — Variable Mapping  *(theo route)*
- **ONLINE_B8ZB** → canonical → `$ND` (Sheet ND_VARIABLE_MAP, `TPB_VARIABLES.md`):
```json
{ "$ND001": "Công ty ABC", "$ND005": "1.000.000.000", "$ND008": "..." }
```
- **OFFLINE / KH_UPLOAD** → canonical → cụm `[...]` (Sheet PLACEHOLDER_MAP):
```json
{ "[ghi tên Chủ đầu tư]": "Công ty ABC", "[ghi số tiền bảo lãnh]": "1.000.000.000" }
```

### Step 7 — Validation  *(prompt: VALIDATE)*
Field thiếu (theo FIELD_REQUIREMENTS) · bất thường · ngày tháng · số tiền vs số-bằng-chữ.

### Step 8 — Confidence Score
```json
{ "field": "beneficiary_name", "value": "ABC", "confidence": 95 }
```
Thấp ⇒ FE **highlight** để user review.

### Step 9 — Reproduce / Generate  *(tại GAS, không phải Dify)*
Giữ **khung của thư KH**, điền BIẾN vào placeholder → xuất DOCX. Xem `DOCX_GENERATOR.md`.

## Output tổng (GAS nhận)
```json
{
  "classification": { "currency": "", "guarantee_type": "", "method": "", "language": "", "template_type": "", "sector": "", "validity_type": "", "joint_venture": "", "contract_status": "" },
  "route": "ONLINE_B8ZB | OFFLINE | KH_UPLOAD",
  "segments": [ { "text": "", "kind": "KHUNG|BIEN", "field": "", "confidence": 0 } ],
  "variables": { "$ND001 | [ghi tên Chủ đầu tư]": { "value": "", "confidence": 0 } },
  "validation": { "missing": [], "warnings": [] }
}
```

## Nguyên tắc
- Prompt configurable qua Sheet `PROMPTS`. Mỗi node LLM có output JSON Schema.
- Không lưu trạng thái phiên trong Dify — GAS quản lý phiên/Drive.
- Segmentation dùng corpus làm ground truth; thư lạ → fuzzy/semantic match.
