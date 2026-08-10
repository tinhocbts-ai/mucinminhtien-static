# CHECKLIST NỘI DUNG — mucinminhtien.com

Lập 10/08/2026. Đối chiếu gap list từ 2 đối thủ + tồn kho thật trong `data/bang-gia.json`.

**Nguyên tắc:** site này là thương hiệu riêng, **không đặt link chéo sang tinhocnamphong**.
Cứ chủ đề nào kéo được traffic long-tail thì viết. Không tự loại bỏ chủ đề vì lý do phân vùng site.

Cột "bán được gì" không phải để lọc, mà để nhớ **chèn link vào đúng mã hàng** — bài không dẫn ra
đơn hàng thì chỉ là traffic rỗng.

---

## 0. PHÁT HIỆN QUAN TRỌNG: nhóm hàng lớn nhất chưa có nội dung

| Nhóm hàng | Số mã | Bài đang có |
|---|---|---|
| Hộp mực & mực in | 211 | Có (một phần) |
| **Lô sấy, lô ép & linh kiện sấy** | **157** | **0 bài** ← lớn thứ 2, trắng hoàn toàn |
| Drum / Trống | 107 | Có (một phần) |
| **Linh kiện khác** | **93** | **0 bài** |
| Gạt mực | 55 | Có (một phần) |
| **Giấy in & Ruy băng** | **53** | **0 bài** |
| **Mực & linh kiện máy photocopy** | **44** | **0 bài** ← mảng đối thủ 2 đang ăn |
| Chip & Seal | 38 | Có (một phần) |
| Trục từ | 19 | Có (một phần) |
| Linh kiện máy fax | 3 | 0 bài |

Gap list của đối thủ toàn xoay quanh **máy in laser văn phòng**. Nhưng 157 mã lô sấy, 44 mã photocopy
và 53 mã giấy/ruy băng của anh thì đối thủ không có — đó là long-tail **không ai tranh**.
Ưu tiên cụm này ngang với cụm lỗi.

---

## A. ĐÃ VIẾT — 16 bài

### /huong-dan/ (14 bài)

| ✓ | Bài | Số từ |
|---|---|---|
| ✅ | Máy in không in được, báo Offline | 865 |
| ✅ | Cách cài đặt máy in: USB, WiFi, LAN | 1.087 |
| ✅ | Cách in 2 mặt Canon, HP, Brother, Epson | 909 |
| ✅ | Cách chọn mực in đúng máy, tiết kiệm | 856 |
| ✅ | Phân biệt mực chính hãng và mực trôi nổi | 877 |
| ✅ | Máy in bị sọc đen dọc | 1.191 |
| ✅ | Cách reset máy in HP, lỗi chấm than 107a | 869 |
| ✅ | Cách reset máy in Brother, reset drum | 981 |
| ✅ | Lỗi Drum End Soon Brother | 823 |
| ✅ | Canon 2900 không nhận hộp mực | 831 |
| ✅ | Lỗi 5B00 máy in Canon | 856 |
| ✅ | Máy in Epson nháy 2 đèn đỏ | 1.010 |
| ✅ | Tràn bộ đếm mực thải Epson | 873 |
| ✅ | Vệ sinh đầu phun Epson | 889 |

### /model/ (2 bài)

| ✓ | Bài | Số từ | Bán được gì |
|---|---|---|---|
| ✅ | HP 107a in mờ, nhạt chữ | 1.734 | Chip 107A, trục từ, drum, mực đổ |
| ✅ | Canon 2900 kéo nhiều tờ giấy | 1.514 | Quả đào, bố thắng, bạc phíp 12A |

> ✅ **16/16 bài đã có 2 ảnh** (hero + infographic) sinh tự động bằng `npm run anh`.
> Đây là ảnh thiết kế, không phải ảnh hiện trường — danh sách thay dần nằm ở `ANH-CAN-THAY.md`.

---

## B. MỞ RỘNG BÀI CŨ — 14 bài, làm song song với viết mới

