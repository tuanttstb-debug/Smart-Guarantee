# DATA MODEL — Smart Guarantee

> Cập nhật theo **`Tham khao/Logic hiển thị.xlsx`** (logic chọn mẫu thật). Tư duy: **`Template + Dimension + Rule Engine`**. Metadata sống trong **Google Sheet**, sửa không cần deploy. Logic chọn mẫu chi tiết: `TEMPLATE_SELECTION.md`. Bài toán lõi (khung vs biến): `VARIABLE_SEGMENTATION.md`.

## A. 9 Dimensions (đã đối chiếu logic thật)

| # | Dimension (field BIZ) | Giá trị (code) |
|---|---|---|
| 1 | **Currency** | `VND` · `NGT` |
| 2 | **Guarantee Type** `goType` | `BLDT` · `BLBH` · `BLTH` · `BLTU` · `BLTT` · `BLKH` *(6 loại)* |
| 3 | **Method** `letterInfo.method` | `TG` · `ĐT` · `SW` |
| 4 | **Language** `letterInfo.language` | `TV` · `TA` · `SN` · `KH` |
| 5 | **Template Type** `letterInfo.type` | `TPB` · `T22` · `T07` · `T40` · `EVN` · `VIT` · `MK` |
| 6 | **Sector (Lĩnh vực)** | `HH` · `XL` · `PTV` · `HON_HOP` · `TBYT` · `DL` · `MT` · *(none)* |
| 7 | **Validity** `commitTerm.type` | `1` từ ngày PH đến ngày · `2` từ ngày đến ngày · `3` …kể từ ngày PH · `4` …kể từ ngày… · `5` sự kiện hiệu lực |
| 8 | **Joint Venture** `jointVentureInfo.type` | `KO` · `DD` · `DDN` · `ĐL` |
| 9 | **Contract Status** | `ĐK` · `BBTT` · `TBTT` · `QĐTT` · `VBK` |
| 10 | **Circular (vòng đời TT)** *(chỉ BLDT)* | `TT06-07` · `TT22` · `TT40` · `TT79` (hiện hành) |
| 11 | **Bidding process** *(BLDT online B8ZB)* | Số túi: `1 túi`·`2 túi` · Giai đoạn: `1GĐ`·`2GĐ` · Loại HĐ: `EC`·`EP`·`EPC`·`PC`·`CGTT` |

> **Đính chính TT79:** TT79 **có thật**, **chỉ áp cho BLDT** (mới nhất, đánh dấu chuyển quản lý đấu thầu Bộ KH&ĐT → **Bộ Tài chính**); các loại BL khác giữ thông tư riêng. (Bộ Y tế = TT07/TT40; Bộ KH&ĐT = TT22/TT06-07.) Guarantee Type **6** (thêm BLBH, BLKH). Thêm chiều: Currency, Sector, Contract Status, **Circular & Bidding process** (BLDT).

## B. Hai hệ biến (song song — hỗ trợ cả hai)
1. **`[...]` placeholder** — mẫu **offline / KH tự upload** (root `Tham khao/`). Người điền / segmentation. Xem `VARIABLE_SEGMENTATION.md` §4.
2. **`$ND` MERGEFIELD** — mẫu **online B8ZB** (`Tham khao/B8ZB/`). Hệ thống điền. Danh mục: `TPB_VARIABLES.md`.

Cả hai **cùng trỏ về CANONICAL_FIELDS**; render theo route (ONLINE→$ND, OFFLINE/KH_UP→`[...]`).

## C. Google Sheet — cấu hình

### Sheet 1 — CANONICAL_FIELDS
`field_code | field_name | data_type` (text/date/amount) — ví dụ: `BENEFICIARY_NAME · BENEFICIARY_ADDR · CONTRACTOR_NAME · GUARANTEE_AMOUNT · AMOUNT_TEXT · BID_PACKAGE_NAME · CONTRACT_REF · ISSUE_DATE · VALIDITY · ISSUING_BANK_NAME …`

### Sheet 2 — FIELD_ALIASES  *(normalize — Risk 1)*
`field_code | alias` — ví dụ BENEFICIARY_NAME ← "Bên thụ hưởng / Bên nhận bảo lãnh / Beneficiary / Chủ đầu tư / Employer".

