/* widgets/ratelimit.js — a live token-bucket rate limiter, the standard API
   defense against floods and abuse. Requests consume tokens; the bucket refills
   at a steady rate. Watch bursts get absorbed up to the capacity, then throttled. */
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
  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.ratelimit = function (root) {
    let cap = 10, rate = 2, tokens = 10, allowed = 0, blocked = 0, last = performance.now();

    const capIn = el("input", { type: "range", min: "1", max: "20", value: "10", class: "input" });
    const rateIn = el("input", { type: "range", min: "1", max: "10", value: "2", class: "input" });
    const capVal = el("span", { class: "src-meta" }), rateVal = el("span", { class: "src-meta" });
    const bar = el("div", { class: "ampbar rl-bar" }, el("span"));
    const fill = bar.firstChild;
    const count = el("div", { class: "mono-out" });
    const stats = el("p", { class: "hint" });
    const one = el("button", { type: "button", class: "btn btn-ghost" }, "Send 1 request");
    const burst = el("button", { type: "button", class: "btn btn-primary" }, "Burst: 10 at once");
    const reset = el("button", { type: "button", class: "btn btn-ghost" }, "Reset");

    function send(n) {
      for (let k = 0; k < n; k++) { if (tokens >= 1) { tokens -= 1; allowed++; } else blocked++; }
      paint();
    }
    function paint() {
      fill.style.width = Math.max(0, Math.min(100, tokens / cap * 100)) + "%";
      count.textContent = tokens.toFixed(1) + " / " + cap + " tokens available";
      stats.textContent = "Allowed " + allowed + " · blocked " + blocked + ". Capacity absorbs a burst; the refill rate (" + rate + "/s) sets the sustained limit. A flood past both gets a cheap 429 instead of hitting your backend.";
    }
    capIn.addEventListener("input", () => { cap = +capIn.value; capVal.textContent = cap; tokens = Math.min(tokens, cap); paint(); });
    rateIn.addEventListener("input", () => { rate = +rateIn.value; rateVal.textContent = rate + "/s"; paint(); });
    one.addEventListener("click", () => send(1));
    burst.addEventListener("click", () => send(10));
    reset.addEventListener("click", () => { tokens = cap; allowed = 0; blocked = 0; paint(); });

    function loop(now) {
      if (!document.contains(root)) return;        // self-terminate when navigated away
      const dt = (now - last) / 1000; last = now;
      tokens = Math.min(cap, tokens + rate * dt);
      paint();
      requestAnimationFrame(loop);
    }

    capVal.textContent = cap; rateVal.textContent = rate + "/s";
    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "RATE LIMIT"), el("h3", null, "Token bucket — absorb bursts, throttle floods")),
      el("div", { class: "widget-body" },
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "Bucket capacity  ", capVal), capIn),
          el("div", { class: "field" }, el("label", null, "Refill rate  ", rateVal), rateIn)),
        el("div", { class: "field" }, el("label", null, "Bucket"), bar, count),
        el("div", { class: "quiz-actions" }, one, burst, reset),
        stats));
    paint();
    requestAnimationFrame(loop);
  };
})();
