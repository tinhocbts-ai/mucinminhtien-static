/* scripts/chen-anh-phu.js — Chèn ảnh phụ vào thân bài trong src/.
 *
 *   node scripts/chen-anh-phu.js          # xem trước, KHÔNG ghi
 *   node scripts/chen-anh-phu.js --write  # chèn thật
 *
 * Chạy SAU node tools/tao-anh-phu.js.
 *
 * Ảnh được rải đều theo các mục H2 giữa bài, tránh nhồi hết vào một chỗ và
 * tránh chèn sát ảnh có sẵn. Chạy lại nhiều lần an toàn: bài nào đã có đường
 * dẫn ảnh đó rồi thì bỏ qua.
 *
 * CHÚ THÍCH ẢNH chỉ nói đúng thứ kiểm chứng được — tên dòng máy trong ảnh.
 * Không mô tả ảnh đang cho thấy thao tác gì, vì đây là ảnh máy chứ không phải
 * ảnh chụp từng bước sửa chữa.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data', 'anh-bai-phu.json');
const WRITE = process.argv.includes('--write');
const DIRS = ['huong-dan', 'model', 'muc-in', 'tu-van'];

const srcCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'anh-nguon.json'), 'utf8'));
const MAP = srcCfg.map || {};
const TEN = srcCfg._tenMay || {};

if (!fs.existsSync(MANIFEST)) {
  console.log('Chưa có data/anh-bai-phu.json — chạy node tools/tao-anh-phu.js trước.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* Chú thích chỉ nói tên dòng máy trong ảnh — thứ duy nhất kiểm chứng được */
function chuThich(ten, i) {
  const mau = [
    'Máy in ' + ten + ' — thuộc nhóm máy áp dụng hướng dẫn trong bài.',
    'Máy in ' + ten + '. Các bước ở trên làm được trên dòng máy này.',
    'Máy in ' + ten + ' — khác dòng thì vị trí nút có thể khác, nguyên tắc xử lý vẫn vậy.',
    'Máy in ' + ten + '. Vật tư và giá theo dòng máy có trong bảng ở bài.'
  ];
  return mau[i % mau.length];
}

/* Gỡ hết figure ảnh phụ đã chèn lần trước, để chèn lại bộ mới */
function goAnhCu(html) {
  return html.replace(/[ \t]*<figure>\s*\n[^]*?assets\/img\/bai\/[^]*?<\/figure>\n\n?/g, '');
}

/* Vị trí các H2 dùng làm mốc chèn: bỏ H2 đầu (đã có ảnh hero ngay trên),
   bỏ các mục cuối bài và mọi H2 có class no-toc. */
function diemChen(html) {
  const re = /[ \t]*<h2(?![^>]*no-toc)[^>]*>([\s\S]*?)<\/h2>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const tieuDe = m[1].replace(/<[^>]+>/g, '').trim();
    if (/Câu hỏi thường gặp|Bài viết liên quan|Báo giá|Bảng tra/i.test(tieuDe)) continue;
    out.push({ index: m.index, text: m[0] });
  }
  return out.slice(1);   /* bỏ H2 đầu tiên */
}

function raiDeu(arr, n) {
  if (arr.length <= n) return arr.slice();
  const out = [];
  const buoc = arr.length / n;
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * buoc)]);
  return out;
}

let changed = 0, skipped = 0, khongCho = 0;
const report = [];

for (const dir of DIRS) {
  const base = path.join(ROOT, 'src', dir);
  if (!fs.existsSync(base)) continue;

  for (const slug of fs.readdirSync(base)) {
    const file = path.join(base, slug, 'index.html');
    if (!fs.existsSync(file)) continue;

    const anh = manifest[slug];
    if (!anh || !anh.length) continue;

    let html = fs.readFileSync(file, 'utf8');
    const before = html;

    /* Bộ ảnh có thể đã đổi sau khi sinh lại — gỡ bộ cũ rồi chèn bộ mới */
    const dangCo = (html.match(/assets\/img\/bai\/([^"]+)/g) || []).map(x => x.split('/').pop());
    const dungBo = dangCo.length === anh.length && anh.every(x => dangCo.includes(x.ten));
    if (dungBo) { skipped++; continue; }
    if (dangCo.length) html = goAnhCu(html);

    const canChen = anh;
    const moc = diemChen(html);
    if (!moc.length) { khongCho++; continue; }

    const chon = raiDeu(moc, canChen.length);

    /* Chèn từ dưới lên để index của các mốc phía trên không bị lệch */
    for (let i = chon.length - 1; i >= 0; i--) {
      const x = canChen[i];
      if (!x) continue;
      const moc1 = chon[i];
      const ten = x.may || TEN[MAP[slug]] || MAP[slug] || 'trong ảnh';
      const indent = (moc1.text.match(/^[ \t]*/) || [''])[0];
      const fig = indent + '<figure>\n' +
        indent + '  <img src="../../assets/img/bai/' + x.ten + '" alt="Máy in ' + escAttr(ten) + '"\n' +
        indent + '       width="1000" height="600" loading="lazy" decoding="async" style="border-radius:var(--radius-sm)">\n' +
        indent + '  <figcaption>' + escAttr(chuThich(ten, i)) + '</figcaption>\n' +
        indent + '</figure>\n\n';
      html = html.slice(0, moc1.index) + fig + html.slice(moc1.index);
    }

    if (html === before) { skipped++; continue; }
    changed++;
    const dsMay = [...new Set(canChen.map(x => x.may).filter(Boolean))].join(' + ');
    report.push('  ' + dir + '/' + slug.padEnd(32) + canChen.length + ' ảnh · ' + dsMay);
    if (WRITE) fs.writeFileSync(file, html, 'utf8');
  }
}

console.log(report.join('\n') || '  (không có gì để chèn)');
console.log('\n' + changed + ' bài được chèn, ' + skipped + ' bài đã đủ' +
  (khongCho ? ', ' + khongCho + ' bài không có chỗ chèn' : '') + '.');
if (!WRITE) console.log('Xem trước thôi. Chạy lại kèm --write để chèn thật.');
else console.log('Đã chèn. Chạy tiếp: node build.js && node scripts/check-seo.js --summary');