### Sheet 3 — PLACEHOLDER_MAP  *(canonical ↔ cụm [...] — mẫu offline/KH)*
`field_code | placeholder` — ví dụ BENEFICIARY_NAME ↔ `[ghi tên Chủ đầu tư]`, `[bên nhận bảo lãnh]`.

### Sheet 3b — ND_VARIABLE_MAP  *(canonical ↔ $ND — mẫu online B8ZB)*
`field_code | tpb_var` — ví dụ BENEFICIARY_NAME ↔ `$ND001`. Danh mục: `TPB_VARIABLES.md`.

### Sheet 4 — TEMPLATE_REGISTRY  *(dựng từ mẫu offline `Tham khao/` + online `B8ZB/`)*
`template_id | source (OFFLINE|ONLINE_B8ZB) | currency | guarantee_type | method | language | template_type | sector | circular | joint_venture | envelope | validity_allowed | template_file | folder | active`
→ `template_file` + `folder` khớp cấu trúc thư mục. Offline: `TEMPLATE_SELECTION.md` §3. Online B8ZB (circular TTxx): §7. Bản `Archive/old-thô`: **active=false** (giữ tham chiếu, không sinh).

### Sheet 5 — SELECTION_RULES  *(bảng quyết định + fall-through "Mẫu KH up")*
Mã hoá bảng ở `TEMPLATE_SELECTION.md` §4 + quy tắc §2 (khi nào rơi về Mẫu KH up).

### Sheet 6 — FIELD_REQUIREMENTS  *(field bắt buộc theo loại BL — từ sheet "Nghĩa vụ được BL")*
Ma trận `guarantee_type × field → bắt buộc?`. Điều kiện hoá bước extract: chỉ hỏi/kiểm field áp dụng cho loại đó. (Xem §D.)

### Sheet 7 — PROMPTS
`CLASSIFY · SEGMENT · EXTRACT · NORMALIZE · VALIDATE` — update prompt không deploy.

## D. Ma trận field theo loại BL (rút từ sheet "Nghĩa vụ được BL")
Các field lõi áp dụng cho **mọi** loại: bên được bảo lãnh (+địa chỉ) · bên thụ hưởng (+địa chỉ, mã số DN/CCCD) · số tiền + đơn vị tiền · thời hạn/hiệu lực · phương án + tên liên danh · tài khoản phí.

| Field đặc thù | Áp dụng cho |
|---|---|
| Số TB mời thầu · tên gói thầu · tên dự án · phương thức chọn nhà thầu · thông tư áp dụng · lĩnh vực | **BLDT** (dự thầu) |
| Tình trạng HĐ · số HĐ · ngày ký · nội dung HĐ | BLBH · BLTU · BLTH · BLTT · BLKH (I=ĐK) |
| Loại hồ sơ tương đương · thông tin hồ sơ · tên gói thầu/dự án | BLTH · BLTU (khi HĐ **chưa ký**: BBTT/TBTT/QĐTT/VBK) |
| Thông báo mời thầu/Hồ sơ mời thầu · ngày hồ sơ | BLDT (mẫu khác online) |

*(BLDT online qua hệ thống Muasamcong quốc gia: bộ field rút gọn — xem sheet gốc dòng B8ZB.)*

## E. Luồng dữ liệu
```
Thư KH → extract text → classify(9–11 dims) → route?
   ├─ ONLINE_B8ZB → map(canonical→$ND) → điền MERGEFIELD template TT79 → DOCX
   └─ OFFLINE/KH_UP → segment(khung/biến, đối chiếu corpus) → map(canonical→[...])
                     → reproduce (giữ khung KH, điền biến) → DOCX
   (chung: normalize alias→canonical · validate theo FIELD_REQUIREMENTS · confidence)
```

## F. Chống rủi ro
- **Risk 1** field nhiều cách gọi → `FIELD_ALIASES`.
- **Risk 2** template/placeholder mới → cập nhật REGISTRY/PLACEHOLDER_MAP/ALIAS/PROMPT, không sửa code.
- **Risk 3** LLM JSON bất ổn → ép JSON Schema mọi node (`DIFY_WORKFLOW.md`).
- **Risk 4** segmentation sai ranh giới khung/biến → fuzzy/semantic match + user review (`VARIABLE_SEGMENTATION.md`).
