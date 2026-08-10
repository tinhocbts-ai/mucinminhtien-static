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
  for (const k of Object.keys(cfg)) if (k.startsWith('_')) delete cfg[k]; // khoa _* la ghi chu
  return cfg;
}

/* ============================================================
   SCHEMA DÙNG CHUNG — sinh 1 lần, chèn vào trang bằng {{ldHome}}
   hoặc {{ldBusiness}}. Sửa NAP ở site.config.json là schema toàn
   site đổi theo, không bao giờ lệch nhau giữa các trang.
   ============================================================ */
function buildSharedSchema(cfg) {
  const S = cfg.siteUrl;
  const sameAs = [cfg.sameAsGoogleMaps, cfg.sameAsFacebook].filter(Boolean);

  const organization = {
    '@type': 'Organization',
    '@id': S + '/#organization',
    name: cfg.brandName,
    url: S + '/',
    logo: { '@type': 'ImageObject', url: S + cfg.logoPath, width: 512, height: 512 },
    email: cfg.email,
    telephone: cfg.hotlineIntl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: cfg.addressStreet,
      addressLocality: cfg.addressLocality,
      addressRegion: cfg.addressRegion,
      postalCode: cfg.postalCode,
      addressCountry: 'VN'
    }
  };
  if (sameAs.length) organization.sameAs = sameAs;

  const localBusiness = {
    '@type': 'LocalBusiness',
    '@id': S + '/#localbusiness',
    name: cfg.brandName,
    image: S + cfg.ogDefault,
    logo: S + cfg.logoPath,
    url: S + '/',
    telephone: cfg.hotlineIntl,
    email: cfg.email,
    priceRange: cfg.priceRange,
    address: organization.address,
    geo: { '@type': 'GeoCoordinates', latitude: cfg.geoLat, longitude: cfg.geoLng },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00', closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'], opens: '08:00', closes: '17:00'
      }
    ],
    areaServed: { '@type': 'City', name: 'Thành phố Hồ Chí Minh' },
    parentOrganization: { '@id': S + '/#organization' }
  };
  if (sameAs.length) localBusiness.sameAs = sameAs;

  const website = {
    '@type': 'WebSite',
    '@id': S + '/#website',
    url: S + '/',
    name: cfg.brandName,
    inLanguage: 'vi-VN',
    publisher: { '@id': S + '/#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: S + '/bang-gia/?q={search_term_string}' },
      'query-input': 'required name=search_term_string'
    }
  };

  const wrap = nodes => '<script type="application/ld+json">\n' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }, null, 2) +
    '\n</script>';

  cfg.ldHome = wrap([organization, website, localBusiness]);
  cfg.ldBusiness = wrap([organization, localBusiness]);
}

/* ============================================================
   HẸN NGÀY ĐĂNG
   Đặt <!--PUBLISH 2026-08-15--> trong file src/ của bài. Trước ngày đó,
   build KHÔNG sinh ra trang: không có HTML, không có trong sitemap, không
   có link trỏ tới. Google không "chưa thấy" trang — trang thật sự chưa tồn tại.

   Nhờ vậy anh viết và commit cả loạt bài một lần, nhưng chúng lên sóng rải
   theo ngày. Cần cron chạy build mỗi sáng (.github/workflows/publish.yml).

   Thẻ card trên trang hub bọc trong <!--CARD model/abc/--> … <!--/CARD-->
   sẽ tự bị gỡ khi bài chưa tới ngày, nên không bao giờ có link gãy.
   ============================================================ */

/* Ngày hôm nay theo giờ Việt Nam — cron của GitHub chạy theo UTC, nếu so
   theo UTC thì bài hẹn ngày 15 sẽ lên từ 07:00 sáng ngày 15 giờ VN trở đi,
   nhưng khoảng 00:00–07:00 vẫn bị coi là ngày 14. */
function todayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function publishDateOf(src) {
  const m = src.match(/<!--\s*PUBLISH\s+(\d{4}-\d{2}-\d{2})\s*-->/);
  return m ? m[1] : null;
}

