/* widgets/cipher.js — classical cipher playground + frequency-analysis break.
   User text is only ever read from inputs and written with textContent. */
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

  // Relative English letter frequencies (%).
  const ENG = [8.17,1.49,2.78,4.25,12.70,2.23,2.02,6.09,6.97,0.15,0.77,4.03,2.41,6.75,7.51,1.93,0.10,5.99,6.33,9.06,2.76,0.98,2.36,0.15,1.97,0.07];
  const A = 65;

  function caesar(text, shift) {
    return text.replace(/[a-z]/gi, function (c) {
      const base = c <= "Z" ? A : 97;
      return String.fromCharCode((c.charCodeAt(0) - base + shift + 26) % 26 + base);
    });
  }
  function vigenere(text, key, dir) {
    key = key.toUpperCase().replace(/[^A-Z]/g, "");
    if (!key) return text;
    let ki = 0;
    return text.replace(/[a-z]/gi, function (c) {
      const base = c <= "Z" ? A : 97;
      const k = key.charCodeAt(ki % key.length) - A;
      ki++;
      const s = dir === "dec" ? -k : k;
      return String.fromCharCode((c.charCodeAt(0) - base + s + 26) % 26 + base);
    });
  }
  function counts(text) {
    const c = new Array(26).fill(0); let total = 0;
    for (const ch of text.toUpperCase()) { const i = ch.charCodeAt(0) - A; if (i >= 0 && i < 26) { c[i]++; total++; } }
    return { c, total };
  }
  // chi-squared score of a candidate plaintext against English.
  function chi2(text) {
    const { c, total } = counts(text);
    if (!total) return Infinity;
    let s = 0;
    for (let i = 0; i < 26; i++) { const e = ENG[i] / 100 * total; s += (c[i] - e) * (c[i] - e) / (e || 1); }
    return s;
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.cipher = function (root) {
    const textIn = el("textarea", { class: "input", rows: "2", spellcheck: "false" });
    textIn.value = "Meet at the old bridge at dawn.";
    const algo = el("select", null,
      el("option", { value: "caesar" }, "Caesar (single shift)"),
      el("option", { value: "vigenere" }, "Vigenère (keyword)"));
    const shiftIn = el("input", { class: "input", type: "number", min: "0", max: "25", value: "3" });
    const keyIn = el("input", { class: "input", type: "text", value: "LEMON", spellcheck: "false" });
    const dir = el("div", { class: "seg" });
    const encBtn = el("button", { type: "button", "aria-pressed": "true" }, "Encrypt");
    const decBtn = el("button", { type: "button", "aria-pressed": "false" }, "Decrypt");
    dir.append(encBtn, decBtn);
    let mode = "enc";

    const out = el("div", { class: "mono-out" });
    const keyField = el("div", { class: "field" }, el("label", null, "Keyword"), keyIn);
    const shiftField = el("div", { class: "field" }, el("label", null, "Shift (0–25)"), shiftIn);

    const breakBtn = el("button", { type: "button", class: "btn btn-ghost" }, "→ Break it with frequency analysis");
    const breakOut = el("div", { hidden: "" });
    const bars = el("div", { class: "bars" });
    const verdict = el("p", { class: "hint" });
    breakOut.append(el("p", { class: "pane-title" }, "Letter frequencies of the ciphertext"), bars, verdict);

    function transform() {
      const t = textIn.value;
      const a = algo.value;
      let result;
      if (a === "caesar") result = caesar(t, mode === "enc" ? +shiftIn.value : -shiftIn.value);
      else result = vigenere(t, keyIn.value, mode === "enc" ? "enc" : "dec");
      out.textContent = result;
      keyField.hidden = a !== "vigenere";
      shiftField.hidden = a === "vigenere";
      breakBtn.hidden = a !== "caesar";
      if (a !== "caesar") breakOut.hidden = true;
    }
    function setMode(m) { mode = m; encBtn.setAttribute("aria-pressed", m === "enc"); decBtn.setAttribute("aria-pressed", m === "dec"); transform(); }

    function doBreak() {
      const cipher = out.textContent;               // attack only the visible ciphertext
      let best = 0, bestScore = Infinity;
      for (let s = 0; s < 26; s++) { const sc = chi2(caesar(cipher, -s)); if (sc < bestScore) { bestScore = sc; best = s; } }
      // draw frequency bars of the ciphertext, highlight the presumed 'E'
      const { c, total } = counts(cipher);
      const max = Math.max(1, ...c);
      const guessedE = (4 + best) % 26;            // where plaintext E landed in ciphertext
      bars.textContent = "";
      for (let i = 0; i < 26; i++) {
        const bar = el("div", { class: "bar" + (i === guessedE ? " hi" : "") });
        bar.style.height = (c[i] / max * 100) + "%";
        bar.append(el("span", null, String.fromCharCode(A + i)));
        bars.append(bar);
      }
      verdict.textContent = "";
      verdict.append(
        "Recovered shift: ", el("b", null, String(best)),
        total ? ". The tall bar (" + String.fromCharCode(A + guessedE) + ") is plaintext E in disguise. Decrypted: " : ". ",
        el("code", null, caesar(cipher, -best).slice(0, 60) + (cipher.length > 60 ? "…" : "")));
      breakOut.hidden = false;
    }

    encBtn.addEventListener("click", () => setMode("enc"));
    decBtn.addEventListener("click", () => setMode("dec"));
    textIn.addEventListener("input", transform);
    algo.addEventListener("change", transform);
    shiftIn.addEventListener("input", transform);
    keyIn.addEventListener("input", transform);
    breakBtn.addEventListener("click", doBreak);

    root.append(
      el("div", { class: "widget-head" },
        el("span", { class: "tag" }, "PLAYGROUND"),
        el("h3", null, "Cipher playground")),
      el("div", { class: "widget-body" },
        el("div", { class: "field" }, el("label", null, "Message"), textIn),
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "Cipher"), algo),
          shiftField, keyField,
          el("div", { class: "field" }, el("label", null, "Direction"), dir)),
        el("div", { class: "field" }, el("label", null, "Output"), out),
        breakBtn, breakOut));
    transform();
  };
})();
