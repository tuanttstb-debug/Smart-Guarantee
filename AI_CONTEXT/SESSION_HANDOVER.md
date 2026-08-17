# SESSION HANDOVER — Smart Guarantee

**Từ phiên:** 2026-08-17 (Claude Code — khởi tạo) · **Cho:** phiên 1 (bắt đầu làm dự án)

## Delta phiên (2026-08-17 — khởi tạo dự án)
- **Việc xong:** Khởi tạo dự án qua skill AIOS `init-project`: `git init` (nhánh `main`), scaffold `AI_CONTEXT/` (OVERVIEW/STATE/TODO/HANDOVER/TECH_DEBT) + `CLAUDE.md` bootstrap; tạo **`DESIGN_SYSTEM.md` kế thừa UI/UX từ PRJ-SHTD** ("TPBank BIZ" — tím-first, card-driven, token-based, breakpoints 1440/1280/1024/768/480); điền OVERVIEW/STATE/TODO khởi điểm (đánh dấu [CHỜ XÁC NHẬN] các mục nghiệp vụ). Đăng ký AIOS registry (thẻ PRJ-SG, PORTFOLIO, INDEX, portfolio-digest).
- **File đổi:** `AI_CONTEXT/*` (5 khung + DESIGN_SYSTEM), `CLAUDE.md`; (AIOS) thẻ + PORTFOLIO/INDEX/projects.json.
- **Quyết định:** UI/UX **kế thừa SHTD**; nghiệp vụ tham chiếu `SYS-BLOL`; stack/phạm vi **chưa chốt** (để phiên 1).
- **Blocker:** chưa có GitHub remote (chỉ local); phạm vi nghiệp vụ chưa xác nhận.
- **Bước kế:** [TT] chốt phạm vi + stack + tạo remote (TODO_NEXT mục Cao); [CC] dựng scaffold FE theo `DESIGN_SYSTEM.md`.
- **Rủi ro hồi quy:** không (dự án mới, chưa có code).

## Cách bắt đầu một phiên (bắt buộc)
1. `git pull` (sau khi có remote).
2. Đọc `AI_CONTEXT/PROJECT_OVERVIEW.md` → `PROJECT_STATE.md` → `TODO_NEXT.md` → file này → `TECH_DEBT.md`. UI: `DESIGN_SYSTEM.md`.
3. Làm việc nhỏ → commit nhỏ → cập nhật context → push. Kết phiên: ghi delta 6 trường.

## Gotchas
- Tên thư mục có dấu cách ("Smart Guarantee") → quote path khi chạy lệnh.
- Repo chưa có remote → `git push` chỉ được sau khi `git remote add origin`.
