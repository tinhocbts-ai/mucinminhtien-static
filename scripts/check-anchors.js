/* scripts/check-anchors.js — Kiểm tra mọi link nội bộ có dấu # trỏ tới id có thật.
 *
 *   node scripts/check-anchors.js
 *
 * check-seo.js đã kiểm link nội bộ có tới đúng trang chưa, nhưng KHÔNG kiểm
 * phần #anchor. Link kiểu /bang-gia/#giay-ruybang vẫn mở đúng trang nên không
 * bị coi là gãy, nhưng người dùng bấm vào lại không nhảy tới đâu cả — lỗi
 * thầm lặng, rất dễ lọt.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'src', 'assets', 'data', 'scripts', 'tools', '.claude', '.github',
  'mucinminhtien.com-Performance-on-Search-2026-07-27']);

function walk(dir, out) {
  out = out || [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try { st = fs.statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, out);
    else if (name === 'index.html') out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const ids = {};   // url -> Set(id)

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue;
  const url = '/' + path.relative(ROOT, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  ids[url] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
}

const bad = new Set();

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue;
  const from = '/' + path.relative(ROOT, f).replace(/\\/g, '/').replace(/index\.html$/, '');

  for (const m of html.matchAll(/\shref="([^"]*#[^"]+)"/g)) {
    const raw = m[1];
    if (/^https?:/i.test(raw) && !raw.startsWith('https://mucinminhtien.com')) continue;
    const [urlPart, frag] = raw.replace('https://mucinminhtien.com', '').split('#');
    if (!frag) continue;

    let target = urlPart
      ? path.posix.normalize(path.posix.join(from, urlPart)).replace(/index\.html$/, '')
      : from;
    if (!target.endsWith('/')) target += '/';

    if (!ids[target]) { bad.add(from + '  →  ' + raw + '   (trang không tồn tại)'); continue; }
    if (!ids[target].has(frag)) bad.add(from + '  →  ' + raw + '   (trang có, nhưng không có id "' + frag + '")');
  }
}

const list = [...bad].sort();
if (list.length) {
  console.log('✗ ' + list.length + ' anchor gãy:\n');
  list.forEach(b => console.log('   ' + b));
  console.log('');
  process.exit(1);
} else {
  console.log('✓ Mọi anchor nội bộ đều trỏ tới id có thật (' + files.length + ' trang đã quét).');
}
