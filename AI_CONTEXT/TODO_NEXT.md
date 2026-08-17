# TODO NEXT — Smart Guarantee

Ưu tiên trên xuống. Owner: [CC]=Claude Code · [TT]=Tuân.

## Cao (phiên 1)
1. [TT] **Chốt phạm vi nghiệp vụ**: loại bảo lãnh, persona, kênh, mức tích hợp core (mở `PROJECT_OVERVIEW.md` — các mục [CHỜ XÁC NHẬN]).
2. [TT] **Chốt stack**: FE tĩnh + GAS + Sheets (mẫu SHTD) hay khác.
3. [TT] **Tạo GitHub remote** `Smart-Guarantee` → `git remote add origin … && git push -u origin main`.
4. [CC] **Dựng scaffold FE** theo `DESIGN_SYSTEM.md`: copy `assets/css/` (đặc biệt `variables.css`) từ SHTD → shell sidebar/topbar + trang chủ; verify chạy Chrome.

## Trung bình
- [CC] Dựng **wizard luồng bảo lãnh** (khởi tạo → duyệt → phát hành → theo dõi) — tái dùng stepper SHTD.
- [CC] Model dữ liệu bảo lãnh (đối chiếu `SYS-BLOL`).

## Thấp / Backlog
- Dashboard trạng thái bảo lãnh (KPI cards theo chuẩn SHTD).
- Tích hợp ký số / core (qua API) — sau khi chốt phạm vi.