14 bài `/huong-dan/` đang ở **823–1.191 từ**, mục tiêu bài dạng lỗi là **1.400–1.800 từ**.
Bài đang top của đối thủ khoảng 1.700–2.000 từ. Mở rộng rẻ hơn viết mới vì URL đã index sẵn.

Mỗi bài thêm đúng 3 thứ: **1 bảng tra**, **số liệu chi phí thật**, **2 ảnh chụp thật**.

| ☐ | Bài | Từ | Thêm gì |
|---|---|---|---|
| ☐ | Lỗi Drum End Soon Brother | 823 | Bảng dòng máy ↔ mã drum ↔ số trang ↔ giá |
| ☐ | Canon 2900 không nhận hộp mực | 831 | Bảng lỗi tiếp điểm / lẫy / formatter + chi phí |
| ☐ | Lỗi 5B00 Canon | 856 | Bảng mã lỗi Canon phun (5B00, 5B01, P07, P08) |
| ☐ | Cách chọn mực in đúng máy | 856 | Bảng chi phí/trang: chính hãng vs tương thích vs nạp |
| ☐ | Cách reset máy in HP | 869 | Bảng đèn báo ↔ ý nghĩa cho 107a/135a/M12a |
| ☐ | Tràn bộ đếm mực thải Epson | 873 | Bảng dòng máy ↔ dung tích tấm thấm ↔ dấu hiệu |
| ☐ | Phân biệt mực chính hãng | 877 | Ảnh thật 2 hộp mực cạnh nhau |
| ☐ | Vệ sinh đầu phun Epson | 889 | Bảng lượng mực tốn mỗi lần Head Cleaning |
| ☐ | Cách in 2 mặt | 909 | Bảng model nào có duplex tự động |
| ☐ | Cách reset Brother | 981 | Bảng dòng có màn hình / không màn hình |
| ☐ | Epson nháy 2 đèn đỏ | 1.010 | Bảng tổ hợp đèn ↔ lỗi |
| ☐ | Cách cài đặt máy in | 1.087 | Bảng lỗi cài đặt thường gặp |
| ☐ | Máy in không in được | 865 | Bảng mã lỗi Windows Print Spooler |
| ☐ | Máy in bị sọc đen dọc | 1.191 | Gần đạt — chỉ cần ảnh thật |

---

## C. CỤM LỖI — 18 bài

### C1. Lỗi bản in (dẫn tới drum, gạt, trục từ, mực)

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ✅ | `/huong-dan/may-in-ra-giay-trang/` | Máy in ra giấy trắng: 7 nguyên nhân — **2.532 từ** | Drum, trục từ, cụm quang |
| ✅ | `/huong-dan/may-in-bi-lem-muc/` | Máy in bị lem mực: 6 nguyên nhân — **2.237 từ** | Gạt mực, lô sấy, bao lụa |
| ☐ | `may-in-in-mo` | Máy in in mờ, chữ nhạt: 7 nguyên nhân theo hãng | Mực đổ, trục từ, drum |
| ☐ | `in-bi-bong-chu-ghosting` | Bản in bị bóng chữ (ghosting) | Lô sấy, drum, lô ép |
| ☐ | `in-bi-dom-trang` | Bản in bị đốm trắng, in không đều | Trục từ, mực bột, drum |
| ☐ | `may-in-mat-chu-thieu-net` | Máy in bị mất chữ, thiếu nét ở mép trang | Trục từ, gạt mực |
| ☐ | `may-in-in-sai-mau` | Máy in phun in sai màu, lệch màu | Mực 003/664, đầu phun |

> `may-in-in-mo` **phải link xuống** bài HP 107a in mờ và ngược lại, để không tự ăn thịt nhau.

