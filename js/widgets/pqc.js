/* widgets/pqc.js — flip on a large quantum computer and watch which algorithms
   fall. Illustrates why the migration is to post-quantum schemes, and the
   "harvest now, decrypt later" urgency. */
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
  // status: 'broken' by Shor, 'resize' weakened by Grover (double the parameter), 'safe' post-quantum
  const ALGOS = [
    { name: "RSA", kind: "public key", q: "broken", why: "Shor's algorithm factors n efficiently." },
    { name: "Elliptic-Curve Cryptography", kind: "public key", q: "broken", why: "Shor's algorithm solves the elliptic-curve discrete log." },
    { name: "Diffie–Hellman", kind: "key exchange", q: "broken", why: "Shor's algorithm solves the discrete log." },
    { name: "AES-256", kind: "symmetric", q: "resize", why: "Grover only halves the effective key length; 256 bits keeps a wide margin." },
    { name: "SHA-256 / SHA-3", kind: "hashing", q: "resize", why: "Grover gives a square-root speedup; use longer output where needed." },
    { name: "ML-KEM (FIPS 203)", kind: "post-quantum KEM", q: "safe", why: "Based on lattice problems with no known quantum break." },
    { name: "ML-DSA (FIPS 204)", kind: "post-quantum signature", q: "safe", why: "Lattice-based signatures standardized for this transition." }
  ];
  const LABEL = { broken: "BROKEN", resize: "resize keys", safe: "safe" };
  const CLS = { broken: "vuln", resize: "", safe: "safe" };

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.pqc = function (root) {
    let quantum = false;
    const sw = el("input", { type: "checkbox", id: "crqc" });
    const rows = el("div", { class: "pqc-list" });
    const harvest = el("div", { class: "note note-history" }, el("div", { class: "ico" }, "✦"),
      el("p", null, "“Harvest now, decrypt later”: an adversary can record today's encrypted traffic and decrypt it once a capable quantum computer exists. That is why data with a long secrecy lifetime is migrating to post-quantum algorithms now, before the hardware arrives."));

    function render() {
      rows.textContent = "";
      ALGOS.forEach((a) => {
        const status = quantum ? a.q : "safe";
        const row = el("div", { class: "pqc-row" });
        row.append(el("span", { class: "pqc-name" }, a.name), el("span", { class: "pqc-kind" }, a.kind));
        const st = el("span", { class: "state " + (CLS[status] || "") }, quantum ? LABEL[a.q] : "secure today");
        row.append(st);
        row.append(el("span", { class: "pqc-why" }, quantum ? a.why : ""));
        rows.append(row);
      });
    }
    sw.addEventListener("change", () => { quantum = sw.checked; render(); });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "FRONTIER"), el("h3", null, "What a large quantum computer breaks")),
      el("div", { class: "widget-body" },
        el("label", { class: "hint check-row" }, sw, "Assume a cryptographically relevant quantum computer exists"),
        rows, harvest));
    render();
  };
})();
