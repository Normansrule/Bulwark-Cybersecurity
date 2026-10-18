/* widgets/depgraph.js — a software supply-chain risk view (OWASP A03:2025).
   Your app's dependencies, some carrying risk. Click one to inspect it; apply
   supply-chain controls and watch the risks that controls actually fix resolve. */
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
  // risk: 'ok' | 'cve' | 'unpinned' | 'typo'. controlsFix: does pin+lockfile+verify+scan help?
  const DEPS = [
    { name: "ui-kit", ver: "2.1.0", depth: 0, risk: "ok", detail: "Pinned, signed, no known advisories.", fixedBy: "already clean" },
    { name: "http-client", ver: "^4.0", depth: 0, risk: "unpinned", detail: "A floating range (^4.0) can pull a new version silently — the door dependency confusion walks through.", fixedBy: "Pin the exact version in a lockfile." },
    { name: "date-parse", ver: "1.2.3", depth: 1, risk: "cve", detail: "Transitive dependency with a known prototype-pollution advisory (CVE).", fixedBy: "Scanner flags it; upgrade to the patched release." },
    { name: "colour-utils", ver: "0.9.1", depth: 1, risk: "typo", detail: "Name looks like the popular 'color-utils' — possible typosquat. Verify the publisher before trusting it.", fixedBy: "Signature/provenance check catches an unexpected publisher." },
    { name: "analytics", ver: "3.4.0", depth: 0, risk: "ok", detail: "Pinned and reviewed.", fixedBy: "already clean" }
  ];
  const LABEL = { ok: "ok", cve: "known CVE", unpinned: "unpinned", typo: "typosquat?" };
  const CLS = { ok: "safe", cve: "vuln", unpinned: "", typo: "vuln" };

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.depgraph = function (root) {
    let controls = false, sel = 1;
    const listEl = el("div", { class: "dep-list" });
    const detail = el("div", { class: "tm-panel" });
    const toggle = el("input", { type: "checkbox", id: "sc_ctrl" });
    const summary = el("p", { class: "hint" });

    function statusOf(d) {
      if (!controls) return d.risk;
      // controls surface/mitigate everything except leave clean as clean
      return d.risk === "ok" ? "ok" : "managed";
    }
    function render() {
      controls = toggle.checked;
      listEl.textContent = "";
      DEPS.forEach((d, i) => {
        const st = statusOf(d);
        const row = el("button", { type: "button", class: "dep-row" + (d.depth ? " sub" : ""), "aria-pressed": String(sel === i) });
        row.append(el("span", { class: "dep-name" }, d.name + "@" + d.ver));
        row.append(el("span", { class: "state " + (st === "managed" ? "safe" : CLS[d.risk] || "") }, st === "managed" ? "managed" : LABEL[d.risk]));
        row.addEventListener("click", () => { sel = i; paintDetail(); });
        listEl.append(row);
      });
      paintDetail();
      const risky = DEPS.filter((d) => d.risk !== "ok").length;
      summary.textContent = controls
        ? "With a lockfile, pinned versions, signature/provenance checks, an SBOM, and continuous scanning, the " + risky + " risky dependencies are now surfaced and managed instead of silent."
        : risky + " of " + DEPS.length + " dependencies carry risk — and you can't see it without tooling. That invisibility is the point of OWASP A03.";
    }
    function paintDetail() {
      DEPS.forEach((_d, i) => { const b = listEl.children[i]; if (b) b.setAttribute("aria-pressed", String(sel === i)); });
      const d = DEPS[sel];
      detail.textContent = "";
      detail.append(el("p", { class: "pane-title" }, d.name + "@" + d.ver + (d.depth ? "  (transitive)" : "  (direct)")));
      detail.append(el("p", { class: "hint" }, d.detail));
      detail.append(el("p", { class: "hint" }, el("b", { class: "atk-fixlabel" }, "Control: "), controls && d.risk !== "ok" ? d.fixedBy + "  — applied." : d.fixedBy));
    }
    toggle.addEventListener("change", render);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "SUPPLY CHAIN"), el("h3", null, "Your dependencies — and their risk")),
      el("div", { class: "widget-body" },
        el("div", { class: "dep-root" }, "your-app"),
        listEl,
        el("label", { class: "hint check-row" }, toggle, "Apply supply-chain controls (pin + lockfile + verify + SBOM + scan)"),
        detail, summary));
    render();
  };
})();
