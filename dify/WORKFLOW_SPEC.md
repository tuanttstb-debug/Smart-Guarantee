# Dify Workflow — Build Spec (Smart Guarantee)

> ⚡ **Import nhanh:** dùng [`smart-guarantee.workflow.yml`](smart-guarantee.workflow.yml) — Dify Studio ▸ *Import DSL* ▸ upload. Sau import: đổi **model** mỗi node LLM sang provider đã cấu hình (đang để `openai/gpt-4o` placeholder); Publish → lấy API key.
>
> ⚠️ **Bản DSL hiện tại là LLM-only (6 node): start→classify→segment→extract→validate→end.** Đã **bỏ 2 code node** (Route, Assemble) vì Dify Cloud giới hạn sandbox code (lỗi 429). Việc suy **route** (deterministic) + parse JSON + gộp output nay do **GAS** làm (`Dify.gs::normalizeDify_` + `routeFromClassification_`). Extract tự suy hệ biến ($ND vs `[...]`) từ classification trong prompt. Các mục §Code Route / §LLM3 / §Code Assemble bên dưới là **spec tham chiếu / fallback** — logic route/assemble đã chuyển sang GAS.
>
> Bản dựng cụ thể cho **Dify Workflow** (không phải chat agent). Thiết kế khái niệm: `../AI_CONTEXT/DIFY_WORKFLOW.md`. Mọi node LLM **bật Structured Output / JSON**. GAS gọi `/v1/workflows/run` blocking và nhận 5 khoá output (`Dify.gs`).
>
> **Nguồn config:** GAS đọc Google Sheet và truyền vào workflow qua input `config_json` (Dify KHÔNG tự đọc Sheet). LLM tham chiếu `config_json` để normalize/map.

## 0. Inputs (Start node)
| Biến | Kiểu | Nguồn |
|---|---|---|
| `raw_text` | paragraph (string) | GAS `Text.gs` (bóc từ PDF) |
| `paragraphs_json` | string (JSON array) | GAS — các đoạn giữ cấu trúc |
| `config_json` | string (JSON) | GAS `SheetConfig.gs` — `{canonical_fields, field_aliases, placeholder_map, nd_variable_map, field_requirements, selection_rules, prompts}` |

## Sơ đồ node
```
Start → [LLM1 Classify] → [Code Route] → [LLM2 Segment]
      → [LLM3 Extract+Map] → [LLM4 Validate] → [Code Assemble] → End
```
4 LLM + 2 Code. Gộp Extract+Normalize+Map vào 1 node cho gọn/rẻ (PoC).

---

## LLM1 — Classify  (9–11 chiều)
**Model:** rẻ, ổn định JSON (Qwen/Gemini/GPT-4o). **Output:** JSON.
**System:**
```
Bạn là chuyên gia nghiệp vụ bảo lãnh ngân hàng TPBank. Phân loại thư bảo lãnh theo các chiều.
Chỉ trả JSON đúng schema, không giải thích. Mã hợp lệ:
guarantee_type ∈ [BLDT,BLBH,BLTH,BLTU,BLTT,BLKH]
method ∈ [TG,ĐT,SW]; language ∈ [TV,TA,SN,KH]
template_type ∈ [TPB,T22,T07,T40,EVN,VIT,MK]; currency ∈ [VND,NGT]
Nếu guarantee_type=BLDT thêm circular ∈ [TT06-07,TT22,TT40,TT79] và envelope.
Trường không xác định: để "".
```
**User:** `Nội dung thư:\n{{#start.raw_text#}}`
**JSON schema (output var `classification`):**
```json
{ "type":"object","properties":{
  "currency":{"type":"string"},"guarantee_type":{"type":"string"},"method":{"type":"string"},
  "language":{"type":"string"},"template_type":{"type":"string"},"sector":{"type":"string"},
  "validity_type":{"type":"string"},"joint_venture":{"type":"string"},"contract_status":{"type":"string"},
  "circular":{"type":"string"},"envelope":{"type":"string"} } }
```

## Code Route — suy route từ classification + selection_rules
**Ngôn ngữ:** Python. **Input:** `classification` (LLM1), `config_json` (start).
```python
def main(classification: str, config_json: str) -> dict:
    import json
    c = json.loads(classification); cfg = json.loads(config_json)
    cur = c.get("currency",""); mth = c.get("method",""); lang = c.get("language","")
    tt  = c.get("template_type",""); gt = c.get("guarantee_type","")
    route = "KH_UPLOAD"
    if cur == "VND" and lang == "TV":
        if gt == "BLDT":
            route = "ONLINE_B8ZB"
        elif mth in ("TG","ĐT") and tt in ("TPB","T22","T07","T40","EVN","VIT"):
            route = "OFFLINE"
    return {"route": route}
```
> Có thể thay bằng vòng lặp trên `cfg["selection_rules"]` (ưu tiên tăng dần) — logic trên đã khớp R1–R6/R99.

