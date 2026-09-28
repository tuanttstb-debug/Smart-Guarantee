#!/usr/bin/env node
/**
 * sync-core.js — sao gas/Core.gs (nguồn chuẩn) → assets/js/core.js cho FE dùng cùng logic
 * (đọc số, chuẩn hoá, render slot xem trước). Chạy sau mỗi lần sửa Core.gs:  node tools/sync-core.js
 * `--check`: chỉ kiểm hai file đồng bộ (thoát 1 nếu lệch) — dùng trước khi commit.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'gas', 'Core.gs');
const dst = path.join(__dirname, '..', 'assets', 'js', 'core.js');
const header = '/* ⚠️ FILE SINH TỰ ĐỘNG từ gas/Core.gs — KHÔNG sửa tay. Chạy: node tools/sync-core.js */\n';
const want = header + fs.readFileSync(src, 'utf8');
if (process.argv.includes('--check')) {
  const have = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : '';
  if (have !== want) { console.error('✗ assets/js/core.js lệch gas/Core.gs — chạy node tools/sync-core.js'); process.exit(1); }
  console.log('✓ core.js đồng bộ');
} else {
  fs.writeFileSync(dst, want);
  console.log('✓ đã sinh assets/js/core.js');
}
