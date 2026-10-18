# Bulwark — Project Handoff

*Last updated: 2026-10-18. This file orients a fresh Claude session (or a new developer) so work can continue without re-reading the whole history.*

---

## What this is

**Bulwark** is an open-source, **defensive** cybersecurity learning platform. It teaches security across its whole arc — classical ciphers → the cryptography running the internet today → the post-quantum/quantum frontier — through interactive, in-browser visualizations, safe "attack-then-defend" simulations, CTF-style puzzles, quizzes, and a glossary.

It is a **fully static site**: no backend, no build step, no runtime dependencies. It deploys to GitHub Pages as-is and runs entirely client-side. This is deliberate — a security teaching tool should model good security (strict Content Security Policy, no analytics, no data leaving the browser).

> Working name "Bulwark" lives only in `index.html` `<title>`, the README, and `docs/`. Rename freely.

---

## Overall goals

1. Teach security from zero, assuming curiosity but no background — every term defined, every claim cited to a primary source.
2. **Defensive only.** Explain how attacks work so learners can defend; ship **no** working exploits, malware, or runnable weapons. Every hands-on step is confined to a bundled target (a fake in-memory DB, a sandboxed `iframe`, a math/reasoning widget). The hard lines live in `docs/ETHICS.md` and are enforced by a CI tripwire (`.github/workflows/ci.yml`).
3. Keep it **accurate** (sources carry "last verified" dates for fast-moving areas like OWASP versions and post-quantum standards) and **beautiful** (a deliberate "cryptographer's console" aesthetic — see Design, below).
4. Stay interactive: prefer a widget the learner can manipulate over a paragraph.

---

## Current state — DONE

**26 lessons across 7 eras** (the timeline spine). All render, all wired into `order`:

