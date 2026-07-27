/* build.js — Sinh HTML tĩnh chuẩn SEO từ src/ + site.config.json + data/products.json
 *
 * Cách dùng:   node build.js
 *
 * Việc build làm 4 phần:
 *  1. Render mọi trang trong src/ (trừ src/templates/), thay {{key}} từ site.config.json.
 *  2. Sinh trang chi tiết sản phẩm: data/products.json + src/templates/product.html
 *     → san-pham/<slug>/index.html (có schema Product, ảnh WebP đã nén).
 *  3. Bơm danh sách sản phẩm theo nhóm vào {{productGroups}} của src/san-pham/index.html.
 *  4. Tự sinh sitemap.xml từ danh sách trang thật đã build.
 *
 * → Đổi SĐT/địa chỉ: sửa site.config.json. Đổi nội dung: sửa src/. Đổi sản phẩm: sửa data/products.json.
 * → KHÔNG sửa tay các file .html ở thư mục gốc — chúng bị ghi đè mỗi lần build.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const CONFIG_FILE = path.join(ROOT, 'site.config.json');
const PRODUCTS_FILE = path.join(ROOT, 'data', 'products.json');
const SITE_URL = 'https://mucinminhtien.com';

function loadConfig() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  delete cfg._help;
  return cfg;
}

function listTemplates(dir, base) {
  base = base || dir;
  let out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === 'templates') continue; // template khong phai trang
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out = out.concat(listTemplates(full, base));
    else if (name.toLowerCase().endsWith('.html')) out.push(path.relative(base, full));
  }
  return out;
}

function render(content, dict, label) {
  const missing = new Set();
  const result = content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (match, key) {
    if (Object.prototype.hasOwnProperty.call(dict, key)) return String(dict[key]);
    missing.add(key);
    return match;
  });
  if (missing.size) console.warn('  ⚠  ' + label + ': thiếu key → ' + Array.from(missing).join(', '));
  return result;
}

function formatPrice(n) {
  return Number(n).toLocaleString('vi-VN').replace(/,/g, '.') + ' đ';
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* The san pham dung chung cho listing + related (lazy-load, co width/height chong CLS) */
function productCard(p, hrefPrefix) {
  return [
    '        <div class="card product-card">',
    '          <div class="p-img"><a href="' + hrefPrefix + p.slug + '/"><img src="' + hrefPrefix + '../' + p.image + '" alt="' + escAttr(p.name) + '" width="' + p.w + '" height="' + p.h + '" loading="lazy" decoding="async"></a></div>',
    '          <h3><a href="' + hrefPrefix + p.slug + '/">' + escAttr(p.name) + '</a></h3>',
    '          <p class="p-price">' + formatPrice(p.price) + '</p>',
    '          <a class="card-link" href="' + hrefPrefix + p.slug + '/">Xem chi tiết →</a>',
    '        </div>'
  ].join('\n');
}

