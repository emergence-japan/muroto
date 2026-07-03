/* ==========================================================================
   室戸ポータル — page behaviour (reveal on scroll, active nav)
   ========================================================================== */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    /* reveal-on-scroll: cards, tiles, timeline items */
    const targets = document.querySelectorAll(
      ".card, .ftile, .timeline li, .link-group, .kpi, .section-head"
    );

    if (prefersReduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      targets.forEach(function (el) { el.classList.add("reveal"); });
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
      targets.forEach(function (el) { io.observe(el); });
    }

    /* active section highlight in global nav */
    const navLinks = Array.prototype.slice.call(
      document.querySelectorAll(".global-nav a")
    );
    const sections = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
      const navIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (a) {
            const active = a.getAttribute("href") === "#" + entry.target.id;
            a.style.color = active ? "var(--vermilion)" : "";
            a.style.borderBottomColor = active ? "var(--vermilion)" : "";
          });
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      sections.forEach(function (s) { navIo.observe(s); });
    }
  });
})();
