# Tests

Worked-example verification for the lessons. Every number a lesson claims — a
cipher vector, a hash digest, the RSA round-trip, the avalanche band — is
checked here so the curriculum can't drift from the math.

No dependencies; uses the Node.js built-in test runner.

```bash
# from the repo root
node --test
```

`crypto.test.mjs` covers:

- **Caesar cipher** — a known vector (`ABC` → `DEF`) and an encrypt/decrypt round-trip.
- **Frequency analysis** — the χ² break recovers an unknown shift from English text.
- **SHA-256** — the FIPS 180-4 known-answer vectors for `""` and `"abc"`.
- **Avalanche effect** — a one-character change flips a large fraction of the 256 digest bits.
- **Birthday bound** — the `2^(n/2)` collision-work relation.
- **PBKDF2 / scrypt** — RFC 7914 known-answer vectors, plus salting.
- **Envelope encryption** — wrap, rotate the KEK, ciphertext unchanged, old KEK can't unwrap.
- **RSA** — the classic `p=61, q=53` textbook round-trip (`65` → `2790` → `65`).

The reference implementations here mirror the logic in `js/widgets/`; if a widget
and a test disagree, one of them is wrong.

## Smoke test

`smoke.cjs` loads every widget plus `content.js` and `app.js` into a jsdom DOM,
visits every route, and asserts each view renders and the expected widgets mount
with no runtime errors. Run it after any change:

```bash
npm install jsdom --no-save    # one-time; node_modules is gitignored
node tests/smoke.cjs
```

When you add a widget, add its filename to the `files` array and a `check(...)`
line for its lesson so coverage stays complete.
