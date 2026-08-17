# DESIGN SYSTEM — Smart Guarantee

> **Hướng đã chốt (phiên 1):** giữ **nhận diện "TPBank BIZ"** (tím-first, bo tròn mềm, bóng tối thiểu) nhưng **bỏ enterprise dashboard/sidebar**. UI là **trang 5-tab tuyến tính trên Bootstrap** — ưu tiên *ra demo nhanh*. Nguồn nhận diện: PRJ-SHTD (`D:\Workspace\Production\SHTD-Dashboard`).

## 1. Nhận diện — "TPBank BIZ" (giữ lại)
- **Tím-first:** phần tử tương tác mặc định tím thương hiệu `#7B2CBF`; không xanh dương làm màu chính.
- **Mềm & bo tròn:** card `20px`, input/button `12px`, badge/pill `9999px`.
- **Bóng tối thiểu:** duy nhất `0 2px 10px rgba(0,0,0,0.03)`.
- **Ít nhiễu:** không gradient trên nội dung, không animation nặng — ưu tiên đọc dữ liệu.

## 2. Bỏ so với SHTD (cho nhanh)
- ❌ Sidebar cố định / off-canvas · ❌ topbar dashboard phức tạp · ❌ wizard stepper nặng → thay bằng **Bootstrap nav-tabs / stepper nhẹ**.
- ✅ Layout: **topbar tím mảnh + vùng nội dung card-driven**, flow tuyến tính 5 bước.

## 3. Layout mục tiêu (5-tab)
```
┌──────────────────────────────────────────┐
│  ▌ TPBank · Smart Guarantee   (topbar tím)│
├──────────────────────────────────────────┤
│ ①Upload  ②Phân loại  ③Dữ liệu  ④Biến TPB  ⑤Xuất │  ← nav-tabs / step
├──────────────────────────────────────────┤
│  card (radius 20, shadow tối thiểu)        │
│  nội dung theo tab hiện hành               │
└──────────────────────────────────────────┘
```
- **Tab 1 Upload** — dropzone PDF. **Tab 2 Classification** — badge 4 tầng (loại/ngôn ngữ/loại thư/bộ mẫu). **Tab 3 Extracted** — bảng field edit được, **highlight confidence thấp** (vàng/đỏ). **Tab 4 Variables** — bảng `NDxxx → giá trị`. **Tab 5 Generate** — nút Generate + Download DOCX.

## 4. Token nền (khởi điểm)
| Token | Giá trị |
|---|---|
| `--color-primary` | `#7B2CBF` |
| `--radius-card` | `20px` |
| `--radius-control` | `12px` |
| `--radius-pill` | `9999px` |
| `--shadow-card` | `0 2px 10px rgba(0,0,0,0.03)` |
| `--space-card` | `24–32px` |
| `--confidence-low` | vàng cảnh báo / đỏ (highlight field) |

## 5. Cách dựng (Bootstrap)
1. Bootstrap 5 (CDN) làm nền lưới/component.
2. 1 file `assets/css/theme.css` **override** biến Bootstrap → áp token TPBank (primary tím, radius, shadow).
   - **Nguồn tham chiếu token SHTD:** file thật là `D:\Workspace\Production\SHTD-Dashboard\assets\css\tokens.css` *(không phải `variables.css` — file đó không tồn tại trên đĩa; đây là đính chính so với bản khởi tạo).* Lấy giá trị màu/radius làm điểm xuất phát, **không copy nguyên cây CSS SHTD** (SHTD là dashboard, ta chỉ cần nhận diện).
3. `nav-tabs` Bootstrap cho 5 bước; badge cho phân loại; `table` cho field/variable.
4. Giữ 4 nguyên tắc nhận diện; không thêm bóng/gradient/animation ngoài chuẩn.

## 6. Responsive (nhẹ)
Bootstrap grid mặc định. Desktop-first, gọn dần ở `768px` (tab cuộn ngang / stack). Không cần off-canvas sidebar (đã bỏ sidebar).
