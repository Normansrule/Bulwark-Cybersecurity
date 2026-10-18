/* widgets/entropy.js — password entropy and time-to-guess under a stated model.
   Estimates an UPPER bound assuming random selection from the detected character
   pool. Real passwords have less entropy; the widget says so. Input is read only
   to size the pool and is never stored or sent. */
(function () {
  "use strict";
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    for (const kid of kids) { if (kid == null) continue; n.append(kid.nodeType ? kid : document.createTextNode(String(kid))); }
    return n;
  }
  const GUESSES = 1e10; // offline attacker, fast unsalted hash, 10 billion/sec
  function poolSize(s) {
    let p = 0;
    if (/[a-z]/.test(s)) p += 26;
    if (/[A-Z]/.test(s)) p += 26;
    if (/[0-9]/.test(s)) p += 10;
    if (/[^A-Za-z0-9]/.test(s)) p += 33;
    return p;
  }
  function humanTime(sec) {
    if (sec < 1) return "under a second";
    const units = [["year", 31557600], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
    for (const [name, s] of units) { if (sec >= s) { const v = sec / s; return v >= 1e9 ? v.toExponential(1) + " " + name + "s" : Math.round(v).toLocaleString() + " " + name + (Math.round(v) === 1 ? "" : "s"); } }
    return sec.toFixed(1) + " seconds";
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.entropy = function (root) {
    const pw = el("input", { class: "input", type: "text", value: "Tr0ub4dour", spellcheck: "false", autocomplete: "off" });
    const bitsOut = el("div", { class: "mono-out big" });
    const meter = el("div", { class: "ampbar" }, el("span"));
    const fill = meter.firstChild;
    const detail = el("p", { class: "hint" });

    function calc() {
      const s = pw.value;
      const pool = poolSize(s);
      const bits = s.length && pool ? s.length * Math.log2(pool) : 0;
      const seconds = Math.pow(2, bits) / 2 / GUESSES;   // expected: half the space
      bitsOut.textContent = bits.toFixed(1) + " bits  (pool " + pool + ", length " + s.length + ")";
      fill.style.width = Math.min(100, bits / 100 * 100) + "%";
      detail.textContent = "Upper-bound estimate. Against an offline attacker at 10 billion guesses/second, expected time to crack ≈ " + humanTime(seconds) + ". A truly random passphrase of a few words beats a short complex string — length dominates. Real-world entropy is lower because people are predictable, which is why sites also rate-limit and use slow, salted hashing.";
    }
    pw.addEventListener("input", calc);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "EQUATION" ), el("h3", null, "Password entropy — bits and time to guess")),
      el("div", { class: "widget-body" },
        el("div", { class: "field" }, el("label", null, "Try a password (stays in your browser)"), pw),
        el("div", { class: "field" }, el("label", null, "Entropy"), bitsOut, meter),
        detail));
    calc();
  };
})();
