/**
 * sim.js — giả lập tối thiểu runtime Google Apps Script (Drive/Sheet/Cache/Properties/Utilities…)
 * đủ để chạy backend gas/*.gs trên Node và test end-to-end. Dữ liệu trong bộ nhớ.
 * KHÔNG phải bản sao đầy đủ API — chỉ các hàm backend đang dùng.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

const toSigned = (buf) => Array.from(buf, (b) => (b > 127 ? b - 256 : b));
const toBuf = (arr) => Buffer.from(arr.map((b) => b & 0xff));

class Blob {
  constructor(buf, type, name) { this.buf = Buffer.from(buf || []); this.type = type || ''; this.name = name || ''; }
  getBytes() { return toSigned(this.buf); }
  getDataAsString() { return this.buf.toString('utf8'); }
  setDataFromString(s) { this.buf = Buffer.from(s, 'utf8'); return this; }
  getName() { return this.name; }
  setName(n) { this.name = n; return this; }
  getContentType() { return this.type; }
  setContentType(t) { this.type = t; return this; }
  copyBlob() { return new Blob(this.buf, this.type, this.name); }
  getBlob() { return this; }
}

let idSeq = 0;
const newId = (p) => p + (++idSeq).toString(36) + crypto.randomBytes(4).toString('hex');

class File {
  constructor(blob, folder) { this.id = newId('f'); this.blob = blob; this.folder = folder; this.trashed = false; this.updated = new Date(); }
  getId() { return this.id; }
  getName() { return this.blob.name; }
  getBlob() { return this.blob.copyBlob(); }
  setTrashed(t) { this.trashed = t; return this; }
  setContent(s) { this.blob.setDataFromString(s); this.updated = new Date(); return this; }
  touch(buf) { this.blob = new Blob(buf, this.blob.type, this.blob.name); this.updated = new Date(Date.now() + 1000); }
  getLastUpdated() { return this.updated; }
}
function iter(arr) { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; }

class Folder {
  constructor(name, drive) { this.id = newId('d'); this.name = name; this.children = []; this.files = []; drive.folders[this.id] = this; this.drive = drive; }
  getId() { return this.id; }
  getName() { return this.name; }
  getFoldersByName(n) { return iter(this.children.filter((c) => c.name === n)); }
  getFolders() { return iter(this.children.slice()); }
  setName(n) { this.name = n; return this; }
  createFolder(n) { const f = new Folder(n, this.drive); this.children.push(f); return f; }
  live() { return this.files.filter((f) => !f.trashed); }
  getFilesByName(n) { return iter(this.live().filter((f) => f.getName() === n)); }
  getFiles() { return iter(this.live()); }
  createFile(a, content, mime) {
    const blob = a instanceof Blob ? a.copyBlob() : new Blob(Buffer.from(content, 'utf8'), mime, a);
    const f = new File(blob, this); this.files.push(f); this.drive.files[f.id] = f; return f;
  }
}

class Sheet {
  constructor(name) { this.name = name; this.rows = []; }
  getDataRange() { const rows = this.rows; return { getValues: () => rows.map((r) => r.slice()) }; }
  appendRow(r) { this.rows.push(r.slice()); }
  getLastRow() { return this.rows.length; }
  setFrozenRows() {}
  getRange(a, c, nr, nc) {
    const sh = this;
    if (typeof a === 'string') { // 'A:A'
      return { createTextFinder: (x) => ({ matchEntireCell: () => ({ findNext: () => {
        const i = sh.rows.findIndex((r) => String(r[0]) === String(x)); return i < 0 ? null : { getRow: () => i + 1 };
      } }) }) };
    }
    const row = a, col = c;
    return {
      setValue: (v) => { while (sh.rows.length < row) sh.rows.push([]); sh.rows[row - 1][col - 1] = v; },
      getValue: () => ((sh.rows[row - 1] || [])[col - 1] ?? ''),
      setValues: (vals) => { vals.forEach((vr, i) => vr.forEach((v, j) => { while (sh.rows.length < row + i) sh.rows.push([]); sh.rows[row - 1 + i][col - 1 + j] = v; })); return { setFontWeight() {} }; },
      clearContent: () => { for (let i = 0; i < (nr || 1); i++) { const r = sh.rows[row - 1 + i]; if (r) for (let j = 0; j < (nc || 1); j++) r[col - 1 + j] = ''; } while (sh.rows.length > 1 && sh.rows[sh.rows.length - 1].every((c) => c === '' || c == null)) sh.rows.pop(); },
      getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const r = sh.rows[row - 1 + i] || []; const o = []; for (let j = 0; j < (nc || 1); j++) o.push(r[col - 1 + j] ?? ''); out.push(o); } return out; },
    };
  }
}
class Spreadsheet {
  constructor(name) { this.id = newId('s'); this.name = name; this.sheets = [new Sheet('Sheet1')]; }
  getId() { return this.id; }
  getUrl() { return 'https://sheet/' + this.id; }
  getSheets() { return this.sheets; }
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
  insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s; }
  deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
}

function createRuntime(opts) {
  opts = opts || {};
  const drive = { folders: {}, files: {}, roots: [] };
  const props = Object.assign({}, opts.props || {});
  const cache = {};
  const sheets = {};
  const logs = [];
  const gdocs = {};
  const triggers = [];

  const ctx = {
    console: { log: (...a) => logs.push(a.join(' ')), warn: (...a) => logs.push('WARN ' + a.join(' ')), error: (...a) => logs.push('ERR ' + a.join(' ')) },
    Logger: { log: (s) => logs.push(String(s)) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); },
    }) },
    CacheService: { getScriptCache: () => ({
      get: (k) => (cache[k] && cache[k].exp > Date.now() ? cache[k].v : null),
      put: (k, v, ttl) => { if (String(v).length > 100 * 1024) throw new Error('Argument too large'); cache[k] = { v: String(v), exp: Date.now() + (ttl || 600) * 1000 }; },
      remove: (k) => { delete cache[k]; },
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => 'Asia/Ho_Chi_Minh' },
    ScriptApp: {
      getOAuthToken: () => 'sim-token',
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: (t) => { const i = triggers.indexOf(t); if (i >= 0) triggers.splice(i, 1); },
      newTrigger: (fn) => { const b = { timeBased: () => b, after: () => b, everyDays: () => b, atHour: () => b,
        create: () => { const t = { getHandlerFunction: () => fn }; triggers.push(t); return t; } }; return b; },
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ setMimeType() { return this; }, getContent: () => s }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      getUuid: () => crypto.randomUUID(),
      sleep() {},
      base64Encode: (x) => (typeof x === 'string' ? Buffer.from(x, 'utf8') : toBuf(x)).toString('base64'),
      base64Decode: (s) => toSigned(Buffer.from(s, 'base64')),
      computeDigest: (alg, s) => toSigned(crypto.createHash(alg).update(Buffer.from(s, 'utf8')).digest()),
      formatDate: (d, tz, fmt) => {
        const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(d);
        const g = (t) => p.find((x) => x.type === t).value;
        return fmt.replace('yyyy', g('year')).replace('MM', g('month')).replace('dd', g('day')).replace('HH', g('hour')).replace('mm', g('minute')).replace('ss', g('second'));
      },
      newBlob: (data, type, name) => new Blob(typeof data === 'string' ? Buffer.from(data, 'utf8') : (Array.isArray(data) ? toBuf(data) : data), type, name),
      unzip: (blob) => new AdmZip(blob.buf).getEntries().filter((e) => !e.isDirectory).map((e) => new Blob(e.getData(), '', e.entryName)),
      zip: (blobs, name) => { const z = new AdmZip(); blobs.forEach((b) => z.addFile(b.getName(), b.buf)); return new Blob(z.toBuffer(), 'application/zip', name); },
    },
    DriveApp: {
      getFolderById: (id) => { if (!drive.folders[id]) throw new Error('No folder ' + id); return drive.folders[id]; },
      getFoldersByName: (n) => iter(drive.roots.filter((f) => f.name === n)),
      createFolder: (n) => { const f = new Folder(n, drive); drive.roots.push(f); return f; },
      getFileById: (id) => drive.files[id] || { setTrashed() {} },
    },
    SpreadsheetApp: {
      create: (n) => { const s = new Spreadsheet(n); sheets[s.id] = s; return s; },
      openById: (id) => { if (!sheets[id]) throw new Error('No sheet ' + id); return sheets[id]; },
    },
    DocumentApp: { openById: (id) => ({ getBody: () => ({ getText: () => gdocs[id] || '' }) }) },
    UrlFetchApp: { fetch: (url, o) => {
      if (url.indexOf('googleapis.com/upload/drive') >= 0) {
        const id = newId('g'); gdocs[id] = opts.ocrText || ''; drive.files[id] = { setTrashed() {} };
        return resp(200, JSON.stringify({ id }));
      }
      if (url.indexOf('/v1/workflows/run') >= 0) {
        const r = opts.dify ? opts.dify(JSON.parse(o.payload)) : { status: 500, body: 'no dify' };
        return resp(r.status, typeof r.body === 'string' ? r.body : JSON.stringify(r.body));
      }
      throw new Error('UrlFetch không giả lập: ' + url);
    } },
  };
  function resp(code, text) { return { getResponseCode: () => code, getContentText: () => text }; }
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const dir = path.join(__dirname, '..', '..', 'gas');
  const src = fs.readdirSync(dir).filter((f) => f.endsWith('.gs')).sort()
    .map((f) => '// ── ' + f + '\n' + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  vm.runInContext(src, ctx, { filename: 'gas-bundle.js' });
  return { ctx, drive, props, logs, Blob, triggers,
    call: (action, body) => JSON.parse(ctx.doPost({ parameter: { action }, postData: { contents: JSON.stringify(body || {}) } }).getContent()),
  };
}

module.exports = { createRuntime, Blob };
