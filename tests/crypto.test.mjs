// crypto.test.mjs — verifies the worked examples that appear in the lessons.
// Run with:  node --test tests/
//
// These reference implementations mirror the math shown in the widgets and
// equation blocks. If a number in a lesson changes, a test here should fail.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";

/* ---- reference cipher + frequency-analysis break (mirrors widgets/cipher.js) ---- */
const A = 65;
const ENG = [8.17,1.49,2.78,4.25,12.70,2.23,2.02,6.09,6.97,0.15,0.77,4.03,2.41,6.75,7.51,1.93,0.10,5.99,6.33,9.06,2.76,0.98,2.36,0.15,1.97,0.07];

function caesar(text, shift) {
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? A : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
  });
}
function chi2(text) {
  const c = new Array(26).fill(0); let total = 0;
  for (const ch of text.toUpperCase()) { const i = ch.charCodeAt(0) - A; if (i >= 0 && i < 26) { c[i]++; total++; } }
  if (!total) return Infinity;
  let s = 0;
  for (let i = 0; i < 26; i++) { const e = ENG[i] / 100 * total; s += (c[i] - e) ** 2 / (e || 1); }
  return s;
}
function breakCaesar(cipher) {
  let best = 0, score = Infinity;
  for (let sft = 0; sft < 26; sft++) { const sc = chi2(caesar(cipher, -sft)); if (sc < score) { score = sc; best = sft; } }
  return best;
}

test("Caesar: known vector and round-trip", () => {
  assert.equal(caesar("ABC", 3), "DEF");
  assert.equal(caesar("xyz", 3), "abc");
  const msg = "Attack at dawn, retreat by noon.";
  assert.equal(caesar(caesar(msg, 7), -7), msg);
});

test("Frequency analysis recovers an unknown Caesar shift", () => {
  const plain =
    "the quick brown fox jumps over the lazy dog while the examiner studies " +
    "letter frequencies to determine which shift best matches ordinary english text";
  for (const shift of [1, 4, 11, 19, 25]) {
    assert.equal(breakCaesar(caesar(plain, shift)), shift, `failed to recover shift ${shift}`);
  }
});

/* ---- SHA-256 known vectors (the hash widget calls the same algorithm) ---- */
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

