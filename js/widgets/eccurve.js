/* widgets/eccurve.js — elliptic-curve point addition over the reals, visualized.
   Curve: y^2 = x^3 + a*x + b. Pick x for P and Q (upper branch); the widget draws
   the chord, the third intersection, and the reflection that is P+Q. Degrades to a
   note if the canvas 2D context is unavailable. */
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
  const A = -1, B = 1;                 // y^2 = x^3 - x + 1
  const XMIN = -1.6, XMAX = 3.0, YSPAN = 5.5;
  const fy = (x) => { const v = x * x * x + A * x + B; return v >= 0 ? Math.sqrt(v) : NaN; };

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.ec = function (root) {
    const canvas = el("canvas", { class: "ec-canvas", width: "620", height: "380" });
    const readout = el("div", { class: "mono-out" });
    const xP = el("input", { type: "range", min: "-130", max: "300", value: "-40", class: "input" });
    const xQ = el("input", { type: "range", min: "-130", max: "300", value: "140", class: "input" });

    const ctx = canvas.getContext ? canvas.getContext("2d") : null;
    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "GEOMETRY" ), el("h3", null, "Elliptic-curve point addition")),
      el("div", { class: "widget-body" },
        ctx ? canvas : el("div", { class: "note note-info" }, el("div", { class: "ico" }, "i"), el("p", null, "Open this in a browser to see the interactive curve.")),
        ctx ? el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "x of P"), xP),
          el("div", { class: "field" }, el("label", null, "x of Q"), xQ)) : null,
        ctx ? el("div", { class: "field" }, el("label", null, "P + Q"), readout) : null,
        el("p", { class: "hint" }, "The line through P and Q meets the curve at exactly one more point; reflect it across the x-axis and you have P + Q. Doing this k times is scalar multiplication — easy forward, but recovering k from the result is the elliptic-curve discrete-log problem, which is why 256-bit ECC matches ~3072-bit RSA.")));
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    function toPx(x, y) {
      const w = canvas.width, h = canvas.height;
      return [ (x - XMIN) / (XMAX - XMIN) * w, h / 2 - y / YSPAN * (h / 2) ];
    }
    function dot(x, y, color, label) {
      const [px, py] = toPx(x, y);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill();
      if (label) { ctx.fillStyle = color; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.fillText(label, px + 7, py - 7); }
    }
    function draw() {
      const ink = css.getPropertyValue("--ink").trim() || "#e8e4da";
      const line = css.getPropertyValue("--line").trim() || "#26374f";
      const accent = css.getPropertyValue("--accent").trim() || "#d59a45";
      const teal = css.getPropertyValue("--teal").trim() || "#46b3a2";
      const rust = css.getPropertyValue("--rust").trim() || "#d97059";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // axes
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      let [ax0, ay0] = toPx(XMIN, 0), [ax1] = toPx(XMAX, 0);
      ctx.beginPath(); ctx.moveTo(ax0, ay0); ctx.lineTo(ax1, ay0); ctx.stroke();
      let [ox] = toPx(0, 0); ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, canvas.height); ctx.stroke();
      // curve (both branches)
      ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
      for (const sgn of [1, -1]) {
        ctx.beginPath(); let started = false;
        for (let px = 0; px <= canvas.width; px++) {
          const x = XMIN + px / canvas.width * (XMAX - XMIN);
          const y = fy(x); if (isNaN(y)) { started = false; continue; }
          const [cx, cy] = toPx(x, sgn * y);
          if (!started) { ctx.moveTo(cx, cy); started = true; } else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
      // points
      const pxv = +xP.value / 100, qxv = +xQ.value / 100;
      const pY = fy(pxv), qY = fy(qxv);
      if (isNaN(pY) || isNaN(qY)) { readout.textContent = "pick x values on the curve"; return; }
      const P = { x: pxv, y: pY }, Q = { x: qxv, y: qY };
      let m;
      if (Math.abs(P.x - Q.x) < 1e-6) m = (3 * P.x * P.x + A) / (2 * P.y);   // doubling
      else m = (Q.y - P.y) / (Q.x - P.x);
      const xR = m * m - P.x - Q.x;
      const yLine = m * (xR - P.x) + P.y;    // third intersection (=-R)
      const R = { x: xR, y: -yLine };
      // chord
      ctx.strokeStyle = accent; ctx.setLineDash([5, 4]); ctx.beginPath();
      const [lx0, ly0] = toPx(XMIN, m * (XMIN - P.x) + P.y), [lx1, ly1] = toPx(XMAX, m * (XMAX - P.x) + P.y);
      ctx.moveTo(lx0, ly0); ctx.lineTo(lx1, ly1); ctx.stroke();
      // reflection line
      ctx.strokeStyle = teal; const [tx, tyTop] = toPx(xR, yLine), [, tyBot] = toPx(xR, -yLine);
      ctx.beginPath(); ctx.moveTo(tx, tyTop); ctx.lineTo(tx, tyBot); ctx.stroke();
      ctx.setLineDash([]);
      dot(P.x, P.y, accent, "P"); dot(Q.x, Q.y, accent, "Q");
      dot(xR, yLine, rust, "−R"); dot(R.x, R.y, teal, "R = P+Q");
      readout.textContent = "P=(" + P.x.toFixed(2) + ", " + P.y.toFixed(2) + ")  Q=(" + Q.x.toFixed(2) + ", " + Q.y.toFixed(2) + ")  →  R=(" + R.x.toFixed(2) + ", " + R.y.toFixed(2) + ")";
    }
    xP.addEventListener("input", draw); xQ.addEventListener("input", draw);
    draw();
  };
})();
