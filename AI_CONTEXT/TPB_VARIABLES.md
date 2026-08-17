# TPB VARIABLES ($ND) — Danh mục biến hệ Online (B8ZB)

> Nguồn: template **online B8ZB** (`Tham khao/B8ZB/`, 221 file) — dùng **Word MERGEFIELD** `«$NDxxx»` (hệ thống điền tự động). Đây là hệ biến **thứ 2** song song với placeholder `[...]` của mẫu offline/KH (xem `VARIABLE_SEGMENTATION.md`). PoC hỗ trợ **cả hai** (route ONLINE dùng $ND, route OFFLINE/KH_UP dùng `[...]`).

## Prefix
- `$ND###` — biến nghiệp vụ chung. · `$TPB###` — thông tin TPBank (bên bảo lãnh). · `$KH###` — thông tin khách hàng/nhà thầu.

## Danh mục biến (rút từ B8ZB — 15 biến, bổ sung dần)

| Biến | Canonical field | Ý nghĩa |
|---|---|---|
| `$ND001` | BENEFICIARY_NAME | Bên thụ hưởng (bên nhận bảo lãnh) |
| `$ND002` | BENEFICIARY_ADDR | Địa chỉ bên thụ hưởng |
| `$ND005` | GUARANTEE_AMOUNT | Số tiền bảo lãnh (bằng số) |
| `$ND006` | CURRENCY | Đơn vị tiền |
| `$ND007` | AMOUNT_TEXT | Số tiền bằng chữ |
| `$ND008` | VALIDITY | Thời hạn hiệu lực bảo lãnh |
| `$ND012` | ISSUE_DATE | Ngày phát hành bảo lãnh |
| `$ND013` | GUARANTEE_NUMBER | Số bảo lãnh |
| `$ND014` | JOINT_VENTURE_INFO | Thông tin liên danh *(chỉ mẫu liên danh)* |
| `$ND033` | PROJECT_NAME | Tên dự án (OF_PROJECT_NAME) |
| `$ND034` | BID_PACKAGE_NAME | Tên gói thầu |
| `$ND035` | BID_NOTICE_NO | Số Thư mời thầu / E-TBMT |
| `$TPB001` | ISSUING_BRANCH | Chi nhánh TPBank phát hành |
| `$TPB002` | ISSUING_BRANCH_ADDR | Địa chỉ trụ sở chi nhánh |
| `$KH001` | CONTRACTOR_NAME | Bên được bảo lãnh (Nhà thầu) |

> ⚠️ Danh mục trên rút từ **BLDT online**. Các loại BL khác (BLBH/BLTH/BLTU/BLTT/BLKH) có thể dùng thêm biến $ND khác — **bổ sung dần** khi nhận template online tương ứng. `« OF_PROJECT_NAME »` là field-code phụ đi kèm $ND033.

## Quan hệ với canonical / placeholder
`$ND` (online) và `[...]` (offline) **cùng trỏ về một bộ CANONICAL_FIELDS**. Google Sheet giữ 2 bảng map:
- `ND_VARIABLE_MAP`: `field_code | tpb_var` (bảng này).
- `PLACEHOLDER_MAP`: `field_code | placeholder` (`DATA_MODEL.md`).

→ Extract 1 lần ra canonical, rồi render theo route: ONLINE→$ND (MERGEFIELD), OFFLINE/KH→`[...]`.
