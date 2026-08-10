/* scripts/new-page.js — Dựng khung một trang mới đúng chuẩn PROJECT.md.
 *
 *   node scripts/new-page.js <loai> <slug> "<Tiêu đề H1>"
 *
 *   loai:  model | ink | error | guide | service
 *
 * Ví dụ:
 *   node scripts/new-page.js model epson-l3110-nhay-2-den-do "Epson L3110 nháy 2 đèn đỏ"
 *   node scripts/new-page.js ink hop-muc-12a "Hộp mực 12A"
 *
 * Sinh ra src/<thu-muc>/<slug>/index.html với sẵn: head đủ thẻ, schema đúng loại,
 * breadcrumb, TOC, khung FAQ khớp schema, khối liên kết nội bộ và CTA.
 * Việc còn lại chỉ là viết nội dung vào các chỗ đánh dấu VIẾT-NỘI-DUNG.
 *
 * Sau khi viết xong:  node build.js && node scripts/check-seo.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const TYPES = {
  model: { dir: 'model', crumb: 'Lỗi theo model', schema: ['Article', 'HowTo', 'FAQPage'], words: '1.200–1.600' },
  ink: { dir: 'muc-in', crumb: 'Mực in', schema: ['Product', 'FAQPage'], words: '900–1.400' },
  error: { dir: 'huong-dan', crumb: 'Hướng dẫn', schema: ['Article', 'HowTo', 'FAQPage'], words: '1.400–1.800' },
  guide: { dir: 'huong-dan', crumb: 'Hướng dẫn', schema: ['Article', 'FAQPage'], words: '900–1.400' },
  service: { dir: '.', crumb: 'Dịch vụ', schema: ['Service', 'FAQPage'], words: '2.200–3.000' }
};

const [, , type, slug, ...titleParts] = process.argv;
const title = titleParts.join(' ');

if (!type || !slug || !title || !TYPES[type]) {
  console.error('Dùng:  node scripts/new-page.js <' + Object.keys(TYPES).join('|') + '> <slug> "<Tiêu đề H1>"');
  process.exit(1);
}

const t = TYPES[type];
const rel = path.join('src', t.dir, slug, 'index.html');
const outFile = path.join(ROOT, rel);
if (fs.existsSync(outFile)) {
  console.error('Đã tồn tại: ' + rel + ' — xoá trước nếu muốn tạo lại.');
  process.exit(1);
}

const urlPath = '/' + (t.dir === '.' ? '' : t.dir + '/') + slug + '/';
const up = t.dir === '.' ? '../' : '../../';
const today = new Date().toISOString().slice(0, 10);

const schemaBlocks = [];

if (t.schema.includes('Article')) {
  schemaBlocks.push(`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${title}",
  "description": "VIẾT-NỘI-DUNG: tóm tắt 1 câu, dưới 155 ký tự",
  "image": "https://mucinminhtien.com/assets/img/hero/${slug}.webp",
  "author": { "@id": "https://mucinminhtien.com/#organization" },
  "publisher": { "@id": "https://mucinminhtien.com/#organization" },
  "datePublished": "${today}",
  "dateModified": "${today}",
  "mainEntityOfPage": "https://mucinminhtien.com${urlPath}"
}
</script>`);
}

if (t.schema.includes('Product')) {
  schemaBlocks.push(`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${title}",
  "description": "VIẾT-NỘI-DUNG: mô tả sản phẩm, dưới 155 ký tự",
  "image": "https://mucinminhtien.com/assets/img/hero/${slug}.webp",
  "brand": { "@type": "Brand", "name": "VIẾT-NỘI-DUNG: HP / Canon / Brother / Epson" },
  "offers": {
    "@type": "Offer",
    "url": "https://mucinminhtien.com${urlPath}",
    "priceCurrency": "VND",
    "price": "VIẾT-NỘI-DUNG",
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://mucinminhtien.com/#localbusiness" }
  }
}
</script>`);
}

schemaBlocks.push(`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "VIẾT-NỘI-DUNG câu hỏi 1",
      "acceptedAnswer": { "@type": "Answer", "text": "VIẾT-NỘI-DUNG trả lời 1, 40–70 từ, viết đủ ý để đứng một mình vẫn hiểu." } },
    { "@type": "Question", "name": "VIẾT-NỘI-DUNG câu hỏi 2",
      "acceptedAnswer": { "@type": "Answer", "text": "VIẾT-NỘI-DUNG trả lời 2." } },
    { "@type": "Question", "name": "VIẾT-NỘI-DUNG câu hỏi 3",
      "acceptedAnswer": { "@type": "Answer", "text": "VIẾT-NỘI-DUNG trả lời 3." } },
    { "@type": "Question", "name": "VIẾT-NỘI-DUNG câu hỏi 4",
      "acceptedAnswer": { "@type": "Answer", "text": "VIẾT-NỘI-DUNG trả lời 4." } }
  ]
}
</script>`);

const howto = t.schema.includes('HowTo')
  ? '<!--HOWTO totalTime="PT15M" from="Bước 1"-->\n'
  : '';

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>VIẾT-NỘI-DUNG: title 40–65 ký tự, không emoji</title>
<meta name="description" content="VIẾT-NỘI-DUNG: 140–158 ký tự, đủ 4 phần — nội dung + giá cụ thể + thời gian + CTA gọi/Zalo.">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://mucinminhtien.com${urlPath}">
<meta property="og:type" content="article">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="Mực in Minh Tiến">
<meta property="og:title" content="VIẾT-NỘI-DUNG: tiêu đề khi chia sẻ">
<meta property="og:description" content="VIẾT-NỘI-DUNG: mô tả ngắn khi chia sẻ.">
<meta property="og:url" content="https://mucinminhtien.com${urlPath}">
<meta property="og:image" content="https://mucinminhtien.com/assets/img/hero/${slug}.webp">
<link rel="stylesheet" href="${up}assets/css/style.css">
${schemaBlocks.join('\n')}
</head>
<body>
<a class="skip-link" href="#main-content">Bỏ qua tới nội dung chính</a>
<div id="site-header"></div>

<main id="main-content">
${howto}  <div class="container">
    <p class="breadcrumb"><a href="${up}index.html">Trang chủ</a> / <a href="../">${t.crumb}</a> / ${title}</p>
  </div>

  <section style="padding-top:0">
    <div class="container">
      <div class="prose">
        <span class="post-tag">VIẾT-NỘI-DUNG: nhãn chuyên mục</span>
        <h1 style="margin:12px 0 6px">${title}</h1>
        <p class="post-meta">Cập nhật: ${today.split('-').reverse().join('/')} · VIẾT-NỘI-DUNG: áp dụng cho model nào</p>

        <figure style="margin-top:20px">
          <img src="${up}assets/img/hero/${slug}.webp" alt="VIẾT-NỘI-DUNG: mô tả đúng nội dung ảnh"
               width="1200" height="675" fetchpriority="high" style="border-radius:var(--radius-sm)">
          <figcaption>VIẾT-NỘI-DUNG: chú thích ảnh (Google đọc được, ảnh thì không)</figcaption>
        </figure>

        <p><strong>VIẾT-NỘI-DUNG: trả lời thẳng câu hỏi chính trong 40 từ đầu tiên.</strong>
        Đây là đoạn Google lấy làm featured snippet và AI Overview — không mở bài vòng vo.</p>

        <!--TOC-->

        <h2>Bước 1 — VIẾT-NỘI-DUNG</h2>
        <p>VIẾT-NỘI-DUNG. Độ dài mục tiêu cả bài: ${t.words} từ.</p>

        <h2>Bước 2 — VIẾT-NỘI-DUNG</h2>
        <p>VIẾT-NỘI-DUNG.</p>

        <h2>VIẾT-NỘI-DUNG: bảng tra cứu hoặc số liệu chi phí</h2>
        <p>Mỗi bài phải có ít nhất 1 bảng hoặc 1 danh sách bước đánh số — đây là thứ đối thủ thường thiếu.</p>

        <h2>Câu hỏi thường gặp</h2>
      </div>
      <div class="faq">
        <details><summary>VIẾT-NỘI-DUNG câu hỏi 1</summary><div>VIẾT-NỘI-DUNG trả lời 1 — phải khớp CHÍNH XÁC với schema FAQPage ở trên.</div></details>
        <details><summary>VIẾT-NỘI-DUNG câu hỏi 2</summary><div>VIẾT-NỘI-DUNG trả lời 2.</div></details>
        <details><summary>VIẾT-NỘI-DUNG câu hỏi 3</summary><div>VIẾT-NỘI-DUNG trả lời 3.</div></details>
        <details><summary>VIẾT-NỘI-DUNG câu hỏi 4</summary><div>VIẾT-NỘI-DUNG trả lời 4.</div></details>
      </div>

      <div class="prose" style="margin-top:34px">
        <h2>Bài viết liên quan</h2>
        <ul>
          <li>VIẾT-NỘI-DUNG: ≥ 3 link nội bộ ra, anchor mô tả tự nhiên</li>
          <li><a href="${up}tra-hop-muc/">Tra hộp mực theo model máy in</a></li>
          <li><a href="${up}dich-vu/">Dịch vụ sửa máy in tận nơi TP.HCM</a></li>
        </ul>
      </div>

      <div class="cta-banner" style="margin-top:40px">
        <h2>VIẾT-NỘI-DUNG: tiêu đề CTA gắn với đúng vấn đề của bài</h2>
        <p>Gọi hoặc nhắn Zalo {{hotlineDisplay}} — kỹ thuật viên có mặt trong 30–60 phút tại khu vực trung tâm TP.HCM.</p>
        <div class="btn-row" style="justify-content:center">
          <a href="tel:{{hotlineTel}}" class="btn btn-outline">Gọi {{hotlineDisplay}}</a>
          <a href="https://zalo.me/{{hotlineTel}}" target="_blank" rel="noopener" class="btn btn-outline">Nhắn Zalo</a>
        </div>
      </div>
    </div>
  </section>
</main>

<div id="site-footer"></div>
<script src="${up}assets/js/include.js"></script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html, 'utf8');

console.log('  ✓ Đã tạo ' + rel);
console.log('    URL sau khi build: https://mucinminhtien.com' + urlPath);
console.log('    Schema: ' + t.schema.join(' + ') + ' + BreadcrumbList (tự sinh)');
console.log('    Độ dài mục tiêu: ' + t.words + ' từ');
console.log('\n  Tìm toàn bộ chỗ cần viết:  grep -rn "VIẾT-NỘI-DUNG" ' + rel.replace(/\\/g, '/'));
console.log('  Xong thì chạy:             node build.js && node scripts/check-seo.js');
