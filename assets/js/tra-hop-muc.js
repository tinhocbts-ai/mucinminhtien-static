/* assets/js/tra-hop-muc.js — Công cụ tra hộp mực / linh kiện theo model máy in.
   Dữ liệu nạp từ assets/js/bang-gia-data.js (window.BANGGIA, sinh bởi build.js).

   Cách khớp: tách truy vấn thành các từ khóa rồi yêu cầu TẤT CẢ đều xuất hiện
   trong tên sản phẩm đã chuẩn hóa. Nhờ vậy "hp 107a" khớp được với
   "Chíp 107A dùng cho hộp mực máy in HP 107W, 135W" — kiểu tìm chuỗi liền
   thông thường sẽ trượt vì tên hàng viết xen kẽ mã và tên hãng. */
(function () {
  'use strict';

  var input = document.getElementById('lookupInput');
  if (!input) return;

  var resultBox = document.getElementById('lookupResult');
  var countBox = document.getElementById('lookupCount');
  var chips = document.querySelectorAll('.lookup-chip');

  /* Bỏ dấu tiếng Việt, hạ chữ thường, gộp khoảng trắng */
  function norm(s) {
    return String(s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN').replace(/,/g, '.') + ' đ';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Người gõ "HP 107a" hầu như luôn cần HỘP MỰC trước, rồi mới tới drum và
     linh kiện rời. Xếp hạng theo nhóm hàng thay vì theo thứ tự trong file. */
  var GROUP_RANK = {
    'hop-muc': 0, 'drum-trong': 1, 'chip-seal': 2, 'gat-muc': 3, 'truc-tu': 4,
    'muc-photo': 5, 'lo-say-lo-ep': 6, 'giay-ruybang': 7, 'linh-kien-fax': 8, 'linh-kien-khac': 9
  };

  var data = null, index = null;

  function ensureIndex() {
    if (index) return true;
    if (!window.BANGGIA) return false;
    data = window.BANGGIA;
    index = data.items.map(function (it) { return norm(it[0]); });
    return true;
  }

  function search(q) {
    var tokens = norm(q).split(' ').filter(function (t) { return t.length >= 2; });
    if (!tokens.length) return [];
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var name = index[i], ok = true;
      for (var t = 0; t < tokens.length; t++) {
        if (name.indexOf(tokens[t]) === -1) { ok = false; break; }
      }
      if (!ok) continue;
      /* Thứ tự ưu tiên: nhóm hàng → có trang sản phẩm riêng → tên ngắn (mã sát hơn) */
      var it = data.items[i];
      var rank = GROUP_RANK[it[2]];
      if (rank === undefined) rank = 9;
      hits.push({ i: i, score: rank * 10000 + (it[3] ? 0 : 500) + it[0].length });
    }
    hits.sort(function (a, b) { return a.score - b.score; });
    return hits.slice(0, 60).map(function (h) { return data.items[h.i]; });
  }

  function render(q) {
    if (!ensureIndex()) {
      resultBox.innerHTML = '<p class="lookup-empty">Đang tải dữ liệu bảng giá…</p>';
      return;
    }
    if (!norm(q)) {
      resultBox.innerHTML = '';
      countBox.textContent = '';
      return;
    }
    var rows = search(q);
    if (!rows.length) {
      countBox.textContent = '';
      resultBox.innerHTML =
        '<div class="lookup-empty">' +
        '<p><strong>Chưa tìm thấy mã nào khớp với “' + esc(q) + '”.</strong></p>' +
        '<p>Kho còn nhiều mã chưa lên bảng giá. Gọi hoặc nhắn Zalo kèm model máy in, ' +
        'chúng tôi kiểm tra và báo giá trong ít phút.</p>' +
        '</div>';
      return;
    }

    countBox.textContent = 'Tìm thấy ' + rows.length + (rows.length === 60 ? '+ ' : ' ') + 'mã phù hợp';
    var html = '<div class="price-table-wrap"><table class="price-table"><thead><tr>' +
      '<th>Sản phẩm</th><th style="width:120px">Nhóm</th><th style="width:130px">Giá tham khảo</th>' +
      '</tr></thead><tbody>';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var name = r[3]
        ? '<a href="../san-pham/' + encodeURIComponent(r[3]) + '/">' + esc(r[0]) + '</a>'
        : esc(r[0]);
      html += '<tr><td>' + name + '</td><td>' + esc(data.groups[r[2]] || '') +
        '</td><td class="price">' + formatPrice(r[1]) + '</td></tr>';
    }
    html += '</tbody></table></div>';
    resultBox.innerHTML = html;
  }

  var timer = null;
  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(function () { render(input.value); }, 120);
  }

  input.addEventListener('input', onInput);
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      input.value = c.getAttribute('data-q');
      input.focus();
      render(input.value);
    });
  });

  /* Cho phép chia sẻ link kèm sẵn truy vấn: /tra-hop-muc/?q=hp+107a */
  var qs = new URLSearchParams(location.search).get('q');
  if (qs) { input.value = qs; }

  /* Dữ liệu nạp async — chờ sẵn sàng rồi mới vẽ lần đầu */
  (function waitData(n) {
    if (window.BANGGIA) { if (input.value) render(input.value); return; }
    if (n > 100) return;
    setTimeout(function () { waitData(n + 1); }, 50);
  })(0);
})();
