/* scripts/check-seo.js — Lint SEO toàn site sau khi build.
 *
 * Cách dùng:
 *   node scripts/check-seo.js            → báo cáo đầy đủ
 *   node scripts/check-seo.js --summary  → chỉ bảng tổng hợp
 *   node scripts/check-seo.js --fail     → exit 1 nếu còn lỗi ERR (dùng cho CI)
 *
 * Quét mọi trang HTML đã build ở gốc repo (bỏ qua src/, partials/, trang redirect stub,
 * node_modules...). Không cần thư viện ngoài — site này là HTML tĩnh do build.js sinh ra
 * nên cấu trúc đủ ổn định để phân tích bằng regex.
 *
 * Mức độ:  ERR = chắc chắn mất điểm SEO   WARN = nên sửa   INFO = ghi chú
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://mucinminhtien.com';

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', 'src', 'partials', 'assets', 'data',
  'scripts', 'tools', 'mucinminhtien.com-Performance-on-Search-2026-07-27'
]);

/* ---------- Ngưỡng ---------- */
const TITLE_MIN = 40, TITLE_MAX = 65;
const DESC_MIN = 120, DESC_MAX = 165;
const MIN_OUTLINKS = 3;
const TOC_WORD_THRESHOLD = 1200;

/* ---------- Tiện ích ---------- */
function walk(dir, out) {
  out = out || [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) walk(full, out);
    else if (name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

function decode(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function meta(html, attr, value) {
  const re = new RegExp('<meta[^>]*' + attr + '=["\']' + value + '["\'][^>]*>', 'i');
  const tag = html.match(re);
  if (!tag) return null;
  const c = tag[0].match(/content=["']([\s\S]*?)["']/i);
  return c ? decode(c[1]).trim() : '';
}

function textLen(s) { return s ? [...s].length : 0; }

/* Đếm từ trong <main>, bỏ script/style/thẻ HTML */
function wordCount(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  const body = (main ? main[0] : html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decode(body).split(/\s+/).filter(Boolean).length;
}

function jsonLdBlocks(html, issues) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1]);
      // Mot khoi co the la 1 node, 1 mang node, hoac boc trong @graph
      const flat = [];
      const push = node => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(push);
        if (Array.isArray(node['@graph'])) node['@graph'].forEach(push);
        if (node['@type']) flat.push(node);
      };
      push(data);
      for (const node of flat) {
        const t = node['@type'];
        for (const one of Array.isArray(t) ? t : [t]) if (one) out.push(one);
      }
    } catch (e) {
      issues.push(['ERR', 'schema-parse', 'JSON-LD không parse được: ' + e.message.slice(0, 60)]);
    }
  }
  return out;
}

