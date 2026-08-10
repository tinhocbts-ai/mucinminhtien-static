/* scripts/apply-meta.js — Ghi đè title + meta description cho các trang viết tay.
 *
 *   node scripts/apply-meta.js
 *
 * Vì sao tách ra file riêng: title/description phải theo công thức có chủ đích
 * (xem PROJECT.md mục 16), không sinh máy móc được. Gom về một chỗ để soát
 * nhanh toàn bộ, thay vì mở 20 file HTML. Script cũng đồng bộ luôn og:title /
 * og:description để không bị lệch giữa SERP và bản chia sẻ Zalo/Facebook.
 *
 * Quy tắc: title 40–65 ký tự, description 140–158 ký tự, KHÔNG dùng emoji.
 * Chạy lại an toàn nhiều lần (idempotent).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* Ký tự {{hotlineDisplay}} được build.js thay sau, dài 11 ký tự khi render.
   Các chuỗi dưới đây đã tính sẵn độ dài theo bản render thật. */
const META = {
  'src/index.html': {
    title: 'Mực In Minh Tiến – Hộp Mực, Drum, Linh Kiện Máy In TP.HCM',
    desc: 'Hộp mực, drum, linh kiện máy in chính hãng giá từ 40.000đ và dịch vụ bơm mực tận nơi TP.HCM trong 30–60 phút. Gọi {{hotlineDisplay}} để được báo giá.',
    ogTitle: 'Mực In Minh Tiến – Hộp mực, drum, linh kiện máy in TP.HCM',
    ogDesc: 'Hộp mực, drum, linh kiện máy in chính hãng và dịch vụ bơm mực tận nơi TP.HCM. Gọi {{hotlineDisplay}}.'
  },
  'src/bang-gia/index.html': {
    title: 'Bảng Giá Hộp Mực, Drum &amp; Linh Kiện Máy In Mới Nhất TP.HCM',
    desc: 'Bảng giá đầy đủ {{priceCount}} mã hộp mực HP, Canon, Brother, Epson, drum, gạt mực, trục từ, chip. Có ô tìm nhanh theo model. Gọi {{hotlineDisplay}} chốt giá sỉ.',
    ogTitle: 'Bảng giá hộp mực, drum và linh kiện máy in TP.HCM',
    ogDesc: 'Giá công khai {{priceCount}} mã hộp mực, drum, gạt mực, trục từ, chip. Tìm nhanh theo model máy in.'
  },
  'src/gioi-thieu/index.html': {
    title: 'Giới Thiệu Mực In Minh Tiến – Hộp Mực &amp; Sửa Máy In TP.HCM',
    desc: 'Mực In Minh Tiến cung cấp hộp mực, drum, linh kiện máy in và dịch vụ sửa máy in tận nơi tại TP.HCM. Kho tại {{addressShort}}. Gọi {{hotlineDisplay}}.',
    ogTitle: 'Giới thiệu Mực In Minh Tiến',
    ogDesc: 'Hộp mực, drum, linh kiện máy in và dịch vụ sửa máy in tận nơi tại TP.HCM. Kho tại {{addressShort}}.'
  },
  'src/lien-he/index.html': {
    title: 'Liên Hệ Mực In Minh Tiến – Hotline Báo Giá Mực In TP.HCM',
    desc: 'Liên hệ Mực In Minh Tiến tại {{addressShort}}. Gọi hoặc nhắn Zalo {{hotlineDisplay}} để báo giá hộp mực và đặt lịch sửa máy in tận nơi trong ngày.',
    ogTitle: 'Liên hệ Mực In Minh Tiến',
    ogDesc: 'Gọi hoặc nhắn Zalo {{hotlineDisplay}} để báo giá hộp mực và đặt lịch sửa máy in tận nơi TP.HCM.'
  },
  'src/huong-dan/index.html': {
    title: 'Hướng Dẫn Sửa Lỗi Máy In Tại Nhà – 14 Bài Chi Tiết Từng Bước',
    desc: 'Tổng hợp hướng dẫn sửa lỗi máy in HP, Canon, Brother, Epson: kẹt giấy, sọc đen, báo hết mực, lỗi 5B00, Drum End Soon. Làm theo từng bước ngay tại nhà.',
    ogTitle: 'Hướng dẫn sửa lỗi máy in tại nhà',
    ogDesc: 'Hướng dẫn sửa lỗi máy in HP, Canon, Brother, Epson viết dễ hiểu, làm theo được ngay tại nhà.'
  },
  'src/nap-muc-may-in-tan-noi-tphcm/index.html': {
    title: 'Nạp Mực Máy In Tận Nơi TP.HCM – Từ 80.000đ, Có Mặt 30 Phút',
    desc: 'Nạp mực, đổ mực máy in tận nơi tại TP.HCM giá từ 80.000đ. Kỹ thuật viên có mặt trong 30–60 phút, báo giá trước khi làm. Gọi {{hotlineDisplay}} hoặc nhắn Zalo.'
  },

  /* ---- Cụm hướng dẫn: title theo công thức {Lỗi}: {N} nguyên nhân / cách xử lý ---- */
  'src/huong-dan/cach-cai-dat-may-in/index.html': {
    title: 'Cách Cài Đặt Máy In Vào Máy Tính: USB, WiFi Và Mạng LAN',
    desc: 'Hướng dẫn cài máy in vào Windows 10/11 qua USB, WiFi và mạng LAN trong 5 phút, kèm cách xử lý khi máy tính không nhận máy in. Làm theo từng bước có ảnh.'
  },
  'src/huong-dan/cach-chon-muc-in/index.html': {
    title: 'Cách Chọn Mực In Đúng Máy, Bền Máy Và Tiết Kiệm Chi Phí',
    desc: 'Cách chọn mực in đúng loại cho máy laser và máy phun, phân biệt mực chính hãng với mực đổ, và tính chi phí thực trên mỗi trang in để không mua hớ.'
  },
  'src/huong-dan/cach-in-2-mat/index.html': {
    title: 'Cách In 2 Mặt Trên Máy In Canon, HP, Brother Và Epson',
    desc: 'Hướng dẫn in 2 mặt tự động và lật giấy thủ công đúng chiều trên Canon, HP, Brother, Epson. Kèm cách xử lý khi bản in bị ngược đầu hoặc lệch trang.'
  },
  'src/huong-dan/cach-reset-may-in-brother/index.html': {
    title: 'Cách Reset Máy In Brother Báo Hết Mực Và Reset Drum',
    desc: 'Hướng dẫn reset bộ đếm mực Brother báo Replace Toner và reset drum cho DCP, HL, MFC trong 4 bước. Kèm lưu ý để không làm hỏng cảm biến hộp mực.'
  },
  'src/huong-dan/cach-reset-may-in-hp/index.html': {
    title: 'Cách Reset Máy In HP Và Xử Lý Lỗi Chấm Than HP 107a, 107w',
    desc: 'Hướng dẫn reset máy in HP khi treo lệnh in và đọc đèn chấm than trên HP 107a, 107w, M1132. Kèm cách xử lý chip hộp mực W1107A sau khi nạp mực.'
  },
  'src/huong-dan/canon-2900-khong-nhan-hop-muc/index.html': {
    title: 'Canon 2900 Không Nhận Hộp Mực: 5 Cách Xử Lý Tại Chỗ',
    desc: 'Máy in Canon 2900 không nhận hộp mực do bẩn tiếp điểm, lệch trục hoặc hộp mực không tương thích. 5 cách kiểm tra và xử lý ngay tại chỗ trong 10 phút.'
  },
  'src/huong-dan/loi-5b00-canon/index.html': {
    title: 'Lỗi 5B00 Máy In Canon: Nguyên Nhân Và Cách Xử Lý An Toàn',
    desc: 'Lỗi 5B00 trên Canon iX6770, G2010, G3000 là tràn bộ đếm mực thải. Giải thích cơ chế, dấu hiệu nhận biết và cách xử lý an toàn kèm vệ sinh tấm thấm mực.'
  },
  'src/huong-dan/loi-drum-end-soon-brother/index.html': {
    title: 'Lỗi Drum End Soon Brother Là Gì Và Cách Reset Trống',
    desc: 'Drum End Soon là cảnh báo trống in sắp hết tuổi thọ, không phải hỏng máy. Cách reset trống trên DCP-B7535DW, HL-L5100DN và khi nào thật sự phải thay drum.'
  },
  'src/huong-dan/may-in-bi-soc-den-doc/index.html': {
    title: 'Máy In Bị Sọc Đen Dọc: 5 Nguyên Nhân Và Cách Khắc Phục',
    desc: 'Nhìn hình dạng vệt sọc để đoán đúng bệnh: trống xước, gạt mực mòn hay mực vón cục. 5 nguyên nhân gây sọc đen dọc và cách tự xử lý trước khi gọi thợ.'
  },
  'src/huong-dan/may-in-epson-bao-loi-2-den-do/index.html': {
    title: 'Máy In Epson Nháy 2 Đèn Đỏ: Nguyên Nhân Và Cách Xử Lý',
    desc: 'Epson L1210, L3110, L3250 nháy 2 đèn đỏ thường do kẹt giấy, hết mực hoặc tràn mực thải. Cách đọc đúng tín hiệu đèn và xử lý từng trường hợp tại nhà.'
  },
  'src/huong-dan/may-in-khong-in-duoc/index.html': {
    title: 'Máy In Không In Được, Báo Offline: 7 Bước Khắc Phục',
    desc: 'Máy in báo Offline hoặc nhận lệnh nhưng không in: 7 bước kiểm tra trên Windows từ hàng đợi in, driver đến cổng kết nối. Xử lý được trong 5 đến 15 phút.'
  },
  'src/huong-dan/phan-biet-muc-in-chinh-hang/index.html': {
    title: 'Phân Biệt Mực In Chính Hãng Và Mực Trôi Nổi: 6 Dấu Hiệu',
    desc: '6 dấu hiệu nhận biết hộp mực chính hãng qua tem, vỏ hộp, chip và chất lượng bản in. Kèm rủi ro thực tế khi dùng mực trôi nổi cho máy in laser.'
  },
  'src/huong-dan/tran-bo-dem-muc-thai-epson/index.html': {
    title: 'Tràn Bộ Đếm Mực Thải Epson: Dấu Hiệu Và Cách Xử Lý',
    desc: 'Máy Epson L1110, L3210, L8050 báo Service Required do tràn bộ đếm mực thải. Giải thích cơ chế, dấu hiệu nhận biết và cách xử lý an toàn kèm thay tấm thấm.'
  },
  'src/huong-dan/ve-sinh-dau-phun-epson/index.html': {
    title: 'Cách Vệ Sinh Đầu Phun Máy In Epson Hết Sọc, Hết Mất Màu',
    desc: 'Thứ tự đúng Nozzle Check, Head Cleaning và Power Ink Flushing để thông đầu phun Epson mà tốn ít mực nhất. Kèm dấu hiệu đầu phun đã tắc cứng phải mang đi.'
  }
};

function setMeta(html, kind, attr, value) {
  const re = new RegExp('(<meta[^>]*' + attr + '="' + kind + '"[^>]*content=")([\\s\\S]*?)(")', 'i');
  if (!re.test(html)) return html;
  return html.replace(re, (m, a, _old, c) => a + value + c);
}

let changed = 0, skipped = [];
for (const [rel, m] of Object.entries(META)) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { skipped.push(rel); continue; }
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  if (m.title) html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + m.title + '</title>');
  if (m.desc) html = setMeta(html, 'description', 'name', m.desc);
  if (m.ogTitle || m.title) html = setMeta(html, 'og:title', 'property', m.ogTitle || m.title);
  if (m.ogDesc || m.desc) html = setMeta(html, 'og:description', 'property', m.ogDesc || m.desc);

  if (html !== before) { fs.writeFileSync(file, html, 'utf8'); changed++; console.log('  ✓ ' + rel); }
}
if (skipped.length) console.log('\n  ⚠ không tìm thấy: ' + skipped.join(', '));
console.log('\nĐã cập nhật ' + changed + ' file. Chạy: node build.js && node scripts/check-seo.js');
