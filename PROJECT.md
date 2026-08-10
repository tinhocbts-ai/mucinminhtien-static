# PROJECT.md — mucinminhtien.com

> Nguồn context chính cho Claude Code. Đọc kỹ trước khi tạo/sửa bất kỳ file nào.
> Bản này chuyển playbook (v1 + bổ sung v2) sang đúng stack thật của repo: **HTML tĩnh + build.js**, không phải Next.js.
> Cập nhật: 2026-08-09.

---

## 0. Vì sao không dùng Next.js như playbook gốc

Playbook gốc viết cho Next.js 15 + MDX + Vercel. Repo này đã chạy production trên **GitHub Pages** với
`build.js` tự viết, 780 mã sản phẩm và tên miền đã trỏ. Đổi stack nghĩa là dựng lại từ đầu, mất toàn bộ
URL đang có index và hệ thống 69 trang redirect từ WordPress cũ — rủi ro lớn hơn lợi ích rất nhiều.

Điều thật sự tạo ra thứ hạng trong playbook **không phải Next.js**, mà là: cấu trúc nội dung, schema đầy đủ,
internal link có chủ đích, tốc độ tải, và nội dung độc nhất. Cả 5 thứ đó đều làm được trên HTML tĩnh —
và tĩnh còn nhanh hơn. Nên: **giữ stack, copy toàn bộ phương pháp.**

| Playbook gốc | Tương đương trong repo này |
|---|---|
| `content/**/*.mdx` + frontmatter | `src/**/index.html` (1 thư mục = 1 URL) |
| `content-collections` + zod | `scripts/check-seo.js` (lint sau build) |
| `data/site.ts` | `site.config.json` |
| `data/pricing.ts` | `data/bang-gia.json` (780 mã) |
| `lib/schema.ts` | `buildSharedSchema()` trong `build.js` |
| `next-sitemap` | Phần 4 của `build.js` |
| RSC render Header/Footer | `injectShell()` — nhúng lúc build |
| `scripts/check-seo.ts` | `scripts/check-seo.js` |
| `opengraph-image.tsx` | `tools/make-brand-images.js` |

---

## 1. Mục tiêu

Website bán hàng + dịch vụ tại TP.HCM, 4 nhánh doanh thu:
1. Bán hộp mực, drum, linh kiện máy in (nhánh chính — 780 mã)
2. Nạp mực / bơm mực tận nơi
3. Sửa máy in tận nơi
4. Linh kiện máy photocopy, máy fax, giấy in

**Mục tiêu SEO:** phủ long-tail theo 3 ma trận — `model máy × mã lỗi`, `triệu chứng × hãng`, `mã mực × model tương thích`.
**Mục tiêu kỹ thuật:** LCP < 2.0s, CLS < 0.05, 100% trang có schema hợp lệ, `check-seo.js` 0 lỗi ERR.

### ⚠ Ranh giới với 5 site còn lại

Trước khi viết bài mới, **bắt buộc tra** `D:/AUTOMATION/projects/phan-vung-keyword-2026-07.md`.
Phân vùng hiện tại: `mucinminhtien` = bán sản phẩm theo model + linh kiện photo + how-to gắn bán hàng.
Cụm **địa bàn (quận/phường) thuộc `tinhocnamphong`**. Xem mục 11 về việc này.

---

## 2. Stack

- HTML tĩnh, không framework, không build step nặng
- `build.js` (Node, không dependency ngoài) sinh toàn bộ trang từ `src/` + `site.config.json` + `data/`
- CSS thuần trong `assets/css/style.css`, font Be Vietnam Pro self-host (woff2)
- `sharp` chỉ dùng cho tool xử lý ảnh, không nằm trong luồng build trang
- Deploy: GitHub Pages, domain `mucinminhtien.com` (CNAME)

**Quy tắc bất di bất dịch:** chỉ sửa `src/`, `site.config.json`, `data/`, `assets/`.
**KHÔNG sửa file .html ở gốc repo** — chúng bị `node build.js` ghi đè.

---

## 3. Cây thư mục

