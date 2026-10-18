/* widgets/kdf.js — why password hashes must be slow. Times a real key-derivation
   function (PBKDF2-HMAC-SHA256 via Web Crypto) on this device at different work
   factors, next to a single fast SHA-256, and turns each into "guesses per
   second per core". Argon2id and scrypt are not in Web Crypto; the lesson
   explains why they're preferred anyway (memory-hardness). */
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
  const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + " million" : n >= 1e3 ? Math.round(n).toLocaleString("en-US") : n.toFixed(1);

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.kdf = function (root) {
    const subtle = window.crypto && window.crypto.subtle;
    const pw = el("input", { class: "input", type: "text", value: "correct horse battery staple", spellcheck: "false" });
    const iters = el("select", { class: "input" },
      el("option", { value: "1000" }, "1,000 (circa 2000 advice: far too low)"),
      el("option", { value: "100000" }, "100,000"),
      el("option", { value: "600000", selected: "selected" }, "600,000 (OWASP's PBKDF2-SHA256 figure)"));
    const go = el("button", { type: "button", class: "btn btn-primary" }, "Hash it and time it");
    const out = el("div", { class: "log" });
    const note = el("p", { class: "hint" });

    async function run() {
      if (!subtle) { out.textContent = "Web Crypto needs a secure context (https:// or http://localhost)."; return; }
      go.disabled = true; out.textContent = "";
      const enc = new TextEncoder().encode(pw.value);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      // one fast hash, repeated so the timer has something to measure
      let t0 = performance.now();
      for (let k = 0; k < 200; k++) await subtle.digest("SHA-256", enc);
      const fast = (performance.now() - t0) / 200;
      const n = +iters.value;
      const base = await subtle.importKey("raw", enc, "PBKDF2", false, ["deriveBits"]);
      t0 = performance.now();
      const bits = await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: n }, base, 256);
      const slow = performance.now() - t0;
      const h = Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
      out.append(
        el("div", { class: "flag" }, "SHA-256 once:        " + fast.toFixed(4) + " ms  →  ~" + fmt(1000 / fast) + " guesses/s on this one core"),
        el("div", { class: "ok" }, "PBKDF2 × " + n.toLocaleString("en-US") + ":  " + slow.toFixed(1) + " ms  →  ~" + fmt(1000 / slow) + " guesses/s on this one core"),
        el("div", null, "salt " + Array.from(salt, (b) => b.toString(16).padStart(2, "0")).join("") + "  digest " + h.slice(0, 32) + "…"));
      note.textContent = "The slow function costs a real user one delay at login, but multiplies the work of every offline guess by about " + fmt(slow / fast) + "×. The random salt means identical passwords get different digests, so one precomputed table can't crack them all. Attackers use GPUs that run far faster than this tab, which is why memory-hard Argon2id or scrypt (expensive in RAM, not just time) is preferred.";
      go.disabled = false;
    }
    go.addEventListener("click", () => run().catch((e) => { out.textContent = e.message; go.disabled = false; }));

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "WEB CRYPTO"), el("h3", null, "Fast hash vs. slow, salted key derivation")),
      el("div", { class: "widget-body" },
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "Password"), pw),
          el("div", { class: "field" }, el("label", null, "PBKDF2 iterations"), iters)),
        el("div", null, go),
        out, note));
  };
})();
