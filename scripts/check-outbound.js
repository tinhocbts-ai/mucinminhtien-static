/* scripts/check-outbound.js — Liệt kê toàn bộ link trỏ ra domain khác.
 *
 *   node scripts/check-outbound.js
 *
 * Vì sao cần: hồ sơ link ra ngoài là thứ dễ mất kiểm soát nhất khi nhiều người
 * cùng thêm bài. Một site kỹ thuật không trích dẫn nguồn nào, hoặc ngược lại
 * nhồi link thương mại ở footer, đều là mẫu bất thường. Lệnh này cho thấy đúng
 * bức tranh: mỗi domain được link mấy lần và từ trang nào.
 *
 * Chỉ quét HTML đã build ở gốc repo, bỏ qua src/ để không đếm trùng bản nguồn.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'src', 'assets', 'data', 'scripts', 'tools', '.claude', '.github',
  'mucinminhtien.com-Performance-on-Search-2026-07-27']);
const OWN = /mucinminhtien\.com/;
const IGNORE = /^(zalo\.me|schema\.org|www\.google\.com|www\.googletagmanager\.com)$/;

function walk(dir, out) {
  out = out || [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try { st = fs.statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const byHost = new Map();

for (const file of walk(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue;
  const page = '/' + path.relative(ROOT, file).replace(/\\/g, '/').replace(/index\.html$/, '');

  for (const m of html.matchAll(/<a\b[^>]*?\shref="(https?:\/\/[^"]+)"/gi)) {
    const url = m[1];
    if (OWN.test(url)) continue;
    const host = url.replace(/^https?:\/\//, '').split('/')[0];
    if (IGNORE.test(host)) continue;
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push({ page, url });
  }
}

if (!byHost.size) {
  console.log('Không có link ra domain nào (ngoài Zalo và các domain hạ tầng).');
  process.exit(0);
}

const rows = [...byHost].sort((a, b) => b[1].length - a[1].length);
let total = 0;

console.log('LINK RA NGOÀI — theo domain\n');
for (const [host, list] of rows) {
  total += list.length;
  console.log('  ' + String(list.length).padStart(2) + '  ' + host);
  const pages = [...new Set(list.map(l => l.page))];
  pages.forEach(p => console.log('        ' + p));
}

console.log('\n  Tổng: ' + total + ' link ra ' + rows.length + ' domain.');

/* Cảnh báo mẫu bất thường */
const warn = [];
for (const [host, list] of rows) {
  const pages = new Set(list.map(l => l.page));
  if (pages.size > 12) warn.push(host + ' xuất hiện trên ' + pages.size + ' trang — kiểm tra xem có phải link sitewide không');
}
if (warn.length) {
  console.log('\n  ⚠  ' + warn.join('\n  ⚠  '));
}
