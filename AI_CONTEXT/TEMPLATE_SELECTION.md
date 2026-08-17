# TEMPLATE SELECTION LOGIC — Smart Guarantee

> **Nguồn sự thật:** `Tham khao/Logic hiển thị.xlsx` (sheet *Logic hiển thị*) — logic **chọn mẫu bằng tay** đang dùng trên BIZ. Đây là tri thức để AI **nhận diện** các chiều dữ liệu và **đối chiếu** khung mẫu. Bộ template thật: `Tham khao/` (4 thư mục, 96 file .docx).
>
> ⚠️ Trọng tâm PoC KHÔNG chỉ là "chọn 1 template". Xem `VARIABLE_SEGMENTATION.md` — bài toán lõi là **bóc tách khung vs biến trên chính thư KH upload**; bảng dưới đây là tri thức nền cho việc đó.

## 1. Chín (9) chiều đầu vào — quyết định mẫu

| Cột | Chiều (field BIZ) | Giá trị (code) |
|---|---|---|
| A | Loại tiền | `VND` · `NGT` (ngoại tệ khác VND) |
| B | Loại bảo lãnh `goType` | `BLDT` dự thầu · `BLBH` bảo hành · `BLTH` THHĐ · `BLTU` tạm ứng · `BLTT` thanh toán · `BLKH` hoàn quyết toán/khác |
| C | Hình thức phát hành `letterInfo.method` | `TG` thư giấy · `ĐT` thư điện tử · `SW` điện swift |
| D | Ngôn ngữ `letterInfo.language` | `TV` · `TA` · `SN` song ngữ · `KH` khác |
| E | Loại mẫu thư `letterInfo.type` | `TPB` · `T22` (TT22-KH&ĐT) · `T07` (TT07-BYT) · `T40` (TT40-BYT) · `EVN` · `VIT` · `MK` mẫu khác |
| F | Lĩnh vực | `HH` hàng hoá · `XL` xây lắp · `PTV` phi tư vấn · `HON_HOP` hỗn hợp · `TBYT` mượn TBYT · `DL` dược liệu · `MT` mua thuốc · *(Không hiển thị)* |
| G | Hiển thị thời hạn `commitTerm.type` | `1` từ ngày phát hành đến ngày… · `2` từ ngày đến ngày · `3` …kể từ ngày phát hành · `4` …kể từ ngày… · `5` sự kiện hiệu lực (chọn ngày dự kiến hết hiệu lực) |
| H | Phương án liên danh `jointVentureInfo.type` | `KO` không · `DD` đại diện liên danh (JOIN_VENTURE_REPRESENTATIVE) · `DDN` đại diện nhóm thành viên (REP_OF_JOINT_VENTURE_MEMBER) · `ĐL` độc lập trong liên danh (INDEPENDENT_CONTRACTOR) |
| I | Tình trạng hợp đồng | `ĐK` đã ký · `BBTT` biên bản thương thảo · `TBTT` thông báo trúng thầu · `QĐTT` quyết định trúng thầu · `VBK` văn bản khác |

Cột J = **file mẫu thư** (output). Cột K = **tooltip hồ sơ phương án** (hồ sơ chứng minh mục đích phát hành).

## 2. Quy tắc rơi về "Mẫu KH up" (không có template chuẩn TPBank)
Template chuẩn TPBank **chỉ áp dụng khi**: `A=VND` **và** `D=TV` **và** `C∈{TG,ĐT}` **và** `E∈{TPB,T22,T07,T40,EVN,VIT}`.
Ngược lại → **`Mẫu KH up`** (KH tự upload thư của họ): xảy ra khi `A=NGT` **hoặc** `C=SW` **hoặc** `D∈{TA,SN,KH}` **hoặc** `E=MK`.
→ Với PoC, đây **không phải** ngoại lệ mà là **case chính**: xem `VARIABLE_SEGMENTATION.md`.

