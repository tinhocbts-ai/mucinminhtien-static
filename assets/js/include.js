/*
  Muc in Minh Tien - simple HTML include helper.
  Every content page has:
    <div id="site-header"></div>
    <div id="site-footer"></div>
  This script fetches partials/header.html and partials/footer.html
  using paths RELATIVE to the current page, so the site works both at
  the domain root and under a GitHub Pages project sub-path
  (e.g. https://user.github.io/repo/) without any changes.
  It also marks the current nav link with aria-current="page" and wires up
  the mobile hamburger menu toggle for small screens.
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
         var current = window.location.pathname.split("/").pop() || "index.html";
         var links = container.querySelectorAll("nav a[href]");
         links.forEach(function (a) {
                 var href = a.getAttribute("href");
                 if (href === current) {
                           a.setAttribute("aria-current", "page");
                 }
         });

      // Mobile hamburger menu toggle
      var toggle = container.querySelector("#navToggle");
         var nav = container.querySelector("#mainNav");
         if (toggle && nav) {
                 toggle.addEventListener("click", function () {
                           var isOpen = nav.classList.toggle("is-open");
                           toggle.classList.toggle("is-open", isOpen);
                           toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
                 });
                 // Close the menu after a nav link is tapped (mobile UX)
           nav.querySelectorAll("a").forEach(function (a) {
                     a.addEventListener("click", function () {
                                 nav.classList.remove("is-open");
                                 toggle.classList.remove("is-open");
                                 toggle.setAttribute("aria-expanded", "false");
                     });
           });
         }
   }

   document.addEventListener("DOMContentLoaded", function () {
         include("#site-header", "partials/header.html", markActiveNav);
         include("#site-footer", "partials/footer.html");
   });
})();
