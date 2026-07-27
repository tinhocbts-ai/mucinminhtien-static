/* assets/js/include.js
   Fetches shared header/footer partials, rewrites their internal links so the
   site works correctly both at the domain root and one folder deep
   (bang-gia/, gioi-thieu/, lien-he/, san-pham/, dich-vu/), and wires up the
   mobile hamburger menu. */
(function () {
  var NESTED_PAGES = ['bang-gia', 'gioi-thieu', 'lien-he', 'san-pham', 'dich-vu'];

  function computeDepth() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (!parts.length) return 0;
    var last = parts[parts.length - 1];
    if (NESTED_PAGES.indexOf(last) !== -1) return 1;
    if (last === 'index.html' && parts.length >= 2 && NESTED_PAGES.indexOf(parts[parts.length - 2]) !== -1) return 1;
    return 0;
  }

  var prefix = computeDepth() === 1 ? '../' : '';

  function applyPrefix(root) {
    root.querySelectorAll('[data-href]').forEach(function (el) {
      el.setAttribute('href', prefix + el.getAttribute('data-href'));
    });
  }

  function currentKey() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    var last = parts[parts.length - 1] || 'index.html';
    if (NESTED_PAGES.indexOf(last) !== -1) return last + '/';
    if (last === 'index.html' && parts.length >= 2 && NESTED_PAGES.indexOf(parts[parts.length - 2]) !== -1) return parts[parts.length - 2] + '/';
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
  });
})();
