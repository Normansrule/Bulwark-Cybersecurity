/* app.js — hash router, safe content renderer, and view builders.
   Loads after content.js and the widgets. Authored content is escaped first,
   then a fixed markup whitelist is applied; learner input never flows through
   here (the widgets handle it with textContent). */
(function () {
  "use strict";
  const { eras, lessons, order, sources, glossary } = window.BULWARK;

  /* ---------- safe rendering ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function mdInline(s) {
    let out = esc(s);
    out = out.replace(/`([^`]+)`/g, (_m, x) => "<code>" + x + "</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, (_m, x) => "<strong>" + x + "</strong>");
    out = out.replace(/(^|[^*])\*([^*]+)\*/g, (_m, pre, x) => pre + "<em>" + x + "</em>");
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, txt, url) => {
      const ok = /^(https?:\/\/|\.?\/|#)/i.test(url) ? url : "#";
      const ext = /^https?:/i.test(ok);
      return '<a href="' + esc(ok) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + txt + "</a>";
    });
    return out;
  }
  function h(tag, cls, kids) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (kids != null) {
      if (Array.isArray(kids)) kids.forEach((k) => k != null && n.append(k.nodeType ? k : document.createTextNode(String(k))));
      else n.append(kids.nodeType ? kids : document.createTextNode(String(kids)));
    }
    return n;
  }
  function pHTML(cls, md) { const p = document.createElement(cls === "li" ? "li" : "p"); if (cls && cls !== "li") p.className = cls; p.innerHTML = mdInline(md); return p; }

  const NOTE_ICO = { info: "i", defend: "✓", attack: "!", history: "✦" };
  const NOTE_LABEL = { info: "note", defend: "defend", attack: "sandboxed", history: "history" };

  function renderBlocks(blocks) {
    const frag = document.createDocumentFragment();
    for (const b of blocks) {
      switch (b.t) {
        case "p": frag.append(pHTML(null, b.md)); break;
        case "h": frag.append(h("h2", null, b.text)); break;
        case "list": {
          const list = document.createElement(b.ordered ? "ol" : "ul");
          b.items.forEach((it) => list.append(pHTML("li", it)));
          frag.append(list); break;
        }
        case "note": {
          const box = h("div", "note note-" + b.kind);
          box.append(h("div", "ico", NOTE_ICO[b.kind] || "i"));
          box.append(pHTML(null, b.md));
          frag.append(box); break;
        }
        case "steps": {
          const ol = h("ol", "prose");
          b.items.forEach((it) => { const li = document.createElement("li"); li.append(h("strong", null, it.h + " ")); const sp = document.createElement("span"); sp.innerHTML = mdInline(it.md); li.append(sp); ol.append(li); });
          frag.append(ol); break;
        }
        case "eq": {
          const box = h("div", "eq");
          box.append(h("div", "eq-int", b.intuition));
          box.append(h("div", "eq-expr", b.expr));
          if (b.where && b.where.length) {
            const w = h("div", "eq-where");
            b.where.forEach((row) => { const d = document.createElement("div"); d.append(h("span", "sym", row.sym), h("span", null, row.def)); w.append(d); });
            box.append(w);
          }
          if (b.example) { const eg = h("div", "eq-eg"); eg.append(h("b", null, "Worked example. ")); const s = document.createElement("span"); s.innerHTML = mdInline(b.example); eg.append(s); box.append(eg); }
          frag.append(box); break;
        }
        case "table": {
          const scroll = h("div", "tbl-scroll");
          const t = h("table", "data");
          const thead = document.createElement("thead"); const htr = document.createElement("tr");
          b.head.forEach((c) => { const th = document.createElement("th"); th.innerHTML = mdInline(c); htr.append(th); });
          thead.append(htr); t.append(thead);
          const tb = document.createElement("tbody");
          b.rows.forEach((r) => { const tr = document.createElement("tr"); r.forEach((c) => { const td = document.createElement("td"); td.innerHTML = mdInline(c); tr.append(td); }); tb.append(tr); });
          t.append(tb); scroll.append(t); frag.append(scroll); break;
        }
        case "quote": {
          const q = h("blockquote", "pquote"); q.append(pHTML(null, b.md)); q.append(h("cite", null, b.cite)); frag.append(q); break;
        }
        case "widget": {
          const shell = h("div", "widget");
          const fn = window.BulwarkWidgets && window.BulwarkWidgets[b.id];
          if (fn) { try { fn(shell, b.data); } catch (e) { shell.append(h("div", "widget-body", "This widget could not load.")); } }
          else shell.append(h("div", "widget-body", "Widget “" + b.id + "” unavailable."));
          frag.append(shell); break;
        }
      }
    }
    return frag;
  }

  /* ---------- progress (best-effort) ---------- */
  function visited() { try { return JSON.parse(localStorage.getItem("bulwark.visited") || "[]"); } catch (e) { return []; } }
  function markVisited(id) { try { const v = visited(); if (!v.includes(id)) { v.push(id); localStorage.setItem("bulwark.visited", JSON.stringify(v)); } } catch (e) {} }

  const flatOrder = eras.flatMap((e) => order[e.id] || []);

  /* ---------- views ---------- */
  function viewHome() {
    const v = h("div", "view");
    const wrap = h("div", "wrap");

    const hero = h("section", "hero");
    hero.append(h("p", "kicker", "History → present → frontier"));
    const hh = document.createElement("h1"); hh.innerHTML = "Learn security by walking <em>the whole arc</em>."; hero.append(hh);
    hero.append(h("p", "lede", "From the ciphers of antiquity and how each one fell, through the cryptography that protects every request you make today, to the post-quantum frontier. Every idea is explained from zero, and the hands-on parts run only against targets built into the page."));
    const animLine = h("p", "hero-anim");
    animLine.append("A defender-in-training, right now learning ");
    if (window.BulwarkWidgets && window.BulwarkWidgets.heroanim) { try { window.BulwarkWidgets.heroanim(animLine); } catch (e) {} }
    hero.append(animLine);
    const cta = h("div", "cta-row");
    const start = h("a", "btn btn-primary", "Start at the beginning"); start.href = "#/lesson/" + flatOrder[0];
    const labs = h("a", "btn btn-ghost", "See the labs"); labs.href = "#/labs";
    cta.append(start, labs); hero.append(cta);
    const flag = h("div", "ethics-flag");
    flag.append(h("div", "ico", "✓"));
    const fp = document.createElement("p"); fp.innerHTML = mdInline("**This is a defensive tool.** It teaches how attacks work so you can stop them. It ships no working exploits, and every lab confines its attack step to something you started on your own machine.");
    flag.append(fp); hero.append(flag);
    wrap.append(hero);

    /* learning-path map: one column per era, one stop per lesson, in order */
    const seen = visited();
    const nextId = flatOrder.find((id) => !seen.includes(id));
    const map = h("section", "pathmap");
    const mapHead = h("div", "pm-head");
    mapHead.append(h("h2", null, "Your path"));
    if (nextId) { const go = h("a", "btn btn-primary", "Continue: " + lessons[nextId].title + " →"); go.href = "#/lesson/" + nextId; mapHead.append(go); }
    else mapHead.append(h("span", "state safe", "Every lesson visited"));
    map.append(mapHead);
    const cols = h("ol", "pm-cols");
    eras.forEach((era) => {
      const ids = order[era.id] || [];
      const col = h("li", "pm-col");
      const done = ids.filter((id) => seen.includes(id)).length;
      col.append(h("div", "pm-era", era.num + " · " + era.title), h("div", "pm-count", done + "/" + ids.length));
      const stops = h("ol", "pm-stops");
      ids.forEach((id) => {
        const li = h("li");
        const a = h("a", "pm-stop" + (seen.includes(id) ? " done" : "") + (id === nextId ? " next" : ""));
        a.href = "#/lesson/" + id;
        a.append(h("span", "pm-dot", seen.includes(id) ? "✓" : ""), h("span", "pm-name", lessons[id].title));
        if (id === nextId) a.setAttribute("aria-current", "step");
        li.append(a); stops.append(li);
      });
      col.append(stops); cols.append(col);
    });
    map.append(cols);
    wrap.append(map);

    const tl = h("section", "timeline");
    tl.append(h("h2", null, "The timeline"));
    const N = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten"][eras.length] || String(eras.length);
    tl.append(h("p", "sub", N + " eras, from antiquity to the frontier. Each links to its lessons."));

    const done = visited();
    const completed = done.filter((id) => flatOrder.includes(id)).length;
    const pct = flatOrder.length ? Math.round(completed / flatOrder.length * 100) : 0;
    const prog = h("div", "progress");
    prog.append(h("span", null, completed + " of " + flatOrder.length + " lessons"));
    const bar = h("div", "bar"); const barFill = h("span"); barFill.style.width = pct + "%"; bar.append(barFill); prog.append(bar);
    prog.append(h("span", null, pct + "%"));
    tl.append(prog);

    const search = document.createElement("input");
    search.className = "input tl-search"; search.type = "search"; search.placeholder = "Search lessons…"; search.setAttribute("aria-label", "Search lessons");
    tl.append(search);

    const spine = h("div", "spine");
    eras.forEach((era, i) => {
      const ids = order[era.id] || [];
      const node = h("button", "timeline-node"); node.style.animationDelay = (i * 40) + "ms";
      if (!ids.length) node.disabled = true;
      const num = h("div", "node-num", era.num);
      const body = h("div");
      const top = h("div"); top.append(h("span", "node-title", era.title), " ", h("span", "node-period", era.period));
      body.append(top, h("div", "node-tag", era.tagline));
      const chips = h("div", "node-lessons");
      ids.forEach((id) => { const c = h("span", "chip", lessons[id].title + (done.includes(id) ? " ✓" : "")); chips.append(c); });
      if (!ids.length) chips.append(h("span", "chip soon", "coming in a later milestone"));
      body.append(chips);
      node.append(num, body);
      if (ids.length) node.addEventListener("click", () => { location.hash = "#/lesson/" + ids[0]; });
      node._text = (era.title + " " + era.tagline + " " + ids.map((id) => lessons[id].title).join(" ")).toLowerCase();
      spine.append(node);
    });
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      [...spine.children].forEach((n) => { n.hidden = !!q && !n._text.includes(q); });
    });
    tl.append(spine);
    wrap.append(tl);
    v.append(wrap);
    return v;
  }

  function viewLesson(id) {
    const l = lessons[id];
    if (!l) return viewHome();
    markVisited(id);
    const era = eras.find((e) => e.id === l.era);
    const v = h("div", "view");
    const wrap = h("div", "wrap");

    const crumb = h("p", "crumb");
    const home = h("a", null, "Timeline"); home.href = "#/";
    crumb.append(home, " / " + (era ? era.title : ""));
    wrap.append(crumb);

    const head = h("header", "lesson-head");
    head.append(h("h1", null, l.title), h("p", "lesson-sub", l.subtitle));
    const meta = h("div", "lesson-meta");
    meta.append(h("span", null, era ? era.num + " · " + era.title : ""), h("span", null, "~" + l.minutes + " min"));
    head.append(meta);
    wrap.append(head);

    const prose = h("article", "prose");
    prose.append(renderBlocks(l.body));
    wrap.append(prose);

    const nav = h("div", "lesson-nav");
    const idx = flatOrder.indexOf(id);
    if (idx > 0) { const a = h("a", "btn btn-ghost", "← " + lessons[flatOrder[idx - 1]].title); a.href = "#/lesson/" + flatOrder[idx - 1]; nav.append(a); } else nav.append(h("span"));
    if (idx < flatOrder.length - 1) { const a = h("a", "btn btn-primary", lessons[flatOrder[idx + 1]].title + " →"); a.href = "#/lesson/" + flatOrder[idx + 1]; nav.append(a); }
    wrap.append(nav);

    v.append(wrap);
    return v;
  }

  function viewLabs() {
    const v = h("div", "view");
    const wrap = h("div", "wrap");
    const head = h("header", "lesson-head");
    head.append(h("h1", null, "Labs: attack, then defend"), h("p", "lesson-sub", "See a flaw exploited against a bundled target, then spend the real effort fixing it, detecting it, and designing it out."));
    wrap.append(head);

    const flag = h("div", "note note-attack");
    flag.append(h("div", "ico", "!"));
    const fp = document.createElement("p"); fp.innerHTML = mdInline("You only ever attack a machine you started, that talks to nothing else. In this web app the “target” is a fake in-memory database or a sandboxed frame; the full containerized runner (milestone 3) enforces the same rule at the operating-system level. See the [ethics policy](./docs/ETHICS.md).");
    flag.append(fp); wrap.append(flag);

    const tracks = [
      { t: "Track 1 — Injection & untrusted input", line: "One idea in many costumes: data crossing a trust boundary must never be run as code.", body: "SQL injection, Cross-Site Scripting, command injection, path traversal, and Server-Side Request Forgery. The graded outcome is always the patch plus a detection rule.", live: "injection", liveLabel: "Try the live injection lesson" },
      { t: "Track 2 — Memory safety & the off-by-one family", line: "Recognize and eliminate a whole bug class — not weaponize it.", body: "Off-by-one and buffer overflow, integer overflow, use-after-free, format strings. Learners watch corruption under a sanitizer and let a fuzzer find the bug, then fix it or move to a memory-safe language. No shellcode, no exploit development.", live: null },
      { t: "Track 3 — Availability & DDoS (defensive)", line: "Understand the attack; configure the defense. No traffic is ever generated.", body: "How amplification, reflection, spoofing, and botnets work, at the level public references teach it — paired with the mitigations. The MVP ships the concept visualizer only.", live: "availability-ddos", liveLabel: "Try the live availability lesson" }
    ];
    tracks.forEach((tr) => {
      const box = h("div", "track");
      box.append(h("h3", null, tr.t), h("p", "track-line", tr.line));
      const p = document.createElement("p"); p.className = "hint"; p.innerHTML = mdInline(tr.body); box.append(p);
      if (tr.live) { const a = h("a", "btn btn-ghost", tr.liveLabel + " →"); a.href = "#/lesson/" + tr.live; box.append(a); }
      wrap.append(box);
    });

    const more = document.createElement("p"); more.className = "hint"; more.style.marginTop = "1.5rem";
    more.innerHTML = mdInline("The full lab-track design, including the hard lines for each track, lives in [docs/LABS.md](./docs/LABS.md).");
    wrap.append(more);

    v.append(wrap);
    return v;
  }

  function viewSources() {
    const v = h("div", "view");
    const wrap = h("div", "wrap");
    const head = h("header", "lesson-head");
    head.append(h("h1", null, "Sources"), h("p", "lesson-sub", "Every non-obvious claim traces to a primary source. Fast-moving areas carry a “last verified” date because they change."));
    wrap.append(head);
    const list = h("div", "src-list");
    sources.forEach((s) => {
      const box = h("div", "src");
      const top = h("div", "src-top");
      const a = h("a", null, s.title); a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      top.append(a, h("span", "badge " + s.status, s.status));
      box.append(top);
      box.append(h("div", "src-meta", s.pub + "  ·  last verified " + s.verified));
      box.append(h("p", "src-note", s.note));
      list.append(box);
    });
    wrap.append(list);
    v.append(wrap);
    return v;
  }

  function viewGlossary() {
    const v = h("div", "view");
    const wrap = h("div", "wrap");
    const head = h("header", "lesson-head");
    head.append(h("h1", null, "Glossary"), h("p", "lesson-sub", "Every term this site uses, defined in one line. Search, or follow a term to the lesson it comes from."));
    wrap.append(head);
    const search = document.createElement("input");
    search.className = "input tl-search"; search.type = "search"; search.placeholder = "Search terms…"; search.setAttribute("aria-label", "Search glossary");
    wrap.append(search);
    const list = document.createElement("dl"); list.className = "gloss-list";
    const rows = [];
    glossary.slice().sort((a, b) => a.term.localeCompare(b.term)).forEach((g) => {
      const box = h("div", "gloss");
      box.append(h("dt", null, g.term));
      const dd = document.createElement("dd"); dd.textContent = g.def + " ";
      if (g.lesson && lessons[g.lesson]) { const a = document.createElement("a"); a.href = "#/lesson/" + g.lesson; a.textContent = "→ " + lessons[g.lesson].title; dd.append(a); }
      box.append(dd);
      box._text = (g.term + " " + g.def).toLowerCase();
      rows.push(box); list.append(box);
    });
    search.addEventListener("input", () => { const q = search.value.trim().toLowerCase(); rows.forEach((r) => { r.hidden = !!q && !r._text.includes(q); }); });
    wrap.append(list);
    v.append(wrap);
    return v;
  }

  function viewChallenges() {
    const v = h("div", "view");
    const wrap = h("div", "wrap");
    const head = h("header", "lesson-head");
    head.append(h("h1", null, "Challenges"), h("p", "lesson-sub", "Defensive puzzles — decode it, reason it out, spot the flaw. Every one is solved with your head, not by attacking anything real. Progress saves in your browser."));
    wrap.append(head);
    const box = h("div");
    if (window.BulwarkWidgets && window.BulwarkWidgets.challenge) { try { window.BulwarkWidgets.challenge(box); } catch (e) { box.append(h("p", "hint", "Challenges could not load.")); } }
    wrap.append(box);

    const more = h("section", "practice");
    more.append(h("h2", null, "Keep practicing"));
    more.append(h("p", "hint", "When you've cleared these, these established, hands-on platforms go far deeper — all legal, sandboxed practice ranges:"));
    const links = [
      ["cryptopals", "https://cryptopals.com/", "Build and break real crypto, set by set."],
      ["CryptoHack", "https://cryptohack.org/", "Gamified modern-cryptography challenges."],
      ["OverTheWire", "https://overthewire.org/wargames/", "Wargames that teach Linux and exploitation basics safely."],
      ["picoCTF (CyLab Security Academy)", "https://picoctf.org/", "Beginner-friendly capture-the-flag from Carnegie Mellon."],
      ["PortSwigger Web Security Academy", "https://portswigger.net/web-security", "Free, thorough web-vulnerability labs."]
    ];
    const grid = h("div", "practice-grid");
    links.forEach(([name, url, desc]) => {
      const a = document.createElement("a"); a.className = "practice-card"; a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.append(h("span", "practice-name", name), h("span", "practice-desc", desc));
      grid.append(a);
    });
    more.append(grid);
    wrap.append(more);

    v.append(wrap);
    return v;
  }

  /* ---------- router ---------- */
  const outlet = document.getElementById("app");
  function setActive(route) {
    document.querySelectorAll(".nav a").forEach((a) => {
      const match = a.getAttribute("data-route") === route;
      if (match) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }
  function route() {
    const hash = location.hash.replace(/^#/, "") || "/";
    let view, active = "home";
    if (hash.startsWith("/lesson/")) { view = viewLesson(hash.slice(8)); active = "home"; }
    else if (hash === "/labs") { view = viewLabs(); active = "labs"; }
    else if (hash === "/challenges") { view = viewChallenges(); active = "challenges"; }
    else if (hash === "/glossary") { view = viewGlossary(); active = "glossary"; }
    else if (hash === "/sources") { view = viewSources(); active = "sources"; }
    else { view = viewHome(); active = "home"; }
    outlet.textContent = "";
    outlet.append(view);
    setActive(active);
    window.scrollTo(0, 0);
    document.title = hash.startsWith("/lesson/") && lessons[hash.slice(8)]
      ? lessons[hash.slice(8)].title + " — Bulwark" : "Bulwark";
  }
  window.addEventListener("hashchange", route);

  /* ---------- theme ---------- */
  const toggle = document.getElementById("theme-toggle");
  function prefersDark() { try { return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) { return false; } }
  function currentTheme() { try { return localStorage.getItem("bulwark.theme"); } catch (e) { return null; } }
  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
    if (toggle) toggle.textContent = (t === "dark" || (!t && prefersDark())) ? "☀" : "☽";
  }
  if (toggle) toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark"
      || (!document.documentElement.getAttribute("data-theme") && prefersDark());
    const next = isDark ? "light" : "dark";
    try { localStorage.setItem("bulwark.theme", next); } catch (e) {}
    applyTheme(next);
  });
  applyTheme(currentTheme());

  route();
})();
