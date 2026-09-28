/**
 * Catalog.gs — danh mục mẫu đã chuẩn hoá (CONFIG/catalog.json, dựng bởi Templates.gs::rebuildTemplates).
 *   templates[]: { id, label, guarantee_type, template_type, method, joint_venture, sector, envelope,
 *                  circular, variant, slots[], preview[] }
 * GAS chỉ cần phần meta (không preview) → cache 10'. FE lấy bản đầy đủ (có preview) qua action=catalog.
 */
var CATALOG_CACHE_KEY = 'sg_catalog_meta_v2';

function catalogFile_() {
  var f = findFile_('CONFIG', 'catalog.json');
  if (!f) throw err_('NOT_CONFIGURED', 'Chưa có CONFIG/catalog.json — chạy setupAll / Cập nhật mẫu');
  return f;
}

function loadCatalogMeta_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(CATALOG_CACHE_KEY);
  if (hit) return JSON.parse(hit);
  var cat = JSON.parse(catalogFile_().getBlob().getDataAsString('UTF-8'));
  // chỉ giữ khoá GAS cần → gọn dưới trần 100KB của CacheService
  var KEEP = ['id', 'label', 'guarantee_type', 'template_type', 'method', 'joint_venture', 'sector', 'envelope', 'variant', 'slots'];
  var meta = cat.templates.map(function (t) {
    var m = {};
    KEEP.forEach(function (k) { m[k] = t[k]; });
    return m;
  });
  try { cache.put(CATALOG_CACHE_KEY, JSON.stringify(meta), 600); } catch (_) { /* >100KB: bỏ cache */ }
  return meta;
}

function findTemplateMeta_(id) {
  var all = loadCatalogMeta_();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

function handleCatalog_() {
  var f = catalogFile_();
  return { ok: true, version: f.getLastUpdated().getTime(), catalog: JSON.parse(f.getBlob().getDataAsString('UTF-8')) };
}

function refreshCatalogCache() {
  CacheService.getScriptCache().remove(CATALOG_CACHE_KEY);
  Logger.log('Đã xoá cache catalog; mẫu: ' + loadCatalogMeta_().length);
}
