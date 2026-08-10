/* assets/js/include.js
   Header và footer ĐÃ được nhúng sẵn vào từng trang lúc build (build.js → injectShell),
   nên file này không còn fetch() partial nữa — Googlebot thấy toàn bộ menu ngay trong
   HTML thô, không phải chờ render JavaScript.

   Việc còn lại của file này: đánh dấu mục menu đang mở, mở/đóng menu mobile,
   và chạy slider khuyến mãi ở trang chủ. */
(function () {
  var NESTED_PAGES = ['bang-gia', 'gioi-thieu', 'lien-he', 'san-pham', 'dich-vu', 'nap-muc-may-in-tan-noi-tphcm', 'huong-dan'];

  function currentKey() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && parts[parts.length - 1] === 'index.html') parts.pop();
    for (var i = parts.length - 1; i >= 0; i--) {
      if (NESTED_PAGES.indexOf(parts[i]) !== -1) return parts[i] + '/';
    }
    return 'index.html';
  }

  function markActive() {
    var key = currentKey();
    document.querySelectorAll('.main-nav a[data-href], .site-footer a[data-href]').forEach(function (a) {
      if (a.getAttribute('data-href') === key) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function setupMobileNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setupPromoSlider() {
    var track = document.getElementById('sliderTrack');
    if (!track) return;
    var slides = track.querySelectorAll('.slide');
    var dots = document.querySelectorAll('#sliderDots .dot');
    var prevBtn = document.getElementById('sliderPrev');
    var nextBtn = document.getElementById('sliderNext');
    var total = slides.length;
    var index = 0;
    var timer = null;

    function goTo(i) {
      index = (i + total) % total;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('active', di === index); });
    }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }
    function startAuto() { stopAuto(); timer = setInterval(next, 5000); }
    function stopAuto() { if (timer) clearInterval(timer); }

    if (nextBtn) nextBtn.addEventListener('click', function () { next(); startAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); startAuto(); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        goTo(parseInt(d.getAttribute('data-index'), 10));
        startAuto();
      });
    });
    var wrap = document.getElementById('promoSlider');
    if (wrap) {
      wrap.addEventListener('mouseenter', stopAuto);
      wrap.addEventListener('mouseleave', startAuto);
    }
    goTo(0);
    startAuto();
  }

  function init() {
    markActive();
    setupMobileNav();
    setupPromoSlider();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
