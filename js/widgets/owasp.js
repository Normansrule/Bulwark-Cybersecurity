/* widgets/owasp.js — the OWASP Top 10:2025 as an accordion.
   Verified against top10.owasp.org/2025 (see the Sources page). Each item pairs
   the risk with the one habit that most reduces it. */
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
  const ITEMS = [
    { id: "A01", t: "Broken Access Control", d: "Users act outside their intended permissions — reading others' records, editing what should be read-only, reaching admin routes. Still the most common serious flaw.", fix: "Deny by default; enforce authorization on the server for every request, never in the UI alone.", tag: "" },
    { id: "A02", t: "Security Misconfiguration", d: "Default accounts, verbose errors, open cloud buckets, missing hardening. Rose to #2 as stacks grew more complex.", fix: "Harden by default, review configuration as code, and turn off what you don't use.", tag: "↑ up" },
    { id: "A03", t: "Software Supply Chain Failures", d: "Compromised or vulnerable dependencies, build systems, and packages — the risk this repo pins lockfiles and signs releases to address.", fix: "Pin dependencies, generate a Software Bill of Materials, verify signatures, and scan continuously.", tag: "new" },
    { id: "A04", t: "Cryptographic Failures", d: "Weak or missing encryption, bad key handling, secrets in the clear — exposing data in transit or at rest.", fix: "Use vetted libraries and current algorithms; encrypt in transit and at rest; manage keys deliberately.", tag: "" },
    { id: "A05", t: "Injection", d: "Untrusted input interpreted as code or structure — SQL injection, Cross-Site Scripting, command injection. The subject of this site's injection lesson.", fix: "Parameterize queries; encode output for its context; never build code from input.", tag: "" },
    { id: "A06", t: "Insecure Design", d: "Flaws baked in before a line is written — missing threat modeling, no rate limits, trust placed where it shouldn't be.", fix: "Threat-model early; design controls in, not on; use secure patterns from the start.", tag: "" },
    { id: "A07", t: "Authentication Failures", d: "Weak login, credential stuffing, poor session handling — letting attackers become someone else.", fix: "Support multi-factor and passkeys; rate-limit; use slow salted password hashing; manage sessions safely.", tag: "" },
    { id: "A08", t: "Software or Data Integrity Failures", d: "Trusting code or data that could be tampered with — unverified updates, insecure deserialization, untrusted CI/CD steps.", fix: "Verify integrity with signatures and checksums; trust only vetted sources and pipelines.", tag: "" },
    { id: "A09", t: "Security Logging and Alerting Failures", d: "Attacks that go unseen because nothing is logged, or nothing watches the logs. The reason for the detection track.", fix: "Log security events, alert on the signatures that matter, and rehearse the response.", tag: "" },
    { id: "A10", t: "Mishandling of Exceptional Conditions", d: "Errors and edge cases handled poorly — leaking detail, failing open, or crashing in ways an attacker can exploit.", fix: "Fail closed, handle errors deliberately, and never expose internals in messages.", tag: "new" }
  ];

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.owasp = function (root) {
    const acc = el("div", { class: "acc" });
    ITEMS.forEach((it, k) => {
      const body = el("div", { class: "acc-body", hidden: k !== 0 ? "" : null });
      body.append(el("p", null, it.d));
      const fix = el("p", { class: "acc-fix" }); fix.append(el("b", null, "Defense: "), it.fix); body.append(fix);
      const head = el("button", { type: "button", class: "acc-head", "aria-expanded": String(k === 0) });
      head.append(el("span", { class: "acc-id" }, it.id), el("span", { class: "acc-t" }, it.t), it.tag ? el("span", { class: "chip" }, it.tag) : null, el("span", { class: "acc-caret" }, "+"));
      head.addEventListener("click", () => {
        const open = body.hidden;
        body.hidden = !open;
        head.setAttribute("aria-expanded", String(open));
        head.querySelector(".acc-caret").textContent = open ? "−" : "+";
      });
      if (k === 0) head.querySelector(".acc-caret").textContent = "−";
      acc.append(el("div", { class: "acc-item" }, head, body));
    });
    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "OWASP 2025"), el("h3", null, "The Top 10 web risks — tap to expand")),
      el("div", { class: "widget-body" }, acc));
  };
})();
