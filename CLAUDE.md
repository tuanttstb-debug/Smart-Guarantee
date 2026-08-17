# CLAUDE.md — Smart Guarantee

Repo này theo chuẩn **AI OS Registry (Hub-and-Spoke)**. Tri thức dự án sống ở `AI_CONTEXT/`; danh mục trung tâm ở repo **AIOS** (`D:\Workspace\AIOS`). ID dự án: **PRJ-SG**.

## Bắt đầu mỗi phiên (BẮT BUỘC)
1. `git pull`.
2. Đọc theo thứ tự: `AI_CONTEXT/PROJECT_OVERVIEW.md` → `PROJECT_STATE.md` → `TODO_NEXT.md` → `SESSION_HANDOVER.md` (**delta mới nhất trên cùng**) → `TECH_DEBT.md`.
3. **Không quét toàn repo.** Chỉ mở module liên quan việc đang làm.

## Quy tắc làm việc
- Việc nhỏ → commit nhỏ → cập nhật `AI_CONTEXT/` → `git push`.
- **Kết thúc phiên:** ghi delta vào `SESSION_HANDOVER.md` đủ **6 trường** — task completed · files changed · decision made · blocker · next step · regression risk. Cập nhật `PROJECT_STATE`/`TODO_NEXT`/`TECH_DEBT` nếu đổi.
- Commit chỉ khi được yêu cầu; nếu đang ở nhánh chính thì tạo nhánh trước. Không skip hook.
- **Dữ liệu khách hàng / nhạy cảm: KHÔNG đưa lên cloud/artifact** (RULE-data-boundary).

## Định danh registry
- Thẻ dự án: `AIOS/04_Knowledge/projects/PRJ-SG.md` · Danh mục: `AIOS/00_System/PORTFOLIO.md`.
- Chuẩn khung `AI_CONTEXT/` + quy ước ID/tên/front-matter: `AIOS/02_Rules/naming-convention.md`.
- Trạng thái đa dự án (tự sinh): `AIOS/00_System/PORTFOLIO_DIGEST.md`.

## Kiến trúc & bối cảnh
Xem `AI_CONTEXT/PROJECT_OVERVIEW.md` → thiết kế chi tiết: `SYSTEM_ARCHITECTURE.md` · `DATA_MODEL.md` · `TEMPLATE_SELECTION.md` · `VARIABLE_SEGMENTATION.md` (bài toán lõi) · `TPB_VARIABLES.md` (biến $ND online) · `DIFY_WORKFLOW.md` · `API_CONTRACT.md` · `DRIVE_STRUCTURE.md` · `DOCX_GENERATOR.md`. UI: `DESIGN_SYSTEM.md`. Nguồn tham khảo: `Tham khao/` (Logic hiển thị.xlsx + 96 mẫu offline + `B8ZB/` 221 mẫu online). Brief gốc: `Prompt mo dau.MD` / `Tổng quan.MD` (repo root).
