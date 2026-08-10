/* tools/make-brand-images.js — Sinh 2 file ảnh thương hiệu mà schema/OG đang trỏ tới.
 *
 *   node tools/make-brand-images.js
 *
 * Sinh ra:
 *   assets/img/logo.png        512×512  — dùng cho schema Organization/LocalBusiness "logo"
 *   assets/img/og-default.jpg  1200×630 — ảnh share mặc định cho trang chưa có ảnh riêng
 *
 * Chỉ cần chạy lại khi đổi nhận diện (màu, tên, hotline). Không nằm trong build.js
 * vì ảnh là file tĩnh, không đổi theo nội dung.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'img');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

const ORANGE = '#ff7a30';
const BLUE = '#0b5fae';
const FONT = 'Segoe UI, Be Vietnam Pro, Arial, sans-serif';

/* Biểu tượng máy in — trùng với logo SVG trong partials/header.html */
function mark(size, x, y) {
  const s = size / 40;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#g)"/>
    <rect x="12.5" y="10" width="15" height="7" rx="1.4" fill="#fff"/>
    <rect x="10" y="16" width="20" height="8" rx="1.6" fill="#fff" fill-opacity=".92"/>
    <rect x="13" y="23.5" width="14" height="8.5" rx="1.2" fill="#fff"/>
    <circle cx="25.5" cy="20" r="1.3" fill="${BLUE}"/>
  </g>`;
}

const GRAD = `<defs><linearGradient id="g" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
  <stop stop-color="${ORANGE}"/><stop offset="1" stop-color="${BLUE}"/></linearGradient></defs>`;

/* ---- logo.png 512×512, nền trắng (schema yêu cầu logo đọc được trên nền sáng) ---- */
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${GRAD}
  <rect width="512" height="512" fill="#ffffff"/>
  ${mark(300, 106, 60)}
  <text x="256" y="428" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="800" fill="${BLUE}">Mực In</text>
  <text x="256" y="482" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="800" fill="${ORANGE}">Minh Tiến</text>
</svg>`;

/* ---- og-default.jpg 1200×630 ---- */
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${GRAD}
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
    <stop stop-color="#0b3f75"/><stop offset="1" stop-color="${BLUE}"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1060" cy="120" r="240" fill="${ORANGE}" fill-opacity="0.12"/>
  <circle cx="120" cy="560" r="180" fill="#ffffff" fill-opacity="0.06"/>
  ${mark(120, 90, 78)}
  <text x="230" y="140" font-family="${FONT}" font-size="42" font-weight="800" fill="#ffffff">Mực In Minh Tiến</text>
  <text x="230" y="182" font-family="${FONT}" font-size="24" font-weight="400" fill="#cfe2f7">Hộp mực · Drum · Linh kiện máy in</text>

  <text x="90" y="330" font-family="${FONT}" font-size="66" font-weight="800" fill="#ffffff">Mực in &amp; linh kiện máy in</text>
  <text x="90" y="412" font-family="${FONT}" font-size="66" font-weight="800" fill="${ORANGE}">Bơm mực tận nơi TP.HCM</text>

  <rect x="90" y="470" width="430" height="72" rx="36" fill="${ORANGE}"/>
  <text x="305" y="517" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="700" fill="#ffffff">Hotline ${cfg.hotlineDisplay}</text>
  <text x="560" y="517" font-family="${FONT}" font-size="26" font-weight="400" fill="#cfe2f7">mucinminhtien.com</text>
</svg>`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  await sharp(Buffer.from(logoSvg)).png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'logo.png'));
  console.log('  ✓ assets/img/logo.png (512×512)');

  await sharp(Buffer.from(ogSvg)).jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(OUT, 'og-default.jpg'));
  console.log('  ✓ assets/img/og-default.jpg (1200×630)');

  /* Bản WebP nhẹ hơn cho dùng nội bộ trên trang */
  await sharp(Buffer.from(ogSvg)).webp({ quality: 82 })
    .toFile(path.join(OUT, 'og-default.webp'));
  console.log('  ✓ assets/img/og-default.webp');
}

main().catch(e => { console.error(e); process.exit(1); });