## LLM2 — Segment (KHUNG vs BIẾN) — *node lõi*
**System:**
```
Phân đoạn thư bảo lãnh thành KHUNG (văn bản mẫu cố định) và BIEN (chỗ cần điền: tên, số tiền,
ngày, địa chỉ, tên gói thầu, số hợp đồng...). Giữ NGUYÊN VĂN và ĐẦY ĐỦ, đúng thứ tự.
Mỗi BIEN đoán field_guess theo canonical_fields trong config. Trả JSON, không giải thích.
```
**User:** `config: {{#start.config_json#}}\n---\nthư:\n{{#start.raw_text#}}`
**JSON schema (output `segments`):**
```json
{ "type":"object","properties":{ "segments":{"type":"array","items":{
  "type":"object","properties":{
    "text":{"type":"string"},"kind":{"type":"string","enum":["KHUNG","BIEN"]},
    "field_guess":{"type":"string"},"confidence":{"type":"number"} } } } } }
```

## LLM3 — Extract + Normalize + Map
**System:**
```
Từ thư và danh sách BIEN, trích giá trị từng field áp dụng cho loại bảo lãnh (dùng field_requirements
trong config theo guarantee_type). Chuẩn hoá tên field về canonical bằng field_aliases; chuẩn hoá số
tiền và ngày (dd/mm/yyyy). Sau đó map sang biến render theo route:
- route=ONLINE_B8ZB: key = $ND theo nd_variable_map.
- route=OFFLINE hoặc KH_UPLOAD: key = cụm [...] theo placeholder_map (chọn placeholder đại diện).
Mỗi biến kèm confidence 0-100. Chỉ trả JSON.
```
**User:**
```
route: {{#code_route.route#}}
classification: {{#llm1.classification#}}
config: {{#start.config_json#}}
segments: {{#llm2.segments#}}
thư: {{#start.raw_text#}}
```
**JSON schema (output `variables`):**
```json
{ "type":"object","properties":{ "variables":{"type":"object",
  "additionalProperties":{"type":"object","properties":{
    "value":{"type":"string"},"confidence":{"type":"number"} } } } } }
```

## LLM4 — Validate
**System:**
```
Kiểm tra: field bắt buộc còn thiếu (field_requirements theo guarantee_type), số tiền bằng số vs bằng chữ,
ngày hợp lệ, hiệu lực hợp lý. Trả JSON {missing:[field_code], warnings:[mô tả ngắn]}.
```
**User:** `config: {{#start.config_json#}}\nclassification: {{#llm1.classification#}}\nvariables: {{#llm3.variables#}}`
**JSON schema (output `validation`):**
```json
{ "type":"object","properties":{
  "missing":{"type":"array","items":{"type":"string"}},
  "warnings":{"type":"array","items":{"type":"string"}} } }
```

## Code Assemble — gộp output cuối
**Input:** classification(LLM1), route(Code Route), segments(LLM2), variables(LLM3), validation(LLM4).
```python
def main(classification: str, route: str, segments: str, variables: str, validation: str) -> dict:
    import json
    seg = json.loads(segments).get("segments", [])
    # đưa field_guess -> field cho khớp API_CONTRACT
    for s in seg:
        if s.get("kind") == "BIEN" and "field_guess" in s:
            s["field"] = s.pop("field_guess")
    return {
        "classification": json.loads(classification),
        "route": route,
        "segments": seg,
        "variables": json.loads(variables).get("variables", {}),
        "validation": json.loads(validation),
    }
```

## End node — Workflow outputs
Xuất 5 biến (từ Code Assemble): `classification, route, segments, variables, validation`.
> GAS `Dify.gs::normalizeDify_` nhận đúng shape này. (Nếu Dify gói trong 1 field JSON string tên `result`, GAS cũng tự parse.)

---

## Bật workflow (checklist)
1. Tạo **Workflow app** trong Dify (không phải Chatflow). Thêm 3 input `raw_text`, `paragraphs_json`, `config_json` ở Start.
2. Dựng 6 node theo sơ đồ; mỗi LLM bật **JSON/Structured Output** + dán schema.
3. Publish → lấy **API key** (`app-...`) + Base URL.
4. GAS Script Properties: `DIFY_BASE_URL`, `DIFY_API_KEY`; **xoá `DIFY_STUB`** (hoặc để `false`).
5. Test: FE upload PDF thật → 5 tab hiển thị dữ liệu thật (không còn stub).

## Ghi chú
- Prompt hiện đặt trong node (nhanh). Muốn configuration-driven hoàn toàn: đọc `config.prompts.CLASSIFY/...` và truyền vào system prompt qua biến — chuyển sau khi chốt chất lượng.
- Chi phí: 4 lần gọi LLM/thư. Có thể gộp Validate vào LLM3 nếu cần rẻ hơn.
- LLM chốt theo chi phí/độ chính xác (Qwen/Gemini/GPT-4o/DeepSeek) — `PROJECT_OVERVIEW.md`.
