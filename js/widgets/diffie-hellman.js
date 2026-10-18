/* widgets/diffie-hellman.js — interactive Diffie-Hellman key exchange.
   Small numbers so the arithmetic is followable; BigInt keeps modpow exact.
   Shows that Alice and Bob reach the same secret while an eavesdropper who
   sees p, g, A, B still faces the discrete-logarithm problem. */
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
  function modpow(b, e, m) { b %= m; let r = 1n; while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; } return r; }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.dh = function (root) {
    const p = el("input", { class: "input", type: "number", min: "5", max: "100000", value: "23" });
    const g = el("input", { class: "input", type: "number", min: "2", max: "100000", value: "5" });
    const a = el("input", { class: "input", type: "number", min: "1", max: "100000", value: "6" });
    const b = el("input", { class: "input", type: "number", min: "1", max: "100000", value: "15" });

    const pubA = el("div", { class: "mono-out" });
    const pubB = el("div", { class: "mono-out" });
    const secA = el("div", { class: "mono-out" });
    const secB = el("div", { class: "mono-out" });
    const match = el("span", { class: "state" });
    const eve = el("div", { class: "log" });

    function calc() {
      try {
        const P = BigInt(p.value || "0"), G = BigInt(g.value || "0");
        const A = BigInt(a.value || "0"), B = BigInt(b.value || "0");
        if (P < 5n || G < 2n) { pubA.textContent = pubB.textContent = "p ≥ 5, g ≥ 2 required"; return; }
        const Apub = modpow(G, A, P), Bpub = modpow(G, B, P);
        const Ash = modpow(Bpub, A, P), Bsh = modpow(Apub, B, P);
        pubA.textContent = "A = g^a mod p = " + G + "^" + A + " mod " + P + " = " + Apub;
        pubB.textContent = "B = g^b mod p = " + G + "^" + B + " mod " + P + " = " + Bpub;
        secA.textContent = "B^a mod p = " + Ash;
        secB.textContent = "A^b mod p = " + Bsh;
        const ok = Ash === Bsh;
        match.className = "state " + (ok ? "safe" : "vuln");
        match.textContent = ok ? "shared secret agrees: " + Ash : "mismatch";
        eve.textContent = "";
        eve.append(el("div", null, "Eve intercepts: p=" + P + ", g=" + G + ", A=" + Apub + ", B=" + Bpub));
        eve.append(el("div", { class: "flag" }, "To get the secret she must solve g^x mod p = A for x — the discrete-log problem, infeasible for large p."));
      } catch (e) { pubA.textContent = "enter integers"; }
    }
    [p, g, a, b].forEach((i) => i.addEventListener("input", calc));

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "KEY EXCHANGE"), el("h3", null, "Diffie–Hellman — a shared secret over an open line")),
      el("div", { class: "widget-body" },
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "Public prime p"), p),
          el("div", { class: "field" }, el("label", null, "Public generator g"), g)),
        el("div", { class: "two-col" },
          el("div", null, el("p", { class: "pane-title" }, "Alice"), el("div", { class: "field" }, el("label", null, "secret a"), a), pubA, el("div", { class: "field" }, el("label", null, "computes"), secA)),
          el("div", null, el("p", { class: "pane-title" }, "Bob"), el("div", { class: "field" }, el("label", null, "secret b"), b), pubB, el("div", { class: "field" }, el("label", null, "computes"), secB))),
        el("div", null, match),
        el("div", { class: "field" }, el("label", null, "What the eavesdropper sees"), eve)));
    calc();
  };
})();
