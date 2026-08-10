/* tools/tao-anh-bai.js — Sinh ảnh cho bài viết TỪ CHÍNH NỘI DUNG BÀI.
 *
 *   node tools/tao-anh-bai.js              # sinh cho bài nào còn thiếu ảnh
 *   node tools/tao-anh-bai.js --force      # sinh lại tất cả
 *   node tools/tao-anh-bai.js --only <slug>
 *
 * Mỗi bài ra 2 ảnh:
 *   assets/img/hero/<slug>.webp   1200×675 — ảnh máy in THẬT + panel thương hiệu + tiêu đề bài
 *   assets/img/info/<slug>.webp   1000×600 — infographic các bước của bài
 *
 * Ảnh hero lấy máy in thật từ kho ảnh dự án Chợ Tốt (khai báo ở data/anh-nguon.json).
 * Ảnh gốc đó đã đăng trên Chợ Tốt, nên KHÔNG dùng thô: mỗi tấm được cắt 16:9, phủ
 * panel gradient, ghi tiêu đề bài + tên miền + hotline → thành ảnh mới hoàn toàn,
 * không bị coi là ảnh trùng, và tự mang từ khóa của bài.
 *
 * Bài không khai báo ảnh nguồn thì dùng thẻ tiêu đề thiết kế (nền gradient, không ảnh máy).
 *
 * Tool tự nhớ file nào đã dùng cho bài nào (data/anh-da-dung.json) nên
 * KHÔNG BAO GIỜ lặp lại cùng một tấm ảnh giữa hai bài.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const HERO_DIR = path.join(ROOT, 'assets', 'img', 'hero');
const INFO_DIR = path.join(ROOT, 'assets', 'img', 'info');
const USED_FILE = path.join(ROOT, 'data', 'anh-da-dung.json');
const SCAN_DIRS = ['huong-dan', 'model', 'muc-in', 'tu-van'];

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
/* CỐ Ý không in số điện thoại lên ảnh: đổi số là phải render lại toàn bộ ảnh
   và những ảnh đã được Google index vẫn mang số cũ. Chỉ in tên miền + mô tả
   ngành hàng — hai thứ không đổi. Số điện thoại đã nằm ở header, footer,
   thanh CTA và schema, không thiếu chỗ hiển thị. */
const TAGLINE = 'Hộp mực · Drum · Linh kiện máy in';
const FONT = 'Segoe UI, Be Vietnam Pro, Arial, sans-serif';

const srcCfgPath = path.join(ROOT, 'data', 'anh-nguon.json');
const srcCfg = fs.existsSync(srcCfgPath) ? JSON.parse(fs.readFileSync(srcCfgPath, 'utf8')) : { map: {} };
const KHO = srcCfg._kho || '';
const MAP = srcCfg.map || {};

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

const PALETTES = [
  { a: '#062c52', b: '#0b5fae', accent: '#ff7a30' },
  { a: '#0b3f75', b: '#1272c9', accent: '#ffa53d' },
  { a: '#123a2e', b: '#1a7f5a', accent: '#ffb02e' },
  { a: '#3d1f47', b: '#7b3f8f', accent: '#ff8a5b' },
  { a: '#4a2410', b: '#a8551f', accent: '#ffc247' }
];
function paletteFor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function clean(s) {
  return String(s).replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ').trim();
}

function wrap(text, fontSize, maxWidth) {
  const perLine = Math.floor(maxWidth / (fontSize * 0.52));
  const out = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if (!cur) { cur = w; continue; }
    if ((cur + ' ' + w).length <= perLine) cur += ' ' + w;
    else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out;
}

