# Contributing to Bulwark

Thanks for helping people learn to defend systems. Read [`docs/ETHICS.md`](docs/ETHICS.md) first: the one rule that decides every contribution is that **hands-on parts run only against a target built into the page that reaches nothing external.** Runnable offensive tooling is out of scope by policy.

## How the code is laid out

See [`HANDOFF.md`](HANDOFF.md) for the architecture. In short: lessons are data in `js/content.js`; widgets are files in `js/widgets/` that register on `window.BulwarkWidgets`; there is no build step and no runtime dependency.

## Before you open a pull request

```bash
for f in js/*.js js/widgets/*.js; do node --check "$f"; done
node --test
npm install --no-save jsdom && node tests/smoke.cjs
```

- New widget: add its `<script>` to `index.html`, its file to `tests/smoke.cjs`, and a `check()` line for its lesson.
- Real math in a widget: add a worked-example test in `tests/crypto.test.mjs`.
- New factual claim: cite a primary source in `sources` with a `verified` date.
- No inline scripts or styles (the CSP forbids them); insert user input with `textContent`, never `innerHTML`; widgets never make network requests (CI enforces this).

## Reporting a vulnerability

Privately, via [`docs/SECURITY.md`](docs/SECURITY.md).
