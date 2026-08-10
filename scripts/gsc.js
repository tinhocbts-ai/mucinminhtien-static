/* scripts/gsc.js — Làm việc với Google Search Console qua API.
 *
 *   node scripts/gsc.js sitemap        # nộp lại sitemap.xml
 *   node scripts/gsc.js index          # kiểm tra từng URL đã được index chưa
 *   node scripts/gsc.js index --new    # chỉ kiểm URL thêm/sửa trong 7 ngày qua
 *   node scripts/gsc.js queries        # top truy vấn 28 ngày
 *   node scripts/gsc.js trung-lap      # dò 2 site có ăn thịt nhau trên cùng truy vấn không
 *
 * ────────────────────────────────────────────────────────────────
 * KHÔNG CÓ LỆNH "request indexing".
 * Indexing API của Google chỉ hỗ trợ chính thức JobPosting và BroadcastEvent.
 * Dùng nó cho trang thường là sai tài liệu công bố — Google có thể bỏ qua
 * hoặc coi là lạm dụng. Việc đó phải bấm tay trong GSC → URL Inspection.
 * Cái script này làm được là CHẨN ĐOÁN: cho biết chính xác trang nào chưa
 * index để anh bấm tay đúng chỗ, thay vì bấm mò.
 * ────────────────────────────────────────────────────────────────
 *
 * CẦN LÀM 2 VIỆC MỘT LẦN TRƯỚC KHI CHẠY (chỉ chủ tài khoản làm được):
 *
 *  1. Bật API trong Google Cloud project n8nhungthinh-492502:
 *     https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
 *
 *  2. Cấp quyền cho service account trong Search Console:
 *     GSC → chọn property mucinminhtien.com → Cài đặt → Người dùng và quyền
 *     → Thêm người dùng → dán email:
 *        hungthinhservicesacc@n8nhungthinh-492502.iam.gserviceaccount.com
 *     → quyền "Đầy đủ" (cần Đầy đủ mới nộp được sitemap; "Hạn chế" chỉ đọc được)
 *
 *  Làm y hệt cho property tinhocnamphong nếu muốn dùng lệnh trung-lap.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://mucinminhtien.com/';
const SITEMAP = 'https://mucinminhtien.com/sitemap.xml';
const KEY_FILE = 'D:/AUTOMATION/projects/chotot/service-account.json';
const SITE_2 = 'https://tinhocnamphong.net/';   // dùng cho lệnh trung-lap

const cmd = process.argv[2];
const argv = process.argv.slice(3);

async function auth(readOnly) {
  if (!fs.existsSync(KEY_FILE)) {
    console.error('Không thấy service account: ' + KEY_FILE);
    process.exit(1);
  }
  const scopes = readOnly
    ? ['https://www.googleapis.com/auth/webmasters.readonly']
    : ['https://www.googleapis.com/auth/webmasters'];
  const client = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: scopes });
  return google.searchconsole({ version: 'v1', auth: await client.getClient() });
}

function huongDanLoi(e) {
  const msg = (e && e.message) || String(e);
  console.error('\n✗ ' + msg + '\n');
  if (/permission|forbidden|403/i.test(msg)) {
    console.error('  Nguyên nhân gần như chắc chắn: service account chưa được thêm vào GSC.');
    console.error('  Vào GSC → property mucinminhtien.com → Cài đặt → Người dùng và quyền');
    console.error('  → Thêm: hungthinhservicesacc@n8nhungthinh-492502.iam.gserviceaccount.com\n');
  } else if (/has not been used|disabled|API/i.test(msg)) {
    /* Lỗi của Google có kèm project NUMBER — dùng số đó chắc ăn hơn project ID,
       vì Cloud Console hay tự nhảy sang project mặc định khi ID không khớp. */
    const soProject = (msg.match(/project (\d+)/) || [])[1];
    console.error('  Chưa bật Search Console API trong Google Cloud.');
    if (soProject) {
      console.error('  Mở đúng link này (gắn cứng project số ' + soProject + ', không nhảy đi đâu được):\n');
      console.error('  https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=' + soProject + '\n');
      console.error('  Kiểm tra góc trên hiện đúng tên project rồi bấm ENABLE.');
      console.error('  Bật xong đợi 1–2 phút cho lan truyền rồi chạy lại.\n');
    } else {
      console.error('  https://console.cloud.google.com/apis/library/searchconsole.googleapis.com\n');
    }
  }
  process.exit(1);
}

