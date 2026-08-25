/* tools/tao-anh-phu.js — Sinh ẢNH PHỤ trong thân bài từ kho ảnh Chợ Tốt.
 *
 *   node tools/tao-anh-phu.js              # sinh cho bài chưa có
 *   node tools/tao-anh-phu.js --so 3       # số ảnh mỗi bài (mặc định 3)
 *   node tools/tao-anh-phu.js --only <slug>
 *   node tools/tao-anh-phu.js --force      # sinh lại kể cả bài đã có
 *
 * Kho ảnh là FRAME CẮT TỪ VIDEO, nên hai vấn đề phải xử lý, nếu không thì
 * bốn tấm trong một bài chỉ là một cảnh chụp bốn lần:
 *
 *   1. TRÙNG CẢNH. Chọn xong phải so từng tấm với các tấm đã chọn bằng chữ ký
 *      ảnh 16×16 xám. Cách nhau dưới NGUONG_KHAC thì bỏ, lấy tấm khác.
 *      Rải đều theo timeline thôi là KHÔNG đủ — hai frame cách nhau xa vẫn có
 *      thể là cùng một cảnh quay chậm, chỉ khác góc zoom.
 *
 *   2. MỘT BÀI MỘT MÁY. Bài hướng dẫn chung áp dụng cho nhiều hãng, nên lấy
 *      ảnh từ nhiều dòng máy khác nhau vừa đỡ nhàm vừa đúng phạm vi bài.
 *      Chỉ lấy thêm dòng máy mà bài CÓ NHẮC TỚI HÃNG đó — kiểm bằng chính nội
 *      dung bài đã build. Trang /model/ nói về đúng một dòng máy nên không trộn.
 *
 * KHÔNG in số điện thoại lên ảnh — đổi số là phải render lại toàn bộ.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'img', 'bai');
const USED_FILE = path.join(ROOT, 'data', 'anh-da-dung.json');
const MANIFEST = path.join(ROOT, 'data', 'anh-bai-phu.json');
const SCAN_DIRS = ['huong-dan', 'model', 'muc-in', 'tu-van'];

const W = 1000, H = 600;
const MIN_BYTES = 25 * 1024;
const NGUONG_KHAC = 30;     /* dưới mức này coi như cùng một cảnh */
const HE_SO_UNG_VIEN = 5;   /* soi gấp 5 lần số ảnh cần để còn chỗ mà loại */
const DOMAIN = 'mucinminhtien.com';

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
const SO = argv.includes('--so') ? Math.max(1, parseInt(argv[argv.indexOf('--so') + 1], 10) || 3) : 3;

const srcCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'anh-nguon.json'), 'utf8'));
const KHO = srcCfg._kho || '';
const MAP = srcCfg.map || {};
const TEN = srcCfg._tenMay || {};

const used = fs.existsSync(USED_FILE) ? JSON.parse(fs.readFileSync(USED_FILE, 'utf8')) : {};
if (!used._phu) used._phu = {};

/* Frame đã xem tận mắt và loại vì không dùng được: ảnh in ra chứ không phải máy,
   kệ trống, tay cầm giấy, frame tối đen. Ghi lại để không bao giờ chọn lại. */
const LOAI_BO = new Set(used._loaiBo || []);

function tapDaDung() {
  const s = new Set(LOAI_BO);
  for (const [k, v] of Object.entries(used)) {
    if (k === '_phu') continue;
    if (v && v.file) s.add(path.basename(v.file));
  }
  for (const list of Object.values(used._phu)) for (const it of list) s.add(path.basename(it.file));
  return s;
}

