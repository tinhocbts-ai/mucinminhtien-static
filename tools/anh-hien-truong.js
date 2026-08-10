/* tools/anh-hien-truong.js — Đưa ảnh sửa chữa chụp thật vào site.
 *
 *   node tools/anh-hien-truong.js
 *
 * Nguồn: D:/AUTOMATION/shared/images/hinh sua may  (ảnh chụp tại xưởng)
 * Ra:    assets/img/xuong/<ten-mo-ta>.webp
 *
 * Đây là ảnh có giá trị E-E-A-T cao nhất trên site: hiện trường thật, tay thợ thật,
 * linh kiện thật. Khác hẳn ảnh máy nguyên hộp lấy từ kho Chợ Tốt (ảnh bán hàng).
 *
 * Xử lý: cắt về đúng tỉ lệ, nén WebP, đóng dấu tên miền nhỏ ở góc.
 * KHÔNG in số điện thoại — đổi số là phải làm lại toàn bộ.
 *
 * Tên file đặt theo nội dung ảnh (không phải "1 (17).jpg") để có giá trị SEO ảnh.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = 'D:/AUTOMATION/shared/images/hinh sua may';
const OUT_DIR = path.join(ROOT, 'assets', 'img', 'xuong');
const FONT = 'Segoe UI, Arial, sans-serif';

/* Bảng phân loại — đọc từng ảnh rồi gán tên, mô tả và khổ dùng.
   khổ: 'wide' 1200×675 (ảnh đầu bài) | 'body' 1000×600 (ảnh trong bài) */
const MAP = [
  { src: '1 (7).jpg',  out: 'sua-may-in-tai-xuong',            alt: 'Bàn làm việc tại xưởng với máy in đang tháo rời và dụng cụ sửa chữa', kho: 'wide' },
  { src: '1 (16).jpg', out: 'thao-may-in-bao-duong',           alt: 'Máy in tháo rời để bảo dưỡng, thấy rõ cụm sấy và bánh răng', kho: 'body' },
  { src: '1 (4).jpg',  out: 'kiem-tra-bo-mach-may-in',         alt: 'Kỹ thuật viên kiểm tra bo mạch và khoang hộp mực bên trong máy in', kho: 'body' },
  { src: '1 (17).jpg', out: 'bao-lua-lo-say-may-in',           alt: 'Tay kỹ thuật viên cầm bao lụa lô sấy trước máy in đã mở cụm sấy', kho: 'body' },
  { src: '1 (2).jpg',  out: 'cum-say-may-in-thao-roi',         alt: 'Cụm sấy máy in laser tháo rời, thấy rõ đường dẫn giấy', kho: 'body' },
  { src: '1 (9).jpg',  out: 'cum-say-may-in-va-day-dien',      alt: 'Cụm sấy máy in tháo rời cùng bó dây điện và cảm biến nhiệt', kho: 'body' },
  { src: '1 (15).jpg', out: 'thay-lo-say-may-in',              alt: 'Thay lô sấy cho máy in laser tại xưởng', kho: 'body' },
  { src: '1 (3).jpg',  out: 'hop-muc-35a-85a-trong-may-in',    alt: 'Hộp mực 35A/85A đang lắp trong khoang máy in HP', kho: 'wide' },
  { src: '1 (5).jpg',  out: 'lap-hop-muc-vao-may-in',          alt: 'Lắp hộp mực vào khoang máy in laser, thấy nhãn cảnh báo trên hộp', kho: 'wide' },
  { src: '1 (14).jpg', out: 'cum-quang-laser-may-in',          alt: 'Cụm quang laser bên trong máy in, bộ phận gây bản in mờ khi bám bẩn', kho: 'body' },
  { src: '1 (11).jpg', out: 'bo-mach-formatter-may-in',        alt: 'Bo mạch formatter máy in cùng cáp tín hiệu', kho: 'body' },
  { src: '1 (13).jpg', out: 'cong-ket-noi-bo-mach-may-in',     alt: 'Cận cảnh cổng kết nối trên bo mạch máy in', kho: 'body' },
  { src: '1 (8).jpg',  out: 'duong-dan-giay-may-in',           alt: 'Đường dẫn giấy và con lăn bên trong máy in đã tháo vỏ', kho: 'body' },
  { src: '1 (6).jpg',  out: 'tam-dan-giay-may-in',             alt: 'Tấm dẫn giấy bằng kim loại tháo khỏi máy in', kho: 'body' },
  { src: '1 (10).jpg', out: 'linh-kien-may-in-thao-roi',       alt: 'Các linh kiện máy in tháo rời xếp trên bàn trước khi vệ sinh', kho: 'body' },
  { src: '1 (18).jpg', out: 'ban-in-thu-sau-khi-sua',          alt: 'Bản in thử màu sau khi sửa xong, kiểm tra chất lượng trước khi bàn giao', kho: 'body' },
  { src: '1 (1).jpg',  out: 'khoang-hop-muc-may-in',           alt: 'Khoang hộp mực máy in đã mở nắp để kiểm tra', kho: 'body' },
  { src: '1 (12).jpg', out: 'gan-bo-mach-vao-may-in',          alt: 'Gắn lại bo mạch vào thân máy in sau khi kiểm tra', kho: 'body' }
];

const SIZES = { wide: [1200, 675], body: [1000, 600] };

function stampSvg(w, h) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect x="0" y="${h - 40}" width="${w}" height="40" fill="#000000" fill-opacity="0.38"/>
      <text x="${w - 18}" y="${h - 14}" text-anchor="end" font-family="${FONT}"
            font-size="20" font-weight="700" fill="#ffffff" fill-opacity="0.92">mucinminhtien.com</text>
    </svg>`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let n = 0;
  const rows = [];

  for (const m of MAP) {
    const src = path.join(SRC_DIR, m.src);
    if (!fs.existsSync(src)) { console.log('  ⚠ không thấy ' + m.src); continue; }
    const [w, h] = SIZES[m.kho];
    const out = path.join(OUT_DIR, m.out + '.webp');

    const base = await sharp(src)
      .rotate()                                   // tôn trọng EXIF của ảnh chụp điện thoại
      .resize(w, h, { fit: 'cover', position: 'attention' })
      .toBuffer();
    await sharp(base).composite([{ input: stampSvg(w, h), top: 0, left: 0 }])
      .webp({ quality: 80 }).toFile(out);

    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log('  ✓ ' + m.out + '.webp'.padEnd(6) + '  ' + w + '×' + h + '  ' + kb + 'KB');
    rows.push({ file: 'assets/img/xuong/' + m.out + '.webp', alt: m.alt, w: w, h: h, from: m.src });
    n++;
  }

  fs.writeFileSync(path.join(ROOT, 'data', 'anh-xuong.json'),
    JSON.stringify({ _help: 'Ảnh hiện trường đã xử lý. Dùng alt sẵn có khi chèn vào bài.', anh: rows }, null, 2) + '\n', 'utf8');

  console.log('\n  ' + n + ' ảnh hiện trường → assets/img/xuong/');
  console.log('  ✓ data/anh-xuong.json (đường dẫn + alt sẵn dùng)');
}

main().catch(e => { console.error(e); process.exit(1); });
