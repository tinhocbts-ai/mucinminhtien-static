/*
  Muc in Minh Tien - simple HTML include helper.
  Every content page has:
    <div id="site-header"></div>
    <div id="site-footer"></div>
  This script fetches partials/header.html and partials/footer.html
  (paths are root-relative so it works from any page) and injects them.
  It also marks the current nav link with aria-current="page" for SEO/UX.
*/
(function () {
    function include(selector, url, afterInsert) {
          var el = document.querySelector(selector);
          if (!el) return;
          fetch(url)
            .then(function (res) {
                      if (!res.ok) throw new Error("Fetch failed: " + url);
                      return res.text();
            })
            .then(function (html) {
                      el.innerHTML = html;
                      if (typeof afterInsert === "function") afterInsert(el);
            })
            .catch(function (err) {
                      console.error(err);
            });
    }

   function markActiveNav(container) {
         var current = window.location.pathname.replace(/\/index\.html$/, "/");
         var links = container.querySelectorAll("nav a[href]");
         links.forEach(function (a) {
                 var href = a.getAttribute("href").replace(/\/index\.html$/, "/");
                 if (href === current) {
                           a.setAttribute("aria-current", "page");
                 }
         });
   }

   document.addEventListener("DOMContentLoaded", function () {
         include("#site-header", "/partials/header.html", markActiveNav);
         include("#site-footer", "/partials/footer.html");
   });
})();
