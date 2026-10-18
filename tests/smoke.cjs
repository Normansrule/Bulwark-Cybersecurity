// Run from the repo root after: npm install jsdom --no-save
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const html = `<!doctype html><html><head></head><body>
<header class="masthead"><a class="brand" href="#/"></a>
<nav class="nav"><a href="#/" data-route="home">Timeline</a><a href="#/labs" data-route="labs">Labs</a><a href="#/sources" data-route="sources">Sources</a></nav>
<button id="theme-toggle" class="iconbtn"></button></header>
<main id="app"></main></body></html>`;

const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.test/" });
const { window } = dom;
// shims jsdom lacks
window.matchMedia = window.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }; };
window.scrollTo = window.scrollTo || function () {};

const files = [
  "js/content.js",
  "js/widgets/cipher.js",
  "js/widgets/hash.js",
  "js/widgets/sqli.js",
  "js/widgets/xss.js",
  "js/widgets/ddos.js",
  "js/widgets/diffie-hellman.js",
  "js/widgets/eccurve.js",
  "js/widgets/entropy.js",
  "js/widgets/tls.js",
  "js/widgets/owasp.js",
  "js/widgets/pqc.js",
  "js/widgets/threatmodel.js",
  "js/widgets/attack.js",
  "js/widgets/tlsbytes.js",
  "js/widgets/cmdi.js",
  "js/widgets/quiz.js",
  "js/widgets/jwt.js",
  "js/widgets/oauth.js",
  "js/widgets/promptinject.js",
  "js/widgets/ratelimit.js",
  "js/widgets/cspbuilder.js",
  "js/widgets/bb84.js",
  "js/widgets/heroanim.js",
  "js/widgets/challenge.js",
  "js/widgets/stego.js",
  "js/widgets/certchain.js",
  "js/widgets/depgraph.js",
  "js/widgets/walkthrough.js",
  "js/widgets/apidefense.js",
  "js/widgets/kdf.js",
  "js/widgets/envelope.js",
  "js/widgets/secretscan.js",
  "js/app.js",
];

const errors = [];
window.addEventListener("error", (e) => errors.push("window.onerror: " + e.message));

for (const f of files) {
  const code = fs.readFileSync(path.join(ROOT, f), "utf8");
  try { window.eval(code); } catch (e) { errors.push(`eval ${f}: ${e.message}`); }
}

function check(hash, label) {
  window.location.hash = hash;
  window.dispatchEvent(new window.Event("hashchange"));
  const app = window.document.getElementById("app");
  const txt = app.textContent.replace(/\s+/g, " ").trim();
  const widgets = app.querySelectorAll(".widget").length;
  console.log(`${label.padEnd(22)} chars=${String(app.textContent.length).padStart(5)} widgets=${widgets} :: ${txt.slice(0, 60)}...`);
  if (app.textContent.length < 40) errors.push(`${label}: view rendered almost empty`);
}

check("#/", "home");
check("#/lesson/classical-ciphers", "lesson: ciphers");
check("#/lesson/hashing", "lesson: hashing");
check("#/lesson/injection", "lesson: injection");
check("#/lesson/availability-ddos", "lesson: ddos");
check("#/lesson/cia-triad", "lesson: cia");
check("#/lesson/public-key", "lesson: pubkey");
check("#/lesson/tls-handshake", "lesson: tls");
check("#/lesson/owasp-top10", "lesson: owasp");
check("#/lesson/passwords-auth", "lesson: auth");
check("#/lesson/frontier-pqc", "lesson: pqc");
check("#/lesson/threat-modeling", "lesson: threatmodel");
check("#/lesson/detection-response", "lesson: detection");
check("#/lesson/zero-trust", "lesson: zerotrust");
check("#/lesson/tokens-oauth", "lesson: tokens");
check("#/lesson/llm-security", "lesson: llmsec");
check("#/lesson/quantum-crypto", "lesson: qkd");
check("#/lesson/steganography", "lesson: stego");
check("#/lesson/supply-chain", "lesson: supply");
check("#/lesson/storing-secrets", "lesson: secrets");
check("#/lesson/csrf-samesite", "lesson: csrf");
check("#/lesson/clickjacking", "lesson: clickjacking");
check("#/lesson/api-security", "lesson: api");
check("#/lesson/automated-pentesting", "lesson: autopentest");
check("#/challenges", "challenges");
check("#/glossary", "glossary");
check("#/labs", "labs");
check("#/sources", "sources");

