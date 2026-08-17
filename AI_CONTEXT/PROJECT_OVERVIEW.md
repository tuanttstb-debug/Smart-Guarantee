---
id: PRJ-SG
type: project-card
title: Smart Guarantee — Số hoá phát hành & quản lý bảo lãnh
status: draft
owner: PER-TTT
tags: [guarantee, bao-lanh, digitalization, fe]
related: [SYS-BLOL, PRJ-SHTD, PER-TTT]
created: 2026-08-17
updated: 2026-08-17
version: 1
source: https://github.com/tuanttstb-debug/Smart-Guarantee.git
---

> ⚠️ **Bản khởi tạo (2026-08-17).** Khung context được dựng sẵn để bắt đầu phiên 1. Các mục đánh dấu **[CHỜ XÁC NHẬN]** cần [TT] chốt ở phiên tới — chưa bịa nghiệp vụ chi tiết.

## Tóm tắt điều hành
**Smart Guarantee** là nền **số hoá phát hành & quản lý bảo lãnh** (bank guarantee / bảo lãnh). Mục tiêu: rút ngắn thời gian phát hành, chuẩn hoá luồng duyệt, và cho phép theo dõi trạng thái bảo lãnh xuyên suốt vòng đời.
**[CHỜ XÁC NHẬN]** phạm vi cụ thể (loại bảo lãnh, đối tượng người dùng, mức độ tích hợp core).

## Bối cảnh nghiệp vụ
- Kế thừa nghiệp vụ **Bảo lãnh online** — xem tri thức AIOS `SYS-BLOL` (`04_Knowledge/products/SYS-BLOL.md`).
- **[CHỜ XÁC NHẬN]** Persona (khách hàng DN · CBQHKH · thẩm định · phê duyệt · vận hành), loại hình (bảo lãnh dự thầu / thực hiện HĐ / tạm ứng / thanh toán / bảo hành), kênh (nội bộ / khách hàng tự phục vụ).

## Phạm vi & không thuộc phạm vi
- Trong (dự kiến): FE luồng khởi tạo → duyệt → phát hành → theo dõi bảo lãnh; dashboard trạng thái. **[CHỜ XÁC NHẬN]**
- Ngoài (dự kiến): core banking / hệ ký số / hạch toán — tích hợp qua API, không tự làm. **[CHỜ XÁC NHẬN]**

## Kiến trúc (đề xuất ban đầu)
- **[CHỜ XÁC NHẬN]** Ứng viên theo mẫu SHTD: FE tĩnh (SPA) + Google Apps Script + Google Sheets (nhanh, chi phí thấp) — HOẶC stack khác nếu cần tích hợp core. Quyết định ở phiên 1.

## UI/UX
- **Kế thừa design language từ PRJ-SHTD** ("TPBank BIZ" — tím-first, card-driven, token-based). Chi tiết & cách áp dụng: `DESIGN_SYSTEM.md` (cùng thư mục).

## Quan hệ với dự án khác / AIOS
- `SYS-BLOL` (nghiệp vụ bảo lãnh online) — nguồn tri thức nghiệp vụ.
- `PRJ-SHTD` — nguồn tham chiếu **UI/UX** (design system) + mẫu kiến trúc FE+GAS.
- Đăng ký trong AIOS registry: `04_Knowledge/projects/PRJ-SG.md` · `00_System/PORTFOLIO.md`.