- **Foundations:** classical ciphers; steganography
- **Core concepts:** CIA triad; threat modeling (STRIDE)
- **Live cryptography:** hashing; public-key (Diffie–Hellman, ECC, RSA); TLS 1.3 handshake + certificate chain
- **Applied security:** injection (SQLi, command injection, XSS); OWASP Top 10 (2025); authentication/passwords; tokens & OAuth; securing AI systems (OWASP LLM Top 10); software supply chain (A03)
- **Applied (added 2026-10-18):** CSRF + SameSite and clickjacking (step-by-step walkthroughs); storing secrets (password hashing, envelope encryption/KMS/HSM, secret managers, rotation, git, client-side)
- **Applied (also):** session fixation + open redirects (walkthroughs)
- **API security (new era 05):** OWASP API Top 10 overview with gateway control board; secure code review (6 snippets); automated/AI pentesters (Shannon) used on your own staging
- **Detection (also):** port scanning and attack surface (defender's view)
- **Detection & response:** availability/DDoS (+ rate limiting); detection & response (ATT&CK, incident loop)
- **Frontier:** post-quantum cryptography; quantum key distribution (BB84); zero trust & confidential computing

**34 interactive widgets** (all in `js/widgets/`, registered on `window.BulwarkWidgets`):
cipher (+ frequency-analysis break), hash avalanche (real Web Crypto SHA-256), sqli, cmdi, xss (sandboxed iframe), cspbuilder, ddos amplification, ratelimit (token bucket), diffie-hellman, eccurve (canvas), tls stepper, tlsbytes (byte-level ClientHello), certchain, owasp accordion, entropy, pqc toggle, threatmodel canvas, attack (ATT&CK matrix), jwt (real HMAC verify), oauth/PKCE, promptinject (simulated), bb84 (QKD), quiz, heroanim, challenge (CTF), stego (LSB image), depgraph (supply chain), walkthrough (data-driven attack→defense story), apidefense (API control board), kdf (live PBKDF2 timing), envelope (real AES-GCM + AES-KW with KEK rotation), secretscan (pre-commit scanner), codereview (click the flawed line, pick the fix), exposure (port-scan outside view + firewall log).

**Platform features:** hash-router SPA; home **learning-path map** (per-era columns, visited/next state, Continue button) + timeline with progress bar + lesson search; **Challenges** page (17 scored CTF puzzles, progress saved in `localStorage`) + "keep practicing" links; searchable **Glossary** (30+ terms); **Sources** page (cited, dated); **Labs** page; animated hero; light/dark theme with system + manual toggle.

**Quality gates (both green):**
- `node --test` → **17/17** worked-example tests in `tests/crypto.test.mjs` (ciphers, SHA-256, RSA, Diffie–Hellman, EC point addition over F₁₇, entropy, TLS byte-layout, JWT tamper, BB84 QBER, RFC 7914 PBKDF2/scrypt vectors, envelope-encryption rotation).
- jsdom smoke test (`tests/smoke.cjs`) renders every route + mounts every widget with zero runtime errors.

**Docs:** `README.md`, `docs/ETHICS.md`, `docs/SECURITY.md`, `docs/LABS.md` (full attack→defend lab-track design), `docs/DEPLOY.md` (blank-Ubuntu-terminal push commands), `docs/REFERENCES.md` (credited inspirations), three README SVG diagrams.

---

## NOT done yet (the backlog, roughly prioritized)

**Still fits in the static site (easy wins, same patterns):**
- More walkthroughs: the `walkthrough` widget is pure data — add `{attack:[…], defend:[…]}` to a lesson (path traversal and XXE are natural next ones)
- Per-category API lessons (BOLA, mass assignment, SSRF) building on `apidefense`
- Certificate-transparency / HSTS lesson
- Per-lesson "last verified" badges surfaced in the UI

**Needs a real host — cannot live in a static site (milestones 3–4 of the original brief):**
- The **containerized lab runner**: the truly sandboxed, runnable vulnerable targets described in `docs/LABS.md` (SQLi/XSS/path-traversal/SSRF labs, memory-safety labs under a sanitizer, DDoS simulate-then-mitigate). Needs OS-level isolation (container/namespace/seccomp), so it requires a backend or a desktop app.
- The **downloadable desktop app** with offline lessons + the local lab runner, and signed releases. A Tauri or Electron shell wrapping this same `index.html` is the natural path; the lab runner is the hard part.

**Housekeeping:**
- Never pushed to GitHub yet (no repo attached). `docs/DEPLOY.md` has the commands. Actions are now SHA-pinned; Dependabot, CodeQL, gitleaks and a weekly lychee link check are configured and start running on first push. After pushing, also enable secret scanning + push protection in repo settings.
- The 2026-10-18 additions' sources were verified that day; the older sources still need a link-check pass (the lychee workflow will flag dead ones).

---

## Architecture — how to extend it (read this before editing)

**Content is data, not markup.** `js/content.js` is the single source of truth and exports `window.BULWARK = { eras, lessons, order, sources, glossary, challenges }`. To add a lesson you add one object to `lessons`, then add its id to the right era array in `order`. The renderer (`js/app.js`) escapes every string, then applies a tiny markup whitelist (`**bold**`, `` `code` ``, `[text](url)`), so authored content can never inject HTML.

**Lesson body is a block array.** Block types: `p`, `h`, `list`, `note` (kinds: info/defend/attack/history), `steps`, `eq` (equation), `table`, `quote`, and `widget`. A widget block is `{ t:"widget", id:"<name>", data:<optional> }`.

**Widgets are a registry.** Each file in `js/widgets/` does `window.BulwarkWidgets.<id> = function(root, data){ ... }`. `app.js` calls `fn(shell, b.data)` when it hits a widget block — so a new widget needs **no router change**, just: write the file, register it, add a `<script>` tag in `index.html`, and reference its id from a lesson. Widgets build DOM with a local `el()` helper and **always** insert user input via `textContent`, never `innerHTML` (the XSS lesson dogfoods this rule).

**Routes** live in `app.js` `route()`: `#/`, `#/lesson/<id>`, `#/labs`, `#/challenges`, `#/glossary`, `#/sources`. Add a nav link in `index.html` when you add a route.

**Styling** is one token-based `css/styles.css`. Colors are CSS custom properties defined on `:root` (light) and overridden for dark via `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`. Reuse existing tokens (`--accent`, `--teal`, `--rust`, `--ink`, `--muted`, `--panel`, etc.) rather than literal colors. No inline styles — the strict CSP forbids them (that's why `theme-init.js` is an external file).

**Design language:** "cryptographer's console" — deep slate-navy ground, brass/copper accent (NOT hacker-green), teal = verified/defended, rust = attack/danger. Display font Fraunces; body IBM Plex Sans; mono IBM Plex Mono (all via Google Fonts, the only allowed external origin).

---

## How to work in this repo (the loop)

```bash
# from the repo root
python3 -m http.server 8000          # preview at http://localhost:8000 (hash widget needs http://, not file://)
node --test                          # run the 13 worked-example tests
```

**Always, after any change:** run `node --check` on edited JS files, then `node --test`, then the smoke test. Keep tests green — if you add a widget with real math, add a worked-example test that pins its numbers.

```bash
npm install jsdom --no-save    # one-time; node_modules is gitignored
node tests/smoke.cjs           # renders every route, mounts every widget, asserts no runtime errors
```

When you add a widget, add its filename to the `files` array near the top of `tests/smoke.cjs` and a `check("#/lesson/<id>", "...")` line for its lesson, so the smoke test keeps full coverage.

**Publishing a live preview:** the whole multi-file site was also flattened into a single self-contained HTML (inlining CSS + all JS, switching the XSS widget to its `srcdoc` sandbox mode via `window.BULWARK_XSS_MODE="srcdoc"`) and published as a claude.ai Artifact for a shareable preview. The build script that does the flattening also lived in scratchpad; it's ~40 lines and trivial to recreate from this description if needed.

---

## The one standing constraint

Before adding anything: does the hands-on part work only against a target the learner started, that reaches nothing external? If an addition would ship a reusable attack, it's out of scope **by policy** (`docs/ETHICS.md`), not by oversight — build the simulated/sandboxed version instead. This is the project's whole identity.
