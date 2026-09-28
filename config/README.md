# config/

`TEMPLATE_REGISTRY.csv` — danh mục mẫu gốc (285 dòng: 96 offline + 189 B8ZB; `active=true` = 168 mẫu đang dùng). **Tự sinh** từ `Tham khao/`:
```
node tools/build-registry.js
```
Chỉ dùng cho **chuyển đổi lần đầu** (`tools/normalize.js` → `build/sg_goc.zip`). Sau khi chuyển, **bảng MAU_THU trên Sheet OPS là nguồn chuẩn** (BA quản lý — `docs/QUAN_LY_MAU.md`); CSV này không còn được đọc lúc chạy.

> Các CSV v1 (CANONICAL_FIELDS, FIELD_ALIASES, PLACEHOLDER_MAP, ND_VARIABLE_MAP, SELECTION_RULES, FIELD_REQUIREMENTS, PROMPTS) đã bỏ ở v2 (2026-09-28): trường dữ liệu + luật render nằm trong `gas/Core.gs`, luật gắn slot trong `gas/Normalize.gs`, prompt trong `gas/Prompt.gs`.
