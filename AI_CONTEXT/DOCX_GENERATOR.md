# DOCX GENERATOR — Smart Guarantee

> Sinh thư tại **GAS** theo **3 route**, ứng với **2 hệ biến**: online B8ZB dùng `$ND` MERGEFIELD, offline/KH dùng `[...]` + segmentation. Bài toán lõi: `VARIABLE_SEGMENTATION.md`. Danh mục $ND: `TPB_VARIABLES.md`.

## Ba nhánh (route)

### Route ONLINE_B8ZB — BLDT online (mẫu chuẩn `$ND`)
```
chọn template B8ZB theo circular=TT79 + envelope + lĩnh vực (TEMPLATE_REGISTRY §7)
   → file .docx trong /TEMPLATE (nguồn: Tham khao/B8ZB/, chỉ TT79)
   → điền MERGEFIELD «$ND001»… bằng giá trị biến → DOCX
```

### Route OFFLINE — mẫu chuẩn offline (`[...]`)
`VND + TV + method∈{TG,ĐT} + type∈{TPB,T22,T07,T40,EVN,VIT}`.
```
chọn template (TEMPLATE_REGISTRY offline) → file .docx (Tham khao/ gốc)
   → replace [...] bằng giá trị biến → DOCX
```

### Route KH_UPLOAD — mẫu khách hàng (case chính PoC)
```
thư KH upload = chính KHUNG
   → dùng Segmentation (Step 3) đánh dấu span BIẾN
   → điền/để mở BIẾN, giữ nguyên KHUNG của KH → DOCX "sát thư KH"
```

## Cơ chế điền
- **ONLINE_B8ZB:** template chứa Word **MERGEFIELD** `«$NDxxx»` → thay bằng giá trị (giữ MERGEFORMAT). Chỉ sinh theo **TT79** (thế hệ cũ classify-only).
- **OFFLINE:** cụm mô tả `[ghi tên Chủ đầu tư]`, `[……]`… (từ điển `VARIABLE_SEGMENTATION.md` §4).
- **KH_UPLOAD:** offset/span từ Segmentation, thay đúng đoạn BIẾN, **không đụng KHUNG**.

## Chọn template chuẩn
Từ `TEMPLATE_REGISTRY` theo tổ hợp chiều (`TEMPLATE_SELECTION.md`) → `template_file` + `folder`. Offline: 4 thư mục (Độc lập/Liên danh × giấy/điện tử), prefix `LD_` = liên danh. Online B8ZB: thêm circular (TT79) + envelope (1/2 túi).

## Hướng triển khai (PoC — nhanh/rẻ)
- **Ứng viên A:** Google Doc + `DocumentApp.replaceText(...)` → export DOCX (nhanh, thuần Google). Lưu ý escape ký tự đặc biệt trong `[...]`.
- **Ứng viên B:** thư viện docx (giữ format phức tạp) — chỉ nếu cần. Chốt Phase 3, ưu tiên A.

## Ràng buộc chất lượng
- **Giữ nguyên format** (font, bảng, xuống dòng) — chỉ thay text BIẾN.
- Biến thiếu giá trị → để placeholder rõ ràng + cảnh báo Validation (Step 7), không hỏng file.
- Kiểm **sót biến** (`[...]` hoặc `«$ND...»` còn lại) trước khi trả download.
- Route KH_UPLOAD: đo độ "sát thư KH" (giữ khung) — tiêu chí demo cốt lõi.

## Đầu ra
`/OUTPUT/<doc_id>.docx` + `download_url` (xem `API_CONTRACT.md` `action=generate`).
