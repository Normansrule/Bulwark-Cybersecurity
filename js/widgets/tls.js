/* widgets/tls.js — a message-by-message walk through the TLS 1.3 handshake.
   Conceptual (what each message establishes), not yet byte-level; the byte
   walkthrough modeled on illustrated-tls13 is a deeper follow-up. */
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
    { from: "c", name: "ClientHello", enc: false, text: "The client offers its TLS version and cipher suites, and — the 1.3 speed trick — already includes a key share: an ephemeral Diffie–Hellman public value. It commits to the key exchange in the very first message." },
    { from: "s", name: "ServerHello", enc: false, text: "The server picks a cipher suite and sends its own key share. Both sides now combine the two shares into a shared handshake secret. From this point on, every handshake message is encrypted." },
    { from: "s", name: "EncryptedExtensions · Certificate · CertificateVerify", enc: true, text: "Now encrypted: the server sends its certificate and a signature over the whole handshake transcript, proving it holds the private key for that certificate. This is what stops an impostor from impersonating the site." },
    { from: "s", name: "Finished (server)", enc: true, text: "A Message Authentication Code over everything sent so far. If any earlier byte had been tampered with, this check fails — integrity for the handshake itself." },
    { from: "c", name: "Finished (client)", enc: true, text: "The client sends its own Finished. Both ends have now confirmed they derived the same keys and saw the same messages. The handshake is complete in a single round trip." },
    { from: "b", name: "Application Data", enc: true, text: "The encrypted channel is open. Your actual request and the server's response flow with confidentiality and integrity, under keys no eavesdropper can derive." }
  ];

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.tls = function (root) {
    let i = 0;
    const dots = el("div", { class: "step-dots" });
    STEPS.forEach((_s, k) => dots.append(el("i", { class: k === 0 ? "on" : "" })));
    const diagram = el("div", { class: "tls-diagram" });
    const cLab = el("div", { class: "tls-end" }, "Client");
    const arrow = el("div", { class: "tls-arrow" });
    const sLab = el("div", { class: "tls-end" }, "Server");
    diagram.append(cLab, arrow, sLab);
    const name = el("div", { class: "pane-title" });
    const body = el("p", { class: "hint" });
    const enc = el("span", { class: "state" });
    const prev = el("button", { type: "button", class: "btn btn-ghost" }, "← Back");
    const next = el("button", { type: "button", class: "btn btn-primary" }, "Next →");

    function render() {
      const s = STEPS[i];
      name.textContent = (i + 1) + ". " + s.name;
      body.textContent = s.text;
      enc.className = "state " + (s.enc ? "safe" : "vuln");
      enc.textContent = s.enc ? "encrypted" : "in the clear";
      arrow.textContent = s.from === "c" ? "──▶" : s.from === "s" ? "◀──" : "◀─▶";
      arrow.className = "tls-arrow " + (s.enc ? "enc" : "plain");
      [...dots.children].forEach((d, k) => d.className = k <= i ? "on" : "");
      prev.disabled = i === 0; next.disabled = i === STEPS.length - 1;
    }
    prev.addEventListener("click", () => { if (i > 0) { i--; render(); } });
    next.addEventListener("click", () => { if (i < STEPS.length - 1) { i++; render(); } });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "HANDSHAKE"), el("h3", null, "TLS 1.3 — a one-round-trip handshake")),
      el("div", { class: "widget-body" },
        diagram, dots,
        el("div", null, name, " ", enc), body,
        el("div", { class: "lesson-nav stepnav" }, prev, next)));
    render();
  };
})();