```
.
├── PROJECT.md                  ← file này
├── build.js                    ← sinh toàn bộ site
├── site.config.json            ← NAP, hotline, geo, schema dùng chung
├── data/
│   ├── products.json           ← 55 SP có trang chi tiết
│   ├── bang-gia.json           ← 780 mã giá (trang bảng giá)
│   └── redirects.json          ← URL WordPress cũ → URL mới
├── src/
│   ├── index.html              ← trang chủ
│   ├── partials/               ← header.html, footer.html (nhúng lúc build)
│   ├── templates/product.html  ← template trang sản phẩm
│   ├── dich-vu/                ← TRANG MẪU CHUẨN (10 khối, mục 8)
│   ├── nap-muc-may-in-tan-noi-tphcm/
│   ├── bang-gia/  san-pham/  gioi-thieu/  lien-he/
│   └── huong-dan/<slug>/       ← cụm nội dung (14 bài)
├── scripts/
│   ├── check-seo.js            ← lint SEO toàn site
│   ├── apply-meta.js           ← quản lý tập trung title/description
│   └── new-page.js             ← scaffold trang mới  (mục 13)
├── tools/
│   ├── design-anh.js           ← ảnh kỹ thuật thật → hero 1200×675 WebP
│   └── make-brand-images.js    ← logo.png + og-default.jpg
└── assets/{css,js,fonts,img}
```

### Thư mục URL sẽ mở thêm

| Route | Loại | Nội dung |
|---|---|---|
| `/huong-dan/<slug>/` | `guide` + `error` | đang có 14 bài, mở rộng theo mục 11 |
| `/model/<slug>/` | `model` | lỗi theo model cụ thể (Epson L3110 nháy 2 đèn…) |
| `/muc-in/<slug>/` | `ink` | theo **mã mực**: dùng cho máy nào, giá, có nên mua |
| `/tu-van/<slug>/` | `buying` | tư vấn chọn mua máy in / hộp mực |
| `/san-pham/<slug>/` | `product` | đã có, sinh từ `data/products.json` |

---

## 4. Quy ước đặt tên

- Slug: tiếng Việt không dấu, gạch nối, không stopword thừa. VD `epson-l3110-nhay-2-den-do`.
- 1 thư mục = 1 URL, luôn có `index.html`, URL luôn kết thúc bằng `/`.
- Ảnh: `assets/img/{nhom}/{slug}-{stt}.webp`.
- **Mỗi trang đúng 1 thẻ H1.** Nội dung bắt đầu từ `##`.

---

## 5. Những gì build.js TỰ ĐỘNG làm cho mọi trang

Không phải nhớ, không thể quên — đây là điểm mạnh so với việc viết tay từng file:

1. **Nhúng header + footer thẳng vào HTML** (`injectShell`). Trước đây nạp bằng `fetch()` lúc chạy →
   Googlebot phải render JS mới thấy menu, toàn bộ internal link từ nav/footer gần như vô giá trị.
   Đây là lỗi nền tảng đã sửa ngày 09/08/2026.
2. **Sinh schema `BreadcrumbList`** từ breadcrumb hiển thị trên trang.
3. **Bổ sung Twitter Card + og:image mặc định** nếu trang chưa khai báo.
4. **Sinh mục lục** cho trang có đánh dấu `<!--TOC-->` (chỉ quét heading trong `<main>`).
5. **Schema dùng chung** `{{ldHome}}` / `{{ldBusiness}}` từ `site.config.json` → NAP không bao giờ lệch giữa các trang.
6. **Sitemap** từ danh sách trang thật đã build.
7. **Trang redirect** từ `data/redirects.json` (meta refresh + canonical, ngoài sitemap).

→ Người viết bài chỉ cần lo: title, description, nội dung, ảnh, schema riêng của loại trang.

---

## 6. Schema bắt buộc theo loại trang

| Loại trang | Schema |
|---|---|
| Trang chủ | `Organization` + `WebSite` (có SearchAction) + `LocalBusiness` — qua `{{ldHome}}` |
| `service` | `Service` (có `hasOfferCatalog`) + `FAQPage` + `BreadcrumbList` |
| `error` / `model` | `Article` + **`HowTo`** + `FAQPage` + `BreadcrumbList` |
| `guide` | `Article` + `BreadcrumbList` |
| `ink` / `product` | `Product` + `Offer` + `BreadcrumbList` |
| `location` (nếu làm) | `Service` + `LocalBusiness` (có `areaServed`) + `FAQPage` + `BreadcrumbList` |