/* Gỡ các khối <!--CARD url--> … <!--/CARD--> trỏ tới bài chưa tới ngày đăng */
function stripDeferredCards(html, deferredUrls) {
  return html.replace(/<!--\s*CARD\s+([^\s>]+)\s*-->([\s\S]*?)<!--\s*\/CARD\s*-->/g,
    function (block, target, inner) {
      const url = '/' + String(target).replace(/^\//, '');
      return deferredUrls.has(url) ? '' : inner;
    });
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

/* ============================================================
   FINALIZE — chạy trên MỌI trang sau khi render {{key}}.
   Mục tiêu: những thứ SEO bắt buộc phải có trên 100% trang thì
   sinh tự động ở build, không phụ thuộc người viết bài nhớ hay quên.
     1. Nhúng header/footer NGAY TRONG HTML (trước đây nạp bằng
        fetch() lúc chạy → Googlebot phải render JS mới thấy menu,
        toàn bộ internal link từ nav/footer gần như vô giá trị).
     2. Sinh schema BreadcrumbList từ breadcrumb hiển thị.
     3. Bổ sung thẻ Twitter Card + og:image mặc định.
     4. Sinh mục lục (TOC) cho trang có đánh dấu <!--TOC-->.
   ============================================================ */

const OG_DEFAULT = SITE_URL + '/assets/img/og-default.jpg';

/* Số cấp thư mục của trang, dùng để đổi data-href thành href tương đối đúng.
   'index.html' → 0 ;  'bang-gia/index.html' → 1 ;  'huong-dan/bai/index.html' → 2 */
function depthOf(rel) {
  return rel.replace(/\\/g, '/').split('/').length - 1;
}

function pageUrlOf(rel) {
  return '/' + rel.replace(/\\/g, '/').replace(/index\.html$/, '');
}

/* Đổi href tương đối trên trang thành URL tuyệt đối (cho schema) */
function absUrl(pageUrl, href) {
  if (/^https?:/i.test(href)) return href;
  if (href.startsWith('/')) return SITE_URL + href;
  let p = path.posix.normalize(path.posix.join(pageUrl, href));
  p = p.replace(/index\.html$/, '');
  if (!p.startsWith('/')) p = '/' + p;
  return SITE_URL + p;
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function jsonEsc(s) {
  return JSON.stringify(String(s));
}

/* --- 1. Nhúng header/footer sẵn trong HTML --- */
function injectShell(html, depth, shell) {
  const prefix = new Array(depth + 1).join('../');
  /* Mọi thẻ <a data-href="X"> được viết lại href="<prefix>X" ngay lúc build,
     nên link nav/footer nằm sẵn trong HTML thô — không cần JS chạy mới có. */
  const withPrefix = part => part.replace(/<a\b([^>]*)>/gi, function (tag, attrs) {
    const dh = attrs.match(/\sdata-href="([^"]*)"/);
    if (!dh) return tag;
    const cleaned = attrs.replace(/\shref="[^"]*"/i, '');
    return '<a href="' + (prefix + dh[1]) + '"' + cleaned + '>';
  });

  let out = html;
  if (out.includes('<div id="site-header"></div>')) {
    out = out.replace('<div id="site-header"></div>', withPrefix(shell.header));
  }
  if (out.includes('<div id="site-footer"></div>')) {
    out = out.replace('<div id="site-footer"></div>', withPrefix(shell.footer));
  }
  return out;
}

/* --- 2. Schema BreadcrumbList sinh từ breadcrumb hiển thị --- */
function breadcrumbLd(html, pageUrl) {
  const bc = html.match(/<(p|nav)[^>]*class="[^"]*\bbreadcrumb\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/i);
  if (!bc) return null;
  const inner = bc[2];
  const items = [];
  const re = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m, lastEnd = 0;
  while ((m = re.exec(inner))) {
    items.push({ name: stripTags(m[2]), url: absUrl(pageUrl, m[1]) });
    lastEnd = re.lastIndex;
  }
  // Phan chu con lai sau the <a> cuoi cung chinh la trang hien tai
  const tail = stripTags(inner.slice(lastEnd)).replace(/^[\s/·>»-]+|[\s/·>»-]+$/g, '').trim();
  if (tail) items.push({ name: tail, url: SITE_URL + pageUrl });
  if (items.length < 2) return null;
  const list = items.map((it, i) =>
    '    { "@type": "ListItem", "position": ' + (i + 1) +
    ', "name": ' + jsonEsc(it.name) + ', "item": ' + jsonEsc(it.url) + ' }'
  ).join(',\n');
  return '<script type="application/ld+json">\n{\n' +
    '  "@context": "https://schema.org",\n  "@type": "BreadcrumbList",\n  "itemListElement": [\n' +
    list + '\n  ]\n}\n</script>\n';
}

/* --- 3. Twitter Card + og:image mặc định --- */
function socialMeta(html) {
  const get = (attr, val) => {
    const t = html.match(new RegExp('<meta[^>]*' + attr + '="' + val + '"[^>]*>', 'i'));
    if (!t) return null;
    const c = t[0].match(/content="([\s\S]*?)"/i);
    return c ? c[1] : '';
  };
  const add = [];
  let ogImage = get('property', 'og:image');
  if (ogImage === null) {
    add.push('<meta property="og:image" content="' + OG_DEFAULT + '">');
    add.push('<meta property="og:image:width" content="1200">');
    add.push('<meta property="og:image:height" content="630">');
    ogImage = OG_DEFAULT;
  }
  if (get('name', 'twitter:card') === null) {
    add.push('<meta name="twitter:card" content="summary_large_image">');
    const t = get('property', 'og:title'), d = get('property', 'og:description');
    if (t !== null) add.push('<meta name="twitter:title" content="' + t + '">');
    if (d !== null) add.push('<meta name="twitter:description" content="' + d + '">');
    add.push('<meta name="twitter:image" content="' + ogImage + '">');
  }
  return add.length ? add.join('\n') + '\n' : '';
}

/* --- 4. Mục lục tự sinh cho trang dài: đặt <!--TOC--> ở nơi muốn hiện --- */
function slugifyVi(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').slice(0, 60);
}

/* Chữ sạch cho mục lục: bỏ thẻ, giải mã entity, bỏ emoji */
function plainLabel(s) {
  return stripTags(s)
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ').trim();
}

/* Gán id cho mọi H2/H3 trong <main> và trả về danh sách heading.
   Dùng chung cho mục lục và cho schema HowTo — nhờ vậy anchor #id luôn tồn tại. */
function assignHeadingIds(html) {
  const mainStart = html.indexOf('<main');
  const mainEnd = html.indexOf('</main>');
  if (mainStart < 0 || mainEnd < 0) return { html: html, heads: [] };

  const heads = [];
  const body = html.slice(mainStart, mainEnd).replace(
    /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    function (m, lvl, attrs, inner) {
      attrs = attrs || '';
      const label = plainLabel(inner);
      let id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
      if (!id) {
        id = slugifyVi(label) || 'muc-' + (heads.length + 1);
        attrs += ' id="' + id + '"';
      }
      heads.push({ lvl: Number(lvl), id: id, text: label, skip: /\bclass="[^"]*\bno-toc\b/.test(attrs) });
      return '<h' + lvl + attrs + '>' + inner + '</h' + lvl + '>';
    });

  return { html: html.slice(0, mainStart) + body + html.slice(mainEnd), heads: heads };
}