function build() {
  const cfg = loadConfig();
  const pagesBuilt = []; // duong dan tuong doi (vd 'bang-gia/index.html') de sinh sitemap

  // ---- Phan 2+3: san pham ----
  let productData = null;
  if (fs.existsSync(PRODUCTS_FILE)) {
    productData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  }

  // {{productGroups}} cho trang danh sach san-pham/
  if (productData) {
    const groups = {};
    for (const p of productData.products) (groups[p.group] = groups[p.group] || []).push(p);
    let html = '';
    // thu tu nhom: hop muc truoc, roi drum, linh kien...
    const order = ['hop-muc', 'drum-trong', 'gat-muc', 'truc-tu', 'chip-seal', 'lo-say-lo-ep', 'linh-kien-fax', 'giay-in', 'linh-kien-khac'];
    for (const g of order) {
      if (!groups[g]) continue;
      html += '      <h2 style="margin:40px 0 18px" id="' + g + '">' + productData.groups[g] + '</h2>\n';
      html += '      <div class="grid grid-3">\n';
      html += groups[g].map(p => productCard(p, '')).join('\n') + '\n';
      html += '      </div>\n';
    }
    cfg.productGroups = html;
  } else {
    cfg.productGroups = '';
  }
  // danh sach slug SP cho 404.html (redirect URL /product/<slug>/ cu)
  cfg.slugs404 = productData ? JSON.stringify(productData.products.map(p => p.slug)) : '[]';

  // ---- Phan 1: render cac trang src/ ----
  const templates = listTemplates(SRC);
  for (const rel of templates) {
    const outPath = path.join(ROOT, rel);
    const rendered = render(fs.readFileSync(path.join(SRC, rel), 'utf8'), cfg, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered, 'utf8');
    pagesBuilt.push(rel.replace(/\\/g, '/'));
    console.log('  ✓ ' + rel);
  }

  // ---- Phan 2: trang chi tiet san pham ----
  if (productData) {
    const tpl = fs.readFileSync(path.join(SRC, 'templates', 'product.html'), 'utf8');
    for (const p of productData.products) {
      const related = productData.products
        .filter(x => x.group === p.group && x.slug !== p.slug).slice(0, 3);
      const relatedHtml = related.length
        ? related.map(x => productCard(x, '../')).join('\n')
        : productData.products.filter(x => x.slug !== p.slug).slice(0, 3).map(x => productCard(x, '../')).join('\n');
      const metaDesc = (p.excerpt || (p.name + ' chính hãng tại Mực In Minh Tiến, giá ' + formatPrice(p.price) + '. Giao nhanh nội thành TP.HCM, tư vấn tương thích theo model máy.')).slice(0, 155);
      const dict = Object.assign({}, cfg, {
        'p.slug': p.slug,
        'p.name': escAttr(p.name),
        'p.shortName': escAttr(p.name.length > 40 ? p.name.slice(0, 40) + '…' : p.name),
        'p.price': p.price,
        'p.priceFmt': formatPrice(p.price),
        'p.image': p.image,
        'p.w': p.w, 'p.h': p.h,
        'p.groupName': productData.groups[p.group],
        'p.excerpt': escAttr(p.excerpt || ''),
        'p.metaDesc': escAttr(metaDesc),
        'p.related': relatedHtml
      });
      const outRel = path.join('san-pham', p.slug, 'index.html');
      const outPath = path.join(ROOT, outRel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, render(tpl, dict, outRel), 'utf8');
      pagesBuilt.push(outRel.replace(/\\/g, '/'));
    }
    console.log('  ✓ ' + productData.products.length + ' trang san pham (san-pham/<slug>/)');
  }

  // ---- Phan 4: sitemap.xml (khong gom partials, 404, trang redirect) ----
  const urls = pagesBuilt
    .filter(rel => !rel.startsWith('partials/') && rel !== '404.html')
    .map(rel => rel.replace(/index\.html$/, ''))
    .map(rel => SITE_URL + '/' + rel)
    .sort();
  const today = new Date().toISOString().slice(0, 10);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + u + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log('  ✓ sitemap.xml (' + urls.length + ' URL)');

  // ---- Phan 5: trang redirect URL cu WordPress -> URL moi (data/redirects.json) ----
  // GitHub Pages khong co 301 server-side. Trang stub voi meta refresh 0s + canonical
  // duoc Google xu ly nhu redirect vinh vien. KHONG dua vao sitemap.
  const REDIRECTS_FILE = path.join(ROOT, 'data', 'redirects.json');
  if (fs.existsSync(REDIRECTS_FILE)) {
    const redirects = JSON.parse(fs.readFileSync(REDIRECTS_FILE, 'utf8'));
    let n = 0;
    for (const [from, to] of Object.entries(redirects)) {
      const rel = from.replace(/^\//, '').replace(/\/$/, '');
      if (!rel) continue;
      const depth = rel.split('/').length;
      const relTarget = new Array(depth + 1).join('../') + to.replace(/^\//, '');
      const stub = '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n' +
        '<title>Đang chuyển hướng…</title>\n' +
        '<link rel="canonical" href="' + SITE_URL + to + '">\n' +
        '<meta name="robots" content="noindex">\n' +
        '<meta http-equiv="refresh" content="0; url=' + relTarget + '">\n' +
        '<script>location.replace("' + relTarget + '");</script>\n' +
        '</head>\n<body>\n<p>Trang này đã chuyển về địa chỉ mới: <a href="' + relTarget + '">' + SITE_URL + to + '</a></p>\n</body>\n</html>\n';
      const outPath = path.join(ROOT, rel, 'index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, stub, 'utf8');
      n++;
    }
    console.log('  ✓ ' + n + ' trang redirect (URL cu -> URL moi, ngoai sitemap)');
  }

  console.log('\nXong. ' + pagesBuilt.length + ' trang. Kiểm tra rồi commit & push để cập nhật GitHub Pages.');
}

build();
