#!/usr/bin/env node
/**
 * build-registry.js — sinh TEMPLATE_REGISTRY.csv từ corpus thật `Tham khao/`.
 *
 * Nguồn:
 *   - Offline: `Tham khao/.{Độc lập|Liên danh} (template thư {điện tử|giấy})` (96 .docx)
 *   - Online B8ZB: `Tham khao/B8ZB/Thư {điện tử|giấy}/Mẫu {Độc lập|Liên danh}/{TT06-07|TT22|TT40|TT79}`
 *
 * Quy tắc (TEMPLATE_SELECTION.md §3, §7):
 *   - offline: [LD_]<BL>_<Lang>_<Tmpl>[_<Sector>][ (variant)] ; folder → method + JV.
 *   - B8ZB:   (BLOL) <lĩnh vực/loại HĐ> - <số túi> HO SO - <ĐỘC LẬP|LIÊN DANH> <TTxx>.
 *   - Chỉ TT79 active=true; TT06-07/TT22/TT40 active=false (giữ để classify); Archive/old-thô = loại bỏ.
 *   - Bỏ file Word lock `~$...`.
 *
 * Output: config/TEMPLATE_REGISTRY.csv  (import vào Google Sheet — xem config/README.md).
 * Chạy:   node tools/build-registry.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REF = path.resolve(__dirname, '..', 'Tham khao');
const OUT = path.resolve(__dirname, '..', 'config', 'TEMPLATE_REGISTRY.csv');

const COLS = [
  'template_id', 'source', 'currency', 'guarantee_type', 'method', 'language',
  'template_type', 'sector', 'circular', 'joint_venture', 'envelope',
  'validity_allowed', 'template_file', 'folder', 'active',
];

const TMPL_NORM = { TT22: 'T22', TT07: 'T07', TT40: 'T40' }; // filename → schema code
const isLock = (n) => n.startsWith('~$');
const isDocx = (n) => n.toLowerCase().endsWith('.docx');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && isDocx(e.name) && !isLock(e.name)) out.push(p);
  }
  return out;
}

function relFolder(file) {
  return path.relative(REF, path.dirname(file)).replace(/\\/g, '/');
}

// ── Offline validity theo §5 ──
function offlineValidity(goType, tmpl, variant) {
  if (tmpl === 'TPB') {
    if (goType === 'BLTU') return /5/.test(variant) ? '5' : '1,2';
    return '1,2';
  }
  return goType === 'BLTU' ? '1-5' : '1-4';
}

function parseOffline(file, seq) {
  const folder = relFolder(file);
  const jv = folder.includes('Liên danh') ? 'LD' : 'KO';
  const method = folder.includes('điện tử') ? 'ĐT' : 'TG';
  let base = path.basename(file, '.docx');
  const vm = base.match(/\(([^)]*)\)/);
  const variant = vm ? vm[1].trim() : '';
  base = base.replace(/\([^)]*\)/g, '').trim().replace(/_+$/, '');
  base = base.replace(/^LD_/, '');
  const parts = base.split('_');
  const goType = parts[0] || '';
  const language = parts[1] || 'TV';
  const tmplRaw = parts[2] || '';
  const tmpl = TMPL_NORM[tmplRaw] || tmplRaw;
  const sector = parts.slice(3).join('_') || '';
  return {
    template_id: 'OFF-' + String(seq).padStart(3, '0'),
    source: 'OFFLINE', currency: 'VND', guarantee_type: goType, method, language,
    template_type: tmpl, sector, circular: '', joint_venture: jv, envelope: '',
    validity_allowed: offlineValidity(goType, tmpl, variant),
    template_file: path.basename(file), folder, active: 'true',
  };
}

const ENVELOPE = { 'MOT TUI': '1 túi', 'HAI TUI': '2 túi' };

function parseB8zb(file, seq) {
  const folder = relFolder(file);
  const method = folder.includes('Thư điện tử') ? 'ĐT' : 'TG';
  const jv = folder.includes('Liên danh') ? 'LD' : 'KO';
  const cm = folder.match(/(TT06-07|TT22|TT40|TT79)/);
  const circular = cm ? cm[1] : '';
  const name = path.basename(file, '.docx');
  let sector = '', envelope = '';
  const m = name.match(/^\(BLOL\)\s*(.+?)\s*-\s*(.+?)\s*HO SO\s*-\s*(?:DOC LAP|LIEN DANH)/i);
  if (m) {
    sector = m[1].trim();
    envelope = ENVELOPE[m[2].trim().toUpperCase()] || m[2].trim();
  } else {
    sector = '(xem template_file)';
  }
  return {
    template_id: 'B8ZB-' + String(seq).padStart(3, '0'),
    source: 'ONLINE_B8ZB', currency: 'VND', guarantee_type: 'BLDT', method, language: 'TV',
    template_type: 'B8ZB', sector, circular, joint_venture: jv, envelope,
    validity_allowed: '', template_file: path.basename(file), folder,
    active: circular === 'TT79' ? 'true' : 'false',
  };
}

function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function main() {
  // Offline: 4 thư mục dot-prefixed ở root Tham khao.
  const offlineDirs = fs.readdirSync(REF, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('.') && e.name.includes('template'))
    .map((e) => path.join(REF, e.name));
  const offlineFiles = offlineDirs.flatMap(walk).sort();

  // B8ZB: bỏ Archive + old - thô.
  const b8zbFiles = walk(path.join(REF, 'B8ZB'))
    .filter((f) => !/Archive|old - thô/i.test(f)).sort();

  const rows = [];
  offlineFiles.forEach((f, i) => rows.push(parseOffline(f, i + 1)));
  b8zbFiles.forEach((f, i) => rows.push(parseB8zb(f, i + 1)));

  const lines = [COLS.join(',')];
  rows.forEach((r) => lines.push(COLS.map((c) => csvCell(r[c])).join(',')));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');

  // Thống kê
  const activeCnt = rows.filter((r) => r.active === 'true').length;
  const byCirc = {};
  rows.filter((r) => r.source === 'ONLINE_B8ZB').forEach((r) => { byCirc[r.circular] = (byCirc[r.circular] || 0) + 1; });
  console.log('TEMPLATE_REGISTRY.csv:', rows.length, 'rows ->', OUT);
  console.log('  offline:', offlineFiles.length, '| B8ZB:', b8zbFiles.length, '| active:', activeCnt);
  console.log('  B8ZB theo circular:', JSON.stringify(byCirc));
}

main();
