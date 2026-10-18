/* widgets/envelope.js — envelope encryption with real Web Crypto.
   A key-encryption key (KEK) lives inside a pretend "KMS" box and is created
   non-extractable, so page code can use it but never read it. Each record is
   encrypted with its own data-encryption key (DEK, AES-256-GCM); only the
   wrapped (encrypted) DEK is stored next to the ciphertext. Rotating the KEK
   re-wraps the small DEK without touching the bulk data. */
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
  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  const short = (h) => h.length > 48 ? h.slice(0, 48) + "…" : h;

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.envelope = function (root) {
    const subtle = window.crypto && window.crypto.subtle;
    const input = el("input", { class: "input", type: "text", value: "patient 4471: allergy = penicillin", spellcheck: "false" });
    const kmsOut = el("div", { class: "mono-out env-kms" });
    const dbOut = el("div", { class: "mono-out" });
    const log = el("div", { class: "log" });
    const enc = el("button", { type: "button", class: "btn btn-primary" }, "Encrypt & store");
    const dec = el("button", { type: "button", class: "btn btn-ghost" }, "Read it back");
    const rot = el("button", { type: "button", class: "btn btn-ghost" }, "Rotate the KEK");
    const leak = el("button", { type: "button", class: "btn btn-ghost" }, "Steal the database");

    let kekVersion = 0, kek = null, record = null;
    const say = (cls, msg) => log.append(el("div", { class: cls }, new Date().toISOString().slice(11, 19) + "  " + msg));

    async function newKek() {
      // extractable:false — the browser will refuse exportKey() on it, like an HSM.
      kek = await subtle.generateKey({ name: "AES-KW", length: 256 }, false, ["wrapKey", "unwrapKey"]);
      kekVersion++;
      kmsOut.textContent = "KEK v" + kekVersion + "  (AES-256 key-wrap, non-extractable: the page can ask the KMS to wrap/unwrap, never to reveal it)";
    }
    function paintDb() {
      if (!record) { dbOut.textContent = "(empty)"; return; }
      dbOut.textContent = "ciphertext: " + short(hex(record.ct)) + "\niv: " + hex(record.iv) + "\nwrapped DEK: " + short(hex(record.wrapped)) + "\nwrapped under: KEK v" + record.kekVersion;
    }
    async function encrypt() {
      const dek = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await subtle.encrypt({ name: "AES-GCM", iv }, dek, new TextEncoder().encode(input.value));
      const wrapped = await subtle.wrapKey("raw", dek, kek, "AES-KW");
      record = { ct, iv, wrapped, kekVersion };
      paintDb();
      say("ok", "fresh DEK generated, data sealed with AES-GCM, DEK wrapped by KEK v" + kekVersion + "; plaintext DEK discarded");
    }
    async function unwrapDek() {
      return subtle.unwrapKey("raw", record.wrapped, kek, "AES-KW", { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    }
    async function decrypt() {
      if (!record) return say("flag", "nothing stored yet");
      try {
        const dek = await unwrapDek();
        const pt = await subtle.decrypt({ name: "AES-GCM", iv: record.iv }, dek, record.ct);
        say("ok", "KMS unwrapped the DEK; decrypted: " + new TextDecoder().decode(pt));
      } catch (e) { say("flag", "decrypt failed: " + e.message); }
    }
    async function rotate() {
      if (!record) { await newKek(); return say("ok", "KEK rotated (no records to re-wrap)"); }
      const dek = await unwrapDek();
      const before = hex(record.ct);
      await newKek();
      record.wrapped = await subtle.wrapKey("raw", dek, kek, "AES-KW");
      record.kekVersion = kekVersion;
      paintDb();
      say("ok", "KEK rotated to v" + kekVersion + "; re-wrapped one 32-byte DEK; bulk ciphertext unchanged: " + (before === hex(record.ct)));
    }
    function steal() {
      if (!record) return say("flag", "nothing stored yet");
      say("flag", "a copy of the database leaks: ciphertext + wrapped DEK, but no KEK. Without a call to the KMS (which checks identity and logs every use) both are useless.");
    }

    enc.addEventListener("click", () => encrypt().catch((e) => say("flag", e.message)));
    dec.addEventListener("click", () => decrypt());
    rot.addEventListener("click", () => rotate().catch((e) => say("flag", e.message)));
    leak.addEventListener("click", steal);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "WEB CRYPTO"), el("h3", null, "Envelope encryption — a key for the data, a key for the key")),
      el("div", { class: "widget-body" },
        el("div", { class: "field" }, el("label", null, "Sensitive record"), input),
        el("div", { class: "quiz-actions" }, enc, dec, rot, leak),
        el("div", { class: "two-col" },
          el("div", null, el("p", { class: "pane-title" }, "KMS / HSM (holds the KEK)"), kmsOut),
          el("div", null, el("p", { class: "pane-title" }, "Database row (what's actually stored)"), dbOut)),
        el("div", { class: "field" }, el("label", null, "Audit log"), log)));

    if (!subtle) { kmsOut.textContent = "Web Crypto needs a secure context (https:// or http://localhost)."; dbOut.textContent = "(unavailable)"; return; }
    paintDb();
    newKek().catch((e) => say("flag", e.message));
  };
})();