function clean(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/* Hãng suy từ tên máy: "Brother HL-L2366DW" -> "brother" */
function hangCua(folder) {
  const ten = TEN[folder] || folder;
  return ten.split(/[\s-]/)[0].toLowerCase();
}

const LOAI = srcCfg._loaiMay || {};
function loaiCua(folder) { return LOAI[folder] || 'laser'; }

/* Bài này nói về loại máy nào — một bài có thể phủ nhiều loại.
   Đây là chốt chặn để ảnh máy in bill không lọt vào bài hộp mực laser:
   chỉ bắt chữ "Epson" trong link chéo cuối trang là không đủ. */
function loaiCuaBai(text) {
  const ra = new Set();
  if (/máy in nhiệt|máy in bill|in hóa đơn|giấy in nhiệt|đầu in nhiệt/.test(text)) ra.add('nhiet');
  if (/máy in phun|đầu phun|ecotank|nozzle check|head cleaning/.test(text)) ra.add('phun');
  if (/laser|hộp mực|drum|trục từ|gạt mực|lô sấy/.test(text)) ra.add('laser');
  if (!ra.size) ra.add('laser');
  return ra;
}

function listArticles() {
  const out = [];
  for (const dir of SCAN_DIRS) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const slug of fs.readdirSync(full)) {
      const file = path.join(full, slug, 'index.html');
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      if (/http-equiv="refresh"/i.test(html)) continue;
      const h1 = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
      if (!h1) continue;
      const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
      out.push({ dir, slug, h1, text: clean(main).toLowerCase() });
    }
  }
  return out;
}

function gomAnh(folder) {
  const seen = new Set(), out = [];
  for (const sub of ['original', '_posted']) {
    const d = path.join(KHO, folder, sub);
    let names = [];
    try { names = fs.readdirSync(d); } catch { continue; }
    for (const n of names) {
      if (!/\.(jpe?g|png|webp)$/i.test(n) || seen.has(n)) continue;
      const full = path.join(d, n);
      let st; try { st = fs.statSync(full); } catch { continue; }
      if (st.size < MIN_BYTES) continue;
      seen.add(n);
      out.push({ name: n, file: full, folder });
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

function raiDeu(arr, n) {
  if (arr.length <= n) return arr.slice();
  const out = [], buoc = arr.length / n;
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * buoc + buoc / 2)]);
  return out;
}

/* Chữ ký 16×16 xám — đủ để bắt "cùng một cảnh, khác góc zoom" */
async function chuKy(file) {
  return await sharp(file).resize(16, 16, { fit: 'fill' }).grayscale().raw().toBuffer();
}
function doKhac(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

/* Danh sách folder được phép dùng cho bài này, folder chính đứng đầu */
function folderChoBai(a) {
  const chinh = MAP[a.slug];
  if (!chinh) return [];
  if (a.dir === 'model') return [chinh];        /* trang một dòng máy — không trộn */

  /* Nguồn phụ gồm cả folder chưa gán cho bài nào (vd xprinter-q260) — kho máy
     nhiệt rất mỏng nên bỏ sót mấy folder này là bài in bill chỉ được 1 ảnh. */
  const dsHang = new Set(Object.values(MAP));
  for (const f of Object.keys(LOAI)) if (f !== '_help') dsHang.add(f);
  const loaiBai = loaiCuaBai(a.text);

  const them = [...dsHang]
    .filter(f => f !== chinh)
    .filter(f => loaiBai.has(loaiCua(f)))        /* đúng loại máy bài đang nói */
    .filter(f => a.text.includes(hangCua(f)))    /* bài phải có nhắc tới hãng đó */
    .filter(f => hangCua(f) !== hangCua(chinh)); /* khác hãng với folder chính */

  /* Mỗi hãng lấy một folder, ưu tiên folder nhiều ảnh chưa dùng */
  const theoHang = {};
  for (const f of them) {
    const h = hangCua(f);
    if (!theoHang[h] || gomAnh(f).length > gomAnh(theoHang[h]).length) theoHang[h] = f;
  }
  return [chinh, ...Object.values(theoHang)];
}

function dauTenMienSvg() {
  const rong = DOMAIN.length * 7.6 + 26;
  return Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
    '<rect x="' + (W - rong - 18) + '" y="' + (H - 46) + '" width="' + rong + '" height="28" rx="14" ' +
    'fill="#0b1f33" fill-opacity="0.62"/>' +
    '<text x="' + (W - rong / 2 - 18) + '" y="' + (H - 27) + '" text-anchor="middle" ' +
    'font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#ffffff" fill-opacity="0.92">' +
    DOMAIN + '</text></svg>'
  );
}

