// docs/readme/generate.mjs — regenerates the animated SVGs embedded in README.md.
// Counts are read from js/content.js, the widget folder and the test file, so the
// README can't drift from the site. Run from the repo root after adding content:
//     node docs/readme/generate.mjs
// GitHub renders these as <img>, which strips scripts but keeps CSS and SMIL
// animation. Every animation respects prefers-reduced-motion.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "docs/readme");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/content.js"), "utf8"), ctx);
const B = ctx.window.BULWARK;

const lessons = Object.values(B.order).flat().length;
const eras = B.eras.length;
const widgets = fs.readdirSync(path.join(ROOT, "js/widgets")).filter((f) => f.endsWith(".js")).length;
const challenges = B.challenges.length;
const sources = B.sources.length;
const tests = (fs.readFileSync(path.join(ROOT, "tests/crypto.test.mjs"), "utf8").match(/^test\(/gm) || []).length;

const C = { bg: "#0f1b2d", panel: "#16273f", line: "#26374f", ink: "#e8e4da", muted: "#9aa7b8", brass: "#d59a45", teal: "#46b3a2", rust: "#d97059" };
const SANS = "font-family:'IBM Plex Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "font-family:Fraunces,Georgia,'Times New Roman',serif";
const MONO = "font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const RM = "@media (prefers-reduced-motion: reduce){*{animation:none!important}}";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const write = (name, svg) => { fs.writeFileSync(path.join(OUT, name), svg.trim() + "\n"); console.log("wrote docs/readme/" + name); };

/* ---------- hero: ciphertext resolves into the name, shield draws itself ---------- */
{
  const W = 1200, H = 300;
  const cipher = "Ebozdun", plain = "Bulwark";   // Caesar shift 3, the first lesson
  const letters = `<text x="330" y="168" class="ct">${cipher}</text><text x="330" y="168" class="pt">${plain}</text>`;
  write("hero.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Bulwark: defensive security, from zero">
<style>
  .ct{${SERIF};font-size:104px;fill:${C.rust};letter-spacing:4px;animation:out .7s ease forwards 1.1s}
  .pt{${SERIF};font-size:104px;fill:${C.ink};letter-spacing:4px;opacity:0;animation:in .7s ease forwards 1.3s}
  @keyframes out{0%{opacity:1}30%{opacity:.6}45%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}
  @keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .shield{fill:none;stroke:${C.brass};stroke-width:5;stroke-linejoin:round;stroke-dasharray:640;stroke-dashoffset:640;animation:draw 1.6s ease forwards .2s}
  .check{fill:none;stroke:${C.teal};stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:120;stroke-dashoffset:120;animation:draw .6s ease forwards 1.6s}
  @keyframes draw{to{stroke-dashoffset:0}}
  .tag{${MONO};font-size:17px;fill:${C.muted};opacity:0;animation:in .8s ease forwards 1.8s}
  .key{${MONO};font-size:15px;fill:${C.brass};opacity:0;animation:in .8s ease forwards 2.2s}
  .scan{fill:url(#sg);animation:sweep 5s linear infinite 2s;opacity:0}
  @keyframes sweep{0%{opacity:0;transform:translateX(-200px)}10%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translateX(1300px)}}
  .grid line{stroke:${C.line};stroke-width:1}
  ${RM}
  @media (prefers-reduced-motion: reduce){.ct{opacity:0}.pt,.tag,.key{opacity:1}.shield,.check{stroke-dashoffset:0}}
</style>
<defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="${C.teal}" stop-opacity="0"/><stop offset=".5" stop-color="${C.teal}" stop-opacity=".18"/><stop offset="1" stop-color="${C.teal}" stop-opacity="0"/></linearGradient></defs>
<rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
<g class="grid">${Array.from({ length: 23 }, (_, i) => `<line x1="${i * 55}" y1="0" x2="${i * 55}" y2="${H}"/>`).join("")}</g>
<rect class="scan" x="0" y="0" width="160" height="${H}"/>
<g transform="translate(150 70)">
  <path class="shield" d="M70 0 L140 26 V86 C140 132 108 160 70 176 C32 160 0 132 0 86 V26 Z"/>
  <path class="check" d="M38 88 L62 112 L104 64"/>
</g>
${letters}
<text x="333" y="222" class="tag">defensive security, from zero · ciphers → today's internet → post-quantum</text>
<text x="333" y="258" class="key">"Ebozdun" is "Bulwark" under a shift-3 Caesar cipher: the first thing you break in lesson one</text>
</svg>`);
}

/* ---------- progress: stat tiles with bars that fill ---------- */
{
  const stats = [
    ["Lessons", lessons, 40, C.brass], ["Eras", eras, 7, C.brass], ["Interactive widgets", widgets, 40, C.teal],
    ["CTF challenges", challenges, 30, C.teal], ["Worked-example tests", tests, tests, C.teal], ["Cited sources", sources, 100, C.brass]
  ];
  const W = 1200, H = 250, tw = 180, gap = 18, x0 = (W - (stats.length * tw + (stats.length - 1) * gap)) / 2;
  const tiles = stats.map(([label, n, goal, col], i) => {
    const x = x0 + i * (tw + gap), pct = Math.min(1, n / goal);
    return `<g transform="translate(${x} 58)">
      <rect width="${tw}" height="150" rx="14" fill="${C.panel}" stroke="${C.line}"/>
      <text x="18" y="62" class="num" style="fill:${col};animation-delay:${(i * 0.12).toFixed(2)}s">${n}</text>
      <text x="18" y="92" class="lab">${esc(label)}</text>
      <rect x="18" y="116" width="${tw - 36}" height="8" rx="4" fill="${C.line}"/>
      <rect x="18" y="116" width="${((tw - 36) * pct).toFixed(1)}" height="8" rx="4" fill="${col}" class="bar" style="animation-delay:${(0.3 + i * 0.12).toFixed(2)}s"/>
      <text x="${tw - 18}" y="140" class="goal">${pct >= 1 ? "✓ done" : "next goal " + goal}</text></g>`;
  }).join("");
  write("progress.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Progress: ${lessons} lessons, ${eras} eras, ${widgets} widgets, ${challenges} challenges, ${tests} tests, ${sources} sources">
<style>
  .h{${SANS};font-size:15px;font-weight:600;fill:${C.muted};letter-spacing:.12em}
  .num{${SERIF};font-size:48px;opacity:0;animation:pop .6s ease forwards}
  .lab{${SANS};font-size:15px;fill:${C.ink}}
  .goal{${MONO};font-size:11px;fill:${C.muted};text-anchor:end}
  .bar{transform-box:fill-box;transform-origin:left;transform:scaleX(0);animation:grow 1.2s cubic-bezier(.2,.8,.2,1) forwards}
  @keyframes grow{to{transform:scaleX(1)}}
  @keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .live{fill:${C.teal};animation:blink 1.6s ease-in-out infinite}
  @keyframes blink{50%{opacity:.25}}
  ${RM}
  @media (prefers-reduced-motion: reduce){.num{opacity:1}.bar{transform:none}}
</style>
<rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
<circle cx="${x0 + 6}" cy="32" r="6" class="live"/>
<text x="${x0 + 20}" y="37" class="h">WHAT'S BUILT · ALL GREEN · 0 RUNTIME DEPENDENCIES</text>
${tiles}
</svg>`);
}

/* ---------- eras: the seven-era timeline lighting up in order ---------- */
{
  const W = 1200, H = 230, n = B.eras.length, step = (W - 160) / (n - 1);
  const nodes = B.eras.map((e, i) => {
    const x = 80 + i * step, cnt = (B.order[e.id] || []).length, d = (0.25 * i).toFixed(2);
    return `<g style="animation-delay:${d}s" class="node">
      <circle cx="${x}" cy="96" r="22" fill="${C.panel}" stroke="${C.brass}" stroke-width="3"/>
      <text x="${x}" y="102" class="n">${e.num}</text>
      <text x="${x}" y="148" class="t">${esc(e.title)}</text>
      <text x="${x}" y="170" class="c">${cnt} lesson${cnt === 1 ? "" : "s"}</text>
      <text x="${x}" y="190" class="p">${esc(e.period)}</text></g>`;
  }).join("");
  write("eras.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="The ${n}-era curriculum timeline">
<style>
  .h{${SANS};font-size:15px;font-weight:600;fill:${C.muted};letter-spacing:.12em}
  .node{opacity:0;animation:rise .6s ease forwards}
  @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .n{${MONO};font-size:15px;fill:${C.brass};text-anchor:middle}
  .t{${SANS};font-size:15px;font-weight:600;fill:${C.ink};text-anchor:middle}
  .c{${MONO};font-size:12px;fill:${C.teal};text-anchor:middle}
  .p{${MONO};font-size:11px;fill:${C.muted};text-anchor:middle}
  .rail{stroke:${C.line};stroke-width:4}
  .flow{stroke:${C.brass};stroke-width:4;stroke-dasharray:10 14;animation:flow 1.4s linear infinite}
  @keyframes flow{to{stroke-dashoffset:-48}}
  ${RM}
  @media (prefers-reduced-motion: reduce){.node{opacity:1}}
</style>
<rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
<text x="80" y="40" class="h">THE CURRICULUM · HISTORY → PRESENT → FRONTIER</text>
<line x1="80" y1="96" x2="${W - 80}" y2="96" class="rail"/>
<line x1="80" y1="96" x2="${W - 80}" y2="96" class="flow"/>
${nodes}
</svg>`);
}


/* ---------- progress tracker: per-area bars + the README checklist ---------- */
// Flip a step's `done` to true when it's finished, then re-run this script.
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const AREAS = [
  { name: "Curriculum (lessons)", have: lessons, goal: 40, unit: "lessons" },
  { name: "Interactive widgets", have: widgets, goal: 40, unit: "widgets" },
  { name: "CTF challenges", have: challenges, goal: 30, unit: "challenges" },
  { name: "Docs, CI & supply chain", steps: [
    ["README, CONTRIBUTING, ETHICS, SECURITY", ["README.md", "CONTRIBUTING.md", "docs/ETHICS.md", "docs/SECURITY.md"].every(exists)],
    ["Lab design + deploy guide", ["docs/LABS.md", "docs/DEPLOY.md"].every(exists)],
    ["CI tests + smoke test + ethics tripwire", exists(".github/workflows/ci.yml")],
    ["Actions pinned by SHA + Dependabot", exists(".github/dependabot.yml")],
    ["CodeQL scanning", exists(".github/workflows/codeql.yml")],
    ["gitleaks secret scanning", exists(".github/workflows/secrets.yml")],
    ["Weekly link check", exists(".github/workflows/links.yml")]] },
  { name: "Public launch", steps: [
    ["Create the GitHub repo and push main", false],
    ["Enable GitHub Pages", false],
    ["Turn on secret scanning + push protection", false],
    ["First CI run green on GitHub", false]] },
  { name: "Sandboxed lab runner", host: true, steps: [
    ["Lab-track design (docs/LABS.md)", exists("docs/LABS.md")],
    ["Container image per lab, no outbound network", false],
    ["Runner that refuses any target it didn't start", false],
    ["First lab: SQL injection, graded by the fix", false],
    ["Memory-safety lab under a sanitizer", false]] },
  { name: "Desktop app", host: true, steps: [
    ["Pick the shell (Tauri or Electron)", false],
    ["Offline lessons packaged", false],
    ["Local lab runner bundled", false],
    ["Signed releases + SHA-256 checksums + SBOM", false]] }
];
for (const a of AREAS) {
  if (a.steps) { a.done = a.steps.filter((s) => s[1]).length; a.pct = a.done / a.steps.length; a.label = a.done + " / " + a.steps.length + " steps"; }
  else { a.pct = Math.min(1, a.have / a.goal); a.label = a.have + " / " + a.goal + " " + a.unit; }
}
const launchDone = AREAS.find((a) => a.name === "Public launch").pct === 1;
const overall = AREAS.reduce((s, a) => s + a.pct, 0) / AREAS.length;
{
  const W = 1200, rowH = 54, top = 96, H = top + AREAS.length * rowH + 30, bx = 400, bw = 560;
  const rows = AREAS.map((a, i) => {
    const y = top + i * rowH, col = a.pct >= 1 ? C.teal : a.host ? C.rust : C.brass, d = (0.15 * i).toFixed(2);
    return `<g transform="translate(0 ${y})">
      <text x="60" y="22" class="an">${esc(a.name)}${a.host ? ' <tspan class="hostt">needs a host</tspan>' : ""}</text>
      <rect x="${bx}" y="8" width="${bw}" height="18" rx="9" fill="${C.line}"/>
      <rect x="${bx}" y="8" width="${Math.max(0.001, bw * a.pct).toFixed(1)}" height="18" rx="9" fill="${col}" class="bar" style="animation-delay:${d}s"/>
      ${a.pct > 0 && a.pct < 1 ? `<rect x="${bx}" y="8" width="${(bw * a.pct).toFixed(1)}" height="18" rx="9" fill="url(#shine)" class="shine" style="animation-delay:${d}s"/>` : ""}
      <text x="${bx + bw + 24}" y="23" class="pc" style="fill:${col}">${Math.round(a.pct * 100)}%</text>
      <text x="${bx + bw + 82}" y="23" class="lb">${esc(a.label)}</text></g>`;
  }).join("");
  write("tracker.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Progress tracker: ${Math.round(overall * 100)}% overall">
<style>
  .h{${SANS};font-size:15px;font-weight:600;fill:${C.muted};letter-spacing:.12em}
  .big{${SERIF};font-size:40px;fill:${C.brass}}
  .an{${SANS};font-size:16px;fill:${C.ink}}
  .hostt{${MONO};font-size:11px;fill:${C.rust}}
  .pc{${MONO};font-size:15px;font-weight:600}
  .lb{${MONO};font-size:12px;fill:${C.muted}}
  .bar{transform-box:fill-box;transform-origin:left;transform:scaleX(0);animation:grow 1.4s cubic-bezier(.2,.8,.2,1) forwards}
  @keyframes grow{to{transform:scaleX(1)}}
  .shine{opacity:.0;animation:shine 2.6s ease-in-out infinite 1.6s}
  @keyframes shine{0%,100%{opacity:0}50%{opacity:.55}}
  ${RM}
  @media (prefers-reduced-motion: reduce){.bar{transform:none}}
</style>
<defs><linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
<text x="60" y="44" class="h">PROGRESS TRACKER · GENERATED FROM THE REPO</text>
<text x="60" y="80" class="big">${Math.round(overall * 100)}% of the way to the full vision</text>
${rows}
</svg>`);

  // README checklist block, between markers
  const box = (b) => (b ? "- [x] " : "- [ ] ");
  const md = AREAS.map((a) => {
    const head = `**${a.name}** — ${Math.round(a.pct * 100)}% (${a.label})${a.host ? " · _needs a real host, can't be static_" : ""}`;
    return a.steps ? head + "\n" + a.steps.map(([t, d]) => "  " + box(d) + t).join("\n") : "- " + head.replace(/^\*\*/, "**");
  }).map((s) => s.startsWith("- ") ? s : "- " + s).join("\n");
  const readme = path.join(ROOT, "README.md");
  if (fs.existsSync(readme)) {
    const r = fs.readFileSync(readme, "utf8");
    const out = r.replace(/<!-- tracker:start -->[\s\S]*?<!-- tracker:end -->/, `<!-- tracker:start -->\n<!-- generated by docs/readme/generate.mjs; edit the AREAS list there, not here -->\n${md}\n<!-- tracker:end -->`);
    const lessonsMd = B.eras.map((e) => "| **" + e.num + " · " + e.title + "** | " + (B.order[e.id] || []).map((id) => B.lessons[id].title).join(" · ") + " |").join("\n");
    const out2 = out.replace(/<!-- lessons:start -->[\s\S]*?<!-- lessons:end -->/, "<!-- lessons:start -->\n<!-- generated by docs/readme/generate.mjs from js/content.js -->\n| Era | Lessons |\n|---|---|\n" + lessonsMd + "\n<!-- lessons:end -->");
    if (out2 !== r) { fs.writeFileSync(readme, out2); console.log("updated README.md tracker + lessons blocks"); }
  }
}

/* ---------- roadmap: what's done, what's next, what needs a host ---------- */
{
  const M = [
    { k: "done", t: "Static curriculum", s: [`${lessons} lessons · ${widgets} widgets`, `${challenges} CTF challenges`, "glossary · sources · path map"] },
    { k: "done", t: "Public-release ready", s: ["SHA-pinned CI · CodeQL", "gitleaks · Dependabot", "weekly link check"] },
    { k: launchDone ? "done" : "now", t: "Publish on GitHub", s: ["create the repo + push", "enable GitHub Pages", "turn on push protection"] },
    { k: launchDone ? "now" : "next", t: "Grow the static site", s: ["more walkthroughs", "per-category API lessons", "community contributions"] },
    { k: "host", t: "Sandboxed lab runner", s: ["containers, no egress", "real vulnerable targets", "graded by the fix"] },
    { k: "host", t: "Desktop app", s: ["Tauri/Electron shell", "offline + local labs", "signed releases + SBOM"] }
  ];
  const col = { done: C.teal, now: C.brass, next: C.muted, host: C.rust };
  const lab = { done: "DONE", now: "YOU ARE HERE", next: "NEXT (STATIC)", host: "NEEDS A HOST" };
  const W = 1200, H = 330, n = M.length, PAD = 115, step = (W - 2 * PAD) / (n - 1);
  const items = M.map((m, i) => {
    const x = PAD + i * step, c = col[m.k], d = (0.3 * i).toFixed(2);
    const ring = m.k === "now" ? `<circle cx="${x}" cy="110" r="22" fill="none" stroke="${c}" stroke-width="3" class="pulse"/>` : "";
    const glyph = m.k === "done" ? "✓" : m.k === "host" ? "⌂" : String(i + 1);
    return `<g class="ms" style="animation-delay:${d}s">${ring}
      <circle cx="${x}" cy="110" r="22" fill="${m.k === "done" ? c : C.panel}" stroke="${c}" stroke-width="3"/>
      <text x="${x}" y="117" class="g" style="fill:${m.k === "done" ? C.bg : c}">${glyph}</text>
      <text x="${x}" y="60" class="k" style="fill:${c}">${lab[m.k]}</text>
      <text x="${x}" y="168" class="t">${esc(m.t)}</text>
      ${m.s.map((s, j) => `<text x="${x}" y="${196 + j * 22}" class="s">${esc(s)}</text>`).join("")}</g>`;
  }).join("");
  const doneX = PAD + 1 * step, nowX = PAD + 2 * step;
  write("roadmap.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Roadmap: static curriculum and public-release prep done; publishing next; lab runner and desktop app need a host">
<style>
  .ms{opacity:0;animation:rise .6s ease forwards}
  @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .k{${MONO};font-size:11px;letter-spacing:.08em;text-anchor:middle}
  .g{${SANS};font-size:18px;font-weight:700;text-anchor:middle}
  .t{${SANS};font-size:16px;font-weight:600;fill:${C.ink};text-anchor:middle}
  .s{${MONO};font-size:12px;fill:${C.muted};text-anchor:middle}
  .rail{stroke:${C.line};stroke-width:4;stroke-dasharray:6 8}
  .doneline{stroke:${C.teal};stroke-width:4;stroke-dasharray:${(doneX - PAD).toFixed(0)};stroke-dashoffset:${(doneX - PAD).toFixed(0)};animation:draw 1.2s ease forwards .4s}
  .nowline{stroke:${C.brass};stroke-width:4;stroke-dasharray:8 10;animation:flow 1.2s linear infinite}
  @keyframes draw{to{stroke-dashoffset:0}}
  @keyframes flow{to{stroke-dashoffset:-36}}
  .pulse{transform-box:fill-box;transform-origin:center;animation:pulse 1.8s ease-out infinite}
  @keyframes pulse{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(1.9)}}
  ${RM}
  @media (prefers-reduced-motion: reduce){.ms{opacity:1}.doneline{stroke-dashoffset:0}}
</style>
<rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
<line x1="${PAD}" y1="110" x2="${W - PAD}" y2="110" class="rail"/>
<line x1="${PAD}" y1="110" x2="${doneX}" y2="110" class="doneline"/>
<line x1="${doneX}" y1="110" x2="${nowX}" y2="110" class="nowline"/>
${items}
</svg>`);
}
