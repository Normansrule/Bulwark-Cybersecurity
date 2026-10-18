/* widgets/certchain.js — the TLS certificate chain of trust, made tangible.
   Leaf -> Intermediate CA -> Root CA. Click a certificate to inspect it; toggle
   failures and watch validation break at a specific link, the way a browser does. */
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
  const CERTS = [
    { id: "leaf", role: "Leaf (server)", subject: "CN=example.com", issuer: "CN=Bulwark Intermediate CA", valid: "2026-01-01 \u2192 2026-04-01", key: "ECDSA P-256", fp: "9f:2a:\u2026:14", note: "Presented by the server. Its validity dates and hostname must match." },
    { id: "inter", role: "Intermediate CA", subject: "CN=Bulwark Intermediate CA", issuer: "CN=Bulwark Root CA", valid: "2024 \u2192 2029", key: "RSA 3072", fp: "c1:77:\u2026:e0", note: "Signs leaf certificates so the root's key can stay offline." },
    { id: "root", role: "Root CA", subject: "CN=Bulwark Root CA", issuer: "self-signed", valid: "2020 \u2192 2040", key: "RSA 4096", fp: "44:0d:\u2026:ab", note: "The trust anchor. It's in your device's trust store, or the chain fails." }
  ];

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.certchain = function (root) {
    let sel = "leaf", expired = false, untrusted = false;
    const chain = el("div", { class: "cert-chain" });
    const cards = {};
    CERTS.forEach((c, i) => {
      const card = el("button", { type: "button", class: "cert-card", "aria-pressed": String(sel === c.id) });
      card.append(el("span", { class: "cert-role" }, c.role), el("span", { class: "cert-cn" }, c.subject));
      card.addEventListener("click", () => { sel = c.id; sync(); });
      cards[c.id] = card;
      chain.append(card);
      if (i < CERTS.length - 1) chain.append(el("div", { class: "cert-link" }, "signed by \u2193"));
    });

    const detail = el("div", { class: "tm-panel" });
    const verdict = el("div", null);
    const expiredT = el("input", { type: "checkbox", id: "cc_exp" });
    const untrustedT = el("input", { type: "checkbox", id: "cc_unt" });

    function sync() {
      expired = expiredT.checked; untrusted = untrustedT.checked;
      CERTS.forEach((c) => cards[c.id].setAttribute("aria-pressed", String(sel === c.id)));
      const c = CERTS.find((x) => x.id === sel);
      detail.textContent = "";
      detail.append(el("p", { class: "pane-title" }, c.role));
      [["Subject", c.subject], ["Issuer", c.issuer], ["Valid", c.id === "leaf" && expired ? "2025-01-01 \u2192 2025-04-01 (EXPIRED)" : c.valid], ["Public key", c.key], ["SHA-256 fingerprint", c.fp]].forEach(([k, val]) => {
        detail.append(el("div", { class: "cert-field" }, el("span", { class: "cert-k" }, k), el("span", null, val)));
      });
      detail.append(el("p", { class: "hint" }, c.note));
      // validation
      verdict.textContent = "";
      let ok = true, why = "Chain valid \u2014 leaf trusted up to a root in the trust store.";
      if (expired) { ok = false; why = "Validation fails at the leaf: the certificate is expired. Browsers refuse the connection."; }
      else if (untrusted) { ok = false; why = "Validation fails at the root: it isn't in the device's trust store, so the chain has no anchor."; }
      verdict.append(el("span", { class: "state " + (ok ? "safe" : "vuln") }, ok ? "\u2713 trusted" : "\u2717 rejected"), " ", el("span", { class: "hint" }, why));
    }
    expiredT.addEventListener("change", sync);
    untrustedT.addEventListener("change", sync);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "CHAIN OF TRUST"), el("h3", null, "Certificate chain \u2014 click to inspect")),
      el("div", { class: "widget-body" },
        chain,
        el("div", { class: "controls" },
          el("label", { class: "hint check-row" }, expiredT, "Leaf certificate expired"),
          el("label", { class: "hint check-row" }, untrustedT, "Root not in trust store")),
        verdict, detail));
    sync();
  };
})();