function injectToc(html, heads) {
  if (!html.includes('<!--TOC-->')) return html;
  const items = heads.filter(h => h.lvl === 2 && !h.skip);
  if (items.length < 3) return html.replace('<!--TOC-->', '');
  const li = items.map(h => '    <li><a href="#' + h.id + '">' + escAttr(h.text) + '</a></li>').join('\n');
  const toc = '<nav class="toc" aria-label="Mục lục bài viết">\n' +
    '  <p class="toc-title">Nội dung bài viết</p>\n  <ol>\n' + li + '\n  </ol>\n</nav>';
  return html.replace('<!--TOC-->', toc);
}

/* ---- Schema HowTo sinh từ chính nội dung trang ----
   Đánh dấu trong src/: <!--HOWTO totalTime="PT15M" from="Bước 1"-->
     totalTime  ISO 8601, ví dụ PT15M = 15 phút   (mặc định PT15M)
     from       lấy bước bắt đầu từ heading chứa chuỗi này (mặc định: heading đầu)
   Các bước = H2 nằm TRƯỚC mục "Câu hỏi thường gặp". Nhờ sinh từ nội dung thật,
   schema không bao giờ lệch với những gì hiển thị trên trang.

   Lưu ý thực tế: Google đã bỏ rich result dạng HowTo từ 08/2023, nên khối này
   không còn tạo giao diện đặc biệt trên SERP. Vẫn giữ vì giúp máy hiểu đúng cấu
   trúc quy trình (có giá trị cho AI Overview và tìm kiếm ngữ nghĩa), chi phí bằng 0. */
function howToLd(html, heads, pageUrl) {
  const marker = html.match(/<!--HOWTO([^>]*)-->/);
  if (!marker) return null;
  const attrs = marker[1];
  const totalTime = (attrs.match(/totalTime="([^"]+)"/) || [])[1] || 'PT15M';
  const from = (attrs.match(/from="([^"]+)"/) || [])[1] || '';
  const to = (attrs.match(/\sto="([^"]+)"/) || [])[1] || '';

  const h1 = plainLabel((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const ogImage = (html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) || [])[1];

  const stopAt = heads.findIndex(h => /Câu hỏi thường gặp|Hỏi (&|và) đáp/i.test(h.text));
  let steps = heads.slice(0, stopAt >= 0 ? stopAt : heads.length).filter(h => h.lvl === 2 && !h.skip);
  if (from) {
    const i = steps.findIndex(h => h.text.includes(from));
    if (i > 0) steps = steps.slice(i);
  }
  if (to) {                       // cắt bỏ các mục cuối bài không phải là bước thao tác
    const i = steps.findIndex(h => h.text.includes(to));
    if (i > 0) steps = steps.slice(0, i);
  }
  if (steps.length < 2) return null;

  /* Mô tả bước = văn bản nằm GIỮA heading này và heading kế tiếp.
     Phải giới hạn phạm vi, nếu không sẽ vớ nhầm đoạn văn của mục sau
     (thường gặp khi nội dung bước là danh sách <ol>/<ul> chứ không phải <p>). */
  const textAfter = id => {
    const at = html.indexOf('id="' + id + '"');
    if (at < 0) return '';
    const rest = html.slice(at);
    const nextHead = rest.slice(1).search(/<h[23][\s>]/i);
    const block = nextHead > 0 ? rest.slice(0, nextHead + 1) : rest;

    const p = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    let t = p ? plainLabel(p[1]) : '';
    if (!t) {                                   // bước viết dạng danh sách
      const li = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].slice(0, 3).map(m => plainLabel(m[1]));
      t = li.join(' ');
    }
    return t.length > 320 ? t.slice(0, 317).replace(/\s\S*$/, '') + '…' : t;
  };

  const node = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: h1,
    totalTime: totalTime,
    step: steps.map((h, i) => {
      const s = {
        '@type': 'HowToStep',
        position: i + 1,
        name: h.text,
        url: SITE_URL + pageUrl + '#' + h.id
      };
      const t = textAfter(h.id);
      if (t) s.text = t;
      return s;
    })
  };
  if (ogImage) node.image = ogImage;

  return '<script type="application/ld+json">\n' + JSON.stringify(node, null, 2) + '\n</script>\n';
}

