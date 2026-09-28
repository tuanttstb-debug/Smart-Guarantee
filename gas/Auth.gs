/**
 * Auth.gs — đăng nhập tài khoản ứng dụng (sheet USERS) + phiên (CacheService).
 *
 * Vì sao không dùng Google Sign-In: cán bộ TPBank dùng M365, không chắc có tài khoản Google;
 * Web App chạy "Execute as Me" nên không lấy được email người dùng ngoài domain.
 * → Tài khoản ứng dụng do admin cấp (adminSetUser chạy từ editor), mật khẩu băm SHA-256 có salt.
 *
 * USERS: username | display_name | branch_name | role(user|admin) | active | salt | pass_hash | last_login
 */
var LOGIN_MAX_FAIL = 5;           // khoá 15' sau 5 lần sai
var LOGIN_LOCK_SECONDS = 900;
var HASH_ROUNDS = 300;

function handleLogin_(body) {
  var username = String(body.username || '').trim().toLowerCase();
  var password = String(body.password || '');
  if (!username || !password) throw err_('AUTH_FAILED', 'Nhập tên đăng nhập và mật khẩu');

  var cache = CacheService.getScriptCache();
  var failKey = 'sg_fail_' + username;
  var fails = Number(cache.get(failKey) || 0);
  if (fails >= LOGIN_MAX_FAIL) throw err_('AUTH_LOCKED', 'Tài khoản tạm khoá 15 phút do nhập sai nhiều lần');

  var row = findUser_(username);
  if (!row || String(row.rec.active).toLowerCase() !== 'true' ||
      hashPassword_(password, String(row.rec.salt)) !== String(row.rec.pass_hash)) {
    cache.put(failKey, String(fails + 1), LOGIN_LOCK_SECONDS);
    throw err_('AUTH_FAILED', 'Sai tên đăng nhập hoặc mật khẩu');
  }
  cache.remove(failKey);

  var user = {
    username: username,
    display_name: String(row.rec.display_name || username),
    branch_name: String(row.rec.branch_name || ''),
    role: String(row.rec.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user',
  };
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put('sg_sess_' + token, JSON.stringify(user), SG.sessionSeconds());
  try { row.sheet.getRange(row.rowIndex, row.col.last_login + 1).setValue(new Date()); } catch (_) {}
  return { ok: true, token: token, user: user, branches: listBranches_(), expires_in: SG.sessionSeconds() };
}

function handleLogout_(body) {
  if (body.token) CacheService.getScriptCache().remove('sg_sess_' + body.token);
  return { ok: true };
}

function handleMe_(user) {
  return { ok: true, user: user, branches: listBranches_() };
}

/** Lấy user từ token phiên; lỗi AUTH_REQUIRED nếu hết hạn/không có. */
function requireUser_(body) {
  var token = body && body.token;
  if (!token) throw err_('AUTH_REQUIRED', 'Chưa đăng nhập');
  var raw = CacheService.getScriptCache().get('sg_sess_' + token);
  if (!raw) throw err_('AUTH_REQUIRED', 'Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại');
  return JSON.parse(raw);
}

function hashPassword_(password, salt) {
  var h = salt + ':' + password;
  for (var i = 0; i < HASH_ROUNDS; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8));
  }
  return h;
}

function findUser_(username) {
  var sh = opsSheet_('USERS');
  var values = sh.getDataRange().getValues();
  var header = values[0].map(function (h) { return String(h).trim(); });
  var col = {};
  header.forEach(function (h, i) { col[h] = i; });
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][col.username]).trim().toLowerCase() === username) {
      var rec = {};
      header.forEach(function (h, i) { rec[h] = values[r][i]; });
      return { sheet: sh, rowIndex: r + 1, col: col, rec: rec };
    }
  }
  return null;
}

/** BRANCHES: branch_name | branch_addr → danh sách cho FE chọn chi nhánh phát hành. */
function listBranches_() {
  try {
    return readTable_(opsSheet_('BRANCHES'))
      .filter(function (r) { return r.branch_name; })
      .map(function (r) { return { branch_name: String(r.branch_name), branch_addr: String(r.branch_addr || '') }; });
  } catch (_) { return []; }
}

// ── Quản trị (chạy từ editor GAS: chọn hàm ▸ Run, sửa tham số trong adminSetUserExample) ──

/**
 * adminSetUser — tạo mới / cập nhật người dùng + đặt mật khẩu.
 * role: 'user' | 'admin'. Mật khẩu ≥ 8 ký tự.
 */
function adminSetUser(username, password, displayName, branchName, role) {
  username = String(username || '').trim().toLowerCase();
  if (!username) throw new Error('Thiếu username');
  if (!password || String(password).length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
  var salt = Utilities.getUuid();
  var hash = hashPassword_(String(password), salt);
  var found = findUser_(username);
  var sh = opsSheet_('USERS');
  if (found) {
    var c = found.col, r = found.rowIndex;
    sh.getRange(r, c.salt + 1).setValue(salt);
    sh.getRange(r, c.pass_hash + 1).setValue(hash);
    sh.getRange(r, c.active + 1).setValue(true);
    if (displayName) sh.getRange(r, c.display_name + 1).setValue(displayName);
    if (branchName) sh.getRange(r, c.branch_name + 1).setValue(branchName);
    if (role) sh.getRange(r, c.role + 1).setValue(role);
  } else {
    sh.appendRow([username, displayName || username, branchName || '', role || 'user', true, salt, hash, '']);
  }
  Logger.log('Đã đặt tài khoản: ' + username);
}

/** Ví dụ — sửa rồi Run. KHÔNG commit mật khẩu thật vào repo. */
function adminSetUserExample() {
  adminSetUser('tuantt', 'DOI-MAT-KHAU-NAY', 'Trần Thế Tuân', 'Hội sở', 'admin');
}

/** Khoá tài khoản (active=false). */
function adminDisableUser(username) {
  var f = findUser_(String(username).trim().toLowerCase());
  if (!f) throw new Error('Không thấy user ' + username);
  f.sheet.getRange(f.rowIndex, f.col.active + 1).setValue(false);
}
