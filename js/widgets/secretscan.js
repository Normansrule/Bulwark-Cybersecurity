/* widgets/secretscan.js — a toy pre-commit secret scanner, in the spirit of
   gitleaks and GitHub push protection. It runs only on the text in the box,
   flags lines that look like credentials, and says what to do instead. All
   sample values are fake and deliberately malformed. */
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

  // Shannon entropy in bits per character — random keys score high, words score low.
  function entropy(s) {
    const f = {}; for (const c of s) f[c] = (f[c] || 0) + 1;
    let h = 0; for (const c in f) { const p = f[c] / s.length; h -= p * Math.log2(p); }
    return h;
  }

  const RULES = [
    { id: "private-key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, why: "a private key block" },
    { id: "cloud-key-id", re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/, why: "the shape of a cloud access-key ID" },
    { id: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, why: "a GitHub token prefix" },
    { id: "conn-string", re: /\b[a-z]+:\/\/[^\s:@/]+:[^\s@/]+@/i, why: "a password embedded in a connection URL" },
    { id: "assignment", re: /\b(pass(word)?|secret|token|api[_-]?key|client[_-]?secret)\b\s*[:=]\s*["']?[^\s"']{6,}/i, why: "a credential assigned a literal value" }
  ];
  const SAFE = /\$\{?[A-Z_]+\}?|process\.env\.|os\.environ|secretsmanager:|vault:|<redacted>/i;

  function scan(text) {
    const hits = [];
    text.split("\n").forEach((ln, idx) => {
      if (SAFE.test(ln) && !/PRIVATE KEY/.test(ln)) return;  // references to a secret store are the fix, not a leak
      for (const r of RULES) if (r.re.test(ln)) { hits.push({ line: idx + 1, rule: r.id, why: r.why }); return; }
      const tok = (ln.match(/[A-Za-z0-9+/_=-]{24,}/g) || []).find((t) => entropy(t) > 4.0);
      if (tok) hits.push({ line: idx + 1, rule: "high-entropy", why: "a long random-looking string (" + entropy(tok).toFixed(1) + " bits/char)" });
    });
    return hits;
  }

  const SAMPLE = [
    "# config/settings.py",
    "DEBUG = False",
    "DATABASE_URL = \"postgres://app:Hunter2Hunter2@db.internal:5432/app\"",
    "STRIPE_KEY = os.environ[\"STRIPE_KEY\"]",
    "AWS_ACCESS_KEY_ID = \"AKIAFAKEFAKEFAKE0000\"",
    "api_key: \"q7Zx9LmP2vR8tY4wK1nB6cD3fG5hJ0sA\"",
    "SESSION_SECRET = ${SESSION_SECRET}",
    "greeting = \"hello world\""
  ].join("\n");

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.secretscan = function (root) {
    const ta = el("textarea", { class: "input ss-text", rows: "9", spellcheck: "false", "aria-label": "File contents to scan" });
    ta.value = SAMPLE;
    const out = el("div", { class: "log" });
    const verdict = el("p", { class: "hint" });

    function run() {
      const hits = scan(ta.value);
      out.textContent = "";
      if (!hits.length) out.append(el("div", { class: "ok" }, "clean: no secret-shaped values found; commit allowed"));
      hits.forEach((h) => out.append(el("div", { class: "flag" }, "line " + h.line + "  [" + h.rule + "]  " + h.why)));
      verdict.textContent = hits.length
        ? "Commit blocked (" + hits.length + " finding" + (hits.length > 1 ? "s" : "") + "). Move each value into a secret manager and reference it by name, e.g. os.environ[\"NAME\"] injected at runtime. If a real secret was ever pushed, rotate it first: deleting it from history does not un-leak it."
        : "Lines that reference a secret by name (environment variable, secret-manager path) pass, because the value itself never touches git.";
    }
    ta.addEventListener("input", run);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "PRE-COMMIT"), el("h3", null, "Secret scanner — catch it before it reaches git")),
      el("div", { class: "widget-body" },
        el("div", { class: "field" }, el("label", null, "Staged file (edit it, try fixing each finding)"), ta),
        el("div", { class: "field" }, el("label", null, "Scanner output"), out),
        verdict));
    run();
  };
  window.BulwarkWidgets.secretscan._scan = scan;   // exposed for the smoke test
})();
