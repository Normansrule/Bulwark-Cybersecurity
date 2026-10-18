/* widgets/oauth.js — the OAuth 2.0 Authorization Code flow with PKCE, stepped.
   Conceptual walkthrough of who talks to whom and why interception fails. */
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
  const STEPS = [
    { from: "App", to: "App", text: "The app generates a random code_verifier and its SHA-256 hash, the code_challenge. The verifier never leaves the app yet." },
    { from: "App", to: "Auth server", text: "The app sends the user to the authorization server with its client_id, redirect_uri, requested scope, and the code_challenge." },
    { from: "User", to: "Auth server", text: "The user authenticates and consents at the authorization server — the app never sees their password." },
    { from: "Auth server", to: "App", text: "The server redirects back to the app with a short-lived authorization code (not a token yet)." },
    { from: "App", to: "Auth server", text: "The app exchanges the code at the token endpoint, sending the original code_verifier. The server checks SHA-256(verifier) equals the earlier challenge." },
    { from: "Auth server", to: "App", text: "Match confirmed: the server returns an access token (and, for OpenID Connect, an id token that proves who the user is)." },
    { from: "App", to: "API", text: "The app calls the API with the access token. The channel is open, and no long-lived secret was ever exposed to the browser." }
  ];

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.oauth = function (root) {
    let i = 0;
    const dots = el("div", { class: "step-dots" });
    STEPS.forEach((_s, k) => dots.append(el("i", { class: k === 0 ? "on" : "" })));
    const fromL = el("div", { class: "tls-end" });
    const arrow = el("div", { class: "tls-arrow enc" }, "──▶");
    const toL = el("div", { class: "tls-end" });
    const diagram = el("div", { class: "tls-diagram" }, fromL, arrow, toL);
    const name = el("div", { class: "pane-title" });
    const body = el("p", { class: "hint" });
    const prev = el("button", { type: "button", class: "btn btn-ghost" }, "← Back");
    const next = el("button", { type: "button", class: "btn btn-primary" }, "Next →");

    function render() {
      const s = STEPS[i];
      fromL.textContent = s.from; toL.textContent = s.to;
      arrow.textContent = s.from === s.to ? "↺" : "──▶";
      name.textContent = "Step " + (i + 1) + " of " + STEPS.length;
      body.textContent = s.text;
      [...dots.children].forEach((d, k) => d.className = k <= i ? "on" : "");
      prev.disabled = i === 0; next.disabled = i === STEPS.length - 1;
    }
    prev.addEventListener("click", () => { if (i > 0) { i--; render(); } });
    next.addEventListener("click", () => { if (i < STEPS.length - 1) { i++; render(); } });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "OAUTH 2.0"), el("h3", null, "Authorization Code flow with PKCE")),
      el("div", { class: "widget-body" },
        diagram, dots, el("div", null, name), body,
        el("div", { class: "lesson-nav stepnav" }, prev, next),
        el("p", { class: "hint" }, "PKCE (Proof Key for Code Exchange) is why intercepting the authorization code isn't enough: without the original code_verifier, a stolen code can't be exchanged for a token.")));
    render();
  };
})();
