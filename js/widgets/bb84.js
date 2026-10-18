/* widgets/bb84.js — Quantum Key Distribution via the BB84 protocol.
   Alice sends qubits in random bases; Bob measures in random bases; they keep
   only the positions where the bases matched. Turn on Eve and her measurements
   disturb the qubits (no-cloning theorem), pushing the error rate toward 25% —
   which is how eavesdropping is DETECTED. All simulated with Math.random. */
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
  const rnd = () => Math.random() < 0.5 ? 0 : 1;
  const BSYM = ["+", "×"]; // 0 rectilinear, 1 diagonal

  // Pure protocol step (mirrored by the test). eve=true inserts an interceptor.
  function run(n, eve) {
    const cols = [];
    for (let i = 0; i < n; i++) {
      const aBit = rnd(), aBasis = rnd();
      let inBasis = aBasis, inBit = aBit, eBasis = null, eBit = null;
      if (eve) {
        eBasis = rnd();
        eBit = (eBasis === aBasis) ? aBit : rnd(); // wrong basis -> random result
        inBasis = eBasis; inBit = eBit;            // Eve resends in her basis
      }
      const bBasis = rnd();
      const bBit = (bBasis === inBasis) ? inBit : rnd();
      const sifted = aBasis === bBasis;
      cols.push({ aBit, aBasis, eBasis, eBit, bBasis, bBit, sifted, error: sifted && aBit !== bBit });
    }
    const sift = cols.filter((c) => c.sifted);
    const errors = sift.filter((c) => c.error).length;
    const qber = sift.length ? errors / sift.length : 0;
    return { cols, sift, errors, qber };
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.bb84 = function (root) {
    const nIn = el("input", { type: "range", min: "8", max: "28", value: "16", class: "input" });
    const nVal = el("span", { class: "src-meta" });
    const eve = el("input", { type: "checkbox", id: "bb84eve" });
    const runBtn = el("button", { type: "button", class: "btn btn-primary" }, "Run exchange");
    const track = el("div", { class: "bb84-track" });
    const keyOut = el("div", { class: "mono-out" });
    const verdict = el("div", null);
    const summary = el("p", { class: "hint" });

    function render() {
      const n = +nIn.value; nVal.textContent = n + " qubits";
      const r = run(n, eve.checked);
      track.textContent = "";
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      r.cols.forEach((c, i) => {
        const col = el("div", { class: "bb84-col" + (c.sifted ? " kept" : "") + (c.error ? " err" : "") });
        if (!reduce) col.style.animationDelay = (i * 25) + "ms";
        col.append(el("div", { class: "bb84-cell a" }, BSYM[c.aBasis] + c.aBit));
        if (eve.checked) col.append(el("div", { class: "bb84-cell e" }, BSYM[c.eBasis] + c.eBit));
        col.append(el("div", { class: "bb84-cell b" }, BSYM[c.bBasis] + c.bBit));
        col.append(el("div", { class: "bb84-mark" }, c.sifted ? (c.error ? "✗" : "✓") : ""));
        track.append(col);
      });
      keyOut.textContent = "Shared key (" + r.sift.length + " bits): " + (r.sift.map((c) => c.aBit).join("") || "—");
      const pct = Math.round(r.qber * 100);
      const bad = r.qber > 0.1;
      verdict.textContent = "";
      verdict.append(el("span", { class: "state " + (bad ? "vuln" : "safe") }, "QBER " + pct + "%  —  " + (bad ? "eavesdropper detected, discard the key" : "clean, key accepted")));
      summary.textContent = eve.checked
        ? "Eve must measure each qubit to learn it, but measuring in the wrong basis disturbs it — the no-cloning theorem means she can't copy it undetected. Those disturbances show up as errors (about 25%) when Alice and Bob compare a sample, so they know to throw the key away."
        : "Where Alice's and Bob's bases matched (✓), their bits agree, giving a shared secret. Mismatched bases (blank) are discarded. With no eavesdropper the error rate is ~0.";
    }
    nIn.addEventListener("input", () => { nVal.textContent = nIn.value + " qubits"; });
    runBtn.addEventListener("click", render);
    eve.addEventListener("change", render);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "BB84 / QKD"), el("h3", null, "Quantum key distribution")),
      el("div", { class: "widget-body" },
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "Qubits  ", nVal), nIn),
          el("label", { class: "hint check-row" }, eve, "Insert an eavesdropper (Eve)")),
        el("div", null, runBtn),
        el("div", { class: "bb84-legend" }, el("span", null, "A = Alice  ·  E = Eve  ·  B = Bob  ·  ", el("span", { class: "state safe" }, "✓ kept"), "  ", el("span", { class: "state vuln" }, "✗ error"))),
        el("div", { class: "bb84-scroll" }, track),
        keyOut, verdict, summary));
    render();
  };
})();