### C2. Lỗi kéo giấy & cơ khí (dẫn tới quả đào, bố thắng, lô ép)

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ☐ | `may-in-ket-giay` | Máy in kẹt giấy: gỡ đúng cách và chống tái phát | Quả đào, bố thắng, lô ép, con lăn |
| ✅ | `/huong-dan/may-in-khong-keo-giay/` | Máy in không kéo giấy: 6 nguyên nhân — **2.202 từ** | Quả đào, bố thắng, lô ép |
| ☐ | `bao-ket-giay-du-khong-ket` | Máy in báo Paper Jam dù không kẹt giấy | Cảm biến, lô sấy |
| ☐ | `may-in-in-xien-lech` | Máy in nuốt giấy lệch, bản in bị xiên | Con lăn, bố thắng |
| ☐ | `may-in-keu-to` | Máy in kêu to, có tiếng lạ khi in | Bánh răng, nhông, lô sấy |
| ☐ | `may-in-co-mui-khet` | Máy in có mùi khét: dừng ngay hay in tiếp? | Lô sấy, lô ép |

### C3. Lỗi phần mềm & kết nối

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ☐ | `may-tinh-khong-nhan-may-in` | Máy tính không nhận máy in, không cài được driver | Dịch vụ tận nơi |
| ☐ | `lenh-in-bi-pending` | Lệnh in bị Pending, kẹt trong hàng đợi | Dịch vụ tận nơi |
| ☐ | `may-in-wifi-chap-chon` | Máy in Wi-Fi chập chờn, lúc in được lúc không | Dịch vụ tận nơi |
| ☐ | `may-in-khong-len-nguon` | Máy in không lên nguồn: kiểm tra theo thứ tự | Nguồn, bo, dịch vụ |
| ☐ | `in-tu-dien-thoai` | Cách in từ điện thoại sang máy in | Dịch vụ, máy mới |

> C3 trùng vùng chủ đề với `tinhocnamphong`. Anh đã quyết viết ở đây — ghi lại để sau này
> đọc GSC biết vì sao có 2 trang cùng chủ đề trên 2 domain.

---

## D. CỤM LÔ SẤY / LÔ ÉP — 157 mã, chưa có bài nào

Nhóm hàng lớn thứ 2 trong kho. Long-tail gần như không ai viết bằng tiếng Việt.

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ☐ | `lo-say-may-in-la-gi` | Lô sấy máy in là gì, khi nào phải thay | Lô sấy (157 mã) |
| ☐ | `may-in-nhoe-cham-tay-ra-muc` | Bản in nhòe, chạm tay là ra mực: lỗi lô sấy | Lô sấy, thermistor |
| ☐ | `loi-50-hp-fuser` | Lỗi 50.1, 50.2, 50.9 máy in HP: lỗi cụm sấy | Lô sấy, lô ép HP |
| ☐ | `thay-lo-ep-khi-nao` | Lô ép mòn: dấu hiệu và chi phí thay | Lô ép, bạc phíp |
| ☐ | `bao-lua-may-in-la-gi` | Bao lụa máy in là gì, thay khi nào | Bao lụa (nhiều mã 26A/49A/55A) |

---

## E. CỤM MÁY PHOTOCOPY — 44 mã, chưa có bài nào

Đối thủ 2 (suamayingiare.com) đang ăn mảng này và còn mở rộng sang cho thuê máy.
Anh có sẵn linh kiện nhưng không có một chữ nào dẫn về.

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ☐ | `bot-tu-may-photo-la-gi` | Bột từ máy photocopy là gì, khi nào phải thay | Bột từ (600–750k/mã) |
| ☐ | `may-photo-ban-in-mo-dam-nhat` | Máy photocopy in mờ, đậm nhạt không đều | Bột từ, drum, gạt |
| ☐ | `thermistor-may-photo` | Thermistor máy photocopy: dấu hiệu hỏng và cách thay | Thermistor (335k) |
| ☐ | `bang-ma-loi-sc-ricoh` | Bảng tra mã lỗi SC máy photocopy Ricoh | Linh kiện Ricoh |
| ☐ | `loi-thuong-gap-toshiba-estudio` | Lỗi thường gặp máy photo Toshiba e-Studio | Bánh xe T, lô sấy |
| ☐ | `chip-muc-may-photo-xerox` | Chip mực máy photocopy Xerox DocuCentre | Chip photo (50k) |