**`HowTo` là lợi thế:** cả hai đối thủ đều thiếu. Mọi bài dạng "cách sửa / cách reset / cách cài" phải có.

**`aggregateRating` chỉ thêm khi có review THẬT.** Bịa đánh giá là vi phạm chính sách Google
và có thể bị gỡ toàn bộ rich result của site.

---

## 7. Công thức title & description (bắt buộc)

**Title 40–65 ký tự, KHÔNG emoji, từ khóa chính ở đầu:**

| Loại | Công thức |
|---|---|
| `error` | `{Lỗi}: {N} Nguyên Nhân Và Cách Sửa Trong {T} Phút` |
| `model` | `{Model} {Triệu Chứng}: Nguyên Nhân Và Cách Xử Lý` |
| `ink` | `{Mã Mực}: Dùng Cho Máy Nào, Giá Bao Nhiêu, Có Nên Mua` |
| `product` | `{Tên rút gọn ≤45} \| Mực In Minh Tiến` (build.js tự sinh) |
| `service` | `{Dịch Vụ} {Địa Bàn} – Từ {N}đ, Có Mặt {T} Phút` |

**Description 140–158 ký tự, đủ 4 thành phần:**
`{dịch vụ/sản phẩm}` + `{giá cụ thể "từ …đ"}` + `{thời gian có mặt / giao hàng}` + `{CTA gọi/Zalo}`

**Đầu bài: trả lời trực tiếp câu hỏi chính trong 40 từ đầu tiên** (ăn featured snippet + AI Overview).

Title/description của trang viết tay quản lý tập trung ở `scripts/apply-meta.js` — sửa một chỗ,
chạy `node scripts/apply-meta.js && node build.js`.

---

## 8. 10 khối bắt buộc của trang dịch vụ

Trang mẫu đã dựng đúng chuẩn: **`src/dich-vu/index.html`** — copy cấu trúc từ đó.

1. H1 + đoạn trả lời trực tiếp + 2 nút Gọi / Zalo
2. Dấu hiệu nhận biết cần dịch vụ
3. 5 lợi thế cạnh tranh (thời gian, minh bạch giá, vật tư sẵn, tay nghề, bảo hành)
4. **Bảng giá** ← khối kéo chuyển đổi mạnh nhất
5. Quy trình 5 bước
6. Hãng / dòng máy hỗ trợ (mỗi hãng link sang 1–2 bài `error`)
7. Phạm vi phục vụ
8. Case thực tế có ảnh trước–sau ← *chưa mở, cần ảnh thật, xem mục 10*
9. FAQ 5–6 câu (khớp 1-1 với schema `FAQPage`)
10. Khối NAP + CTA cuối

---

## 9. Quy tắc internal link

- `error` → trang `service` tương ứng + 2–4 `error` cùng nhóm triệu chứng
- `model` → `error` gốc + `product` linh kiện liên quan
- `product` → `bang-gia` + `dich-vu` + `huong-dan` + `nap-muc` (đã tự động trong template)
- `service` → toàn bộ hãng máy + top 8 `error`
- Trang chủ → 4 nhánh dịch vụ + 8 `error` + danh mục sản phẩm (mọi trang ≤ 3 click từ home)
- Anchor text đa dạng, mô tả tự nhiên, không lặp cứng một cụm
- **Ngưỡng kiểm:** ≥ 3 link nội bộ ra và ≥ 3 link nội bộ vào mỗi trang — `check-seo.js` tự cảnh báo

Trang sản phẩm dùng cơ chế **related xoay vòng** (`build.js`): mỗi SP trỏ tới 3 SP kế tiếp trong nhóm
theo vòng tròn, đảm bảo không SP nào bị mồ côi link.

---

## 10. Hình ảnh

| Loại | Kích thước | Định dạng |
|---|---|---|
| Hero / cover bài | 1200×675 | WebP q78 |
| Ảnh trong bài | 1000×600 | WebP |
| Sản phẩm | 640×640 hoặc 800×800 nền trắng | WebP |
| OG | 1200×630 | JPG (`tools/make-brand-images.js`) |
| Logo schema | 512×512 | PNG nền trắng |