test("SHA-256 matches FIPS 180-4 known-answer vectors", () => {
  assert.equal(sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("Avalanche: a one-character change flips close to half the digest bits", () => {
  const bitsOf = (hex) => hex.match(/../g).flatMap((h) => {
    const n = parseInt(h, 16); return [7,6,5,4,3,2,1,0].map((i) => (n >> i) & 1);
  });
  const a = bitsOf(sha256("bulwark"));
  const b = bitsOf(sha256("Bulwark"));
  let diff = 0;
  for (let i = 0; i < 256; i++) if (a[i] !== b[i]) diff++;
  // Independent bits would differ ~50%; assert a wide but real avalanche band.
  assert.ok(diff > 90 && diff < 166, `expected a strong avalanche, got ${diff}/256 bits`);
});

/* ---- birthday bound (hash lesson equation) ---- */
test("Birthday bound: collision work is about 2^(n/2)", () => {
  assert.equal(2 ** (256 / 2), 2 ** 128); // SHA-256
  assert.equal(2 ** (128 / 2), 2 ** 64);  // MD5-sized
});

/* ---- textbook RSA worked example (public-key lesson, milestone 2) ---- */
function modpow(base, exp, mod) {
  base %= mod; let r = 1n;
  while (exp > 0n) { if (exp & 1n) r = (r * base) % mod; base = (base * base) % mod; exp >>= 1n; }
  return r;
}
test("RSA round-trip on the classic p=61, q=53 example", () => {
  const p = 61n, q = 53n, n = p * q;          // 3233
  const phi = (p - 1n) * (q - 1n);            // 3120
  const e = 17n, d = 2753n;                    // e*d ≡ 1 (mod phi)
  assert.equal((e * d) % phi, 1n);
  const m = 65n;
  const c = modpow(m, e, n);                   // encrypt
  assert.equal(c, 2790n);
  assert.equal(modpow(c, d, n), m);            // decrypt back to 65
});

/* ---- Diffie–Hellman (public-key lesson, dh widget) ---- */
test("Diffie–Hellman: both parties derive the same shared secret", () => {
  const p = 23n, g = 5n, a = 6n, b = 15n;
  const A = modpow(g, a, p), B = modpow(g, b, p);
  const sharedA = modpow(B, a, p);
  const sharedB = modpow(A, b, p);
  assert.equal(sharedA, sharedB);
  assert.equal(sharedA, modpow(g, a * b, p)); // both equal g^(ab) mod p
});

/* ---- Elliptic-curve point addition over F_p (public-key lesson, ec widget) ---- */
function inv(a, p) { return modpow(((a % p) + p) % p, p - 2n, p); } // p prime
function ecAdd(P, Q, a, p) {
  if (P === null) return Q;
  if (Q === null) return P;
  if (P.x === Q.x && (P.y + Q.y) % p === 0n) return null; // P + (−P) = O
  let m;
  if (P.x === Q.x && P.y === Q.y) m = ((3n * P.x * P.x + a) * inv(2n * P.y, p)) % p;
  else m = ((Q.y - P.y + p) % p * inv(((Q.x - P.x) % p + p) % p, p)) % p;
  const x = ((m * m - P.x - Q.x) % p + p) % p;
  const y = ((m * (P.x - x) - P.y) % p + p) % p;
  return { x, y };
}
const onCurve = (P, a, b, p) => P === null || (P.y * P.y % p) === (((P.x ** 3n + a * P.x + b) % p) + p) % p;

test("EC point addition over F_17 stays on the curve and is commutative", () => {
  const a = 2n, b = 2n, p = 17n;            // y^2 = x^3 + 2x + 2 over F_17
  const G = { x: 5n, y: 1n };
  assert.ok(onCurve(G, a, b, p));
  const two = ecAdd(G, G, a, p);            // 2G
  assert.deepEqual(two, { x: 6n, y: 3n });  // known value for this standard curve
  const three = ecAdd(two, G, a, p);        // 3G
  assert.deepEqual(three, { x: 10n, y: 6n });
  assert.ok(onCurve(two, a, b, p) && onCurve(three, a, b, p));
  assert.deepEqual(ecAdd(G, two, a, p), ecAdd(two, G, a, p)); // commutative
});

/* ---- password entropy (passwords-auth lesson, entropy widget) ---- */
test("Entropy formula H = L·log2(N)", () => {
  const H = (L, N) => L * Math.log2(N);
  assert.ok(Math.abs(H(12, 95) - 78.83) < 0.1);   // 12 random printable-ASCII chars
  assert.ok(H(20, 26) > H(10, 95));                // length beats complexity
});

/* ---- TLS ClientHello byte layout (tls-handshake lesson, tlsbytes widget) ---- */
test("Assembled ClientHello length fields are internally consistent", () => {
  const legacyVer = 2, random = 32, sid = 1 + 32, cs = 2 + 6, comp = 2;
  const extSV = 7;                        // supported_versions -> TLS 1.3
  const ksEntry = 2 + 2 + 32;            // group + keylen + x25519 key
  const ksList = 2 + ksEntry;
  const extKS = 2 + 2 + ksList;
  const exts = extSV + extKS;
  const extBlock = 2 + exts;             // 2-byte extensions length + extensions
  const body = legacyVer + random + sid + cs + comp + extBlock;
  const record = 4 + body;              // handshake header (type + 3-byte len) + body
  assert.equal(exts, 49);
  assert.equal(body, 128);
  assert.equal(record, 132);
});

/* ---- JWT: base64url + HMAC-SHA256 (tokens-oauth lesson, jwt widget) ---- */
test("JWT signature detects payload tampering and payload decodes back", () => {
  const b64u = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sign = (data, key) => b64u(createHmac("sha256", key).update(data).digest());
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const good = b64u(JSON.stringify({ sub: "alice", role: "user" }));
  const evil = b64u(JSON.stringify({ sub: "alice", role: "admin" }));
  const key = "bulwark-demo-secret";
  const sigGood = sign(header + "." + good, key);
  // tampering the payload without re-signing yields a signature mismatch
  assert.notEqual(sign(header + "." + evil, key), sigGood);
  // the payload is readable (base64url decodes back to the JSON)
  const decoded = JSON.parse(Buffer.from(good.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
  assert.equal(decoded.sub, "alice");
});

/* ---- BB84 quantum key distribution (quantum-crypto lesson, bb84 widget) ---- */
function bb84(n, eve) {
  const rnd = () => Math.random() < 0.5 ? 0 : 1;
  let sift = 0, errors = 0;
  for (let i = 0; i < n; i++) {
    const aBit = rnd(), aBasis = rnd();
    let inBasis = aBasis, inBit = aBit;
    if (eve) { const eB = rnd(); inBit = (eB === aBasis) ? aBit : rnd(); inBasis = eB; }
    const bBasis = rnd();
    const bBit = (bBasis === inBasis) ? inBit : rnd();
    if (aBasis === bBasis) { sift++; if (aBit !== bBit) errors++; }
  }
  return { sift, errors, qber: sift ? errors / sift : 0 };
}
test("BB84: no eavesdropper means matched bases never disagree", () => {
  const r = bb84(3000, false);
  assert.ok(r.sift > 1000);
  assert.equal(r.errors, 0);
});
test("BB84: an eavesdropper pushes QBER toward 25%", () => {
  const r = bb84(4000, true);
  assert.ok(r.qber > 0.15 && r.qber < 0.35, `expected ~0.25, got ${r.qber.toFixed(3)}`);
});

/* ---- password KDFs: RFC 7914 known-answer vectors (storing-secrets lesson) ---- */
import { pbkdf2Sync, scryptSync, webcrypto } from "node:crypto";

test("PBKDF2-HMAC-SHA256 matches RFC 7914 §11 vector", () => {
  assert.equal(pbkdf2Sync("passwd", "salt", 1, 64, "sha256").toString("hex"),
    "55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783");
});

test("scrypt matches RFC 7914 §12 vector (N=1024, r=8, p=16)", () => {
  assert.equal(scryptSync("password", "NaCl", 64, { N: 1024, r: 8, p: 16 }).toString("hex"),
    "fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640");
});

test("Salt: the same password with different salts gives different hashes", () => {
  const a = pbkdf2Sync("hunter2", "salt-A", 1000, 32, "sha256").toString("hex");
  const b = pbkdf2Sync("hunter2", "salt-B", 1000, 32, "sha256").toString("hex");
  assert.notEqual(a, b);
});

/* ---- envelope encryption: mirrors widgets/envelope.js with the same Web Crypto calls ---- */
test("Envelope encryption: wrap, rotate KEK, ciphertext unchanged, still decrypts", async () => {
  const subtle = webcrypto.subtle;
  const kek1 = await subtle.generateKey({ name: "AES-KW", length: 256 }, false, ["wrapKey", "unwrapKey"]);
  await assert.rejects(subtle.exportKey("raw", kek1));             // non-extractable, like an HSM
  const dek = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const msg = "patient 4471: allergy = penicillin";
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, dek, new TextEncoder().encode(msg));
  const wrapped1 = await subtle.wrapKey("raw", dek, kek1, "AES-KW");
  assert.equal(wrapped1.byteLength, 40);                             // 32-byte key + 8-byte RFC 3394 integrity block

  const kek2 = await subtle.generateKey({ name: "AES-KW", length: 256 }, false, ["wrapKey", "unwrapKey"]);
  const dekBack = await subtle.unwrapKey("raw", wrapped1, kek1, "AES-KW", { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const wrapped2 = await subtle.wrapKey("raw", dekBack, kek2, "AES-KW");

  const dek2 = await subtle.unwrapKey("raw", wrapped2, kek2, "AES-KW", { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv }, dek2, ct);
  assert.equal(new TextDecoder().decode(pt), msg);
  // the old KEK can't open the new wrap
  await assert.rejects(subtle.unwrapKey("raw", wrapped2, kek1, "AES-KW", { name: "AES-GCM", length: 256 }, true, ["decrypt"]));
});