---

## F. CỤM GIẤY IN & RUY BĂNG — 53 mã, chưa có bài nào

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ☐ | `chon-giay-in-dinh-luong` | Chọn giấy in đúng định lượng: 70, 80 hay 100 gsm | Giấy in |
| ☐ | `giay-in-nhiet-57-hay-80` | Giấy in nhiệt khổ 57mm hay 80mm: chọn đúng cho máy bill | Giấy nhiệt |
| ☐ | `ruy-bang-may-in-kim` | Ruy băng máy in kim: chọn đúng loại, thay thế nào | Ruy băng |
| ☐ | `giay-chuyen-nhiet-in-duoc-gi` | Giấy chuyển nhiệt in được lên chất liệu gì | Giấy chuyển nhiệt |

---

## G. CỤM MODEL (`/model/`) — 6 bài

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ☐ | `hp-1102-ket-giay-lien-tuc` | HP 1102 kẹt giấy liên tục | Lô ép 35A, bạc phíp (33 mã 35A) |
| ☐ | `canon-mf3010-in-mo` | Canon MF3010 in mờ, nhạt dần | Mực 337, gạt, trục từ (10 mã) |
| ☐ | `brother-hl-l2321d-bao-toner` | Brother HL-L2321D báo Toner Life End | TN-2380, gạt Brother |
| ☐ | `epson-l3110-mat-mau-den` | Epson L3110 mất màu đen | Mực 003 (9 mã) |
| ☐ | `canon-2900-loi-e000` | Canon 2900 lỗi E000 | Lô sấy, cụm sấy 12A (28 mã) |
| ☐ | `hp-m402-loi-59c0` | HP M402 lỗi 59.C0 | Bao lụa 26A, lô ép (17 mã) |

---

## H. CỤM MÃ MỰC (`/muc-in/`) — ✅ ĐÃ XONG 8/11 (10/08/2026)

Mỗi trang trả lời đúng 3 câu: **dùng cho máy nào — giá bao nhiêu — nên mua chính hãng hay nạp lại**.
Bảng linh kiện + giá sinh tự động từ `data/bang-gia.json` nên luôn khớp hàng thật.

| ✓ | Trang | Mã | Số mã kho | Ảnh máy thật |
|---|---|---|---|---|
| ✅ | `/muc-in/hop-muc-35a/` | 35A | 33 | thẻ thiết kế (kho chưa có máy P1005) |
| ✅ | `/muc-in/hop-muc-12a/` | 12A | 28 | Canon LBP2900 |
| ✅ | `/muc-in/hop-muc-49a/` | 49A | 18 | thẻ thiết kế (kho chưa có máy 1320) |
| ✅ | `/muc-in/hop-muc-cf226a/` | 26A / CF226A | 17 | HP M402DNE |
| ✅ | `/muc-in/hop-muc-16a/` | 16A | 15 | thẻ thiết kế (kho chưa có máy A3 5200) |
| ✅ | `/muc-in/hop-muc-85a/` | 85A | 14 | Canon LBP6030 |
| ✅ | `/muc-in/hop-muc-107a/` | 107A / W1107A | 12 | HP Laser 107w |
| ✅ | `/muc-in/hop-muc-canon-337/` | Canon 337 | 10 | Canon MF249dw |
| ☐ | `/muc-in/hop-muc-canon-325/` | Canon 325 | 14 | |
| ☐ | `/muc-in/muc-epson-003/` | Epson 003 | 9 | |
| ☐ | `/muc-in/hop-muc-brother-tn-2380/` | TN-2380 | 3 | |

Thêm mã mới: thêm một khối vào `data/muc-in.json` rồi `node build.js` — hub và link chéo tự cập nhật.

