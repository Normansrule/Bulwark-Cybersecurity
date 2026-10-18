/* widgets/walkthrough.js — a short, visual, step-by-step "watch the attack,
   then watch the defense" story. Each step shows who is acting, what their
   screen (or the wire) looks like, and one sentence of narration. Everything is
   authored data from content.js rendered with textContent; nothing runs, and
   every host in the stories uses a reserved example domain (RFC 2606). */
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

  // Each actor gets a glyph and a side of the stage, so the story reads left-to-right.
  const CAST = {
    attacker: { glyph: "☠", label: "Attacker", cls: "wt-atk" },
    victim:   { glyph: "☺", label: "Victim",   cls: "wt-vic" },
    browser:  { glyph: "▣", label: "Browser",  cls: "wt-sys" },
    app:      { glyph: "▤", label: "Web app",  cls: "wt-sys" },
    server:   { glyph: "▤", label: "Server",   cls: "wt-sys" },
    db:       { glyph: "◫", label: "Database", cls: "wt-sys" },
    defender: { glyph: "✓", label: "Defense",  cls: "wt-def" }
  };

  // Render a line, wrapping the first occurrence of `hl` in a highlight span.
  function line(text, hl) {
    const row = el("div", { class: "wt-line" });
    const i = hl ? text.indexOf(hl) : -1;
    if (i < 0) { row.textContent = text; return row; }
    row.append(text.slice(0, i), el("mark", { class: "wt-hl" }, hl), text.slice(i + hl.length));
    return row;
  }

  function screen(s) {
    const kind = s.kind || "browser";
    const frame = el("div", { class: "wt-screen wt-" + kind });
    const bar = el("div", { class: "wt-bar" });
    if (kind === "browser") bar.append(el("span", { class: "wt-dots" }, "● ● ●"), el("span", { class: "wt-url" }, s.url || ""));
    else bar.append(el("span", { class: "wt-kind" }, s.title || ({ request: "HTTP request", response: "HTTP response", code: "server code", terminal: "server log" }[kind] || kind)));
    frame.append(bar);
    const body = el("div", { class: "wt-body" });
    (s.lines || []).forEach((t) => body.append(line(t, s.hl)));
    if (s.button) body.append(el("span", { class: "wt-fakebtn" + (s.decoy ? " wt-decoy" : "") }, s.button));
    frame.append(body);
    return frame;
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.walkthrough = function (root, data) {
    data = data || { title: "Walkthrough", attack: [], defend: [] };
    let track = "attack", i = 0;

    const aBtn = el("button", { type: "button", "aria-pressed": "true" }, "1 · The attack");
    const dBtn = el("button", { type: "button", "aria-pressed": "false" }, "2 · The defense");
    const seg = el("div", { class: "seg" }, aBtn, dBtn);
    const who = el("div", { class: "wt-who" });
    const stage = el("div", { class: "wt-stage" });
    const say = el("p", { class: "wt-say", "aria-live": "polite" });
    const dots = el("div", { class: "step-dots" });
    const back = el("button", { type: "button", class: "btn btn-ghost" }, "← Back");
    const next = el("button", { type: "button", class: "btn btn-primary" }, "Next →");
    const count = el("span", { class: "src-meta" });

    function steps() { return data[track] || []; }
    function paint() {
      const list = steps(), s = list[i] || {};
      const c = CAST[s.who] || CAST.app;
      who.textContent = "";
      who.className = "wt-who " + c.cls;
      who.append(el("span", { class: "wt-glyph", "aria-hidden": "true" }, c.glyph), el("span", null, s.label || c.label));
      stage.textContent = "";
      if (s.screen) stage.append(screen(s.screen));
      say.textContent = s.say || "";
      dots.textContent = "";
      list.forEach((_, k) => dots.append(el("i", { class: k === i ? "on" : "" })));
      count.textContent = "step " + (i + 1) + " of " + list.length;
      back.disabled = i === 0 && track === "attack";
      const last = i === list.length - 1;
      next.textContent = last ? (track === "attack" ? "Now defend it →" : "Start over ↺") : "Next →";
      aBtn.setAttribute("aria-pressed", track === "attack");
      dBtn.setAttribute("aria-pressed", track === "defend");
      root.classList.toggle("wt-defending", track === "defend");
    }
    function go(t, k) { track = t; i = k; paint(); }
    next.addEventListener("click", () => {
      if (i < steps().length - 1) go(track, i + 1);
      else if (track === "attack") go("defend", 0);
      else go("attack", 0);
    });
    back.addEventListener("click", () => {
      if (i > 0) go(track, i - 1);
      else if (track === "defend") go("attack", (data.attack || []).length - 1);
    });
    aBtn.addEventListener("click", () => go("attack", 0));
    dBtn.addEventListener("click", () => go("defend", 0));
    root.addEventListener("keydown", (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") { next.click(); e.preventDefault(); }
      if (e.key === "ArrowLeft" && !back.disabled) { back.click(); e.preventDefault(); }
    });
    root.tabIndex = 0;

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "WALKTHROUGH"), el("h3", null, data.title)),
      el("div", { class: "widget-body" },
        el("div", { class: "wt-top" }, seg, count),
        el("div", { class: "wt-scene" }, who, stage),
        say,
        dots,
        el("div", { class: "quiz-actions" }, back, next)));
    paint();
  };
})();