/* Danh sách URL thật đã build, đọc từ sitemap vừa sinh */
function urlsFromSitemap() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

/* ---------- sitemap ---------- */
async function napSitemap() {
  const api = await auth(false);
  await api.sitemaps.submit({ siteUrl: SITE, feedpath: SITEMAP });
  console.log('✓ Đã nộp lại ' + SITEMAP);

  const res = await api.sitemaps.get({ siteUrl: SITE, feedpath: SITEMAP });
  const s = res.data;
  console.log('  Lần cuối Google tải: ' + (s.lastDownloaded || 'chưa tải lần nào'));
  console.log('  Số URL Google đọc được: ' + ((s.contents && s.contents[0] && s.contents[0].submitted) || '—'));
  if (s.errors > 0 || s.warnings > 0) {
    console.log('  ⚠ lỗi: ' + s.errors + ', cảnh báo: ' + s.warnings);
  }
}

/* ---------- kiểm tra index ---------- */
async function kiemTraIndex() {
  const api = await auth(true);
  let urls = urlsFromSitemap();

  if (argv.includes('--new')) {
    /* chỉ lấy trang có file nguồn sửa trong 7 ngày qua */
    const nguong = Date.now() - 7 * 864e5;
    urls = urls.filter(u => {
      const rel = u.replace(SITE, '').replace(/\/$/, '');
      const f = path.join(ROOT, rel || '.', 'index.html');
      try { return fs.statSync(f).mtime.getTime() > nguong; } catch { return false; }
    });
    console.log('Chỉ kiểm ' + urls.length + ' URL mới/vừa sửa trong 7 ngày.\n');
  }

  const daIndex = [], chuaIndex = [], loi = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    process.stdout.write('\r  đang kiểm ' + (i + 1) + '/' + urls.length + '   ');
    try {
      const r = await api.urlInspection.index.inspect({
        requestBody: { inspectionUrl: u, siteUrl: SITE }
      });
      const s = r.data.inspectionResult.indexStatusResult || {};
      const verdict = s.verdict;                       // PASS | NEUTRAL | FAIL
      const cover = s.coverageState || '';
      if (verdict === 'PASS') daIndex.push({ u, cover });
      else chuaIndex.push({ u, cover: cover || verdict });
    } catch (e) {
      loi.push({ u, msg: (e.message || '').slice(0, 60) });
    }
    await new Promise(r => setTimeout(r, 350));        // tôn trọng hạn ngạch
  }
  process.stdout.write('\r' + ' '.repeat(40) + '\r');

  console.log('✓ ĐÃ INDEX: ' + daIndex.length + '/' + urls.length);
  if (chuaIndex.length) {
    console.log('\n✗ CHƯA INDEX: ' + chuaIndex.length + ' — đây là danh sách cần bấm tay trong URL Inspection:\n');
    chuaIndex.forEach(x => console.log('   ' + x.u + '\n        → ' + x.cover));
  }
  if (loi.length) {
    console.log('\n⚠ Không kiểm được ' + loi.length + ' URL:');
    loi.slice(0, 5).forEach(x => console.log('   ' + x.u + ' — ' + x.msg));
  }
  console.log('\nGhi chú: API không cho phép yêu cầu index. Copy danh sách trên vào');
  console.log('GSC → URL Inspection → Request indexing, mỗi ngày làm được khoảng 10 URL.');
}

