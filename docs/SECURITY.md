# Security policy

## Reporting a vulnerability

If you find a security issue in Bulwark itself — a way the site could run untrusted code, leak data out of the browser, or a lab simulation that isn't as contained as it claims — please report it privately.

- **Preferred:** open a [GitHub private security advisory](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository (Security → Advisories → Report a vulnerability).
- Please include: what you found, how to reproduce it, and the impact you think it has.
- Please do **not** open a public issue for an unpatched vulnerability.

We aim to acknowledge a report within a few days and to agree on a disclosure timeline with the reporter. There is no bug-bounty program.

## The app's own security posture

Bulwark is a security teaching tool, so it holds itself to the practices it teaches.

- **Fully static, no backend.** Nothing the learner types leaves the browser. There is no server to attack and no data to breach.
- **Strict Content Security Policy.** `index.html` ships a CSP that allows scripts and styles only from the site's own origin (`'self'`) and fonts from Google Fonts; it sets `object-src 'none'` and `base-uri 'none'`. There are **no inline scripts** — a Cross-Site Scripting (XSS) payload has nothing to execute against.
- **Known limitation: framing.** The CSP deliberately omits `frame-ancestors`: browsers ignore that directive when the policy arrives in a `<meta>` tag (CSP Level 3 §3.3); it only works as an HTTP response header. GitHub Pages cannot set custom headers, so the static deployment does not enforce anti-framing. There is nothing to click-jack (no accounts, no state-changing actions), but if you host Bulwark behind a server or CDN, send `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` as headers. The clickjacking lesson uses this as its worked example.
- **User input is never trusted.** Every string a learner enters is inserted with `textContent`, never `innerHTML`, and the widgets never call `eval`. The XSS lesson exists precisely to show why.
- **No analytics, no third-party trackers, no cookies.** Lesson progress is stored in `localStorage` and stays on the device.
- **Sandboxed demonstrations.** The XSS demo runs learner input inside an `iframe` with a restrictive `sandbox` attribute (`allow-scripts` only, no `allow-same-origin`), so an injected script cannot reach the parent page, its storage, or its origin.

## Supply chain (OWASP A03:2025)

In place:

- **Zero runtime dependencies** (no bundler, no framework). `jsdom` is installed only in CI for the smoke test.
- **GitHub Actions pinned by full commit SHA**, each with least-privilege `permissions:` blocks and `persist-credentials: false` on checkout.
- **Dependabot** (`.github/dependabot.yml`) keeps those pins current.
- **CodeQL** (`.github/workflows/codeql.yml`) scans the JavaScript and the workflows themselves on every push, PR and weekly.
- **gitleaks** (`.github/workflows/secrets.yml`) scans full history for committed credentials on every push and PR. Also turn on GitHub secret scanning + push protection in the repo settings.
- **Link check** (`.github/workflows/links.yml`, lychee) runs weekly so cited sources don't rot silently.
- The CI **ethics tripwire** also fails the build if widget code makes any network request.

Still planned:
- Signed releases with SHA-256 checksums and a Software Bill of Materials (SBOM) once there are binaries (the desktop app, milestone 4).

## Supported versions

Until a `1.0` release, only the default branch is supported.