async function main() {
  if (!KHO || !fs.existsSync(KHO)) { console.log('Không thấy kho ảnh: ' + KHO); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let articles = listArticles();
  if (ONLY) articles = articles.filter(a => a.slug === ONLY);

  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const daDung = tapDaDung();
  const dau = dauTenMienSvg();

  let nAnh = 0, nBai = 0, nBoQua = 0, nLoai = 0;
  const thieu = [];

  for (const a of articles) {
    if (!MAP[a.slug]) { thieu.push(a.slug + ' (chưa gán trong data/anh-nguon.json)'); continue; }
    if (manifest[a.slug] && manifest[a.slug].length >= SO && !FORCE) { nBoQua++; continue; }

    const folders = folderChoBai(a);
    /* Luân phiên giữa các dòng máy: máy 1, máy 2, máy 3, rồi quay lại máy 1 */
    const theoFolder = folders.map(f => {
      const pool = gomAnh(f).filter(x => !daDung.has(x.name));
      return { folder: f, ungVien: raiDeu(pool, SO * HE_SO_UNG_VIEN) };
    }).filter(x => x.ungVien.length);

    if (!theoFolder.length) { thieu.push(a.slug + ' (kho đã hết ảnh chưa dùng)'); continue; }

    const daChon = [], kySo = [];
    let vong = 0;
    while (daChon.length < SO && vong < SO * HE_SO_UNG_VIEN) {
      const nhom = theoFolder[vong % theoFolder.length];
      vong++;
      let lay = null;
      while (nhom.ungVien.length) {
        const uv = nhom.ungVien.shift();
        let ky;
        try { ky = await chuKy(uv.file); } catch { continue; }
        const trung = kySo.some(k => doKhac(k, ky) < NGUONG_KHAC);
        if (trung) { nLoai++; continue; }
        lay = { uv, ky };
        break;
      }
      if (lay) { daChon.push(lay.uv); kySo.push(lay.ky); }
    }

    if (!daChon.length) { thieu.push(a.slug + ' (không tìm được ảnh đủ khác nhau)'); continue; }

    const ghi = [];
    for (let i = 0; i < daChon.length; i++) {
      const out = path.join(OUT_DIR, a.slug + '-' + (i + 1) + '.webp');
      try {
        const base = await sharp(daChon[i].file)
          .resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();
        await sharp(base).composite([{ input: dau, top: 0, left: 0 }])
          .webp({ quality: 78 }).toFile(out);
      } catch { continue; }
      daDung.add(daChon[i].name);
      ghi.push({ file: daChon[i].file, ten: path.basename(out), may: TEN[daChon[i].folder] || daChon[i].folder });
      nAnh++;
    }
    if (!ghi.length) { thieu.push(a.slug + ' (không xử lý được ảnh nào)'); continue; }

    /* Xoá file thừa nếu lần này sinh ít hơn lần trước */
    for (let i = ghi.length; i < 8; i++) {
      const du = path.join(OUT_DIR, a.slug + '-' + (i + 1) + '.webp');
      if (fs.existsSync(du)) fs.unlinkSync(du);
    }

    manifest[a.slug] = ghi;
    used._phu[a.slug] = ghi;
    nBai++;
    console.log('  ✓ ' + a.slug.padEnd(34) + ghi.length + ' ảnh · ' +
      [...new Set(ghi.map(g => g.may))].join(' + '));
  }

  fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2) + '\n', 'utf8');
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log('\n  ' + nAnh + ' ảnh phụ cho ' + nBai + ' bài, loại ' + nLoai + ' tấm vì trùng cảnh' +
    (nBoQua ? ', bỏ qua ' + nBoQua + ' bài đã đủ' : ''));
  if (thieu.length) {
    console.log('\n  Chưa sinh được:');
    thieu.forEach(t => console.log('    - ' + t));
  }
  console.log('\n  Chạy tiếp: node scripts/chen-anh-phu.js --write && node build.js');
}

main().catch(e => { console.error(e); process.exit(1); });