- Ảnh **bắt buộc** có `alt` mô tả, `width`/`height` (chống CLS), `loading="lazy"` trừ ảnh hero (`fetchpriority="high"`).

### Quy trình ảnh: sinh trước, thay ảnh thật sau

Không chờ ảnh chụp mới được xuất bản. Mỗi bài tự có 2 ảnh ngay từ đầu:

```bash
npm run anh      # = tao-anh-bai.js + chen-anh-bai.js --write + build.js
```

- `tools/tao-anh-bai.js` đọc **H1, nhãn chuyên mục và danh sách H2 từ chính bài đã build**,
  sinh ra `assets/img/hero/<slug>.webp` (1200×675) và `assets/img/info/<slug>.webp`
  (1000×600, infographic các bước). Màu nền chọn theo hash của slug nên ổn định giữa các lần chạy.
- **Ảnh hero dùng ảnh máy in THẬT** lấy từ kho dự án Chợ Tốt
  (`D:/AUTOMATION/projects/chotot/chotot-images/<model>/original/`, 24 model có ảnh).
  Gán bài ↔ model ở `data/anh-nguon.json`. Ảnh gốc đã đăng trên Chợ Tốt nên **không dùng thô**:
  mỗi tấm được cắt 16:9, phủ panel gradient, ghi tiêu đề bài + tên miền → ảnh mới hoàn toàn,
  không bị coi là trùng lặp, lại tự mang từ khóa của bài.
- Tool ghi lại file đã dùng vào `data/anh-da-dung.json` nên **không bao giờ lặp lại một tấm ảnh
  giữa hai bài**, và ưu tiên ảnh nét (file nặng nhất trong thư mục).
- Bài chưa gán model thì dùng thẻ tiêu đề thiết kế (nền gradient, không ảnh máy).
  Chỉ gán khi ảnh **đúng loại máy** — ví dụ bài lỗi 5B00 là máy phun, không gán ảnh máy laser.

> **KHÔNG in số điện thoại lên ảnh.** Đổi số là phải render lại toàn bộ, và những ảnh Google đã
> index vẫn mang số cũ. Ảnh chỉ in tên miền + mô tả ngành hàng. Số điện thoại đã có ở header,
> footer, thanh CTA và schema.
- `scripts/chen-anh-bai.js --write` chèn `og:image`, `<figure>` hero và `<figure>` infographic
  vào đúng vị trí trong `src/`. Chạy lại nhiều lần an toàn, bài nào có ảnh rồi thì bỏ qua.
- `ANH-CAN-THAY.md` tự cập nhật, liệt kê từng bài kèm **gợi ý nên chụp gì**. Chụp được ảnh nào
  thì ghi đè lên đúng đường dẫn đó, giữ nguyên kích thước, rồi `node build.js`.

Ảnh sinh ra là **ảnh thiết kế**, giải quyết việc bài trống ảnh và cho ảnh OG tử tế —
nhưng không thay được tín hiệu E-E-A-T của ảnh hiện trường. Thay dần bằng ảnh thật.

Kho ảnh kỹ thuật thật: `D:\AUTOMATION\projects\tinhocnamphong\hình kỹ thuật\` (98 ảnh .jpg),
xử lý qua `tools/design-anh.js` (ảnh gốc + panel thương hiệu) trước khi dùng.
- Ảnh AI chỉ dùng cho hero trừu tượng. Không sinh ảnh có logo thương hiệu thật, không chèn chữ vào ảnh
  (dùng `<figcaption>` để Google đọc được).
- Ảnh chụp màn hình hướng dẫn: chụp thật trên Windows 11, che thông tin cá nhân, khoanh vùng viền cam `#F97316`.

---

## 11. Lộ trình

**Sprint 0 — Nền tảng kỹ thuật ✅ HOÀN THÀNH 09/08/2026**
`injectShell`, BreadcrumbList tự sinh, Twitter Card, TOC, schema dùng chung, `check-seo.js`,
`make-brand-images.js`, làm sạch title/description 20 trang, trang `/dich-vu/` chuẩn 10 khối.
Kết quả: 0 lỗi ERR, 73/77 trang sạch hoàn toàn.

