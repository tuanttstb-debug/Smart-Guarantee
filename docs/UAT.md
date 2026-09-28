# UAT pilot — Smart Guarantee v2

> Mục tiêu: xác nhận đủ điều kiện dùng thật cho nhóm cán bộ tác nghiệp BL. Chạy sau khi hoàn tất `gas/README.md` §Triển khai và `checkSetup` toàn ✓.

## 1. Kiểm thử tự động (đã có — chạy trước mỗi lần deploy)
`bash tools/check.sh`: mẫu strict (0 chỗ trống sót / 168 mẫu) · lõi 44 ca · giả lập GAS e2e 41 ca (auth, phân quyền, upload, process, generate, lịch sử, brute-force, LLM lỗi) · UI demo desktop + mobile.

## 2. Bộ thư UAT (nghiệp vụ chuẩn bị — lưu `Test/`, KHÔNG commit)
Tối thiểu **20 thư thật đã che/được phép dùng**, phủ:

| Nhóm | Số thư | Lưu ý |
|---|---|---|
| BLDT TT79 (1 túi / 2 túi, độc lập / liên danh) | 4 | kiểm `$ND` → bên thụ hưởng, E-TBMT, thời hạn hiệu lực |
| BLTH / BLTU / BLBH TT22 (HH, XL, PTV, TBYT) | 6 | tạm ứng: 2 số tiền khác nhau |
| TT07 Bộ Y tế (dược liệu, mua thuốc 1/lô thụ hưởng) | 2 | |
| EVN, Viettel | 3 | |
| Mẫu TPB (BLTH/BLTU/BLBH/BLTT) | 3 | BLTU thời hạn 1+2 vs 5 |
| PDF scan / ảnh chụp | 2 | chất lượng OCR |

Mỗi thư ghi **đáp án**: mẫu đúng (template_id) + giá trị đúng các trường.

## 3. KPI chấp nhận pilot
| KPI | Cách đo | Ngưỡng |
|---|---|---|
| Chọn đúng mẫu ở top-1 | template_id đề xuất = đáp án | ≥ 85% (top-3 ≥ 95%) |
| Trường đúng không phải sửa | trường đúng / trường mẫu cần | ≥ 90% |
| Thư xuất đúng định dạng mẫu | mở Word, so mẫu gốc | 100% |
| Không có số liệu sai lọt qua | số tiền/ngày sai mà không bị cảnh báo | 0 |
| Thời gian xử lý / thư | upload → xuất | ≤ 3 phút (so ~15–20 phút thủ công) |

Ghi kết quả từng thư vào bảng (cột: file · mẫu đề xuất · đúng? · số trường sửa · lỗi · thời gian). Trường sai lặp lại → sửa `gas/Prompt.gs` (tăng `PROMPT_VERSION`), chạy lại cả bộ.

## 4. Kiểm soát vận hành cần xác nhận
- [ ] Tài khoản riêng từng cán bộ; không dùng chung. Admin rà AUDIT hằng tuần.
- [ ] Cán bộ tích "Tôi đã đối chiếu…" trước khi xuất; thư còn ô vàng không được ký/phát hành.
- [ ] Thư xuất vẫn qua quy trình kiểm soát/ký hiện hành (công cụ hỗ trợ soạn, không thay thẩm quyền phê duyệt).
- [ ] Chính sách lưu trữ Drive INPUT/OUTPUT (đề xuất xoá sau 90 ngày) — cần chốt.
