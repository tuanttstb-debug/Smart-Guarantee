# PROJECT STATE — Smart Guarantee

**Cập nhật:** 2026-08-17 · **Version:** 0.1.0 (khởi tạo) · **Repo:** https://github.com/tuanttstb-debug/Smart-Guarantee.git *(remote CHƯA tạo — xem Đang treo)*

## Tóm tắt
Dự án **mới khởi tạo** — chưa có code. Đã dựng khung context AI OS + `CLAUDE.md`, `git init` local (nhánh `main`). Nghiệp vụ: số hoá phát hành & quản lý bảo lãnh (kế thừa `SYS-BLOL`). UI/UX kế thừa PRJ-SHTD.

## Đã có
- Khung `AI_CONTEXT/` chuẩn (OVERVIEW/STATE/TODO/HANDOVER/TECH_DEBT) + `DESIGN_SYSTEM.md` (tham chiếu SHTD).
- `CLAUDE.md` bootstrap (auto-load chuẩn cho phiên).
- Đăng ký AIOS registry: thẻ `PRJ-SG`, PORTFOLIO, INDEX, portfolio-digest.
- `git init` local, nhánh `main` (chưa có commit đầu tại thời điểm ghi).

## Nguồn dữ liệu / tích hợp
- **[CHỜ XÁC NHẬN]** stack + nguồn dữ liệu. Ứng viên: GAS + Google Sheets (theo mẫu SHTD) hoặc tích hợp core qua API.

## Đang treo
- **Tạo GitHub remote** `Smart-Guarantee` rồi `git remote add origin … && push` (chưa làm — cần thao tác [TT]/`gh`).
- **[CHỜ XÁC NHẬN]** phạm vi nghiệp vụ, persona, loại bảo lãnh (xem PROJECT_OVERVIEW).
- Dựng scaffold FE (shell UI theo DESIGN_SYSTEM) — phiên 1.

## Rủi ro / hiện tượng đã biết
- Nghiệp vụ chi tiết chưa chốt → tránh code sâu trước khi xác nhận phạm vi.
- Repo chưa có remote → chưa backup cloud cho tới khi tạo.

## Delta (2026-08-17)
Khởi tạo dự án qua skill `init-project` của AIOS: scaffold `AI_CONTEXT/` + `CLAUDE.md`, tạo `DESIGN_SYSTEM.md` kế thừa UI/UX SHTD, đăng ký registry. Chưa có code/nghiệp vụ chi tiết.