**Sprint 1 — Cụm `model` (ưu tiên cao nhất cho site này)**
Đây là ma trận long-tail đúng phân vùng keyword của `mucinminhtien` — model máy dẫn thẳng tới bán hộp mực.
Epson L1110 / L1210 / L3110 / L3150 / L3210 / L3250 / L8050 (nháy đèn, Service Required, mất màu),
Canon 2900 / 6030 / MF3010, HP 107a-107w / 135a-135w / P1102 / lỗi 59.C0,
Brother HL-L2321D / L2701D (lỗi Toner, lỗi Paper).
Mỗi bài link thẳng sang trang `product` của hộp mực/linh kiện tương ứng.

**Sprint 2 — Cụm `ink` (mã mực)**
`/muc-in/<mã>/`: 12A, 85A, 337, 325, W1107A, TN-2380, CF226A, 003, 664… Mỗi trang trả lời đúng 3 câu:
dùng cho máy nào, giá bao nhiêu, nên mua chính hãng hay nạp lại. Đây là truy vấn có ý định mua rõ nhất.

**Sprint 3 — Mở rộng cụm `error`**
Bổ sung 15–20 bài: kẹt giấy, kẹt giấy liên tục, in mờ, không kéo giấy, ra giấy trắng, lem mực, nhòe chữ,
kêu to, không lên nguồn, không kết nối Wi-Fi, báo lỗi cartridge/drum/toner, không in 2 mặt,
kéo nhiều tờ, mùi khét, báo paper jam dù không kẹt. Tất cả phải có schema `HowTo`.

**Sprint 4 — Công cụ tra cứu (lợi thế đối thủ không có)**
"Tra hộp mực theo model máy in" — dữ liệu sẵn trong `data/bang-gia.json`, làm bằng JS thuần, không cần backend.

**Sprint 5 — E-E-A-T + đo lường**
Ảnh chụp thật, case trước–sau, Google Business Profile trùng NAP tuyệt đối, video ngắn 30–60s cho lỗi phổ biến,
đo Core Web Vitals, theo dõi GSC.

### Về "ưu tiên phường mới" (mục 14 của playbook v2)

Chiến lược phường mới sau sáp nhập TP.HCM đúng và đáng làm — tập từ khóa gần như trống.
Nhưng theo bảng phân vùng 6 site, cụm địa bàn thuộc `tinhocnamphong`, làm ở cả 2 site sẽ tự cạnh tranh.

**Quyết định 09/08/2026: hoãn cụm phường, chạy cụm `model` và `ink` trước.** Quay lại quyết định
site nào làm cụm phường sau khi cụm model đã có dữ liệu GSC.

### Nhịp xuất bản — hẹn ngày đăng

Viết và commit cả loạt bài một lần, nhưng cho chúng lên sóng rải theo ngày. Cách làm:

1. Đặt `<!--PUBLISH 2026-08-15-->` ngay sau `<main id="main-content">` trong file `src/` của bài.
2. Trước ngày đó, `build.js` **không sinh HTML** cho trang: không có file, không có trong sitemap,
   không có link trỏ tới. Google không "chưa thấy" trang — trang thật sự chưa tồn tại. Đây là điểm
   khác biệt so với việc gắn `noindex` hay giấu khỏi sitemap: không có gì để Google hiểu nhầm.
3. `.github/workflows/publish.yml` chạy 08:00 giờ VN mỗi ngày, build lại và commit nếu có bài tới ngày.

**Tránh link gãy:** thẻ card hoặc mục danh sách trỏ tới bài chưa đăng phải bọc trong
`<!--CARD model/abc/-->` … `<!--/CARD-->` — build tự gỡ khối đó khi bài chưa tới ngày, và tự trả lại
khi đã đăng. Nếu quên bọc, build in cảnh báo `LINK GÃY` kèm đúng đường dẫn cần sửa.

Ngày so theo múi giờ `Asia/Ho_Chi_Minh`, không phải UTC.

Bài viết xong nhưng chưa có ảnh: giữ khối `<!-- ẢNH CẦN CHỤP -->` trong `src/` ghi rõ cần chụp gì,
chưa chèn thẻ `<img>` để tránh ảnh vỡ trên trang đang chạy.

### Về việc "tham khảo nội dung đối thủ"