/* --- 5. Tracking: chèn vào MỌI trang, cấu hình ở site.config.json ---
   Để trống khoá nào thì không chèn gì cho khoá đó, trang không tải thêm byte nào.
   GA4 nạp async nên không chặn hiển thị. */
function trackingTags(cfg) {
  const out = [];
  if (cfg.gscVerification) {
    out.push('<meta name="google-site-verification" content="' + escAttr(cfg.gscVerification) + '">');
  }
  if (cfg.bingVerification) {
    out.push('<meta name="msvalidate.01" content="' + escAttr(cfg.bingVerification) + '">');
  }
  if (cfg.ga4Id) {
    const id = escAttr(cfg.ga4Id);
    out.push('<script async src="https://www.googletagmanager.com/gtag/js?id=' + id + '"></script>');
    out.push('<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}' +
      "gtag('js',new Date());gtag('config','" + id + "');</script>");
  }
  return out.length ? out.join('\n') + '\n' : '';
}

function finalize(html, rel, shell, cfg) {
  const pageUrl = pageUrlOf(rel);
  let out = injectShell(html, depthOf(rel), shell);

  const ids = assignHeadingIds(out);
  out = ids.html;
  out = injectToc(out, ids.heads);

  const head = [];
  if (cfg) head.push(trackingTags(cfg));
  const social = socialMeta(out);
  if (social) head.push(social);
  if (!/"@type":\s*"BreadcrumbList"/.test(out)) {
    const bc = breadcrumbLd(out, pageUrl);
    if (bc) head.push(bc);
  }
  if (!/"@type":\s*"HowTo"/.test(out)) {
    const ht = howToLd(out, ids.heads, pageUrl);
    if (ht) head.push(ht);
  }
  if (head.length) out = out.replace('</head>', head.join('') + '</head>');
  return out.replace(/<!--HOWTO[^>]*-->/g, '');
}

/* Ten san pham xuat tu WooCommerce co dang "Ten day du - Ten ngan lap lai",
   doi khi con dinh ma SKU rac. Lam sach de dung cho H1 / title / alt. */
function cleanProductName(raw) {
  let n = String(raw).split(/\s+-\s+/)[0].trim();
  n = n.replace(/\s*\(\s*dùng cho phôi chính hãng\s*\)/i, '');
  n = n.replace(/\s*_?\d{6,}$/, '');
  return n.replace(/\s{2,}/g, ' ').replace(/[\s/,–-]+$/, '').trim();
}

