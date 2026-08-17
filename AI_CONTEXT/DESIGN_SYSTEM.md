# Design System — Smart Guarantee (kế thừa từ SHTD "TPBank BIZ")

> **Nguồn tham chiếu:** dự án **PRJ-SHTD** — `D:\Workspace\Production\SHTD-Dashboard\AI_CONTEXT\` (`DESIGN_SYSTEM.md`, `UIUX_SYSTEM.md`, `RESPONSIVE_GUIDE.md`, `THEME_ARCHITECTURE.md`). Smart Guarantee **dùng lại nguyên** ngôn ngữ thị giác này để đồng bộ trải nghiệm; file này là bản tóm + cách áp dụng. Khi cần chi tiết component, mở docs SHTD.

## 1. Design Identity — "TPBank BIZ"
- **Tím-first**: mọi phần tử tương tác mặc định tím thương hiệu `#7B2CBF`; loại xanh dương khỏi palette chính.
- **Enterprise dashboard**: sidebar cố định + topbar + vùng nội dung card-driven.
- **Ít nhiễu thị giác**: không animation nặng, không đổ bóng đậm, không gradient trên nội dung. Ưu tiên **đọc dữ liệu**.

## 2. Nguyên tắc cốt lõi
1. **Tím-first** — interactive = tím `#7B2CBF`.
2. **Thoáng, không dày đặc** — card padding 24–32px, section gap 24px.
3. **Mềm & bo tròn** — card `border-radius: 20px`; input/button `12px`; badge/pill `9999px`.
4. **Bóng tối thiểu** — duy nhất `0 2px 10px rgba(0,0,0,0.03)`.
5. **Workflow-first** — wizard stepper + form sections + luồng phê duyệt là trung tâm UX. (Rất hợp luồng bảo lãnh: khởi tạo → duyệt → phát hành.)

## 3. Token nền (khởi điểm — điều chỉnh trong `variables.css`)
| Token | Giá trị | Ghi chú |
|---|---|---|
| `--color-primary` | `#7B2CBF` | Tím thương hiệu |
| `--radius-card` | `20px` | Thẻ |
| `--radius-control` | `12px` | Input/Button |
| `--radius-pill` | `9999px` | Badge/Pill |
| `--shadow-card` | `0 2px 10px rgba(0,0,0,0.03)` | Bóng duy nhất |
| `--space-card` | `24–32px` | Padding thẻ |
| `--sidebar-w` | `252px` (1440) · `240px` (1280) | Bề rộng sidebar |

> ⚠️ SHTD chưa có file `DESIGN_TOKENS.md` riêng — token nằm trong `assets/css/variables.css`. Khi dựng FE, **copy `variables.css` từ SHTD làm điểm xuất phát** rồi tinh chỉnh cho Smart Guarantee.

## 4. Kiến trúc CSS (theo SHTD)
```
assets/css/
├── variables.css   ← TẤT CẢ token (SỬA Ở ĐÂY TRƯỚC) — LOAD ĐẦU TIÊN
├── base.css        ← reset, html/body, focus
├── typography.css  ├── layout.css (shell: sidebar/topbar/main)
├── components.css  ├── forms.css   ├── wizard.css (stepper — dùng cho luồng bảo lãnh)
├── dashboard.css   ├── portal.css  ├── login.css  ├── states.css
└── responsive.css  ← breakpoints
```
**Thứ tự load quan trọng:** `variables.css` luôn đầu tiên.

## 5. Layout shell
Sidebar (252px, gradient tím, cố định) + Topbar + `app-content` card-driven. Cấu trúc markup sidebar/topbar: xem `SHTD-Dashboard/AI_CONTEXT/DESIGN_SYSTEM.md` mục Component Reference.

## 6. Responsive — Desktop-first
Base 1440px, media query đơn giản hoá dần:

| Breakpoint | Thay đổi chính |
|---|---|
| 1440px+ | Full, sidebar 252px |
| 1280px | Sidebar 240px, content padding 24px |
| **1024px** | **Sidebar off-canvas** (`translateX(-100%)`) + nút toggle + overlay |
| 768px | KPI 2 cột, topbar gọn |
| 480px | KPI 1 cột, form full-width, bottom nav |

## 7. Cách áp dụng cho Smart Guarantee
1. Copy `assets/css/` (đặc biệt `variables.css`) từ SHTD làm nền → tinh chỉnh token nếu cần.
2. Dùng lại **shell** (sidebar/topbar) + **wizard stepper** cho luồng phát hành bảo lãnh.
3. Giữ 5 nguyên tắc; không thêm bóng/gradient/animation ngoài chuẩn.
4. Bám breakpoint 1440/1280/1024/768/480; kiểm off-canvas sidebar tại 1024.