Bóc **bộ khung, danh sách ý và câu hỏi** đối thủ đang phủ là hợp lệ và nên làm.
Nhưng **không spin lại câu chữ của họ** — thuật toán chống scaled content abuse nhắm đúng vào đó,
và mục 7 + mục 12 của chính tài liệu này cấm. Cách cho kết quả tốt hơn: cùng độ phủ chủ đề,
viết mới hoàn toàn, cộng thêm thứ đối thủ không có (bảng tra, số liệu chi phí thật, link tới đúng mã hàng đang bán).

---

## 12. Ranh giới KHÔNG làm

- **Không** host, mirror hay đặt link tải Epson Adjustment Program, resetter crack, phần mềm full active.
  Rủi ro DMCA và Google đang siết mạnh. Thay bằng: bài giải thích cơ chế waste ink pad counter,
  dấu hiệu "Service Required", hướng dẫn vệ sinh/thay hộp mực thải, và **dịch vụ reset tận nơi**
  (đây mới là trang chuyển đổi). Cách này vẫn bắt được phần lớn truy vấn mà không dính rủi ro.
- **Không** viết mảng lạc đề (game, thủ thuật máy tính chung) — giữ topical authority thuần máy in.
- **Không** nhân bản trang địa bàn chỉ đổi tên phường (Google coi là scaled content abuse).
  Mỗi trang địa bàn phải có ≥ 40% nội dung độc nhất: tên đường thật, case thật, ảnh thật.
- **Không** nhồi emoji vào title.
- **Không** bịa case khách hàng, bịa review, bịa `aggregateRating`.
- **Không** copy câu chữ từ website tham khảo — chỉ giữ chủ đề và sự thật kỹ thuật, viết lại hoàn toàn.

---

## 13. Definition of Done cho một trang

- [ ] `node build.js` không cảnh báo thiếu key
- [ ] `node scripts/check-seo.js` — 0 lỗi ERR cho trang đó
- [ ] Title 40–65 ký tự theo công thức mục 7, không emoji
- [ ] Description 140–158 ký tự, đủ 4 thành phần
- [ ] Đúng 1 H1; trả lời câu hỏi chính trong 40 từ đầu
- [ ] Đủ số từ: `error` 1.400–1.800 · `model` 1.200–1.600 · `service` 2.200–3.000 · `guide` 900–1.400
- [ ] Ít nhất 1 bảng hoặc 1 danh sách bước đánh số
- [ ] ≥ 2 ảnh riêng có alt + caption, đúng kích thước mục 10
- [ ] FAQ ≥ 4 câu, khớp 1-1 với schema `FAQPage`
- [ ] Schema đủ theo mục 6, test Rich Results không lỗi
- [ ] ≥ 3 link nội bộ ra, ≥ 3 link nội bộ vào
- [ ] `<!--TOC-->` nếu bài > 1.200 từ
- [ ] Đã soát chính tả (đối thủ sai nhiều — đây là lợi thế)

---

## 14. Lệnh thường dùng

```bash
node build.js                      # sinh lại toàn bộ site
node scripts/check-seo.js          # lint SEO chi tiết từng trang
node scripts/check-seo.js --summary  # chỉ bảng tổng hợp
node scripts/check-seo.js --fail   # exit 1 nếu còn lỗi ERR (dùng cho CI)
node scripts/apply-meta.js         # cập nhật title/description tập trung
node tools/make-brand-images.js    # sinh lại logo.png + og-default.jpg
```

Quy trình chuẩn khi thêm/sửa nội dung:

```bash
node build.js && node scripts/check-seo.js --summary
```

## 15. Lệnh gợi ý cho Claude Code

```
# Sinh bài model
Đọc PROJECT.md mục 6, 7, 9, 13. Tạo src/model/epson-l3110-nhay-2-den-do/index.html
theo chuẩn type "model", 1.400 từ, có schema Article + HowTo + FAQPage,
link sang product hộp mực Epson tương ứng, tự đề xuất 3 ảnh cần chụp kèm alt.

# Kiểm tra
Chạy node build.js && node scripts/check-seo.js, liệt kê trang thiếu internal link,
title sai độ dài, hoặc thiếu schema, rồi sửa.
```