## 3. Quy ước tên file & thư mục
- **Tên file:** `[LD_]<BL>_<NgônNgữ>_<Mẫu>[_<LĩnhVực>][ (biến thể)]` — ví dụ `BLTH_TV_TT22_HH`, `BLDT_TV_TPB`, `LD_BLTU_TV_VIT`.
- **Prefix `LD_`** = liên danh (H∈{DD,DDN,ĐL}); không prefix = độc lập (H=KO).
- **Thư giấy vs điện tử** = **cùng tên file, khác thư mục** (`Độc lập/Liên danh (template thư giấy)` vs `(template thư điện tử)`).
- 4 thư mục: `Độc lập (giấy)` · `Độc lập (điện tử)` · `Liên danh (giấy)` · `Liên danh (điện tử)`.

## 4. Bảng quyết định (rút gọn từ sheet, VND)

### BLDT — Bảo lãnh dự thầu  (I = N/A)
| E mẫu | F lĩnh vực | G thời hạn | H liên danh | → J file | Tooltip K |
|---|---|---|---|---|---|
| TPB | — | 1,2 | KO | `BLDT_TV_TPB` | Thông báo mời thầu/Hồ sơ mời thầu |
| T22 | — | 1-4 | KO,DD,DDN,ĐL | `BLDT_TV_TT22_HH` | |
| T40 | — | 1-4 | KO,DD,DDN,ĐL | `BLDT_TV_TT07` | |
| MK / (D≠TV) / (C=SW) | — | 1-5 | * | **Mẫu KH up** | |

### BLBH — Bảo lãnh bảo hành  (I = ĐK)
| TPB | — | 1,2 | KO | `BLBH_TV_TPB` | HĐ kinh tế + biên bản bàn giao/nghiệm thu |
| EVN | — | 1-4 | * | `BLBH_TV_EVN` | |
| VIT | — | 1-4 | * | `BLBH_TV_VIT` | |
| MK/… | | | | **Mẫu KH up** | |

### BLTH — Bảo lãnh thực hiện hợp đồng  (I = ĐK/BBTT/TBTT/QĐTT/VBK)
| TPB | — | 1,2 | KO | `BLTH_TV_TPB` | TB/QĐ trúng thầu · BB thương thảo · HĐ kinh tế |
| T22 | HH | 1-4 | * | `BLTH_TV_TT22_HH` | |
| T22 | XL | 1-4 | * | `BLTH_TV_TT22_XL` | |
| T22 | PTV | 1-4 | * | `BLTH_TV_TT22_PTV` | |
| T22 | HON_HOP | 1-4 | * | `BLTH_TV_TT22_HON_HOP` | |
| T22 | TBYT | 1-4 | * | `BLTH_TV_TT22_TBYT` | |
| T40 | DL | 1-4 | * | `BLTH_TV_TT07_DL` | |
| T40 | MT | 1-4 | * | `BLTH_TV_TT07_MT` (1 thụ hưởng / lô thụ hưởng) | |
| EVN | — | 1-4 | * | `BLTH_TV_EVN` | |
| VIT | — | 1-4 | * | `BLTH_TV_VIT` | |
| MK/… | | | | **Mẫu KH up** | |

### BLTU — Bảo lãnh tạm ứng  (I = ĐK)
| TPB | — | 1,2 | KO | `BLTU_TV_TPB (thoi han 1 + 2)` | TB/QĐ trúng thầu · BB thương thảo · HĐ |
| TPB | — | 5 | * | `BLTU_TV_TPB (thoi han 5)` | |
| T22 | HH/XL/PTV/HON_HOP/TBYT | 1-5 | * | `BLTU_TV_TT22_<F>` | |
| EVN | — | 1-5 | * | `BLTU_TV_EVN` | |
| VIT | — | 1-5 | * | `BLTU_TV_VIT` | |
| MK/… | | | | **Mẫu KH up** | |

### BLTT — Bảo lãnh thanh toán  (I = ĐK)
| TPB | — | 1,2 | KO | `BLTT_TV_TPB` | HĐ kinh tế + biên bản đối chiếu công nợ |
| MK/… | | | | **Mẫu KH up** | |

