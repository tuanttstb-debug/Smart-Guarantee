#!/usr/bin/env bash
# check.sh — chạy toàn bộ kiểm thử trước khi deploy/commit. Dừng ở lỗi đầu tiên.
# Cần: Node, Python + playwright (UI), thư mục Tham khao/ (mẫu gốc, local-only).
set -euo pipefail
cd "$(dirname "$0")/.."
export PYTHONUTF8=1
echo "== 1. Chuẩn hoá thư viện mẫu (strict)"; (cd tools/gas-sim && [ -d node_modules ] || npm install --silent); node tools/normalize.js --strict | tail -1
echo "== 2. Lõi Core.gs";            node tools/test-core.js
echo "== 3. core.js FE đồng bộ";     node tools/sync-core.js --check
echo "== 4. Backend GAS (giả lập)";  (cd tools/gas-sim && node e2e.js | tail -1)
echo "== 5. Giao diện (demo mode)";  python tools/ui_smoke.py 2>/dev/null | tail -1
echo "✓ Tất cả đạt"
