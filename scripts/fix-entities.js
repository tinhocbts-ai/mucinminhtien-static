/* scripts/fix-entities.js — Dọn HTML entity còn sót từ lúc export WordPress.
 *
 *   node scripts/fix-entities.js          # xem trước, KHÔNG ghi file
 *   node scripts/fix-entities.js --write  # thực sự sửa
 *
 * Vì sao cần: dữ liệu xuất từ WooCommerce mang theo entity dạng &#8211; nằm
 * TRONG chuỗi văn bản. Khi build đổ chuỗi đó vào HTML, trình duyệt hiển thị
 * đúng dấu gạch — nhưng chuỗi cũng bị dùng cho <title>, alt và JSON-LD, nơi
 * entity không được giải mã và lộ ra chuỗi thô trên SERP.
 *
 * Chỉ quét NGUỒN (data/ và src/). File .html ở gốc repo là file sinh ra,
 * sửa ở đó sẽ bị build ghi đè.
 *
 * KHÔNG đụng tới &amp; &lt; &gt; &quot; — chúng là escape hợp lệ của HTML.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');

/* Entity kiểu chữ nghĩa (typographic) bị lọt từ WordPress — cần đổi về ký tự thật */
const MAP = {
  '&#8211;': '–',   // en dash
  '&#8212;': '—',   // em dash
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8230;': '…',
  '&#8722;': '−',   // minus sign
  '&#42;': '*',
  '&#039;': '’',
  '&nbsp;': ' ',
  '&amp;#': '&#'    // entity bị escape 2 lần
};

const TARGET_DIRS = ['data', 'src'];
const EXT = new Set(['.json', '.html', '.js', '.md']);

function walk(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(name).toLowerCase())) out.push(full);
  }
  return out;
}

let touched = 0, total = 0;
const report = [];

for (const d of TARGET_DIRS) {
  for (const file of walk(path.join(ROOT, d))) {
    const before = fs.readFileSync(file, 'utf8');
    let after = before;
    const found = [];

    for (const [ent, ch] of Object.entries(MAP)) {
      const n = after.split(ent).length - 1;
      if (!n) continue;
      found.push(ent + ' ×' + n);
      total += n;
      after = after.split(ent).join(ch);
    }

    if (!found.length) continue;
    touched++;
    report.push('  ' + path.relative(ROOT, file).replace(/\\/g, '/') + '  →  ' + found.join(', '));
    if (WRITE) fs.writeFileSync(file, after, 'utf8');
  }
}

console.log(report.join('\n') || '  (không còn entity nào cần sửa)');
console.log('\n' + touched + ' file, ' + total + ' vị trí.');
if (!WRITE) {
  console.log('Đây mới là XEM TRƯỚC. Chạy lại kèm --write để thực sự sửa:');
  console.log('  node scripts/fix-entities.js --write');
} else {
  console.log('Đã sửa. Chạy tiếp: node build.js && node scripts/check-seo.js --summary');
}

/* Cảnh báo entity lạ chưa nằm trong bảng MAP */
const unknown = new Map();
for (const d of TARGET_DIRS) {
  for (const file of walk(path.join(ROOT, d))) {
    const s = fs.readFileSync(file, 'utf8');
    for (const m of s.matchAll(/&#\d{2,5};/g)) {
      if (!MAP[m[0]]) unknown.set(m[0], (unknown.get(m[0]) || 0) + 1);
    }
  }
}
if (unknown.size) {
  console.log('\n⚠ Entity số chưa có trong bảng chuyển đổi — kiểm tra thủ công:');
  for (const [e, n] of unknown) console.log('    ' + e + ' ×' + n);
}