function isRedirectStub(html) {
  return /http-equiv=["']refresh["']/i.test(html) && /name=["']robots["'][^>]*noindex/i.test(html);
}

/* Loại trang → schema bắt buộc (mục 8 PROJECT.md) */
function pageType(url) {
  if (url === '/') return 'home';
  if (url.startsWith('/san-pham/') && url !== '/san-pham/') return 'product';
  if (url.startsWith('/huong-dan/') && url !== '/huong-dan/') return 'guide';
  if (url.startsWith('/model/') && url !== '/model/') return 'model';
  if (url.startsWith('/muc-in/') && url !== '/muc-in/') return 'ink';
  if (url.startsWith('/nap-muc') || url.startsWith('/dich-vu')) return 'service';
  if (url.startsWith('/bang-gia')) return 'pricing';
  return 'page';
}

const REQUIRED_SCHEMA = {
  home:    ['Organization', 'WebSite', 'LocalBusiness'],
  service: ['Service', 'BreadcrumbList', 'FAQPage'],
  guide:   ['Article', 'BreadcrumbList'],
  model:   ['Article', 'HowTo', 'FAQPage', 'BreadcrumbList'],
  ink:     ['Product', 'FAQPage', 'BreadcrumbList'],
  product: ['Product', 'BreadcrumbList'],
  pricing: ['BreadcrumbList'],
  page:    ['BreadcrumbList']
};

/* ---------- Kiểm tra 1 trang ---------- */
function checkPage(file) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (isRedirectStub(html)) return null;
  if (rel === '404.html') return null;

  const url = '/' + rel.replace(/index\.html$/, '').replace(/^\.\//, '');
  const type = pageType(url);
  const issues = [];

  /* --- title --- */
  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleM ? decode(titleM[1]).trim() : null;
  if (!title) issues.push(['ERR', 'title', 'thiếu thẻ <title>']);
  else if (textLen(title) > TITLE_MAX) issues.push(['WARN', 'title', textLen(title) + ' ký tự (>' + TITLE_MAX + ', Google cắt đuôi)']);
  else if (textLen(title) < TITLE_MIN) issues.push(['WARN', 'title', textLen(title) + ' ký tự (<' + TITLE_MIN + ', chưa tận dụng hết)']);

  /* --- description --- */
  const desc = meta(html, 'name', 'description');
  if (desc === null) issues.push(['ERR', 'desc', 'thiếu meta description']);
  else if (textLen(desc) > DESC_MAX) issues.push(['WARN', 'desc', textLen(desc) + ' ký tự (>' + DESC_MAX + ')']);
  else if (textLen(desc) < DESC_MIN) issues.push(['WARN', 'desc', textLen(desc) + ' ký tự (<' + DESC_MIN + ')']);

  /* --- canonical --- */
  const canon = (html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
  if (!canon) issues.push(['ERR', 'canonical', 'thiếu canonical']);
  else {
    if (!canon.startsWith('http')) issues.push(['ERR', 'canonical', 'canonical không tuyệt đối']);
    else if (canon.replace(/\/$/, '') !== (SITE_URL + url).replace(/\/$/, ''))
      issues.push(['ERR', 'canonical', 'canonical lệch URL thật → ' + canon]);
  }

  /* --- H1 --- */
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length === 0) issues.push(['ERR', 'h1', 'không có H1']);
  else if (h1s.length > 1) issues.push(['ERR', 'h1', h1s.length + ' thẻ H1 (chỉ được 1)']);

  /* --- Open Graph + Twitter --- */
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (meta(html, 'property', p) === null) issues.push(['WARN', 'og', 'thiếu ' + p]);
  }
  if (meta(html, 'name', 'twitter:card') === null)
    issues.push(['WARN', 'twitter', 'thiếu twitter:card (share Twitter/X, Zalo preview kém)']);

  /* --- JSON-LD --- */
  const types = jsonLdBlocks(html, issues);
  for (const need of REQUIRED_SCHEMA[type] || []) {
    if (!types.includes(need)) issues.push(['ERR', 'schema', 'thiếu schema ' + need]);
  }

  /* --- Ảnh --- */
  const imgs = html.match(/<img[^>]*>/gi) || [];
  let noAlt = 0, noDim = 0;
  for (const img of imgs) {
    if (!/\salt=["']/.test(img)) noAlt++;
    else if (/\salt=["']\s*["']/.test(img)) noAlt++;
    if (!/\swidth=["']/.test(img) || !/\sheight=["']/.test(img)) noDim++;
  }
  if (noAlt) issues.push(['ERR', 'img-alt', noAlt + '/' + imgs.length + ' ảnh thiếu alt']);
  if (noDim) issues.push(['WARN', 'img-size', noDim + '/' + imgs.length + ' ảnh thiếu width/height (gây CLS)']);

  /* --- Thứ tự heading --- */
  const heads = [...html.matchAll(/<h([2-4])[\s>]/gi)].map(m => Number(m[1]));
  for (let i = 1; i < heads.length; i++) {
    if (heads[i] - heads[i - 1] > 1) { issues.push(['WARN', 'heading', 'nhảy cấp H' + heads[i - 1] + ' → H' + heads[i]]); break; }
  }

  /* --- Internal link ra --- */
  /* \shref= chứ không phải href= — nếu không sẽ bắt nhầm thuộc tính data-href
     (giá trị chưa có tiền tố ../) và tính sai link nội bộ. */
  const links = [...html.matchAll(/<a\b[^>]*?\shref=["']([^"'#][^"']*)["']/gi)].map(m => m[1]);
  const outLinks = new Set();
  for (const href of links) {
    if (/^(https?:|tel:|mailto:)/i.test(href) && !href.startsWith(SITE_URL)) continue;
    const target = resolveHref(url, href);
    if (target && target !== url) outLinks.add(target);
  }
  if (outLinks.size < MIN_OUTLINKS)
    issues.push(['WARN', 'outlink', outLinks.size + ' link nội bộ ra (<' + MIN_OUTLINKS + ')']);

  /* --- Bài dài cần TOC --- */
  const words = wordCount(html);
  const hasToc = /class=["'][^"']*\btoc\b/i.test(html) || /id=["']toc["']/i.test(html);
  if (words > TOC_WORD_THRESHOLD && !hasToc)
    issues.push(['WARN', 'toc', words + ' từ nhưng chưa có mục lục']);

  /* --- FAQ có schema chưa --- */
  const looksFaq = /Câu hỏi thường gặp|FAQ/i.test(html);
  if (looksFaq && !types.includes('FAQPage') && type !== 'home')
    issues.push(['WARN', 'faq', 'có mục FAQ trên trang nhưng thiếu schema FAQPage']);

  return { rel, url, type, title, desc, words, types: [...new Set(types)], outLinks, issues, imgCount: imgs.length };
}

function resolveHref(fromUrl, href) {
  if (href.startsWith(SITE_URL)) href = href.slice(SITE_URL.length) || '/';
  if (/^(https?:|tel:|mailto:|javascript:)/i.test(href)) return null;
  let abs;
  if (href.startsWith('/')) abs = href;
  else abs = path.posix.normalize(path.posix.join(fromUrl, href));
  abs = abs.split('#')[0].split('?')[0];
  abs = abs.replace(/index\.html$/, '');
  if (!abs.startsWith('/')) abs = '/' + abs;
  if (!/\.[a-z0-9]{2,5}$/i.test(abs) && !abs.endsWith('/')) abs += '/';
  return abs;
}

/* ---------- Chạy ---------- */
function main() {
  const argv = process.argv.slice(2);
  const summaryOnly = argv.includes('--summary');
  const failMode = argv.includes('--fail');

  const pages = walk(ROOT).map(checkPage).filter(Boolean);
  pages.sort((a, b) => a.url.localeCompare(b.url));

  /* Orphan / inbound link */
  const inbound = new Map();
  for (const p of pages) inbound.set(p.url, 0);
  for (const p of pages) for (const t of p.outLinks) if (inbound.has(t)) inbound.set(t, inbound.get(t) + 1);
  for (const p of pages) {
    const n = inbound.get(p.url);
    if (p.url !== '/' && n === 0) p.issues.push(['ERR', 'orphan', 'trang mồ côi — không trang nào link tới']);
    else if (p.url !== '/' && n < MIN_OUTLINKS) p.issues.push(['WARN', 'inlink', n + ' link nội bộ vào (<' + MIN_OUTLINKS + ')']);
  }

  /* Trùng title / description */
  const byTitle = new Map(), byDesc = new Map();
  for (const p of pages) {
    if (p.title) (byTitle.get(p.title) || byTitle.set(p.title, []).get(p.title)).push(p.url);
    if (p.desc) (byDesc.get(p.desc) || byDesc.set(p.desc, []).get(p.desc)).push(p.url);
  }
  const dupTitles = [...byTitle].filter(([, v]) => v.length > 1);
  const dupDescs = [...byDesc].filter(([, v]) => v.length > 1);

  /* Sitemap coverage */
  let sitemapUrls = new Set();
  const smFile = path.join(ROOT, 'sitemap.xml');
  if (fs.existsSync(smFile)) {
    for (const m of fs.readFileSync(smFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      sitemapUrls.add(m[1].replace(SITE_URL, '') || '/');
    }
  }
  const missingInSitemap = pages.filter(p => !sitemapUrls.has(p.url)).map(p => p.url);

  /* In báo cáo */
  let nErr = 0, nWarn = 0;
  const byCode = new Map();

  if (!summaryOnly) console.log('\n════ CHI TIẾT TỪNG TRANG ════\n');
  for (const p of pages) {
    for (const [lvl, code] of p.issues) {
      if (lvl === 'ERR') nErr++; else if (lvl === 'WARN') nWarn++;
      byCode.set(code, (byCode.get(code) || 0) + 1);
    }
    if (summaryOnly || !p.issues.length) continue;
    console.log('  ' + p.url + '   [' + p.type + ', ' + p.words + ' từ, schema: ' + (p.types.join('+') || 'không có') + ']');
    for (const [lvl, code, msg] of p.issues) {
      console.log('      ' + (lvl === 'ERR' ? '✗' : '!') + ' ' + code.padEnd(12) + ' ' + msg);
    }
    console.log('');
  }

  console.log('\n════ TỔNG HỢP ════\n');
  console.log('  Trang quét:      ' + pages.length);
  console.log('  Trang sạch:      ' + pages.filter(p => !p.issues.length).length);
  console.log('  Lỗi (ERR):       ' + nErr);
  console.log('  Cảnh báo (WARN): ' + nWarn);

  console.log('\n  Xếp theo loại vấn đề:');
  for (const [code, n] of [...byCode].sort((a, b) => b[1] - a[1])) {
    console.log('    ' + String(n).padStart(4) + '  ' + code);
  }

  const byType = new Map();
  for (const p of pages) byType.set(p.type, (byType.get(p.type) || 0) + 1);
  console.log('\n  Số trang theo loại: ' + [...byType].map(([k, v]) => k + '=' + v).join(', '));

  if (dupTitles.length) {
    console.log('\n  ✗ Title trùng (' + dupTitles.length + ' nhóm):');
    for (const [t, urls] of dupTitles.slice(0, 10)) console.log('      "' + t.slice(0, 60) + '" → ' + urls.length + ' trang');
  }
  if (dupDescs.length) {
    console.log('\n  ✗ Description trùng (' + dupDescs.length + ' nhóm):');
    for (const [, urls] of dupDescs.slice(0, 10)) console.log('      ' + urls.slice(0, 3).join(', ') + (urls.length > 3 ? ' …(+' + (urls.length - 3) + ')' : ''));
  }
  if (missingInSitemap.length) {
    console.log('\n  ✗ Thiếu trong sitemap.xml (' + missingInSitemap.length + '): ' + missingInSitemap.slice(0, 8).join(', '));
  }

  console.log('');
  if (failMode && nErr) process.exit(1);
}

main();