## I. CỤM KIẾN THỨC / TƯ VẤN — 8 bài

| ☐ | Slug | Tiêu đề | Bán được gì |
|---|---|---|---|
| ☐ | `cach-do-muc-may-in-tai-nha` | Cách đổ mực máy in tại nhà: làm được và không nên làm | Mực đổ, chip |
| ☐ | `cach-ve-sinh-gat-muc` | Cách vệ sinh và thay gạt mực đúng kỹ thuật | Gạt mực (55 mã) |
| ☐ | `bao-quan-hop-muc` | Cách bảo quản hộp mực chưa dùng để không hỏng | Hộp mực |
| ☐ | `may-in-de-lau-khong-dung` | Máy in để lâu không dùng có sao không | Dịch vụ vệ sinh, mực |
| ☐ | `toner-low-vs-replace-toner` | Toner Low và Replace Toner khác nhau thế nào | Chip, hộp mực |
| ☐ | `kiem-tra-so-trang-da-in` | Cách kiểm tra số trang máy in đã in (page count) | Drum, hộp mực |
| ☐ | `may-in-in-cham` | Máy in in chậm: nguyên nhân và cách tăng tốc | Dịch vụ, RAM/bo |
| ☐ | `bang-ma-loi-may-in-epson` | Bảng tra mã lỗi Epson: E01–E11, U052, W11 | Mực 003, tấm thấm |

> `bang-ma-loi-may-in-epson` gộp luôn "E05 / E07 / U052" trong gap list — làm **1 bảng tra**
> thay vì 3 bài mỏng. Đây đúng là thứ cả hai đối thủ đều không có.

---

## TỔNG KHỐI LƯỢNG

| Cụm | Số bài |
|---|---|
| B. Mở rộng bài cũ | 14 |
| C. Cụm lỗi | 18 |
| D. Lô sấy / lô ép | 5 |
| E. Máy photocopy | 6 |
| F. Giấy in & ruy băng | 4 |
| G. Model | 6 |
| H. Mã mực | 11 |
| I. Kiến thức / tư vấn | 8 |
| **Tổng** | **58 bài mới + 14 bài mở rộng** |

## THỨ TỰ ĐỀ XUẤT — đăng dồn trong 1–2 tuần

Quyết định 10/08/2026: **không rải ngày**. Đây là domain cũ đã có lịch sử, không phải domain mới,
và mạng internal link chỉ chạy khi các trang đã sống — rải 5 tuần thì link cụt suốt 5 tuần.
Cơ chế `<!--PUBLISH-->` vẫn giữ trong build, dùng khi cần chứ không bắt buộc.

Giới hạn thật không nằm ở SEO mà ở tốc độ viết: mỗi phiên làm tốt được **4–6 bài đạt chuẩn**,
58 bài ≈ **10–12 phiên**. Thứ tự ưu tiên nếu phải dừng giữa chừng:

1. **Đợt 1 — 11 trang mã mực (H).** Ý định mua cao nhất, dẫn thẳng vào 780 mã đang bán.
2. **Đợt 2 — 13 bài lỗi bản in + kéo giấy (C1 + C2).** Volume lớn nhất trong gap list đối thủ.
3. **Đợt 3 — 15 bài cụm không ai tranh (D + E + F).** 157 mã lô sấy + 44 mã photocopy + 53 mã giấy.
4. **Đợt 4 — 6 bài model (G) + 8 bài kiến thức (I).**
5. **Đợt 5 — 5 bài phần mềm (C3) + mở rộng 14 bài cũ (B).**

Ảnh không chặn tiến độ: viết xong chạy `npm run anh` là mỗi bài có 2 ảnh ngay.

## BỘ KHUNG CHUẨN CHO BÀI LỖI — rút từ đối thủ đang top (10/08/2026)

Đối thủ mạnh nhất `suamayingiare.com` dùng chung một bộ khung cho toàn cụm lỗi, bài dài **2.500–3.000 từ**:

