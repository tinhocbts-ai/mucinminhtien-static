# SESSION-NOTES — mucinminhtien.com

> File bàn giao giữa các phiên làm việc. **Đọc file này trước, rồi tới `PROJECT.md` và `CONTENT-PLAN.md`.**
> Cập nhật lần cuối: 10/08/2026 — sau phiên viết 14 trang (cụm sọc, cụm bill/nhiệt, cụm driver, 3 mã mực cuối).

---

## 0. Việc phải làm ngay khi mở phiên mới

**Mặc định mỗi phiên là VIẾT BÀI, không phải dựng công cụ.** Chủ site đã nhắc rõ điều này —
khoảng cách với đối thủ là 205 bài so với 32 bài của mình, không phải thiếu công cụ.
Chỉ làm công cụ khi nó trực tiếp tăng tốc sản xuất nội dung.

Không hỏi lại "có làm tiếp không" — cứ làm tiếp cụm kế trong `CONTENT-PLAN.md`.

```bash
node build.js && node scripts/check-seo.js --summary && node scripts/check-anchors.js
```

---

## 1. Tình trạng hiện tại

| | |
|---|---|
| Trang đã build | **116** |
| Bài nội dung | **46** (27 hướng dẫn, 11 model, 11 mã mực, trừ hub) |
| Lỗi ERR | **0** |
| Cảnh báo | 1 (inlink < 3 ở 1 trang sản phẩm) |
| Anchor gãy | 0 |
| Link ra ngoài | 11 link / 6 domain |
| Commit gần nhất | `293e0e1` |

Site live: https://mucinminhtien.com — GitHub Pages, repo **public** `tinhocbts-ai/mucinminhtien-static`.

---

## 2. Bối cảnh cạnh tranh

**Đối thủ chính: `linhkienmayingiare.net`** — do kỹ thuật viên cũ của Nam Phong tách ra lập,
dùng lại tên thương hiệu, đổi logo. **Không phải site nhà.** Site nhà là `tinhocnamphong`.
mucinminhtien là site mới dựng để tranh key với đối thủ mà không động vào site cũ.

Quy mô đối thủ (đọc từ sitemap ngày 10/08/2026):

| | Họ | Ta |
|---|---|---|
| Bài viết | 205 | 46 |
| Sản phẩm | 248 | 55 |
| **Tổng URL** | **~493** | **116** |

Bóc 205 bài của họ:
- ~26 bài **phần mềm reset crack** → ta KHÔNG làm (DMCA + malware)
- 40 trang **quận/phường**, gồm ma trận lỗi × quận (`sua-may-in-bi-lem-muc-quan-phu-nhuan`) → đang hoãn
- 31 bài **lỗi theo model cụ thể** → ta có 9
- ~57 bài lỗi chung + mở rộng tỉnh (Bình Dương, Tiền Giang)

**Phần thật sự phải đuổi: ~110 bài. Còn thiếu ~78.**

### Đối thủ mạnh ở đâu, yếu ở đâu

Đã đọc trực tiếp bài của họ để đo:

| | Họ | Ta |
|---|---|---|
| Độ dài bài lỗi | 3.500–4.000 từ | 2.200–3.200 |
| Schema JSON-LD | **không có gì** | Article + HowTo + FAQPage + Breadcrumb |
| FAQ | không có | 5–6 câu vào schema |
| Mục lục | không có | có |
| Bảng giá trong bài | không công khai | 2 bảng, giá linh kiện thật |
| Ảnh | placeholder SVG | ảnh máy thật + ảnh xưởng + infographic |

**Chiêu của họ:** dùng trang tải phần mềm reset để kéo traffic, trong file nén có text
bảo người dùng lên Google gõ từ khoá → bấm vào trang họ → kéo xuống copy mã để giải nén.
Đây là **thao túng tín hiệu người dùng**. Đã thống nhất KHÔNG làm lại; thay bằng viết
cụm bài giải thích cơ chế + bán dịch vụ reset tận nơi.

---

## 3. Cách sản xuất nội dung (quan trọng nhất)

Ba cụm dùng **template + JSON** để đạt khối lượng mà vẫn khác biệt thật:

| Cụm | Dữ liệu | Template |
|---|---|---|
| Mã mực `/muc-in/` | `data/muc-in.json` | `src/templates/muc-in.html` |
| Lỗi theo model `/model/` | `data/model-loi.json` | `src/templates/model-loi.html` |
| Sản phẩm `/san-pham/` | `data/products.json` | `src/templates/product.html` |