/* ---------- truy vấn ---------- */
function ngayTruoc(n) {
  return new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
}

async function truyVan() {
  const api = await auth(true);
  const r = await api.searchanalytics.query({
    siteUrl: SITE,
    requestBody: {
      startDate: ngayTruoc(28), endDate: ngayTruoc(1),
      dimensions: ['query'], rowLimit: 40
    }
  });
  const rows = r.data.rows || [];
  if (!rows.length) { console.log('Chưa có dữ liệu truy vấn trong 28 ngày qua.'); return; }
  console.log('TOP TRUY VẤN 28 NGÀY — ' + SITE + '\n');
  console.log('  click  hiển thị   CTR    vị trí   truy vấn');
  rows.forEach(x => console.log(
    '  ' + String(x.clicks).padStart(5) +
    String(x.impressions).padStart(9) +
    (x.ctr * 100).toFixed(1).padStart(7) + '%' +
    x.position.toFixed(1).padStart(8) + '   ' + x.keys[0]));
}

/* ---------- dò trùng lặp giữa 2 site ---------- */
async function trungLap() {
  const api = await auth(true);
  const lay = async site => {
    try {
      const r = await api.searchanalytics.query({
        siteUrl: site,
        requestBody: {
          startDate: ngayTruoc(28), endDate: ngayTruoc(1),
          dimensions: ['query'], rowLimit: 500
        }
      });
      return new Map((r.data.rows || []).map(x => [x.keys[0], x]));
    } catch (e) {
      console.error('  ⚠ không đọc được ' + site + ' — ' + (e.message || '').slice(0, 70));
      return new Map();
    }
  };

  const [a, b] = await Promise.all([lay(SITE), lay(SITE_2)]);
  if (!a.size || !b.size) { console.log('\nThiếu dữ liệu một trong hai property, không so được.'); return; }

  const chung = [...a.keys()].filter(k => b.has(k));
  if (!chung.length) { console.log('✓ Không có truy vấn nào cả hai site cùng xuất hiện. Không đụng nhau.'); return; }

  console.log('⚠ ' + chung.length + ' truy vấn CẢ HAI SITE cùng lên — kiểm xem có chia phiếu không:\n');
  console.log('  truy vấn'.padEnd(38) + 'minhtien'.padStart(16) + '   namphong');
  chung
    .map(k => ({ k, x: a.get(k), y: b.get(k) }))
    .sort((p, q) => (p.x.position + p.y.position) - (q.x.position + q.y.position))
    .slice(0, 30)
    .forEach(r => {
      const canhBao = (r.x.position > 12 && r.y.position > 12) ? '  ← cả hai đều thấp, nghi chia phiếu' : '';
      console.log('  ' + r.k.slice(0, 36).padEnd(38) +
        ('pos ' + r.x.position.toFixed(1)).padStart(16) +
        ('   pos ' + r.y.position.toFixed(1)) + canhBao);
    });
  console.log('\n  Truy vấn nào cả hai cùng ở vị trí > 12 là dấu hiệu chia phiếu:');
  console.log('  nên để một site giữ chủ đề đó, site kia đổi góc tiếp cận.');
}

/* ---------- chạy ---------- */
const lenh = {
  sitemap: napSitemap,
  index: kiemTraIndex,
  queries: truyVan,
  'trung-lap': trungLap
};

if (!lenh[cmd]) {
  console.log('Dùng: node scripts/gsc.js <sitemap|index|queries|trung-lap>');
  console.log('  sitemap      nộp lại sitemap.xml');
  console.log('  index        kiểm từng URL đã index chưa (thêm --new để chỉ kiểm URL mới)');
  console.log('  queries      top truy vấn 28 ngày');
  console.log('  trung-lap    dò 2 site có ăn thịt nhau trên cùng truy vấn không');
  process.exit(1);
}

lenh[cmd]().catch(huongDanLoi);