/* ---------- Đọc bài từ HTML đã build ---------- */
function readArticle(dir, slug) {
  const file = path.join(ROOT, dir, slug, 'index.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) return null;
  const h1 = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const tag = clean((html.match(/<span class="post-tag"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const heads = [...main.matchAll(/<h2(?![^>]*no-toc)[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => clean(m[1]))
    .filter(t => t && !/Câu hỏi thường gặp|Bài viết liên quan|Mua kèm/i.test(t));
  return { dir, slug, h1, tag, heads, url: '/' + dir + '/' + slug + '/' };
}

function listArticles() {
  const out = [];
  for (const dir of SCAN_DIRS) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const slug of fs.readdirSync(full)) {
      if (!fs.statSync(path.join(full, slug)).isDirectory()) continue;
      const a = readArticle(dir, slug);
      if (a && a.h1) out.push(a);
    }
  }
  return out;
}

/* ---------- Chọn ảnh máy in, không lặp giữa các bài ---------- */
const used = fs.existsSync(USED_FILE) ? JSON.parse(fs.readFileSync(USED_FILE, 'utf8')) : {};
const usedFiles = new Set(Object.values(used).map(v => v.file));

function pickPhoto(slug) {
  if (used[slug] && fs.existsSync(used[slug].file) && !FORCE) return used[slug].file;

  const folder = MAP[slug];
  if (!folder || !KHO) return null;
  const dir = path.join(KHO, folder, 'original');
  if (!fs.existsSync(dir)) return null;

  /* Ưu tiên ảnh nét: cùng khung 1280×720 thì file nặng hơn thường nhiều chi tiết hơn,
     ảnh mờ do rung tay khi quay video sẽ nén xuống rất nhẹ. */
  const candidates = fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .map(f => ({ file: path.join(dir, f), size: fs.statSync(path.join(dir, f)).size }))
    .sort((x, y) => y.size - x.size);

  const keepOwn = used[slug] ? used[slug].file : null;
  const pick = candidates.find(c => !usedFiles.has(c.file) || c.file === keepOwn);
  if (!pick) return null;

  usedFiles.add(pick.file);
  used[slug] = { folder: folder, file: pick.file };
  return pick.file;
}

/* ---------- Lớp phủ cho ảnh hero ---------- */
function heroOverlaySvg(a, hasPhoto) {
  const W = 1200, H = 675;
  const p = paletteFor(a.slug);
  const maxTextW = hasPhoto ? 600 : 900;
  const size = a.h1.length > 70 ? 46 : a.h1.length > 46 ? 52 : 60;
  const lines = wrap(a.h1, size, maxTextW).slice(0, 4);
  const gap = size + 14;
  const startY = Math.round(H / 2 - ((lines.length - 1) * gap) / 2) + 10;

  const bg = hasPhoto
    ? `<defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.a}" stop-opacity="0.95"/>
      <stop offset="0.42" stop-color="${p.a}" stop-opacity="0.80"/>
      <stop offset="1" stop-color="${p.b}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="mark" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
      <stop stop-color="${p.accent}"/><stop offset="1" stop-color="${p.b}"/>
    </linearGradient>
  </defs>
  <rect width="${Math.round(W * 0.64)}" height="${H}" fill="url(#panel)"/>`
    : `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/>
    </linearGradient>
    <linearGradient id="mark" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
      <stop stop-color="${p.accent}"/><stop offset="1" stop-color="${p.b}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1085" cy="118" r="250" fill="${p.accent}" fill-opacity="0.11"/>
  <circle cx="108" cy="612" r="170" fill="#ffffff" fill-opacity="0.05"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${bg}
  <rect x="0" y="0" width="10" height="${H}" fill="${p.accent}"/>

  <g transform="translate(70,50) scale(1.05)">
    <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#mark)"/>
    <rect x="12.5" y="10" width="15" height="7" rx="1.4" fill="#fff"/>
    <rect x="10" y="16" width="20" height="8" rx="1.6" fill="#fff" fill-opacity=".92"/>
    <rect x="13" y="23.5" width="14" height="8.5" rx="1.2" fill="#fff"/>
  </g>
  <text x="128" y="78" font-family="${FONT}" font-size="26" font-weight="800" fill="#ffffff">Mực In Minh Tiến</text>
  ${a.tag ? `<text x="128" y="105" font-family="${FONT}" font-size="18" fill="#cfe2f7">${esc(a.tag)}</text>` : ''}

  ${lines.map((l, i) =>
    `<text x="70" y="${startY + i * gap}" font-family="${FONT}" font-size="${size}" font-weight="800" fill="#ffffff">${esc(l)}</text>`
  ).join('\n  ')}

  <rect x="70" y="${startY + lines.length * gap - size + 22}" width="120" height="7" rx="4" fill="${p.accent}"/>

  <rect x="0" y="${H - 74}" width="${W}" height="74" fill="#000000" fill-opacity="${hasPhoto ? 0.30 : 0}"/>
  <text x="70" y="${H - 28}" font-family="${FONT}" font-size="25" font-weight="700" fill="#ffffff">mucinminhtien.com</text>
  <text x="${W - 70}" y="${H - 28}" text-anchor="end" font-family="${FONT}" font-size="23" font-weight="600" fill="${p.accent}">${esc(TAGLINE)}</text>
</svg>`;
}

async function makeHero(a, outPath) {
  const photo = pickPhoto(a.slug);
  const overlay = Buffer.from(heroOverlaySvg(a, !!photo));

  if (photo) {
    /* Ảnh gốc 1280×720 → cắt về đúng 1200×675, hạ sáng nhẹ để chữ trắng đọc rõ */
    const base = await sharp(photo)
      .resize(1200, 675, { fit: 'cover', position: 'right' })
      .modulate({ brightness: 0.94 })
      .toBuffer();
    await sharp(base).composite([{ input: overlay, top: 0, left: 0 }])
      .webp({ quality: 80 }).toFile(outPath);
    return path.basename(photo);
  }

  await sharp(overlay).webp({ quality: 82 }).toFile(outPath);
  return null;
}

/* ---------- Ảnh infographic ---------- */
function infoSvg(a) {
  const W = 1000, H = 600;
  const p = paletteFor(a.slug);
  const items = a.heads.slice(0, 5);
  if (items.length < 2) return null;

  const rowH = Math.floor((H - 210) / items.length);
  const rows = items.map((t, i) => {
    const y = 178 + i * rowH;
    const first = wrap(t, 25, 760)[0];
    const label = first.length < t.length ? first.replace(/[\s,–-]+$/, '') + '…' : first;
    return `
  <circle cx="72" cy="${y + rowH / 2 - 6}" r="23" fill="${p.accent}"/>
  <text x="72" y="${y + rowH / 2 + 3}" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="800" fill="#ffffff">${i + 1}</text>
  <text x="112" y="${y + rowH / 2 + 3}" font-family="${FONT}" font-size="25" font-weight="600" fill="#1c2733">${esc(label)}</text>
  ${i < items.length - 1 ? `<rect x="112" y="${y + rowH - 8}" width="${W - 182}" height="1" fill="#e3e9f0"/>` : ''}`;
  }).join('');

  const titleLines = wrap(a.h1, 34, 840).slice(0, 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="hd" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
    <stop stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="138" fill="url(#hd)"/>
  <rect y="138" width="${W}" height="6" fill="${p.accent}"/>
  ${titleLines.map((l, i) =>
    `<text x="46" y="${titleLines.length === 1 ? 82 : 62 + i * 42}" font-family="${FONT}" font-size="34" font-weight="800" fill="#ffffff">${esc(l)}</text>`
  ).join('\n  ')}
  ${rows}
  <rect y="${H - 46}" width="${W}" height="46" fill="#f5f8fc"/>
  <text x="46" y="${H - 16}" font-family="${FONT}" font-size="20" font-weight="700" fill="${p.b}">mucinminhtien.com</text>
  <text x="${W - 46}" y="${H - 16}" text-anchor="end" font-family="${FONT}" font-size="19" font-weight="600" fill="${p.accent}">${esc(TAGLINE)}</text>
</svg>`;
}

/* ---------- Gợi ý ảnh nên chụp bổ sung ---------- */
function goiYAnh(a) {
  const t = (a.h1 + ' ' + a.tag).toLowerCase();
  if (/mờ|nhạt|sọc|đốm|lem|bóng chữ|giấy trắng/.test(t)) return 'Bản in lỗi đặt cạnh bản in chuẩn';
  if (/kẹt giấy|kéo giấy|xiên|lệch/.test(t)) return 'Quả đào / bố thắng đã mòn, chụp cận';
  if (/drum|trống/.test(t)) return 'Bề mặt drum xước dưới ánh sáng nghiêng';
  if (/gạt mực/.test(t)) return 'Lưỡi gạt mòn, so cạnh gạt mới';
  if (/lô sấy|lô ép|khét|nhòe/.test(t)) return 'Cụm sấy tháo rời, chỉ vào lô sấy';
  if (/photo/.test(t)) return 'Máy photocopy đang mở nắp, cụm mực';
  if (/reset|chip|toner/.test(t)) return 'Vị trí chip trên hộp mực, chụp cận';
  if (/đầu phun|epson|mất màu/.test(t)) return 'Bản Nozzle Check trước và sau khi thông';
  if (/giấy|ruy băng/.test(t)) return 'Các loại giấy xếp cạnh nhau, thấy rõ định lượng';
  if (/mực|hộp mực/.test(t)) return 'Hộp mực thật trên bàn làm việc';
  return 'Kỹ thuật viên đang thao tác trên máy in';
}

/* ---------- Chạy ---------- */
async function main() {
  fs.mkdirSync(HERO_DIR, { recursive: true });
  fs.mkdirSync(INFO_DIR, { recursive: true });

  let articles = listArticles();
  if (ONLY) articles = articles.filter(a => a.slug === ONLY);

  let nPhoto = 0, nDesign = 0, nInfo = 0, nSkip = 0;

  for (const a of articles) {
    const heroPath = path.join(HERO_DIR, a.slug + '.webp');
    const infoPath = path.join(INFO_DIR, a.slug + '.webp');
    const needHero = FORCE || !fs.existsSync(heroPath);
    const needInfo = FORCE || !fs.existsSync(infoPath);
    if (!needHero && !needInfo) { nSkip++; continue; }

    let photoName = null;
    if (needHero) {
      photoName = await makeHero(a, heroPath);
      if (photoName) nPhoto++; else nDesign++;
    }
    let infoDone = false;
    if (needInfo) {
      const svg = infoSvg(a);
      if (svg) { await sharp(Buffer.from(svg)).webp({ quality: 84 }).toFile(infoPath); infoDone = true; nInfo++; }
    }
    console.log('  ✓ ' + a.slug.padEnd(34) +
      (photoName ? 'ảnh máy: ' + (used[a.slug] ? used[a.slug].folder : '') + '/' + photoName
        : needHero ? 'thẻ thiết kế (chưa gán ảnh máy)' : '') +
      (infoDone ? '  + infographic' : ''));
  }

  fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2) + '\n', 'utf8');

  console.log('\n  ' + nPhoto + ' hero dùng ảnh máy thật, ' + nDesign + ' hero thẻ thiết kế, ' +
    nInfo + ' infographic' + (nSkip ? ', bỏ qua ' + nSkip + ' bài đã có ảnh' : ''));

  /* ---- ANH-CAN-THAY.md ---- */
  const all = listArticles();
  const md = [
    '# ẢNH BÀI VIẾT — nguồn và việc cần làm thêm',
    '',
    'Sinh tự động bởi `node tools/tao-anh-bai.js` — cập nhật lại mỗi lần chạy.',
    '',
    'Ảnh hero = **ảnh máy in thật** (kho dự án Chợ Tốt) đã cắt 16:9, phủ panel thương hiệu và',
    'ghi tiêu đề bài + tên miền. Ảnh gốc đã đăng trên Chợ Tốt nên không dùng thô — bản đã chế biến',
    'là ảnh mới hoàn toàn, không bị coi là trùng lặp.',
    '',
    'Gán ảnh cho bài mới: thêm dòng vào `data/anh-nguon.json` rồi chạy `npm run anh`.',
    'Tool tự chọn tấm chưa dùng ở bài nào khác, ưu tiên ảnh nét — không bao giờ lặp lại một tấm.',
    '',
    '| ☐ | Bài | Ảnh máy dùng | Infographic | Nên chụp bổ sung |',
    '|---|---|---|---|---|'
  ];
  for (const a of all) {
    const u = used[a.slug];
    const info = fs.existsSync(path.join(INFO_DIR, a.slug + '.webp'));
    md.push('| ☐ | `' + a.url + '` | ' +
      (u ? '`' + u.folder + '`' : '_thẻ thiết kế_') + ' | ' +
      (info ? '✅' : '—') + ' | ' + goiYAnh(a) + ' |');
  }
  md.push('', '**Tổng: ' + all.length + ' bài — ' +
    all.filter(a => used[a.slug]).length + ' bài có ảnh máy thật.**', '');
  fs.writeFileSync(path.join(ROOT, 'ANH-CAN-THAY.md'), md.join('\n'), 'utf8');
  console.log('  ✓ ANH-CAN-THAY.md');
  console.log('\n  Chạy tiếp: node scripts/chen-anh-bai.js --write && node build.js');
}

main().catch(e => { console.error(e); process.exit(1); });