Thêm bài mới = thêm một khối JSON → hub tự cập nhật, link chéo tự sinh, ảnh tự tạo.
**Khoảng 15 phút một trang thay vì cả tiếng.**

Bài đứng riêng (không theo cụm) thì viết file HTML trong `src/`.

### Quy trình chuẩn khi thêm bài

```bash
node build.js                              # sinh trang
node tools/tao-anh-bai.js                  # sinh ảnh hero + infographic
node scripts/chen-anh-bai.js --write       # chèn ảnh vào bài viết tay
node build.js && node scripts/check-seo.js --summary && node scripts/check-anchors.js
```

Hoặc gộp: `npm run all` rồi `npm run anh`.

### Bộ khung bắt buộc cho bài lỗi

Rút từ đối thủ đang top: Dấu hiệu → Nguyên nhân (mỗi cái một H3) → Cách khắc phục từng bước
→ Khi nào gọi thợ → **Báo giá** → Phòng tránh → FAQ. Mục tiêu **2.000–2.500 từ**.

Bốn thứ bắt buộc có mà đối thủ không có: **schema đầy đủ, FAQ ≥5 câu, bảng tra triệu chứng →
bộ phận → chi phí, bảng báo giá dịch vụ.**

---

## 4. Ảnh — đã tự động hoá

Ba nguồn:

| Nguồn | Đường dẫn | Dùng làm gì |
|---|---|---|
| Kho Chợ Tốt | `D:/AUTOMATION/projects/chotot/chotot-images/<model>/original/` | Ảnh hero: máy in thật + panel + tiêu đề bài |
| Ảnh xưởng | `assets/img/xuong/` (18 tấm đã xử lý) | Ảnh hiện trường trong thân bài |
| Sinh từ nội dung | `assets/img/info/` | Infographic các bước |

- Gán bài ↔ model máy ở **`data/anh-nguon.json`**
- Tool ghi lại file đã dùng ở `data/anh-da-dung.json` → **không bao giờ lặp một tấm**
- **KHÔNG in số điện thoại lên ảnh** (đổi số là phải render lại toàn bộ)
- Chỉ gán ảnh khi **đúng loại máy** — vd bài lỗi 5B00 là máy phun, không gán ảnh laser

24 model trong kho Chợ Tốt, còn ~9 model chưa dùng.

---

## 5. Cơ chế đặc biệt trong build.js

| Cơ chế | Cách dùng |
|---|---|
| **Hẹn ngày đăng** | `<!--PUBLISH 2026-08-15-->` trong file src → trước ngày đó không sinh HTML |
| **Card tự ẩn** | `<!--CARD model/abc/-->` … `<!--/CARD-->` quanh thẻ trỏ tới bài chưa đăng |
| **Mục lục** | `<!--TOC-->` |
| **HowTo schema** | `<!--HOWTO totalTime="PT20M" from="Bước 1" to="Bảng tra"-->` |
| **Loại khỏi TOC** | `class="no-toc"` trên H2 |

Header/footer nhúng sẵn lúc build (không còn fetch JS). Schema dùng chung qua `{{ldHome}}`.

---

## 6. Search Console — đã kết nối API

```bash
npm run gsc:sitemap      # nộp lại sitemap
npm run gsc:index        # kiểm từng URL đã index chưa
npm run gsc:queries      # top truy vấn 28 ngày
npm run gsc:trung-lap    # dò 2 site nhà có chia phiếu không
```

**Property là Domain property: `sc-domain:mucinminhtien.com`** (không phải URL-prefix —
gọi sai kiểu báo lỗi y hệt thiếu quyền, rất dễ đi lạc). Script tự dò bằng `sites.list`.

Service account: `hungthinhservicesacc@n8nhungthinh-492502...` — quyền `siteOwner`.
Khoá đọc từ `GSC_KEY` → `gsc-key.json` → service account của hub. **Repo public, khoá đã gitignore.**

> **Không có lệnh request indexing.** Indexing API của Google chỉ hỗ trợ `JobPosting` và
> `BroadcastEvent`. Phải bấm tay trong GSC → URL Inspection, ~10 URL/ngày.

### Số liệu index đo ngày 10/08/2026

**Chỉ 5/40 trang nội dung được index.** 28 trang ở trạng thái *Discovered — currently not indexed*
(Google biết URL nhưng chưa crawl). Cách chữa là **thêm nội dung và link nội bộ**, không phải
thêm công cụ. Sitemap Google mới đọc 77 URL, hiện có 102.