1. Dấu hiệu nhận biết
2. Nguyên nhân (mỗi nguyên nhân một H3)
3. Cách khắc phục tại nhà, từng bước
4. Khi nào cần gọi kỹ thuật viên
5. **Báo giá sửa lỗi** ← khối này site ta đang thiếu ở mọi bài
6. Cách phòng tránh
7. FAQ
8. Liên hệ & tổng kết

**Bốn thứ ta hơn được họ** — đã kiểm chứng bằng cách đọc trực tiếp bài của họ:

| Họ | Ta |
|---|---|
| Ảnh placeholder SVG, không một ảnh chụp thật nào | 18 ảnh xưởng thật + kho 41.576 ảnh máy in |
| Bảng giá chỉ nêu khoảng dịch vụ (150.000–600.000đ) | Giá **linh kiện thật** từ 773 mã trong kho |
| FAQ 3 câu | FAQ 5–6 câu, đẩy hết vào schema |
| Không có bảng tra triệu chứng → bộ phận | Bảng tra là điểm mạnh cố định của ta |

→ **Nâng mục tiêu độ dài bài lỗi từ 1.400–1.800 lên 2.000–2.500 từ.**

**Đối thủ chính: `linhkienmayingiare.net`** — do kỹ thuật viên cũ của Nam Phong tách ra lập,
dùng lại tên thương hiệu và đổi logo. Site mới nhưng lên rất nhanh. Đây là đối thủ thật, **không phải site nhà**,
nên bám sát và đánh trực diện vào key họ đang thắng. Site nhà là `tinhocnamphong` — mucinminhtien là site mới
dựng để tranh key với đối thủ mà không phải động vào site cũ.

### Key đối thủ đang thắng — trạng thái đối đầu

| Key họ có | Ta | Ghi chú |
|---|---|---|
| sửa máy in bị lem mực | ✅ 3.189 từ | Họ 3.500–4.000 từ nhưng **0 schema, 0 FAQ, 0 mục lục, 0 bảng giá** |
| máy in không nhận lệnh in | ✅ máy in không in được | |
| HP 107a/107w lỗi đèn đỏ | ✅ 2 bài (reset + in mờ) | |
| Epson L3110/L1110 nháy 2 đèn | ✅ | |
| Canon 2900 chạy liên tục | ✅ 2.082 từ | Vừa viết |
| máy in bill, in nhiệt không in được | ✅ 2.266 từ | Vừa viết — ta còn **bán giấy in nhiệt**, họ không |
| sửa máy in quận Phú Nhuận | ☐ | Cụm quận — xem mục 14, đang hoãn |
| sửa máy in gần đây / thợ tận nơi HCM | ☐ | Key dịch vụ, cân nhắc |
| reset Epson L360 (phần mềm crack) | ✋ **không làm** | Rủi ro DMCA, xem mục 12 |


---

## ĐIỀU KIỆN KHÔNG ĐƯỢC BỎ QUA

- [ ] Mỗi bài ≥ 1 bảng tra triệu chứng → bộ phận → chi phí
- [ ] Mỗi bài có khối **báo giá** riêng (đối thủ có, ta đang thiếu)
- [ ] Mỗi bài ≥ 2 ảnh — chạy `npm run anh` là có ngay hero + infographic, không chờ ảnh chụp
- [ ] Ảnh thật thay dần theo `ANH-CAN-THAY.md`, ghi đè đúng đường dẫn và giữ nguyên kích thước
- [ ] Mỗi bài ≥ 3 link nội bộ vào, ≥ 3 link ra, và **link tới ít nhất 1 mã hàng cụ thể**
- [ ] Bài quy trình gắn `<!--HOWTO-->`; bài chẩn đoán thì **không** gắn
- [ ] Không copy câu chữ đối thủ — chỉ lấy bộ khung và sự thật kỹ thuật
- [ ] `node build.js && node scripts/check-seo.js` phải 0 lỗi ERR trước khi commit
