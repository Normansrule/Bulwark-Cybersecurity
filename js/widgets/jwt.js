/* widgets/jwt.js — inspect and verify a JSON Web Token with real HMAC-SHA256.
   Signs a default token with a demo secret via Web Crypto, then lets you tamper
   the payload and watch verification fail until it's re-signed. Everything stays
   in the browser. */
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
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64uBytes = (bytes) => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const b64uStr = (str) => b64uBytes(enc.encode(str));
  function b64uToStr(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; try { return dec.decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))); } catch (e) { return "(invalid)"; } }
  async function sign(data, secret) {
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    return b64uBytes(new Uint8Array(sig));
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.jwt = function (root) {
    const head = el("div", { class: "widget-head" }, el("span", { class: "tag" }, "JWT"), el("h3", null, "JSON Web Token — inspect and verify"));
    if (!(typeof crypto !== "undefined" && crypto.subtle)) {
      root.append(head, el("div", { class: "widget-body" }, el("div", { class: "note note-info" }, el("div", { class: "ico" }, "i"),
        el("p", null, "This needs the Web Crypto API. Open over ", el("code", null, "http://localhost"), " or the deployed HTTPS site."))));
      return;
    }
    const HEADER = { alg: "HS256", typ: "JWT" };
    const secret = el("input", { class: "input", type: "text", value: "bulwark-demo-secret", spellcheck: "false" });
    const payload = el("textarea", { class: "input", rows: "4", spellcheck: "false" });
    payload.value = JSON.stringify({ sub: "alice", role: "user", iat: 1893456000 }, null, 2);
    let currentSig = "";

    const tokenOut = el("div", { class: "mono-out jwt-token" });
    const badge = el("span", { class: "state" });
    const hOut = el("div", { class: "mono-out" });
    const status = el("p", { class: "hint" });

    const signBtn = el("button", { type: "button", class: "btn btn-primary" }, "Sign with secret");
    const tamperBtn = el("button", { type: "button", class: "btn btn-ghost" }, "Tamper: role → admin");

    const hSeg = b64uStr(JSON.stringify(HEADER));
    function parts() { return hSeg + "." + b64uStr(payload.value); }

    async function update() {
      const p = parts();
      const expected = await sign(p, secret.value);
      const valid = expected === currentSig && currentSig !== "";
      tokenOut.textContent = "";
      tokenOut.append(el("span", { class: "jwt-h" }, hSeg), ".", el("span", { class: "jwt-p" }, b64uStr(payload.value)), ".", el("span", { class: "jwt-s" }, currentSig || "(unsigned)"));
      badge.className = "state " + (valid ? "safe" : "vuln");
      badge.textContent = valid ? "signature valid" : "signature INVALID";
      hOut.textContent = "header: " + b64uToStr(hSeg);
      status.textContent = valid
        ? "The signature matches HMAC-SHA256 over header.payload with this secret. Any change to the payload breaks it — that's the integrity guarantee."
        : "The payload no longer matches the signature. A server that verifies properly rejects this token. Click “Sign with secret” to forge a new valid one — which is exactly why the secret must stay secret.";
    }
    async function resign() { currentSig = await sign(parts(), secret.value); update(); }

    payload.addEventListener("input", update);
    secret.addEventListener("input", update);
    signBtn.addEventListener("click", resign);
    tamperBtn.addEventListener("click", () => {
      try { const o = JSON.parse(payload.value); o.role = "admin"; payload.value = JSON.stringify(o, null, 2); } catch (e) {}
      update();
    });

    root.append(head, el("div", { class: "widget-body" },
      el("div", { class: "field" }, el("label", null, "Token"), tokenOut, badge),
      el("div", { class: "two-col" },
        el("div", null, el("div", { class: "field" }, el("label", null, "Payload (edit me)"), payload)),
        el("div", null, el("div", { class: "field" }, el("label", null, "Secret (HMAC key)"), secret), hOut)),
      el("div", { class: "quiz-actions" }, signBtn, tamperBtn),
      status,
      el("div", { class: "note note-defend" }, el("div", { class: "ico" }, "✓"),
        el("p", null, "Real-world rules: verify the signature server-side, reject ", el("code", null, "alg: none"), ", pin the expected algorithm (don't trust the token's own ", el("code", null, "alg"), "), and prefer asymmetric signing (RS256/EdDSA) so verifiers never hold a signing secret."))));
    resign();
  };
})();
