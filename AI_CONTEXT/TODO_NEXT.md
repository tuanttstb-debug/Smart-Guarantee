# TODO NEXT — Smart Guarantee

Owner: [CC]=Claude Code · [TT]=anh Tuân. Ưu tiên trên → dưới. Xong thì xoá dòng.

## 🔴 Triển khai v2 (theo `gas/README.md` §Triển khai)
- ✅ [CC] Đẩy code GAS bằng clasp (28/09) — sao lưu bản cũ `build/gas_backup_20260928/`.
- [ ] [TT] Upload `build/sg_goc.zip` → Drive `Smart-Guarantee/CONFIG`.
- [ ] [TT] Editor GAS ▸ `setupAll` ▸ Run ▸ cấp quyền ▸ lưu mật khẩu admin in ở log.
- [ ] [TT] Dify: import `dify/smart-guarantee.workflow.yml` (app v2), chọn model, publish, key mới → `DIFY_API_KEY`; xoá `DIFY_STUB`.
- [ ] [TT] Điền tab BRANCHES; `adminSetUser` cho nhóm pilot.
- [ ] [CC] `clasp deploy -i AKfycbxCBF…Z0` (giữ URL) → chạy thử thư test qua FE thật, so với giả lập.
- [ ] [TT/BA] Rà tab MAU_THU (tên hiển thị, chiều) + SLOT_REVIEW theo `docs/QUAN_LY_MAU.md`.

## UAT pilot (`docs/UAT.md`)
- [ ] [TT] Bộ 20 thư + đáp án (mẫu đúng + giá trị trường) — lưu `Test/`.
- [ ] [CC] Script chấm UAT tự động (so kết quả `process` với đáp án) → báo KPI.
- [ ] [CC] Tinh chỉnh `gas/Prompt.gs` theo lỗi lặp (tăng `PROMPT_VERSION`).

## Backlog
- [ ] [TT] Chốt lưu trữ Drive (xoá sau 90 ngày?) → [CC] trigger dọn tự động.
- [ ] [CC] Trang admin: quản lý user/chi nhánh, xem AUDIT (hiện làm trong Sheet).
- [ ] [CC] Mẫu tiếng Anh/song ngữ (thư viện hiện chỉ tiếng Việt).
- [ ] [CC] Chuẩn bị adapter on-prem (OCR + LLM nội bộ) khi TPBank duyệt mở rộng.
