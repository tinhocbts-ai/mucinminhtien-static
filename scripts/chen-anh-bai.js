/* scripts/chen-anh-bai.js — Chèn ảnh hero + ảnh infographic vào file src/ của bài.
 *
 *   node scripts/chen-anh-bai.js          # xem trước, KHÔNG ghi
 *   node scripts/chen-anh-bai.js --write  # thực sự chèn
 *
 * Chạy SAU khi đã có ảnh (node tools/tao-anh-bai.js).
 *
 * Chèn 3 thứ, bỏ qua nếu đã có sẵn (chạy lại nhiều lần an toàn):
 *   1. <meta property="og:image"> trỏ tới ảnh hero
 *   2. <figure> ảnh hero ngay dưới dòng "Cập nhật:"
 *   3. <figure> ảnh infographic ngay trước mục "Câu hỏi thường gặp"
 *
 * Alt của ảnh lấy từ H1 nên luôn mô tả đúng nội dung, không nhồi từ khóa.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');
const SITE = 'https://mucinminhtien.com';
const DIRS = ['huong-dan', 'model', 'muc-in', 'tu-van'];

function clean(s) {
  return String(s).replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

let changed = 0, skipped = 0;
const report = [];

for (const dir of DIRS) {
  const base = path.join(ROOT, 'src', dir);
  if (!fs.existsSync(base)) continue;

  for (const slug of fs.readdirSync(base)) {
    const file = path.join(base, slug, 'index.html');
    if (!fs.existsSync(file)) continue;

    let html = fs.readFileSync(file, 'utf8');
    const before = html;
    const h1 = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
    if (!h1) continue;

    const heroRel = 'assets/img/hero/' + slug + '.webp';
    const infoRel = 'assets/img/info/' + slug + '.webp';
    const hasHero = fs.existsSync(path.join(ROOT, heroRel));
    const hasInfo = fs.existsSync(path.join(ROOT, infoRel));
    const up = '../../';
    const done = [];

    /* 1. og:image */
    if (hasHero && !/property="og:image"/i.test(html)) {
      html = html.replace(/(<meta property="og:url"[^>]*>)/i,
        '$1\n<meta property="og:image" content="' + SITE + '/' + heroRel + '">');
      done.push('og:image');
    }

    /* 2. Ảnh hero dưới dòng "Cập nhật:" */
    if (hasHero && !html.includes(heroRel.replace('assets', up + 'assets'))) {
      const metaLine = html.match(/([ \t]*)<p class="post-meta">[\s\S]*?<\/p>/i);
      if (metaLine) {
        const indent = metaLine[1];
        const fig = '\n\n' + indent + '<figure>\n' +
          indent + '  <img src="' + up + heroRel + '" alt="' + escAttr(h1) + '"\n' +
          indent + '       width="1200" height="675" fetchpriority="high" style="border-radius:var(--radius-sm)">\n' +
          indent + '</figure>';
        html = html.replace(metaLine[0], metaLine[0] + fig);
        done.push('hero');
      }
    }

    /* 3. Ảnh infographic trước mục FAQ */
    if (hasInfo && !html.includes(infoRel.replace('assets', up + 'assets'))) {
      const faq = html.match(/([ \t]*)<h2[^>]*>\s*Câu hỏi thường gặp\s*<\/h2>/i);
      if (faq) {
        const indent = faq[1];
        const fig = indent + '<figure>\n' +
          indent + '  <img src="' + up + infoRel + '" alt="Tóm tắt các bước: ' + escAttr(h1) + '"\n' +
          indent + '       width="1000" height="600" loading="lazy" decoding="async" style="border-radius:var(--radius-sm)">\n' +
          indent + '  <figcaption>Tóm tắt nhanh các bước xử lý trong bài. Lưu ảnh này để làm theo khi không tiện mở web.</figcaption>\n' +
          indent + '</figure>\n\n';
        html = html.replace(faq[0], fig + faq[0]);
        done.push('info');
      }
    }

    /* Gỡ khối ghi chú ẢNH CẦN CHỤP khi đã có ảnh thay thế */
    if (done.includes('hero')) {
      html = html.replace(/[ \t]*<!--\s*ẢNH CẦN CHỤP[\s\S]*?-->\n?/g, '');
    }

    if (html === before) { skipped++; continue; }
    changed++;
    report.push('  ' + dir + '/' + slug + '  →  ' + done.join(', '));
    if (WRITE) fs.writeFileSync(file, html, 'utf8');
  }
}

console.log(report.join('\n') || '  (không có gì để chèn)');
console.log('\n' + changed + ' bài cần chèn, ' + skipped + ' bài đã đủ ảnh.');
if (!WRITE) console.log('Xem trước thôi. Chạy lại kèm --write để chèn thật.');
else console.log('Đã chèn. Chạy tiếp: node build.js && node scripts/check-seo.js --summary');
