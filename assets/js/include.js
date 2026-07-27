/* assets/js/include.js
   Fetches shared header/footer partials, rewrites their internal links so the
   site works correctly both at the domain root and one folder deep
   (bang-gia/, gioi-thieu/, lien-he/, san-pham/, dich-vu/), wires up the
   mobile hamburger menu, and runs the homepage promo slider. */
(function () {
  var NESTED_PAGES = ['bang-gia', 'gioi-thieu', 'lien-he', 'san-pham', 'dich-vu', 'nap-muc-may-in-tan-noi-tphcm', 'huong-dan'];

  /* Tra ve so cap thu muc tinh tu goc site (0 = trang chu).
     Ho tro ca bai viet nam sau 1 cap (vd /huong-dan/ten-bai/ -> depth 2)
     va truong hop host trong sub-path (GitHub Pages /ten-repo/...). */
  function computeDepth() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && parts[parts.length - 1] === 'index.html') parts.pop();
    for (var i = parts.length - 1; i >= 0; i--) {
      if (NESTED_PAGES.indexOf(parts[i]) !== -1) return parts.length - i;
    }
    return 0;
  }

  var depth = computeDepth();
  var prefix = new Array(depth + 1).join('../');

  function applyPrefix(root) {
    root.querySelectorAll('[data-href]').forEach(function (el) {
      el.setAttribute('href', prefix + el.getAttribute('data-href'));
    });
  }

  function currentKey() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && parts[parts.length - 1] === 'index.html') parts.pop();
    for (var i = parts.length - 1; i >= 0; i--) {
      if (NESTED_PAGES.indexOf(parts[i]) !== -1) return parts[i] + '/';
    }
    return 'index.html';
  }

  function markActive(root) {
    var key = currentKey();
    root.querySelectorAll('.main-nav a[data-href]').forEach(function (a) {
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

  function include(id, file, cb) {
    fetch(prefix + file)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = html;
        applyPrefix(el);
        if (cb) cb(el);
      })
      .catch(function (e) { console.error('include() failed for', file, e); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    include('site-header', 'partials/header.html', function (el) {
      markActive(el);
      setupMobileNav();
    });
    include('site-footer', 'partials/footer.html', function (el) {
      markActive(el);
    });
    setupPromoSlider();
  });
})();
