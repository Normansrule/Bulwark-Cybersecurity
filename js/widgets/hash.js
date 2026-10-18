/* widgets/hash.js — SHA-256 avalanche visualizer via the Web Crypto API.
   Uses the browser's audited crypto.subtle, not a hand-rolled hash. */
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
  const enc = new TextEncoder();
  async function sha256Bytes(str) {
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(str));
    return new Uint8Array(buf);
  }
  const toHex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
  const bits = (b) => { const out = []; for (const byte of b) for (let i = 7; i >= 0; i--) out.push((byte >> i) & 1); return out; };

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.hash = function (root) {
    const secure = (typeof crypto !== "undefined" && crypto.subtle);
    const head = el("div", { class: "widget-head" }, el("span", { class: "tag" }, "SHA-256"), el("h3", null, "Hash avalanche"));

    if (!secure) {
      root.append(head, el("div", { class: "widget-body" },
        el("div", { class: "note note-info" }, el("div", { class: "ico" }, "i"),
          el("p", null, "The Web Crypto API needs a secure context. Open this over ",
            el("code", null, "http://localhost"), " or the deployed HTTPS site — not a ", el("code", null, "file://"), " URL — and the live hashing will appear here."))));
      return;
    }

    const aIn = el("input", { class: "input", type: "text", value: "bulwark", spellcheck: "false" });
    const bIn = el("input", { class: "input", type: "text", value: "Bulwark", spellcheck: "false" });
    const aOut = el("div", { class: "mono-out" });
    const bOut = el("div", { class: "mono-out" });
    const grid = el("div", { class: "bitgrid" });
    for (let i = 0; i < 256; i++) grid.append(el("i"));
    const summary = el("p", { class: "hint" });

    async function update() {
      const [ab, bb] = await Promise.all([sha256Bytes(aIn.value), sha256Bytes(bIn.value)]);
      aOut.textContent = toHex(ab);
      bOut.textContent = toHex(bb);
      const abits = bits(ab), bbits = bits(bb);
      let diff = 0;
      const cells = grid.children;
      for (let i = 0; i < 256; i++) {
        const d = abits[i] !== bbits[i];
        if (d) diff++;
        cells[i].className = d ? "diff" : (bbits[i] ? "on" : "");
      }
      summary.textContent = "";
      const same = aIn.value === bIn.value;
      summary.append(
        el("b", null, diff + " of 256 bits"),
        " differ (" + Math.round(diff / 256 * 100) + "%). ",
        same ? "Identical inputs → identical digest, every time."
             : "The inputs differ by as little as one character, yet about half the output bits flip — the avalanche effect. Red cells are the bits that changed.");
    }
    let t;
    const deb = () => { clearTimeout(t); t = setTimeout(update, 120); };
    aIn.addEventListener("input", deb);
    bIn.addEventListener("input", deb);

    root.append(head, el("div", { class: "widget-body" },
      el("div", { class: "two-col" },
        el("div", null, el("div", { class: "field" }, el("label", null, "Input A"), aIn), el("div", { class: "field" }, el("label", null, "SHA-256(A)"), aOut)),
        el("div", null, el("div", { class: "field" }, el("label", null, "Input B"), bIn), el("div", { class: "field" }, el("label", null, "SHA-256(B)"), bOut))),
      el("div", null, el("p", { class: "pane-title" }, "256-bit digest of B — red = changed vs A"), grid),
      summary));
    update();
  };
})();
