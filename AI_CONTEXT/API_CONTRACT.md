# API CONTRACT v2 — FE ⇄ GAS (2026-09-28)

> Thay v1 (upload/process/generate theo route + segments). Mọi request: `POST {GAS_URL}?action=<a>`, body JSON gửi `Content-Type: text/plain` (né CORS preflight). Mọi action trừ `ping`/`login` cần `token`.
> Phản hồi: `{ ok:true, ... }` hoặc `{ ok:false, error_code, message }`.

| action | Body | Trả về |
|---|---|---|
| `ping` | – | `{service, version:2, ts}` |
| `login` | `{username, password}` | `{token, user:{username,display_name,branch_name,role}, branches[], expires_in}` |
| `me` / `logout` | `{token}` | `{user, branches}` / `{}` |
| `catalog` | `{token}` | `{version, catalog:{templates:[{id,label,guarantee_type,template_type,method,joint_venture,sector,envelope,variant,slots[],preview[{t,a,b}]}]}}` |
| `upload` | `{token, filename, content_base64}` | `{doc_id}` — `SG-YYYYMMDD-NNN` |
| `process` | `{token, doc_id, method?:'ĐT'|'TG'}` | `{doc_id, text, classification, method, fields, meta{k:{confidence,evidence}}, warnings[], notes[], candidates[{id,label,score,reasons[]}], template_id, prompt_version}` |
| `load` | `{token, doc_id}` | bản `process` đã lưu (+ `final` nếu đã sinh thư) |
| `generate` | `{token, doc_id, template_id, fields, allow_missing?}` | `{file_name, content_base64, missing[], warnings[]}` |
| `history` | `{token, all?}` | `{items:[{doc_id,created_at,username,file_name,status,guarantee_type,template_id}]}` |

**classification**: `guarantee_type` BLDT|BLTH|BLTU|BLBH|BLTT|BLKH · `form_family` TT79|T22|T07|EVN|VIT|TPB|OTHER · `joint_venture` LD|KO · `method` ĐT|TG · `sector` · `envelope` · `variant` · `language` · `confidence`.

**fields** (nguyên tử, xem `gas/Core.gs::FIELDS`): ben_name, ben_addr, app_name, app_addr, app_reg_no, jv_name, branch_name, branch_addr, contract_name, contract_no, contract_date, bid_package, project, bid_notice_no, bid_notice_date, amount, currency, advance_amount, guarantee_no, issue_date, effective_date, expiry_date, validity_text, account_no. Ngày `dd/mm/yyyy`; tiền = chuỗi số chuẩn (`"7654321000"`).

**error_code**: `AUTH_REQUIRED` · `AUTH_FAILED` · `AUTH_LOCKED` · `FORBIDDEN` (hồ sơ người khác) · `NOT_FOUND` · `PARSE_ERROR` · `OCR_FAILED` · `LLM_FAILED` · `MISSING_FIELDS` · `TEMPLATE_NOT_FOUND` · `NOT_CONFIGURED` · `INTERNAL`.

**Phân quyền**: user chỉ thấy/sửa hồ sơ của mình; `admin` xem được mọi hồ sơ (`history {all:true}`).

## GAS ⇄ Dify
`POST {DIFY_BASE_URL}/v1/workflows/run` blocking · `inputs:{system_prompt, raw_text, today}` → `outputs.result` = JSON text theo schema trong `gas/Prompt.gs`.