### BLKH — Bảo lãnh hoàn quyết toán/khác  (I = ĐK)
| MK | — | 1-5 | * | **Mẫu KH up** | HĐ kinh tế + công văn của bên nhận bảo lãnh |

### NGT (ngoại tệ) — mọi loại BL
→ luôn **Mẫu KH up** (A=NGT, xem §2).

## 5. Ràng buộc validity (G) theo case
- **TPB** thường chỉ cho `1,2` (BLTU có nhánh riêng `5`).
- **T22/T07/T40/EVN/VIT** cho `1-4` (BLTU cho `1-5`).
- **MK / mẫu KH up** cho `1-5` (đủ 5 kiểu). Chi tiết rule: `DATA_MODEL.md` §Dimension Validity.

## 6. Sản phẩm & mã trên BIZ (tham chiếu — sheet *Product*)
`BLDT`(+`B8ZB` online/Muasamcong) · `BLBH`(+`B902`) · `BLTU` · `BLTH`(+`B11Z`) · `BLTT`(+`B492`) · `BLKH` (phase 4 đổi tên "Bảo lãnh khác") · `BAZZ/B400` CKTC · `BLVV` vay vốn · `BLDU` đối ứng · `BLRE` cho chủ đầu tư.
Nhóm giao dịch: Phát hành · Sửa đổi (+ cập nhật/hủy). **PoC scope = Phát hành.**

## 7. BLDT ONLINE (B8ZB) — theo vòng đời thông tư
> Nguồn: `Tham khao/B8ZB/` (221 file). Đây là bộ **BLDT online** (qua hệ thống Muasamcong), dùng biến **`$ND` MERGEFIELD** (`TPB_VARIABLES.md`) — khác hệ `[...]` của mẫu offline/KH.

### 7.1 Cấu trúc thư mục
`B8ZB/ {Thư điện tử | Thư giấy} / {Mẫu Độc lập | Mẫu Liên danh} / {TT06-07 | TT22 | TT40 | TT79} / <lĩnh vực + quy trình>.docx`

### 7.2 Chiều mới — **Circular (vòng đời thông tư)** *(chỉ BLDT)*
`TT06-07` → `TT22` → `TT40` → **`TT79`** (hiện hành). **TT79 chỉ điều chỉnh mẫu BLDT** — đánh dấu chuyển quản lý đấu thầu **Bộ KH&ĐT → Bộ Tài chính**; các loại BL khác **giữ nguyên** thông tư của chúng.
→ **PoC:** classify được cả 4 thế hệ (thư cũ vẫn tồn tại), nhưng **chỉ SINH theo TT79**. Bản `Archive/`, `old - thô/` (~32 file): **không đưa vào REGISTRY**, giữ tham chiếu.

### 7.3 Chiều mới — **quy trình đấu thầu** (BLDT online)
- **Số túi hồ sơ:** `1 túi` · `2 túi` hồ sơ.
- **Giai đoạn:** `1 giai đoạn` (· 2 giai đoạn).
- **Lĩnh vực / loại hợp đồng:** HÀNG HOÁ · XÂY LẮP · PHI TƯ VẤN · MƯỢN MÁY · CGTT (chào giá trực tuyến) · **EC · EP · EPC · PC** (loại hợp đồng) · THUỐC CŨ / THUỐC MỚI (dược — TT40).

### 7.4 Quy ước tên file B8ZB
`(BLOL) <LĨNH VỰC/LOẠI HĐ> - <SỐ TÚI> HO SO - <ĐỘC LẬP|LIÊN DANH> <TTxx>.docx`
ví dụ `(BLOL) HANG HOA - MOT TUI HO SO - DOC LAP TT79`, `(BLOL) EPC - HAI TUI HO SO - LIEN DANH TT22`. Prefix `(BLOL)` = Bảo lãnh Online.

### 7.5 Thống kê (tham khảo)
221 file (32 archive/old). Theo circular: TT22 72 · TT79 72 · TT06-07 25 · TT40 12. Method: giấy 129 · điện tử 92. Form: độc lập 111 · liên danh 110.
