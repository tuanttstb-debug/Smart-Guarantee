#!/usr/bin/env python3
"""
ui_smoke.py — kiểm thử giao diện ở chế độ demo (?mock=1) bằng Playwright + Chrome cài sẵn.
Luồng: đăng nhập → chọn tệp → phân tích → rà soát (sửa trường) → đổi mẫu → xem trước → xuất.
Chụp màn hình vào build/ui/. Bắt lỗi JS console. Thoát 1 nếu có bước hỏng.

Chạy: PYTHONUTF8=1 python tools/ui_smoke.py   (tự bật http.server cổng 8765)
"""
import functools
import http.server
import os
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build", "ui")
os.makedirs(OUT, exist_ok=True)


def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    h.log_message = lambda *a: None
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 8765), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


def main():
    srv = serve()
    errors, fails = [], []

    def check(name, cond):
        print(("  ✓ " if cond else "  ✗ ") + name)
        if not cond:
            fails.append(name)

    sample = os.path.join(OUT, "sample.pdf")
    with open(sample, "wb") as f:
        f.write(b"%PDF-1.4\n% demo\n")
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        for vw, tag in ((1366, "desk"), (390, "mobile")):
            page = b.new_page(viewport={"width": vw, "height": 900}, accept_downloads=True)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.goto("http://127.0.0.1:8765/index.html?mock=1")
            page.wait_for_selector("#loginView:not(.d-none)")
            page.screenshot(path=os.path.join(OUT, tag + "_0_login.png"))
            page.fill("#loginUser", "demo")
            page.fill("#loginPass", "x")
            page.click("#loginBtn")
            page.wait_for_selector("#appView:not(.d-none)")
            check(tag + ": đăng nhập", page.is_visible("#step1"))
            page.set_input_files("#fileInput", sample)
            check(tag + ": nhận tệp", page.is_enabled("#analyzeBtn"))
            page.screenshot(path=os.path.join(OUT, tag + "_1_upload.png"), full_page=True)
            page.click("#analyzeBtn")
            page.wait_for_selector("#step2:not(.d-none)", timeout=15000)
            check(tag + ": sang bước 2", page.is_visible("#fieldForm .sg-field"))
            check(tag + ": có mẫu đề xuất", page.input_value("#tplSelect") == "DEMO-01")
            check(tag + ": đánh dấu thiếu ben_addr", page.locator('[data-row="ben_addr"].is-miss').count() == 1)
            page.fill("#f_ben_addr", "Số 1 đường A")
            check(tag + ": hết thiếu sau khi nhập", page.locator('[data-row="ben_addr"].is-miss').count() == 0)
            words = page.inner_text('[data-words="amount"]')
            check(tag + ": đọc số thành chữ", "Một tỷ năm trăm triệu đồng" in words)
            page.click(".sg-ev >> nth=0")
            page.screenshot(path=os.path.join(OUT, tag + "_2_review.png"), full_page=True)
            page.click("text=Xem trước thư →")
            page.wait_for_selector("#step3:not(.d-none)")
            check(tag + ": xem trước có giá trị", "CÔNG TY MẪU A" in page.inner_text("#paper"))
            check(tag + ": còn 1 ô trống (hết hạn)", page.locator("#paper .sg-pv-miss").count() == 1)
            check(tag + ": nút xuất khoá khi chưa xác nhận", page.is_disabled("#generateBtn"))
            page.check("#confirmReview")
            check(tag + ": vẫn khoá khi còn ô trống", page.is_disabled("#generateBtn"))
            page.check("#allowMissing")
            page.screenshot(path=os.path.join(OUT, tag + "_3_preview.png"), full_page=True)
            with page.expect_download() as dl:
                page.click("#generateBtn")
            d = dl.value
            check(tag + ": tải file", d.suggested_filename.startswith("DEMO-"))
            page.wait_for_selector("#generateStatus .sg-ok")
            # đổi mẫu thủ công
            page.click("#stepper li[data-step='2']")
            page.click("#tplBrowseBtn")
            page.click("#browseList button[data-id='DEMO-02']")
            check(tag + ": đổi mẫu tay", page.input_value("#tplSelect") == "DEMO-02")
            page.close()
        b.close()
    srv.shutdown()
    real_err = [e for e in errors if "favicon" not in e]
    check("không lỗi JS console", not real_err)
    for e in real_err:
        print("    JS:", e)
    print("✓ UI OK" if not fails else "✗ %d bước hỏng" % len(fails))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
