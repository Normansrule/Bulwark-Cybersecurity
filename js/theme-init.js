/* theme-init.js — loaded synchronously in <head> so the saved theme is applied
   before first paint (no flash). Kept external because the strict CSP allows no
   inline scripts. */
(function () {
  try {
    var t = localStorage.getItem("bulwark.theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