Dữ liệu GSC 6 tháng trước 27/07: 110 click, 1.838 hiển thị, vị trí trung bình 8.68.
Toàn bộ click đến từ URL `/product/` cũ — nay là trang redirect, equity đang chuyển.

---

## 7. Nghiên cứu keyword — dùng dữ liệu thật

File `all_keywords_2026-07-25.csv` (7.025 truy vấn, gitignored) là dữ liệu GSC của
**domain khác**, chỉ dùng nghiên cứu thị trường. Nhưng rất giá trị để chọn chủ đề.

Cơ hội lớn còn bỏ trống (đo ngày 10/08):

| Cụm | Hiển thị | Trạng thái |
|---|---|---|
| `máy in bị sọc` — cả cụm (ngang, trắng, dọc mờ…) | **1.093** | ✅ Đủ 4 bài: đen dọc, ngang, trắng dọc, trắng ngang |
| `sửa máy in nhiệt` + `bill` + `hóa đơn` | **969** | ✅ 5 bài: không in được, sửa, in mờ, khổ A5, chọn giấy |
| `driver canon lbp 251dw/252dw` các biến thể | ~700 | ✅ Vừa làm + bài máy tính không nhận máy in |
| `máy in hp laserjet pro m402dn` | 519 | ✅ Trang model kèm bảng giá vật tư 226A thật |
| `reset drum brother 7535` | 506 | ✅ Đã làm |
| `máy in canon 2900 bị sọc đen dọc` | 147 | ✅ Trang model riêng, giá vật tư 12A thật |

**Lưu ý:** `máy in bị sọc ngang` và `sọc trắng` là chủ đề KHÁC với sọc đen dọc — nguyên nhân
khác hẳn, phải viết bài riêng chứ không gộp.

---

## 8. Việc chỉ chủ site làm được (đang treo)

Trong `site.config.json`:

- [ ] `ga4Id` — chưa có analytics, đang bay mù
- [ ] `gscVerification`, `bingVerification`
- [ ] `sameAsGoogleMaps`, `sameAsFacebook` — cho schema Organization
- [ ] `contactFormKey` — form liên hệ chưa dựng, hai khoá config đang treo không ai dùng
- [ ] `geoLat` / `geoLng` — **đang là toạ độ ước lượng**, cần lấy toạ độ thật của 77 Bắc Hải

Ngoài ra:
- [ ] GSC → Sitemaps → submit lại (hoặc chạy `npm run gsc:sitemap`)
- [ ] GSC → URL Inspection → request indexing 10 trang quan trọng nhất
- [ ] Cấp quyền service account cho property `tinhocnamphong` nếu muốn dùng `gsc:trung-lap`
- [ ] Ảnh máy phun Canon (G1010/G2010/iX6770) — bài lỗi 5B00 đang thiếu ảnh đúng loại
- [ ] Ảnh cuộn giấy in nhiệt — để dựng trang sản phẩm, hiện chỉ có dòng trong bảng giá

---

## 9. Ranh giới đã thống nhất

- **Không** host / mirror / link tải phần mềm reset crack (DMCA + malware + rủi ro thương hiệu)
- **Không** thao túng tín hiệu người dùng kiểu đối thủ (ép gõ từ khoá, copy mã để giải nén)
- **Không** che quyền sở hữu để link đếm nặng hơn — đó là định nghĩa PBN
- **Không** spin nội dung đối thủ; bóc bộ khung và ý thì được, viết mới hoàn toàn
- **Không** bịa case khách hàng, review, `aggregateRating`
- **Không** in số điện thoại lên ảnh
- Link ra ngoài: chỉ trong thân bài, tối đa 1 link thương mại mỗi bài, không bao giờ ở footer

---

## 10. Làm tiếp theo thứ tự này

Năm mục đầu của danh sách cũ **đã xong trong phiên 10/08** (14 trang mới). Còn lại:

1. **Cụm lô sấy / lô ép** — 157 mã hàng, chưa có bài nào. Mục D trong `CONTENT-PLAN.md`.
   Bài `lo-say-may-in-la-gi`, `may-in-nhoe-cham-tay-ra-muc`, `loi-50-hp-fuser`, `thay-lo-ep-khi-nao`, `bao-lua-may-in-la-gi`.
   Đã có sẵn móc nối: bài sọc ngang và lem mực đều trỏ tới cụm sấy nhưng chưa có trang đích.
