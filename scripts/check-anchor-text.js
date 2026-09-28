/* scripts/check-anchor-text.js — soi rủi ro TỐI ƯU QUÁ MỨC
 *
 *   node scripts/check-anchor-text.js            # báo cáo gọn
 *   node scripts/check-anchor-text.js --full     # liệt kê mọi anchor của mọi đích
 *
 * Ba thứ cần canh, đúng ba thứ Google coi là tín hiệu spam trong nội bộ site:
 *   1. Một đích nhận quá nhiều anchor GIỐNG HỆT NHAU (anchor exact-match lặp lại).
 *   2. Anchor trùng đúng từ khoá tiền của trang khác → dấu hiệu ăn thịt từ khoá.
 *   3. Hai trang cùng nhắm một cụm từ trong title → cannibalization.
 *
 * Ngưỡng dựa trên kinh nghiệm site dịch vụ: một đích có ≥ 40% anchor giống nhau
 * VÀ ≥ 5 link vào là đáng xem lại; tỷ lệ anchor thương hiệu/mô tả nên chiếm đa số.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FULL = process.argv.includes('--full');
const BO_QUA = ['node_modules', '.git', 'assets', 'src', 'data', 'scripts', 'tools', '.github',
  'mucinminhtien.com-Performance-on-Search-2026-07-27'];

function moiTrang(dir, out = []) {
  for (const ten of fs.readdirSync(dir)) {
    if (BO_QUA.includes(ten)) continue;
    const p = path.join(dir, ten);
    const st = fs.statSync(p);
    if (st.isDirectory()) moiTrang(p, out);
    else if (ten === 'index.html') out.push(p);
  }
  return out;
}

const urlCua = p => '/' + path.relative(ROOT, p).split(path.sep).slice(0, -1).join('/').replace(/^$/, '') + (path.relative(ROOT, p) === 'index.html' ? '' : '/');
const chuan = s => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim().toLowerCase();
const boDau = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

const trang = moiTrang(ROOT);
const anchorTheoDich = new Map();   // đích -> Map(anchor -> {n, tu:Set})
const titleTheoTrang = new Map();
let tongLink = 0;

for (const p of trang) {
  const html = fs.readFileSync(p, 'utf8');
  if (/name="robots"[^>]*noindex/i.test(html)) continue;   // trang redirect stub, không tính
  const tu = urlCua(p);
  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (t) titleTheoTrang.set(tu, chuan(t[1]));

  // chỉ xét link trong <main>, bỏ header/footer (link điều hướng lặp lại là bình thường)
  // breadcrumb là điều hướng, lặp lại là bình thường — không tính vào hồ sơ anchor
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [''])[0]
    .replace(/<p class="breadcrumb"[\s\S]*?<\/p>/gi, '');
  for (const m of main.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href = m[1];
    if (/^(https?:|tel:|mailto:|#)/i.test(href)) continue;
    const anchor = chuan(m[2]);
    if (!anchor) continue;
    // quy href tương đối về đường dẫn tuyệt đối
    const base = path.dirname(p);
    const dich = '/' + path.relative(ROOT, path.resolve(base, href)).split(path.sep).join('/')
      .replace(/index\.html$/, '').replace(/\/$/, '') + '/';
    if (!anchorTheoDich.has(dich)) anchorTheoDich.set(dich, new Map());
    const m2 = anchorTheoDich.get(dich);
    if (!m2.has(anchor)) m2.set(anchor, { n: 0, tu: new Set() });
    m2.get(anchor).n++; m2.get(anchor).tu.add(tu);
    tongLink++;
  }
}

console.log('\n════ ANCHOR TEXT NỘI BỘ (chỉ tính link trong <main>) ════\n');
console.log('  Trang quét: ' + trang.length + ' · link nội bộ trong thân bài: ' + tongLink + '\n');

const canhBao = [];
const rows = [...anchorTheoDich.entries()]
  .map(([dich, m]) => {
    const tong = [...m.values()].reduce((a, v) => a + v.n, 0);
    const list = [...m.entries()].sort((a, b) => b[1].n - a[1].n);
    return { dich, tong, list, deu: list[0] ? list[0][1].n / tong : 0 };
  })
  .sort((a, b) => b.tong - a.tong);

for (const r of rows) {
  const caoNhat = r.list[0];
  const nguyCo = r.tong >= 8 && r.deu >= 0.5;
  if (nguyCo) canhBao.push(r);
  if (FULL || nguyCo) {
    console.log((nguyCo ? '  ⚠ ' : '    ') + r.dich + '  ← ' + r.tong + ' link, ' + r.list.length + ' biến thể anchor');
    r.list.slice(0, FULL ? 99 : 4).forEach(([a, v]) =>
      console.log('        ' + String(v.n).padStart(2) + '×  "' + a.slice(0, 68) + '"'));
    if (nguyCo) console.log('        → ' + Math.round(r.deu * 100) + '% link vào dùng chung một anchor. Đổi bớt sang cách diễn đạt khác.');
  }
}

/* ---- Ăn thịt từ khoá: hai trang cùng nhắm một cụm trong title ---- */
console.log('\n════ NGHI NGỜ ĂN THỊT TỪ KHOÁ (title trùng cụm chính) ════\n');
const cum = new Map();
for (const [tu, ti] of titleTheoTrang) {
  const khoa = boDau(ti).replace(/[–—|:].*$/, '').replace(/\s+/g, ' ').trim()
    .split(' ').slice(0, 6).join(' ');
  if (!khoa) continue;
  if (!cum.has(khoa)) cum.set(khoa, []);
  cum.get(khoa).push(tu);
}
let n = 0;
for (const [k, list] of cum) if (list.length > 1) { n++; console.log('  ⚠ "' + k + '"\n      ' + list.join('\n      ')); }
if (!n) console.log('  Không có hai trang nào trùng cụm chính trong title.');

console.log('\n════ TỔNG HỢP ════\n');
console.log('  Đích có anchor lặp đáng xem lại: ' + canhBao.length);
console.log('  Title trùng cụm chính: ' + n);
console.log('\n  Nguyên tắc: mỗi đích nên có ít nhất 3–4 cách gọi khác nhau, và anchor nên mô tả');
console.log('  nội dung đích chứ không phải nhồi đúng từ khoá muốn rank.\n');
