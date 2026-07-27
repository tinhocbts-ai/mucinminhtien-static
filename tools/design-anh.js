/* tools/design-anh.js — Tạo ảnh feature "dạng thiết kế" cho bài viết
 *
 * Lấy ảnh kỹ thuật thật + phủ lớp thiết kế thương hiệu (panel xanh, tiêu đề chữ to,
 * gạch cam, tên site) → ra ảnh mới mang nhận diện Mực In Minh Tiến, khác biệt
 * hoàn toàn với ảnh gốc đã dùng ở web khác (tốt cho SEO ảnh).
 *
 * Cách dùng:
 *   node tools/design-anh.js "<đường dẫn ảnh gốc>" "<tiêu đề>" <ten-file-ra> [chữ nhỏ phụ]
 *
 * Ví dụ:
 *   node tools/design-anh.js "D:/AUTOMATION/projects/tinhocnamphong/hình kỹ thuật/20260327_145647.jpg" \
 *        "Máy in bị sọc đen dọc|Nguyên nhân & cách khắc phục" soc-den-doc "Hướng dẫn từ kỹ thuật viên"
 *
 * - Tiêu đề dùng dấu | để xuống dòng thủ công (mỗi dòng ≤ ~26 ký tự cho đẹp).
 * - Output: assets/img/hero/<ten-file-ra>.webp — 1200×675, đã nén (< ~60KB).
 */
'use strict';
const path = require('path');
const sharp = require('sharp');

const W = 1200, H = 675;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'img', 'hero');

const [, , srcPath, titleRaw, outName, subRaw, posRaw, blurRaw] = process.argv;
if (!srcPath || !titleRaw || !outName) {
  console.log('Cach dung: node tools/design-anh.js "<anh goc>" "<tieu de | dong 2>" <ten-file-ra> [chu phu] [vi tri crop] [blur=x,y,w,h]');
  console.log('  vi tri crop: attention (mac dinh) | centre | top | bottom | left | right');
  console.log('  blur=x,y,w,h: lam mo 1 vung (toa do tren khung 1200x675) — che sticker/thong tin la');
  process.exit(1);
}
const POS = { top: 'north', bottom: 'south', left: 'west', right: 'east' }[posRaw] || posRaw || 'attention';
const BLUR = /^blur=/.test(blurRaw || '') ? blurRaw.slice(5).split(',').map(Number) : null;

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const lines = titleRaw.split('|').map(s => s.trim()).filter(Boolean);
const sub = (subRaw || 'mucinminhtien.com — 0915 510 203').trim();

/* Panel trai phu gradient xanh dam -> trong suot; tieu de chu to trang;
   gach cam accent; ten thuong hieu tren cung. */
const titleSize = lines.length >= 3 ? 54 : 62;
const lineGap = titleSize + 14;
const titleStartY = Math.round(H / 2 - ((lines.length - 1) * lineGap) / 2) + 20;

const titleSpans = lines.map((l, i) =>
  `<text x="70" y="${titleStartY + i * lineGap}" font-family="Segoe UI, Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">${esc(l)}</text>`
).join('\n');

const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#062c52" stop-opacity="0.94"/>
      <stop offset="0.55" stop-color="#0b5fae" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#0b5fae" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${Math.round(W * 0.72)}" height="${H}" fill="url(#panel)"/>
  <!-- thuong hieu -->
  <text x="70" y="86" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">Mực In <tspan fill="#ff9d5c">Minh Tiến</tspan></text>
  <rect x="70" y="104" width="64" height="5" rx="2.5" fill="#ff7a30"/>
  <!-- tieu de -->
  ${titleSpans}
  <!-- gach cam duoi tieu de -->
  <rect x="70" y="${titleStartY + (lines.length - 1) * lineGap + 26}" width="110" height="7" rx="3.5" fill="#ff7a30"/>
  <!-- chu phu -->
  <text x="70" y="${H - 56}" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#dbeafe">${esc(sub)}</text>
</svg>`;

(async () => {
  const fs = require('fs');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, outName + '.webp');
  let photo = await sharp(srcPath)
    .rotate() // ton trong EXIF orientation anh chup dien thoai
    .resize(W, H, { fit: 'cover', position: POS })
    .modulate({ brightness: 0.96, saturation: 1.05 })
    .toBuffer();
  if (BLUR) {
    const [bx, by, bw, bh] = BLUR;
    const patch = await sharp(photo).extract({ left: bx, top: by, width: bw, height: bh }).blur(18).toBuffer();
    photo = await sharp(photo).composite([{ input: patch, left: bx, top: by }]).toBuffer();
  }
  const info = await sharp(photo)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .webp({ quality: 78 })
    .toFile(outPath);
  console.log('✓ ' + path.relative(path.join(__dirname, '..'), outPath) + ' — ' + info.width + 'x' + info.height + ', ' + Math.round(info.size / 1024) + 'KB');
})();
