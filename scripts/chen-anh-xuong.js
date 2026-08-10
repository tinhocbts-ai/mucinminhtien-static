/* scripts/chen-anh-xuong.js — Chèn ảnh hiện trường vào các trang đang thiếu ảnh.
 *
 *   node scripts/chen-anh-xuong.js          # xem trước
 *   node scripts/chen-anh-xuong.js --write  # chèn thật
 *
 * Chạy sau: node tools/anh-hien-truong.js
 *
 * Ưu tiên chèn vào 6 trang chính trước đây KHÔNG có ảnh nào (/, /dich-vu/,
 * /gioi-thieu/, /nap-muc.../), rồi tới các bài viết mà ảnh hiện trường minh hoạ
 * đúng nội dung hơn hẳn thẻ thiết kế.
 *
 * Chạy lại nhiều lần an toàn: đã có ảnh đó rồi thì bỏ qua.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');

const anhXuong = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'anh-xuong.json'), 'utf8')).anh;
const byName = {};
for (const a of anhXuong) byName[path.basename(a.file, '.webp')] = a;

/* file src → [{ anh, sau (chuỗi neo, chèn NGAY SAU), caption }] */
const CHEN = {
  'src/dich-vu/index.html': [
    {
      anh: 'sua-may-in-tai-xuong',
      sau: '<a href="https://zalo.me/{{hotlineTel}}" target="_blank" rel="noopener" class="btn btn-outline">Nhắn Zalo báo giá</a>\n      </div>',
      caption: 'Xưởng của chúng tôi tại {{addressShort}} — máy khách gửi về được tháo kiểm tra từng cụm trước khi báo giá.'
    },
    {
      anh: 'bao-lua-lo-say-may-in',
      sau: '<h2>5 bước làm việc</h2>\n      </div>',
      caption: 'Bao lụa lô sấy đã mòn được thay tại chỗ — đây là nguyên nhân phổ biến khiến bản in bị nhòe, chạm tay là ra mực.'
    },
    {
      anh: 'ban-in-thu-sau-khi-sua',
      sau: '<h2>Hãng và dòng máy nhận sửa</h2>\n      </div>',
      caption: 'Mọi máy đều được in thử và đưa khách xem bản in trước khi kết thúc, không bàn giao khi bản in chưa đạt.'
    }
  ],

  'src/index.html': [
    {
      anh: 'thao-may-in-bao-duong',
      sau: '<p>Đội ngũ kỹ thuật viên có mặt nhanh tại nhà riêng, văn phòng, xử lý gọn trong ngày.</p>\n</div>',
      caption: 'Kỹ thuật viên tháo máy bảo dưỡng tại xưởng — ảnh chụp thực tế, không phải ảnh minh hoạ.'
    }
  ],

  'src/gioi-thieu/index.html': [
    {
      anh: 'linh-kien-may-in-thao-roi',
      sau: '<h2>Sản phẩm &amp; dịch vụ chính</h2>',
      caption: 'Linh kiện tháo rời chờ vệ sinh và kiểm tra tại xưởng Mực In Minh Tiến.'
    }
  ],

  'src/nap-muc-may-in-tan-noi-tphcm/index.html': [
    {
      anh: 'lap-hop-muc-vao-may-in',
      sau: '<h2>Nạp mực tận nơi 4 bước</h2>\n      </div>',
      caption: 'Lắp lại hộp mực sau khi nạp và vệ sinh khoang chứa — bước cuối trước khi in thử.'
    }
  ],

  /* Bài lỗi 5B00 (máy in PHUN) KHÔNG chèn ảnh nào từ bộ này: cả 18 tấm đều là
     máy laser hoặc có hộp mực laser trong khung hình. Dùng ảnh laser minh hoạ
     cho bài về máy phun là sai sự thật — giữ thẻ thiết kế tới khi có ảnh
     máy phun Canon (G1010 / G2010 / iX6770) chụp riêng. */

  'src/huong-dan/may-in-bi-soc-den-doc/index.html': [
    {
      anh: 'cum-quang-laser-may-in',
      sau: '<h2>Cách khắc phục từng bước</h2>',
      caption: 'Cụm quang laser bên trong máy in. Bụi mực bám lên gương phản xạ ở đây cũng gây vệt mờ trên bản in.'
    }
  ],

  'src/huong-dan/may-in-khong-in-duoc/index.html': [
    {
      anh: 'bo-mach-formatter-may-in',
      sau: '<h2>Bước 7 — Gỡ và cài lại driver</h2>',
      caption: 'Bo mạch formatter — nơi xử lý lệnh in. Nếu đã làm hết 7 bước mà máy vẫn không nhận, vấn đề thường nằm ở đây.'
    }
  ],

  'src/huong-dan/cach-cai-dat-may-in/index.html': [
    {
      anh: 'cong-ket-noi-bo-mach-may-in',
      sau: '<h2>Máy tính không nhận máy in — xử lý nhanh</h2>',
      caption: 'Cổng kết nối trên bo mạch máy in. Cáp USB lỏng hoặc cổng bẩn là nguyên nhân hay bị bỏ qua nhất.'
    }
  ]
};

function depthOf(rel) {
  return rel.replace(/\\/g, '/').replace(/^src\//, '').split('/').length - 1;
}

let changed = 0, added = 0;
const report = [];

for (const [rel, items] of Object.entries(CHEN)) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { report.push('  ⚠ không thấy ' + rel); continue; }
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const up = '../'.repeat(depthOf(rel));

  for (const it of items) {
    const a = byName[it.anh];
    if (!a) { report.push('  ⚠ chưa có ảnh ' + it.anh); continue; }
    const src = up + a.file;
    if (html.includes(src)) continue;                 // đã chèn rồi
    if (!html.includes(it.sau)) { report.push('  ⚠ ' + rel + ': không tìm thấy neo cho ' + it.anh); continue; }

    const fig = '\n\n      <figure>\n' +
      '        <img src="' + src + '" alt="' + a.alt + '"\n' +
      '             width="' + a.w + '" height="' + a.h + '" loading="lazy" decoding="async" style="border-radius:var(--radius-sm)">\n' +
      '        <figcaption>' + it.caption + '</figcaption>\n' +
      '      </figure>\n';

    html = html.replace(it.sau, it.sau + fig);
    added++;
    report.push('  ✓ ' + rel.replace('src/', '') + '  ←  ' + it.anh);
  }

  if (html !== before) { changed++; if (WRITE) fs.writeFileSync(file, html, 'utf8'); }
}

console.log(report.join('\n') || '  (không có gì để chèn)');
console.log('\n' + added + ' ảnh vào ' + changed + ' trang.');
console.log(WRITE ? 'Đã chèn. Chạy tiếp: node build.js' : 'Xem trước thôi. Chạy lại kèm --write để chèn thật.');
