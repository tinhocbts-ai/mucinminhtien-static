/* build.js — Sinh HTML tĩnh chuẩn SEO từ src/ + site.config.json
 *
 * Cách dùng:   node build.js
 *
 * - Đọc thông tin dùng chung trong site.config.json.
 * - Duyệt toàn bộ file .html trong src/, thay mọi {{key}} bằng giá trị thật.
 * - Ghi kết quả ra ĐÚNG vị trí tương ứng ở thư mục gốc (cái GitHub Pages phục vụ).
 *
 * → Muốn đổi SĐT / Zalo / email / địa chỉ: chỉ sửa site.config.json rồi chạy lại.
 * → Muốn đổi NỘI DUNG trang: sửa file trong src/, KHÔNG sửa file .html ở gốc.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const CONFIG_FILE = path.join(ROOT, 'site.config.json');

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  const cfg = JSON.parse(raw);
  delete cfg._help; // bỏ dòng ghi chú, không phải biến
  return cfg;
}

/* Trả về danh sách đường dẫn tương đối của mọi file .html trong src/ */
function listTemplates(dir, base) {
  base = base || dir;
  let out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out = out.concat(listTemplates(full, base));
    } else if (name.toLowerCase().endsWith('.html')) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

/* Thay tất cả {{key}} trong nội dung; báo lỗi nếu gặp key chưa khai báo */
function render(content, cfg, relPath) {
  const missing = new Set();
  const result = content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (match, key) {
    if (Object.prototype.hasOwnProperty.call(cfg, key)) return String(cfg[key]);
    missing.add(key);
    return match;
  });
  if (missing.size) {
    console.warn(
      '  ⚠  ' + relPath + ': thiếu key trong site.config.json → ' +
      Array.from(missing).join(', ')
    );
  }
  return result;
}

function build() {
  if (!fs.existsSync(SRC)) {
    console.error('✗ Không tìm thấy thư mục src/. Dừng.');
    process.exit(1);
  }
  const cfg = loadConfig();
  const templates = listTemplates(SRC);
  let count = 0;

  for (const rel of templates) {
    const srcPath = path.join(SRC, rel);
    const outPath = path.join(ROOT, rel);
    const rendered = render(fs.readFileSync(srcPath, 'utf8'), cfg, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log('  ✓ ' + rel);
    count++;
  }

  console.log('\nXong. Đã sinh ' + count + ' trang từ src/ + site.config.json.');
  console.log('Kiểm tra tại chỗ rồi commit & push để cập nhật GitHub Pages.');
}

build();
