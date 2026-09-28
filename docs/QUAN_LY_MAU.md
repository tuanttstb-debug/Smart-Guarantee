# Quản lý thư viện mẫu thư bảo lãnh — hướng dẫn cho BA / nghiệp vụ

> Không cần máy lập trình, không cần chạy script. Mọi thao tác trên **Google Drive** + **Google Sheet OPS**.

## Ba nơi, ba vai trò
| Nơi | Ai dùng | Làm gì |
|---|---|---|
| Drive `Smart-Guarantee/TEMPLATE_GOC/` | BA | **Nơi DUY NHẤT sửa mẫu.** Mở file Word, sửa, lưu. Thêm mẫu = thả file vào. |
| Sheet OPS › tab **MAU_THU** | BA | **Bảng mã hoá mẫu**: mã mẫu, tên hiển thị, loại BL, bộ mẫu, lĩnh vực, liên danh, giấy/điện tử, bật/tắt. |
| Drive `Smart-Guarantee/TEMPLATE/` | Hệ thống | Bản máy sinh (mẫu có slot). **Không sửa tay** — mỗi lần cập nhật sẽ bị ghi lại. |

Sheet OPS › tab **SLOT_REVIEW**: từng chỗ trống của từng mẫu được hệ thống hiểu là trường gì (vd `[ghi rõ giá trị…]` sau "khoản tiền tạm ứng" → *số tiền tạm ứng*). BA rà khi thêm/sửa mẫu.

## Sửa một mẫu
1. Mở file trong `TEMPLATE_GOC` (đường dẫn có ở cột `duong_dan` của MAU_THU) → sửa bằng Word → lưu.
2. Chỗ cần điền: viết như mẫu hiện có — `[ghi tên Chủ đầu tư]`, `___ [ghi rõ giá trị bằng số, bằng chữ…]`, `ngày___ tháng___ năm___`, `…………`, hoặc biến `«$ND001»`.
3. Hệ thống tự áp dụng lúc **2h sáng**; muốn áp dụng ngay: admin bấm **⟳ Cập nhật mẫu** trên ứng dụng.
4. Xem cột `trang_thai` của mẫu vừa sửa:
   - `OK` — đã dùng bản mới.
   - `⚠ n chỗ trống chưa nhận diện (…) — đang dùng bản cũ` — hệ thống **không đoán được** chỗ trống mới là trường gì nên **giữ bản cũ** (không ảnh hưởng người dùng). Sửa cách viết chỗ trống theo mẫu có sẵn, hoặc báo đội phát triển thêm luật nhận diện.

## Thêm mẫu mới
1. Thả file `.docx` vào thư mục phù hợp trong `TEMPLATE_GOC` (vd `Mẫu thường/Liên danh - Thư điện tử/`).
2. Bấm **⟳ Cập nhật mẫu** (hoặc chờ 2h sáng) → MAU_THU tự thêm 1 dòng:
   - Tên file theo quy ước (`[LD_]<BL>_TV_<Bộ mẫu>[_<Lĩnh vực>][ (biến thể)].docx`, hoặc `(BLOL) … TT79.docx`) → tự điền mã + các cột, **dùng ngay**.
   - Tên file tự do → dòng mới `active = FALSE`, trạng thái nhắc BA **điền `loai_bl`, `bo_mau`** (và lĩnh vực, liên danh, hình thức) rồi đặt `active = TRUE` → bấm cập nhật lần nữa.

## Tắt / sửa thông tin một mẫu
- Tắt: đặt `active = FALSE` → cập nhật → mẫu biến khỏi danh sách chọn của cán bộ (file gốc vẫn còn).
- Sửa tên hiển thị / chiều phân loại (dùng để AI chọn mẫu): sửa trực tiếp ô trong MAU_THU (các cột mã có danh sách thả xuống) → cập nhật.
- **Không sửa `ma_mau`** của mẫu đã dùng (hồ sơ cũ tham chiếu mã này) và không sửa `file_id`.
- Đổi tên / di chuyển file trong `TEMPLATE_GOC`: thoải mái — hệ thống nhận file theo ID, không theo tên.

## Mã mẫu
`<Loại BL>-<Bộ mẫu>[-<Lĩnh vực>][-<Số túi>][-<Biến thể>]-<LD|KO>-<E|G>` — vd `BLTU-T22-XL-LD-E` = BL hoàn trả tạm ứng · TT22 · xây lắp · liên danh · thư điện tử; `BLDT-TT79-HH-1T-KO-G` = BL dự thầu TT79 · hàng hoá · 1 túi hồ sơ · độc lập · thư giấy.
