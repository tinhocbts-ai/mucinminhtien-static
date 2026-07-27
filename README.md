# mucinminhtien-static

Website HTML tĩnh chuẩn SEO cho **Mực In Minh Tiến** — host trên GitHub Pages.

Demo: https://tinhocbts-ai.github.io/mucinminhtien-static/

---

## ⭐ Quy tắc quan trọng nhất

Website được **build ra HTML tĩnh** để tối ưu SEO (Google/Zalo/Bing đọc được đầy đủ, không phụ thuộc JavaScript).

| Muốn đổi gì | Sửa file nào | Rồi làm gì |
|-------------|--------------|-----------|
| SĐT, Zalo, email, địa chỉ (dùng nhiều nơi) | **`site.config.json`** | chạy `node build.js` |
| Nội dung / bố cục 1 trang | file trong **`src/`** | chạy `node build.js` |
| Thêm/sửa/xoá sản phẩm (tên, giá, nhóm) | **`data/products.json`** | chạy `node build.js` — tự sinh trang chi tiết + danh sách + sitemap |
| Giao diện trang chi tiết sản phẩm | `src/templates/product.html` | chạy `node build.js` |

Ảnh sản phẩm: WebP đã nén (~6KB/ảnh) trong `assets/img/products/<slug>.webp`.
Ảnh mới PHẢI nén trước khi đưa vào (WebP, tối đa 640px, < 30KB). Font tự host trong `assets/fonts/`.

> ⚠️ **KHÔNG sửa trực tiếp các file `.html` ở thư mục gốc** (index.html, bang-gia/index.html, partials/…).
> Chúng là **file tự sinh** — mỗi lần chạy `node build.js` sẽ bị ghi đè.

Đổi 1 chỗ trong `site.config.json` → chạy build → **mọi trang tự cập nhật**.

---

## Cấu trúc

```
site.config.json     ← thông tin dùng chung (SĐT, Zalo, email, địa chỉ)
build.js             ← công cụ build: src/ + config → HTML tĩnh ở gốc
src/                 ← BẢN GỐC để sửa (chứa {{placeholder}})
  index.html
  partials/{header,footer}.html
  {bang-gia,dich-vu,gioi-thieu,lien-he,san-pham}/index.html
assets/              ← css, js, ảnh (không cần build)

index.html           ┐
bang-gia/index.html  │ ← FILE TỰ SINH (GitHub Pages phục vụ) — đừng sửa tay
partials/…           ┘
```

## Quy trình cập nhật

```bash
# 1. Sửa site.config.json hoặc file trong src/
# 2. Build ra HTML tĩnh
node build.js
# 3. Kiểm tra tại chỗ (mở index.html hoặc chạy web server tĩnh)
# 4. Commit & push để cập nhật GitHub Pages
git add -A
git commit -m "Cập nhật nội dung"
git push
```

## Placeholder đang dùng (khai báo trong `site.config.json`)

| Placeholder | Ý nghĩa | Ví dụ |
|-------------|---------|-------|
| `{{hotlineDisplay}}` | SĐT hiển thị | `0915 510 203` |
| `{{hotlineTel}}` | SĐT cho `tel:` và link Zalo | `0915510203` |
| `{{hotlineIntl}}` | SĐT quốc tế (JSON-LD) | `+84915510203` |
| `{{email}}` | Email | `tinhocbts@gmail.com` |
| `{{addressFull}}` | Địa chỉ đầy đủ | `77 Bắc Hải, …, TP. Hồ Chí Minh` |
| `{{addressShort}}` | Địa chỉ ngắn (meta) | `77 Bắc Hải, …, TP.HCM` |
| `{{addressStreet}}` | Đường + phường (JSON-LD) | `77 Bắc Hải, Phường Diên Hồng` |

Thêm placeholder mới: thêm key vào `site.config.json`, dùng `{{key}}` trong `src/`, chạy build.

---

Lưu ý: chưa gắn tên miền thật (`CNAME`) — chỉ thêm khi đã được duyệt xong.
