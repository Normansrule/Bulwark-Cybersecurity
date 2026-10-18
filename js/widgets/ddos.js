/* widgets/ddos.js — amplification-factor concept visualizer.
   Generates NO traffic. It is a calculator that shows why reflection attacks get
   leverage and why removing spoofing removes the leverage. See docs/ETHICS.md. */
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
  window.BulwarkWidgets.ddos = function (root) {
    const req = el("input", { type: "range", min: "20", max: "100", value: "60", class: "input" });
    const resp = el("input", { type: "range", min: "60", max: "4000", value: "3000", step: "20", class: "input" });
    const filter = el("input", { type: "checkbox", id: "bcp38" });

    const reqVal = el("span", { class: "src-meta" });
    const respVal = el("span", { class: "src-meta" });
    const factorOut = el("div", { class: "mono-out big" });
    const bar = el("div", { class: "ampbar" }, el("span"));
    const barFill = bar.firstChild;
    const explain = el("p", { class: "hint" });

    function update() {
      const rq = +req.value, rs = +resp.value;
      reqVal.textContent = rq + " bytes";
      respVal.textContent = rs + " bytes";
      const factor = rs / rq;
      if (filter.checked) {
        factorOut.textContent = "× 0  (attack neutralized)";
        barFill.style.width = "0%";
        explain.textContent = "With source-address filtering (BCP 38) deployed, the attacker cannot forge the victim's address, so the reflected replies have nowhere to go. The leverage disappears at the root — which is why this is the single most effective network-level fix.";
      } else {
        factorOut.textContent = "× " + factor.toFixed(1) + "  amplification";
        barFill.style.width = Math.min(100, factor / 60 * 100) + "%";
        explain.textContent = "Each " + rq + "-byte request the attacker spoofs draws a " + rs + "-byte reply toward the victim — about " + factor.toFixed(0) + " times the traffic for the same effort. Defenders remove the leverage (filter spoofing, absorb with a CDN, rate-limit) rather than trying to out-bandwidth the flood.";
      }
    }
    req.addEventListener("input", update);
    resp.addEventListener("input", update);
    filter.addEventListener("change", update);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "CONCEPT"), el("h3", null, "Amplification factor — no traffic generated")),
      el("div", { class: "widget-body" },
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "Spoofed request size  ", reqVal), req),
          el("div", { class: "field" }, el("label", null, "Reflected reply size  ", respVal), resp)),
        el("div", { class: "field" }, el("label", null, "Leverage"), factorOut, bar),
        el("label", { class: "hint check-row" }, filter, "Enforce source-address filtering (BCP 38)"),
        explain));
    update();
  };
})();
