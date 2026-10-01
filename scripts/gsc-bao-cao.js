/* scripts/gsc-bao-cao.js — báo cáo GSC gọn để quyết định viết gì tiếp
 *
 *   node scripts/gsc-bao-cao.js            # 90 ngày
 *   node scripts/gsc-bao-cao.js 28         # đổi số ngày
 *
 * In ra bốn thứ:
 *   1. Trang nào đang có hiển thị (và trang mới đã được Google thấy chưa)
 *   2. Truy vấn có hiển thị mà chưa có click — chỗ sửa title/meta là ăn ngay
 *   3. Truy vấn đang ở vị trí 5–20 — đẩy một chút là lên trang 1
 *   4. Truy vấn site đang hiện mà CHƯA có trang riêng — gợi ý bài tiếp theo
 */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ROOT = path.join(__dirname, '..');
const DAYS = parseInt(process.argv[2] || '90', 10);
const KEY_CANDIDATES = [
  process.env.GSC_KEY,
  path.join(ROOT, 'gsc-key.json'),
  'D:/AUTOMATION/projects/chotot/service-account.json'
].filter(Boolean);
const KEY_FILE = KEY_CANDIDATES.find(p => { try { return fs.existsSync(p); } catch { return false; } });

const d = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const nod = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

(async () => {
  if (!KEY_FILE) { console.log('Không tìm thấy khoá service account.'); return; }
  const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const sc = google.searchconsole({ version: 'v1', auth: await auth.getClient() });
  const sites = (await sc.sites.list()).data.siteEntry || [];
  const site = (sites.find(s => /mucinminhtien/.test(s.siteUrl)) || {}).siteUrl;
  if (!site) { console.log('Service account chưa được cấp quyền trên property nào của mucinminhtien.com.'); return; }

  const hoi = async (dims, rowLimit = 500) => (await sc.searchanalytics.query({
    siteUrl: site,
    requestBody: { startDate: d(DAYS), endDate: d(1), dimensions: dims, rowLimit }
  })).data.rows || [];

  console.log('\n══ BÁO CÁO GSC ' + DAYS + ' NGÀY — ' + site + ' ══');

  /* 1. Trang */
  const trang = await hoi(['page']);
  console.log('\n── 1. TRANG ĐANG CÓ HIỂN THỊ (' + trang.length + ' trang) ──\n');
  console.log('   Click  Hiển thị   Vị trí │ Trang');
  trang.sort((a, b) => b.impressions - a.impressions).slice(0, 25).forEach(r => {
    console.log(String(r.clicks).padStart(8) + String(r.impressions).padStart(10) +
      String(r.position.toFixed(1)).padStart(9) + ' │ ' + r.keys[0].replace('https://mucinminhtien.com', ''));
  });

  /* trang đã build nhưng chưa có hiển thị nào */
  const coHienThi = new Set(trang.map(r => r.keys[0].replace('https://mucinminhtien.com', '').replace(/\/$/, '')));
  const daBuild = [];
  (function quet(dir) {
    for (const f of fs.readdirSync(dir)) {
      if (['node_modules', '.git', 'assets', 'src', 'data', 'scripts', 'tools', '.github'].includes(f)) continue;
      const p = path.join(dir, f);
      try {
        if (fs.statSync(p).isDirectory()) quet(p);
        else if (f === 'index.html' && !/noindex/.test(fs.readFileSync(p, 'utf8').slice(0, 1500)))
          daBuild.push('/' + path.relative(ROOT, path.dirname(p)).split(path.sep).join('/'));
      } catch { }
    }
  })(ROOT);
  const chua = daBuild.filter(u => !coHienThi.has(u === '/.' ? '' : u));
  console.log('\n   → ' + (daBuild.length - chua.length) + '/' + daBuild.length + ' trang đã có hiển thị. Chưa có hiển thị lần nào:');
  chua.slice(0, 20).forEach(u => console.log('        ' + u + '/'));
  if (chua.length > 20) console.log('        … còn ' + (chua.length - 20) + ' trang nữa');

  /* 2 + 3 + 4. Truy vấn */
  const tv = await hoi(['query'], 1000);
  const chuaClick = tv.filter(r => r.clicks === 0 && r.impressions >= 3).sort((a, b) => b.impressions - a.impressions);
  console.log('\n── 2. CÓ HIỂN THỊ NHƯNG CHƯA CÓ CLICK (' + chuaClick.length + ' truy vấn) ──\n');
  console.log('   Hiển thị  Vị trí │ Truy vấn');
  chuaClick.slice(0, 20).forEach(r =>
    console.log(String(r.impressions).padStart(9) + String(r.position.toFixed(1)).padStart(8) + ' │ ' + r.keys[0]));

  const gan = tv.filter(r => r.position >= 5 && r.position <= 20 && r.impressions >= 2)
    .sort((a, b) => b.impressions - a.impressions);
  console.log('\n── 3. ĐANG Ở VỊ TRÍ 5–20, ĐẨY MỘT CHÚT LÀ LÊN (' + gan.length + ' truy vấn) ──\n');
  console.log('   Hiển thị  Vị trí │ Truy vấn');
  gan.slice(0, 20).forEach(r =>
    console.log(String(r.impressions).padStart(9) + String(r.position.toFixed(1)).padStart(8) + ' │ ' + r.keys[0]));

  /* 4. truy vấn chưa có trang riêng */
  const noiDung = daBuild.map(u => {
    const p = path.join(ROOT, u.replace(/^\//, ''), 'index.html');
    try { return { u, t: nod(fs.readFileSync(p, 'utf8').replace(/<[^>]*>/g, ' ').slice(0, 3000)) }; } catch { return null; }
  }).filter(Boolean);
  const thieu = tv.filter(r => r.impressions >= 3).filter(r => {
    const tu = nod(r.keys[0]).split(/\s+/).filter(w => w.length > 2);
    return !noiDung.some(p => tu.every(w => p.t.includes(w)));
  }).sort((a, b) => b.impressions - a.impressions);
  console.log('\n── 4. TRUY VẤN SITE ĐANG HIỆN MÀ CHƯA CÓ TRANG RIÊNG (' + thieu.length + ') ──\n');
  console.log('   Hiển thị  Vị trí │ Truy vấn  ← gợi ý bài tiếp theo');
  thieu.slice(0, 25).forEach(r =>
    console.log(String(r.impressions).padStart(9) + String(r.position.toFixed(1)).padStart(8) + ' │ ' + r.keys[0]));

  const T = tv.reduce((s, r) => ({ c: s.c + r.clicks, i: s.i + r.impressions }), { c: 0, i: 0 });
  console.log('\n   TỔNG ' + DAYS + ' ngày: ' + T.c + ' click · ' + T.i + ' hiển thị · ' + tv.length + ' truy vấn\n');
})();