2. **Cụm máy photocopy** — 44 mã, mục E. Đối thủ 2 đang ăn mảng này.
3. **Cụm giấy in & ruy băng** — 53 mã, mục F. Đã làm 1 bài (giấy in nhiệt), còn 3 bài.
4. **Cụm lỗi bản in còn lại (C1)** — `may-in-in-mo`, `in-bi-bong-chu-ghosting`, `in-bi-dom-trang`, `may-in-mat-chu-thieu-net`, `may-in-in-sai-mau`.
5. **Cụm lỗi kéo giấy (C2)** — `may-in-ket-giay`, `bao-ket-giay-du-khong-ket`, `may-in-in-xien-lech`, `may-in-keu-to`, `may-in-co-mui-khet`.
6. **4 bài cụm reset viết đúng cách** — lấy traffic mà không đụng file crack.
7. **Mở rộng 14 bài cũ** dưới 1.200 từ lên 2.000+ (mục B).
8. **5 bài model còn lại (G)** — HP 1102 kẹt giấy, Canon MF3010 in mờ, Brother HL-L2321D báo toner, Epson L3110 mất màu đen, Canon 2900 lỗi E000.

### Đã làm trong phiên 10/08 (14 trang)

| Cụm | Trang | Từ |
|---|---|---|
| Sọc | `/huong-dan/may-in-bi-soc-ngang/` | 3.263 |
| Sọc | `/huong-dan/may-in-bi-soc-trang-doc/` | 2.725 |
| Sọc | `/huong-dan/may-in-bi-soc-trang-ngang/` | 2.817 |
| Sọc | `/model/canon-2900-bi-soc-den-doc/` | 2.449 |
| Nhiệt | `/huong-dan/sua-may-in-nhiet/` | 2.488 |
| Nhiệt | `/huong-dan/may-in-nhiet-in-mo/` | 2.767 |
| Nhiệt | `/huong-dan/may-in-nhiet-kho-a5/` | 2.671 |
| Nhiệt | `/huong-dan/giay-in-nhiet-57-hay-80/` | 2.085 |
| Driver | `/huong-dan/driver-canon-lbp-251dw/` | 2.318 |
| Driver | `/huong-dan/may-tinh-khong-nhan-may-in/` | 2.565 |
| Model | `/model/hp-m402dn-loi-thuong-gap/` | 2.409 |
| Mã mực | `/muc-in/hop-muc-canon-325/` | 1.637 |
| Mã mực | `/muc-in/muc-epson-003/` | 1.600 |
| Mã mực | `/muc-in/hop-muc-brother-tn-2380/` | 1.690 |

**Ba thứ mới rút ra, dùng lại cho các cụm sau:**

1. **Bảng chu kỳ lặp vệt sọc** (`may-in-bi-soc-ngang`) — đo khoảng cách giữa hai vệt rồi
   đối chiếu chu vi từng trục để ra đúng bộ phận. Không đối thủ nào có.
2. **Phép thử đổi hộp mực** — tách bạch lỗi trong hộp mực và lỗi ở máy trong hai phút.
   Dùng lại được cho mọi bài lỗi bản in.
3. **Bảng giá vật tư thật theo mã** (`canon-2900-bi-soc-den-doc`, `hp-m402dn-loi-thuong-gap`) —
   lấy thẳng từ `data/bang-gia.json`, ghi rõ quy cách (bộ 5 cây, 1 cặp…) để không gây hiểu nhầm.
   Đây là thứ đối thủ không thể sao chép vì họ không có kho.

Chi tiết từng bài ở `CONTENT-PLAN.md`.

---

## 11. Việc còn dở dang

- 2 bài để mở chỗ cho link về `mucinht.com`: `chon-may-in-bill-cho-quan-cafe`, `may-in-tem-ma-vach-la-gi`
  (đã đặt 1 link tới trang trụ máy bill cũ, còn 2 link nữa theo kế hoạch)
- **Giá trục từ đang lệch giữa các bài**: bài cũ `may-in-ra-giay-trang` ghi "từ 34.000đ",
  bài mới ghi "từ 20.000đ" (đúng mức thấp nhất trong kho — trục từ 15A/92A). Cả hai đều là giá
  thật nhưng nên thống nhất một con số khi rà lại loạt bài cũ.
- **Kho ảnh Chợ Tốt**: `xprinter-q260` có 86 ảnh nhưng nằm ở `dot1/` và `_posted/`, còn
  `original/` rỗng nên `tao-anh-bai.js` không dùng được. Muốn dùng ảnh máy in bill Xprinter
  thì phải copy sang `original/`. Hiện bài nhiệt đang dùng `apos-200` và `epson-t82`.
- `.github/workflows/publish.yml` đã có cron 08:00 giờ VN nhưng **chưa chạy lần nào** —
  cần bật quyền Read and write trong Settings → Actions → General