/* Cat chuoi tai ranh gioi tu / dau phan cach de title khong dut giua ma may */
function trimTitle(s, max) {
  const chars = [...s];
  if (chars.length <= max) return s;
  const cut = chars.slice(0, max).join('');
  const at = Math.max(cut.lastIndexOf(' / '), cut.lastIndexOf(', '), cut.lastIndexOf(' '));
  return (at > max * 0.55 ? cut.slice(0, at) : cut).replace(/[\s/,–-]+$/, '').trim();
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
  buildSharedSchema(cfg);
  const nextYear = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  cfg.priceValidUntil = nextYear;
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

  // ---- Bang gia day du (data/bang-gia.json -> {{priceTables}} trong src/bang-gia) ----
  const BANGGIA_FILE = path.join(ROOT, 'data', 'bang-gia.json');
  let bgItems = [], bgGroups = {};   // dung lai o phan sinh trang ma muc
  if (fs.existsSync(BANGGIA_FILE)) {
    const bg = JSON.parse(fs.readFileSync(BANGGIA_FILE, 'utf8'));

    /* Dữ liệu xuất từ WooCommerce có vài dòng lặp y hệt (cùng tên, cùng giá).
       Khử ở đây thay vì sửa file gốc để lần xuất dữ liệu sau vẫn tự sạch. */
    const seen = new Set();
    const before = bg.items.length;
    bg.items = bg.items.filter(i => {
      const k = i.name.trim().toLowerCase() + '|' + i.price;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (before !== bg.items.length) {
      console.log('  ✓ bỏ ' + (before - bg.items.length) + ' dòng bảng giá trùng lặp');
    }

    const byG = {};
    for (const i of bg.items) (byG[i.group] = byG[i.group] || []).push(i);
    const order = ['hop-muc', 'drum-trong', 'gat-muc', 'truc-tu', 'chip-seal', 'lo-say-lo-ep', 'muc-photo', 'giay-ruybang', 'linh-kien-fax', 'linh-kien-khac'];
    let html = '';
    for (const g of order) {
      if (!byG[g]) continue;
      html += '      <h3 class="bg-group" id="bg-' + g + '">' + bg.groups[g] + ' <span class="bg-count">(' + byG[g].length + ' mã)</span></h3>\n';
      html += '      <div class="price-table-wrap"><table class="price-table bg-table"><thead><tr><th>Sản phẩm</th><th style="width:140px">Giá tham khảo</th></tr></thead><tbody>\n';
      for (const i of byG[g]) {
        const nm = i.page ? '<a href="../san-pham/' + i.page + '/">' + escAttr(i.name) + '</a>' : escAttr(i.name);
        html += '<tr><td>' + nm + '</td><td class="price">' + formatPrice(i.price) + '</td></tr>\n';
      }
      html += '</tbody></table></div>\n';
    }
    cfg.priceTables = html;
    cfg.priceCount = bg.items.length;
    bgItems = bg.items;
    bgGroups = bg.groups;

    /* Dữ liệu cho công cụ "Tra hộp mực theo model máy in" (/tra-hop-muc/).
       Xuất dạng mảng gọn [ten, gia, nhom, slugTrangSP] để file tải về nhẹ nhất
       có thể — 780 mã còn khoảng 84 KB, tải async nên không chặn hiển thị. */
    const lookup = {
      groups: bg.groups,
      items: bg.items.map(i => [i.name, i.price, i.group, i.page || ''])
    };
    const dataDir = path.join(ROOT, 'assets', 'js');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'bang-gia-data.js'),
      'window.BANGGIA=' + JSON.stringify(lookup) + ';\n', 'utf8');
    console.log('  ✓ assets/js/bang-gia-data.js (' + lookup.items.length + ' mã)');
  } else { cfg.priceTables = ''; cfg.priceCount = 0; }

  // ---- Danh sach ma muc cho trang hub /muc-in/ ({{mucInList}}) ----
  const MUCIN_LIST_FILE = path.join(ROOT, 'data', 'muc-in.json');
  if (fs.existsSync(MUCIN_LIST_FILE)) {
    const codes = JSON.parse(fs.readFileSync(MUCIN_LIST_FILE, 'utf8')).codes || [];
    cfg.mucInList = codes.map(m => [
      '        <div class="card post-card">',
      '          <span class="post-tag">' + escAttr(m.tag) + '</span>',
      '          <h2><a href="' + m.slug + '/">Hộp mực ' + escAttr(m.code) + '</a></h2>',
      '          <p>' + escAttr(m.machines[0].models.split(',').slice(0, 3).join(',')) +
        '… — in khoảng ' + escAttr(m.yieldPages) + ' trang.</p>',
      '          <a class="card-link" href="' + m.slug + '/">Xem máy dùng được &amp; giá →</a>',
      '        </div>'
    ].join('\n')).join('\n');
  } else { cfg.mucInList = ''; }

  // ---- Slider trang chu (data/slider.json -> {{promoSlider}}) ----
  // Tach ra file du lieu de noi dung khuyen mai khong bi hardcode trong HTML
  // roi het han ma khong ai nho sua.
  const SLIDER_FILE = path.join(ROOT, 'data', 'slider.json');
  if (fs.existsSync(SLIDER_FILE)) {
    const sl = JSON.parse(fs.readFileSync(SLIDER_FILE, 'utf8')).slides || [];
    const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
    let slides = '', dots = '';
    sl.forEach((s, i) => {
      slides +=
        '<div class="slide slide-' + (letters[i % letters.length]) + '">\n' +
        '<div class="container slide-inner">\n' +
        '<span class="slide-tag">' + escAttr(s.tag) + '</span>\n' +
        '<p class="slide-h">' + escAttr(s.heading) + '</p>\n' +
        '<p>' + escAttr(s.text) + '</p>\n' +
        '<a href="' + escAttr(s.ctaHref) + '" class="btn btn-primary">' + escAttr(s.ctaText) + '</a>\n' +
        '</div>\n</div>\n';
      dots += '<button type="button" class="dot' + (i === 0 ? ' active' : '') +
        '" data-index="' + i + '" aria-label="Xem slide ' + (i + 1) + '"></button>\n';
    });
    cfg.promoSlider = sl.length
      ? '<section class="promo-slider" id="promoSlider" aria-label="Chương trình khuyến mãi">\n' +
        '<div class="slider-track" id="sliderTrack">\n' + slides + '</div>\n' +
        '<button type="button" class="slider-arrow prev" id="sliderPrev" aria-label="Slide trước">❮</button>\n' +
        '<button type="button" class="slider-arrow next" id="sliderNext" aria-label="Slide sau">❯</button>\n' +
        '<div class="slider-dots" id="sliderDots">\n' + dots + '</div>\n</section>'
      : '';
    console.log('  ✓ slider trang chủ (' + sl.length + ' slide, từ data/slider.json)');
  } else {
    cfg.promoSlider = '';
  }

  // ---- Header/footer: doc 1 lan, nhung thang vao tung trang luc build ----
  const shell = {
    header: render(fs.readFileSync(path.join(SRC, 'partials', 'header.html'), 'utf8'), cfg, 'partials/header.html'),
    footer: render(fs.readFileSync(path.join(SRC, 'partials', 'footer.html'), 'utf8'), cfg, 'partials/footer.html')
  };

  // ---- Phan 1: render cac trang src/ ----
  const templates = listTemplates(SRC).filter(rel => !rel.replace(/\\/g, '/').startsWith('partials/'));

  /* Quet truoc toan bo <!--PUBLISH--> de biet bai nao chua toi ngay,
     TRUOC khi render bat cu trang nao — nho vay trang hub biet ma go card. */
  const today = todayVN();
  const deferred = [];        // [{ rel, url, date }]
  const deferredUrls = new Set();
  for (const rel of templates) {
    const date = publishDateOf(fs.readFileSync(path.join(SRC, rel), 'utf8'));
    if (date && date > today) {
      const url = pageUrlOf(rel);
      deferred.push({ rel: rel.replace(/\\/g, '/'), url: url, date: date });
      deferredUrls.add(url);
    }
  }
  if (deferred.length) {
    console.log('\n  ⏳ ' + deferred.length + ' bài hẹn ngày đăng (hôm nay ' + today + ', chưa sinh HTML):');
    for (const d of deferred.sort((a, b) => a.date.localeCompare(b.date))) {
      console.log('       ' + d.date + '  ' + d.url);
    }
    console.log('');
  }

  for (const rel of templates) {
    const outPath = path.join(ROOT, rel);
    const relUrl = pageUrlOf(rel);

    if (deferredUrls.has(relUrl)) {
      /* Neu truoc do da tung build ra roi moi hen lai ngay, phai xoa ban cu —
         de nguyen thi trang van song tren Pages du da hen ngay khac. */
      if (fs.existsSync(outPath)) {
        fs.rmSync(path.dirname(outPath), { recursive: true, force: true });
        console.log('  ⏳ gỡ bản đã build của bài đang hẹn ngày: ' + relUrl);
      }
      continue;
    }

    let out = render(fs.readFileSync(path.join(SRC, rel), 'utf8'), cfg, rel);
    out = stripDeferredCards(out, deferredUrls);
    out = out.replace(/<!--\s*\/?CARD[^>]*-->/g, '').replace(/<!--\s*PUBLISH[^>]*-->\s*/g, '');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, finalize(out, rel, shell, cfg), 'utf8');
    pagesBuilt.push({ url: rel.replace(/\\/g, '/'), mtime: fs.statSync(path.join(SRC, rel)).mtime });
    console.log('  ✓ ' + rel);
  }

  /* Chan link gay: bai chua dang ma van con trang khac tro toi */
  if (deferred.length) {
    const broken = [];
    for (const p of pagesBuilt) {
      const html = fs.readFileSync(path.join(ROOT, p.url), 'utf8');
      for (const d of deferred) {
        const slug = d.url.replace(/^\/|\/$/g, '').split('/').pop();
        if (new RegExp('href="[^"]*' + slug + '/"').test(html)) {
          broken.push(pageUrlOf(p.url) + '  →  ' + d.url);
        }
      }
    }
    if (broken.length) {
      console.log('  ⚠  LINK GÃY — trang dưới đây trỏ tới bài chưa tới ngày đăng.');
      console.log('     Bọc thẻ card đó trong <!--CARD ' + deferred[0].url.replace(/^\//, '') + '--> … <!--/CARD--> để tự ẩn:');
      for (const b of [...new Set(broken)]) console.log('       ' + b);
      console.log('');
    }
  }

  // Don file partials/*.html cu o goc repo (truoc day duoc fetch luc chay)
  const stalePartials = path.join(ROOT, 'partials');
  if (fs.existsSync(stalePartials)) {
    fs.rmSync(stalePartials, { recursive: true, force: true });
    console.log('  ✓ đã xoá partials/ ở gốc (không còn nạp bằng JS)');
  }

  // ---- Phan 2: trang chi tiet san pham ----
  if (productData) {
    const tpl = fs.readFileSync(path.join(SRC, 'templates', 'product.html'), 'utf8');
    /* Trang san pham sinh tu du lieu + template, lastmod = ban moi nhat giua hai thu */
    const productMtime = new Date(Math.max(
      fs.statSync(PRODUCTS_FILE).mtime.getTime(),
      fs.statSync(path.join(SRC, 'templates', 'product.html')).mtime.getTime()
    ));
    for (const p of productData.products) {
      /* Chon SP lien quan theo kieu XOAY VONG thay vi luon lay 3 cai dau:
         cach cu khien vai SP dau nhom nhan het link noi bo, cac SP con lai
         gan nhu mo coi. Xoay vong dam bao moi SP deu duoc >= 3 trang tro toi. */
      const pool = productData.products.filter(x => x.group === p.group);
      const base = pool.length >= 4 ? pool : productData.products;
      const at = base.findIndex(x => x.slug === p.slug);
      const related = [1, 2, 3].map(k => base[(at + k) % base.length]).filter(x => x && x.slug !== p.slug);
      const relatedHtml = related.length
        ? related.map(x => productCard(x, '../')).join('\n')
        : productData.products.filter(x => x.slug !== p.slug).slice(0, 3).map(x => productCard(x, '../')).join('\n');
      const clean = cleanProductName(p.name);
      /* Brand trong schema Product phai la HANG SAN XUAT, khong phai ten shop.
         Do ten SP tu WooCommerce khong co truong brand, ta suy ra tu ten. */
      const BRANDS = ['HP', 'Canon', 'Brother', 'Epson', 'Ricoh', 'Samsung', 'Xerox',
        'Toshiba', 'Sharp', 'Panasonic', 'Lexmark', 'Pantum', 'Kyocera', 'Mitsu'];
      const brand = BRANDS.find(b => new RegExp('\\b' + b + '\\b', 'i').test(p.name)) || cfg.brandName;
      /* Title <= 65 ky tu: ten rut gon + thuong hieu. Model day du van nam
         o H1, o dong "Ten day du" trong body va o schema Product. */
      let titleTag = trimTitle(clean, 45) + ' | Mực In Minh Tiến';
      if ([...titleTag].length < 40) {                       // ten qua ngan -> bo sung nhom hang cho du nghia
        titleTag = trimTitle(clean + ' – ' + productData.groups[p.group], 45) + ' | Mực In Minh Tiến';
      }
      /* Description 140-158 ky tu theo cong thuc: san pham + gia + giao hang + CTA */
      const descBase = trimTitle(clean, 58) + ' (' + productData.groups[p.group] + ') — giá ' +
        formatPrice(p.price) + '. Hàng có sẵn tại kho ' + cfg.addressShort +
        ', giao nhanh nội thành, tư vấn đúng model máy. Gọi ' + cfg.hotlineDisplay + '.';
      const metaDesc = (p.excerpt && p.excerpt.length >= 120 && p.excerpt.length <= 158)
        ? p.excerpt
        : trimTitle(descBase, 158);
      const dict = Object.assign({}, cfg, {
        'p.slug': p.slug,
        'p.name': escAttr(clean),
        'p.fullName': escAttr(p.name),
        'p.titleTag': escAttr(titleTag),
        'p.brand': escAttr(brand),
        'p.sku': escAttr(p.slug),
        'p.shortName': escAttr(trimTitle(clean, 38)),
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
      fs.writeFileSync(outPath, finalize(render(tpl, dict, outRel), outRel, shell, cfg), 'utf8');
      pagesBuilt.push({ url: outRel.replace(/\\/g, '/'), mtime: productMtime });
    }
    console.log('  ✓ ' + productData.products.length + ' trang san pham (san-pham/<slug>/)');
  }

  // ---- Trang ma muc (/muc-in/<slug>/) tu data/muc-in.json + template ----
  // Bang linh kien va gia KHONG khai bao trong muc-in.json — lay tu bang-gia.json
  // theo matchKeys, nen gia tren trang luon khop bang gia that.
  const MUCIN_FILE = path.join(ROOT, 'data', 'muc-in.json');
  if (fs.existsSync(MUCIN_FILE) && bgItems.length) {
    const mucIn = JSON.parse(fs.readFileSync(MUCIN_FILE, 'utf8'));
    const tplMuc = fs.readFileSync(path.join(SRC, 'templates', 'muc-in.html'), 'utf8');
    const mucMtime = new Date(Math.max(
      fs.statSync(MUCIN_FILE).mtime.getTime(),
      fs.statSync(path.join(SRC, 'templates', 'muc-in.html')).mtime.getTime()
    ));
    const normName = s => s.toLowerCase().replace(/[-\s]/g, '');

    const allCodes = mucIn.codes;
    for (let ci = 0; ci < allCodes.length; ci++) {
      const m = allCodes[ci];
      /* Nối chéo xoay vòng: mỗi mã trỏ tới 2 mã kế tiếp trong danh sách,
         nên không mã nào bị mồ côi link nội bộ. */
      const siblings = [1, 2].map(k => allCodes[(ci + k) % allCodes.length])
        .filter(x => x.slug !== m.slug);
      /* Linh kien that trong kho khop voi ma nay */
      const parts = bgItems.filter(i => m.matchKeys.some(k => normName(i.name).includes(normName(k))));
      const byGroup = {};
      for (const p of parts) (byGroup[p.group] = byGroup[p.group] || []).push(p);

      let partsTable = '<div class="price-table-wrap"><table class="price-table"><thead><tr>' +
        '<th>Sản phẩm</th><th style="width:150px">Nhóm</th><th style="width:130px">Giá tham khảo</th>' +
        '</tr></thead><tbody>\n';
      for (const g of Object.keys(byGroup)) {
        for (const i of byGroup[g].sort((a, b) => a.price - b.price)) {
          const nm = i.page ? '<a href="../../san-pham/' + i.page + '/">' + escAttr(i.name) + '</a>' : escAttr(i.name);
          partsTable += '<tr><td>' + nm + '</td><td>' + escAttr(bgGroups[g] || '') +
            '</td><td class="price">' + formatPrice(i.price) + '</td></tr>\n';
        }
      }
      partsTable += '</tbody></table></div>';

      const machineHtml = '<div class="price-table-wrap"><table class="price-table"><thead><tr>' +
        '<th style="width:180px">Dòng máy</th><th>Model cụ thể</th><th>Ghi chú</th></tr></thead><tbody>\n' +
        m.machines.map(x => '<tr><td><strong>' + escAttr(x.brand) + '</strong></td><td>' +
          escAttr(x.models) + '</td><td>' + escAttr(x.note) + '</td></tr>').join('\n') +
        '\n</tbody></table></div>';

      const sectionsHtml = m.sections.map(s => '<h2>' + escAttr(s.h2) + '</h2>\n' + s.html).join('\n\n');

      const faqHtml = m.faqs.map(f =>
        '        <details>\n          <summary>' + escAttr(f.q) + '</summary>\n' +
        '          <div>' + escAttr(f.a) + '</div>\n        </details>').join('\n');

      const faqSchema = '<script type="application/ld+json">\n' + JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: m.faqs.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
      }, null, 2) + '\n</script>';

      const prices = parts.map(p => p.price);
      const dict = Object.assign({}, cfg, {
        'm.slug': m.slug, 'm.code': escAttr(m.code), 'm.brand': escAttr(m.brand),
        'm.tag': escAttr(m.tag), 'm.h1': escAttr(m.h1), 'm.title': escAttr(m.title),
        'm.desc': escAttr(m.desc), 'm.ogTitle': escAttr(m.ogTitle), 'm.ogDesc': escAttr(m.ogDesc),
        'm.answer': escAttr(m.answer), 'm.query': encodeURIComponent(m.query),
        'm.altNamesText': escAttr(m.altNames.join(', ')),
        'm.altNamesJson': JSON.stringify(m.altNames),
        'm.updated': mucMtime.toLocaleDateString('vi-VN'),
        'm.priceMin': prices.length ? Math.min(...prices) : 0,
        'm.priceMax': prices.length ? Math.max(...prices) : 0,
        'm.partCount': parts.length,
        'm.machineHtml': machineHtml, 'm.partsTable': partsTable,
        'm.sectionsHtml': sectionsHtml, 'm.refillHtml': m.refill,
        'm.faqHtml': faqHtml, 'm.faqSchema': faqSchema,
        'm.relatedHtml': m.related.map(r =>
          '          <li><a href="' + r.href + '">' + escAttr(r.text) + '</a></li>').join('\n') +
          '\n' + siblings.map(x =>
          '          <li><a href="../' + x.slug + '/">Hộp mực ' + escAttr(x.code) +
          ': dùng cho máy nào, giá bao nhiêu</a></li>').join('\n')
      });

      const outRel = path.join('muc-in', m.slug, 'index.html');
      const outPath = path.join(ROOT, outRel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, finalize(render(tplMuc, dict, outRel), outRel, shell, cfg), 'utf8');
      pagesBuilt.push({ url: outRel.replace(/\\/g, '/'), mtime: mucMtime });
    }
    console.log('  ✓ ' + mucIn.codes.length + ' trang mã mực (muc-in/<slug>/)');
  }

  // ---- Phan 4: sitemap.xml (khong gom partials, 404, trang redirect) ----
  /* lastmod lấy theo thời điểm sửa FILE NGUỒN thật của từng trang.
     Trước đây mọi URL đều mang cùng một ngày build — Google học được rằng
     lastmod của site này không đáng tin rồi bắt đầu bỏ qua tín hiệu đó. */
  const urls = pagesBuilt
    .filter(p => !p.url.startsWith('partials/') && p.url !== '404.html')
    .map(p => ({
      loc: SITE_URL + '/' + p.url.replace(/index\.html$/, ''),
      lastmod: p.mtime.toISOString().slice(0, 10)
    }))
    .sort((a, b) => a.loc.localeCompare(b.loc));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + u.loc + '</loc><lastmod>' + u.lastmod + '</lastmod></url>').join('\n') +
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
