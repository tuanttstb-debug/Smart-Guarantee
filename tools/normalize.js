#!/usr/bin/env node
/**
 * normalize.js — chạy bộ chuẩn hoá mẫu (gas/Normalize.gs + gas/Registry.gs — CÙNG mã với GAS) trên máy.
 *
 * Nguồn: Tham khao/ (thư viện gốc, local-only) + config/TEMPLATE_REGISTRY.csv (active=true, 168 mẫu).
 * Đầu ra (build/, không commit):
 *   templates/<ma_mau>.docx   mẫu có slot            catalog.json      danh mục + slot + xem trước
 *   slots_review.csv          bảng rà soát slot      sg_goc.zip        gói chuyển đổi lần đầu lên Drive
 *                                                                        (TEMPLATE_GOC/… + manifest.json)
 * Chạy: node tools/normalize.js [--strict] [--compare]
 *   --strict : thoát 1 nếu còn chỗ trống chưa gắn slot
 *   --compare: đối chiếu slot + xem trước với build/catalog.py.json (bản Python cũ) nếu có
 */
'use strict';
const fs = require('fs');
const path = require('path');
const AdmZip = require(path.join(__dirname, 'gas-sim', 'node_modules', 'adm-zip'));
const N = require(path.join(__dirname, '..', 'gas', 'Normalize.gs'));
const R = require(path.join(__dirname, '..', 'gas', 'Registry.gs'));

const ROOT = path.join(__dirname, '..');
const REF = path.join(ROOT, 'Tham khao');
const OUT = path.join(ROOT, 'build');

function readCsv(p) {
  const lines = fs.readFileSync(p, 'utf8').trim().split(/\r?\n/);
  const head = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const cells = []; let cur = '', q = false;
    for (const ch of l) {
      if (ch === '"') q = !q; else if (ch === ',' && !q) { cells.push(cur); cur = ''; } else cur += ch;
    }
    cells.push(cur);
    const o = {}; head.forEach((h, i) => { o[h] = cells[i] || ''; }); return o;
  });
}

/** Thư mục đích trên Drive TEMPLATE_GOC cho 1 dòng registry (cây gọn, dễ đọc cho BA). */
function gocFolder(r) {
  const kind = (r.joint_venture === 'LD' ? 'Liên danh' : 'Độc lập') + ' - ' + (r.method === 'ĐT' ? 'Thư điện tử' : 'Thư giấy');
  return (r.source === 'ONLINE_B8ZB' ? 'BLDT TT79' : 'Mẫu thường') + '/' + kind;
}

/** Chuẩn hoá 1 file docx (Buffer) → { buf, slots, preview, report, unmapped }. */
function normalizeDocx(buf) {
  const zin = new AdmZip(buf), parts = {};
  zin.getEntries().forEach((e) => { if (N.wantsPart(e.entryName)) parts[e.entryName] = e.getData().toString('utf8'); });
  const r = N.normalizeParts(parts);
  const zout = new AdmZip();
  zin.getEntries().forEach((e) => {
    if (e.isDirectory || N.dropsPart(e.entryName)) return;
    zout.addFile(e.entryName, r.parts[e.entryName] != null ? Buffer.from(r.parts[e.entryName], 'utf8') : e.getData());
  });
  return Object.assign({ buf: zout.toBuffer() }, r);
}

function main() {
  const strict = process.argv.includes('--strict');
  const compare = process.argv.includes('--compare');
  fs.mkdirSync(path.join(OUT, 'templates'), { recursive: true });
  const rows = readCsv(path.join(ROOT, 'config', 'TEMPLATE_REGISTRY.csv')).filter((r) => r.active === 'true');
  const taken = {}, catalog = [], review = [], manifest = [], idMap = {};
  const goc = new AdmZip();
  let unmapped = 0;
  rows.forEach((r) => {
    const src = path.join(REF, r.folder, r.template_file);
    if (!fs.existsSync(src)) { console.log('THIẾU', src); return; }
    const folder = gocFolder(r);
    const meta = R.inferMeta(folder, r.template_file);
    if (!meta.parsed) console.log('  ⚠ tên file chưa theo quy ước:', r.template_file);
    const code = R.makeCode(meta, taken);
    idMap[r.template_id] = code;
    const buf = fs.readFileSync(src);
    const n = normalizeDocx(buf);
    unmapped += n.unmapped;
    fs.writeFileSync(path.join(OUT, 'templates', code + '.docx'), n.buf);
    n.report.forEach((x) => review.push([code, x.slot, x.left, x.blank, x.right]));
    const entry = {
      id: code, label: R.labelOf(meta), guarantee_type: meta.loai_bl, template_type: meta.bo_mau,
      method: meta.hinh_thuc, joint_venture: meta.lien_danh, sector: meta.linh_vuc, envelope: meta.so_tui,
      variant: meta.bien_the, slots: n.slots, preview: n.preview,
    };
    catalog.push(entry);
    goc.addFile('TEMPLATE_GOC/' + folder + '/' + r.template_file, buf);
    manifest.push(Object.assign({ ma_mau: code, ten_mau: entry.label, folder, file: r.template_file }, meta));
  });
  goc.addFile('manifest.json', Buffer.from(JSON.stringify(manifest), 'utf8'));
  goc.writeZip(path.join(OUT, 'sg_goc.zip'));
  fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify({ version: 3, templates: catalog }));
  const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  fs.writeFileSync(path.join(OUT, 'slots_review.csv'), '﻿ma_mau,slot,left,blank,right\n' + review.map((r) => r.map(esc).join(',')).join('\n'));

  const freq = {};
  catalog.forEach((t) => t.slots.forEach((s) => { freq[s] = (freq[s] || 0) + 1; }));
  console.log('mẫu:', catalog.length, '| chỗ trống:', review.length, '| chưa gắn slot:', unmapped, '| mã trùng tên:', Object.keys(taken).length === catalog.length ? 0 : 'CÓ');

  if (compare) {
    const pyPath = path.join(OUT, 'catalog.py.json');
    if (!fs.existsSync(pyPath)) { console.log('Không có build/catalog.py.json để so'); } else {
      const py = JSON.parse(fs.readFileSync(pyPath, 'utf8')).templates;
      let diffSlots = 0, diffPrev = 0;
      py.forEach((t) => {
        const js = catalog.find((x) => x.id === idMap[t.id]);
        if (!js) { console.log('  thiếu', t.id); diffSlots++; return; }
        if (JSON.stringify(js.slots) !== JSON.stringify(t.slots)) { diffSlots++; console.log('  slot lệch', t.id, js.id, '\n    py', t.slots.join(','), '\n    js', js.slots.join(',')); }
        const a = t.preview.map((p) => p.t + '|' + p.a + '|' + p.b).join('\n'), b = js.preview.map((p) => p.t + '|' + p.a + '|' + p.b).join('\n');
        if (a !== b) {
          diffPrev++;
          if (diffPrev <= 3) {
            const al = a.split('\n'), bl = b.split('\n');
            for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) { console.log('  preview lệch', t.id, '#' + i, '\n    py', al[i], '\n    js', bl[i]); break; }
          }
        }
      });
      console.log('so với Python: slot lệch', diffSlots, '| xem trước lệch', diffPrev, '/', py.length);
    }
  }
  if (strict && unmapped) process.exit(1);
}

main();