// exercise a couple of widget internals directly
try {
  const box = window.document.createElement("div");
  window.BulwarkWidgets.sqli(box);
  const payloadBtn = [...box.querySelectorAll("button")].find(b => /classic payload/i.test(b.textContent));
  payloadBtn.click();
  const rows = [...box.querySelectorAll(".log")].pop().textContent;
  console.log("sqli payload flagged:", /ALERT/.test(rows));
  if (!/ALERT/.test(rows)) errors.push("sqli detection did not flag the tautology");
} catch (e) { errors.push("sqli exercise: " + e.message); }

// every lesson in order must exist and every widget it references must be registered
for (const era of Object.keys(window.BULWARK.order)) for (const id of window.BULWARK.order[era]) {
  const l = window.BULWARK.lessons[id];
  if (!l) { errors.push("order references missing lesson " + id); continue; }
  for (const b of l.body) if (b.t === "widget" && !window.BulwarkWidgets[b.id]) errors.push(id + ": widget " + b.id + " not registered");
}

// walkthrough: steps through attack into defense
try {
  const box = window.document.createElement("div");
  const data = window.BULWARK.lessons["csrf-samesite"].body.find(b => b.id === "walkthrough").data;
  window.BulwarkWidgets.walkthrough(box, data);
  const next = [...box.querySelectorAll("button")].find(b => /Next/.test(b.textContent));
  for (let k = 0; k < data.attack.length; k++) next.click();
  const ok = box.classList.contains("wt-defending");
  console.log("walkthrough reaches defense:", ok);
  if (!ok) errors.push("walkthrough did not advance into the defense track");
} catch (e) { errors.push("walkthrough exercise: " + e.message); }

// API control board: nothing blocked with no controls; all abuse blocked, no legit traffic blocked, with all on
try {
  const ev = window.BulwarkWidgets.apidefense._evaluate;
  const none = ev({}), all = ev(Object.fromEntries(window.BulwarkWidgets.apidefense._controls.map(c => [c, true])));
  const pass = none.every(x => !x.blocked) && all.every(x => x.blocked === x.r.bad);
  console.log("api controls precise:", pass);
  if (!pass) errors.push("apidefense: controls not precise (all abuse blocked, no legit traffic blocked)");
} catch (e) { errors.push("apidefense exercise: " + e.message); }

// secret scanner: flags literals, passes references
try {
  const scan = window.BulwarkWidgets.secretscan._scan;
  const leaky = scan('DATABASE_URL = "postgres://app:Hunter2Hunter2@db.internal:5432/app"\nAWS_ACCESS_KEY_ID = "AKIAFAKEFAKEFAKE0000"\n-----BEGIN RSA PRIVATE KEY-----');
  const clean = scan('STRIPE_KEY = os.environ["STRIPE_KEY"]\nSESSION_SECRET = ${SESSION_SECRET}\ngreeting = "hello world"');
  console.log("secret scan:", leaky.length, "hits on leaky,", clean.length, "on clean");
  if (leaky.length !== 3 || clean.length !== 0) errors.push("secretscan: expected 3 hits on leaky sample and 0 on clean");
} catch (e) { errors.push("secretscan exercise: " + e.message); }

console.log("\n" + (errors.length ? "ERRORS:\n" + errors.join("\n") : "SMOKE TEST CLEAN — no runtime errors, all views rendered."));
process.exit(errors.length ? 1 : 0);
