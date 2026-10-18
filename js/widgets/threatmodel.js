/* widgets/threatmodel.js — an interactive trust-boundary canvas.
   A fixed data-flow diagram; select a flow to see whether it crosses a trust
   boundary and the STRIDE risks it invites, then "apply controls" to mark them
   handled. Teaches the identify-then-mitigate loop, not a real analyzer. */
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
  const SVGNS = "http://www.w3.org/2000/svg";
  function s(tag, attrs) { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }

  const NODES = {
    user: { x: 8, y: 92, w: 116, h: 48, label: "User / Browser", zone: "untrusted" },
    web:  { x: 172, y: 92, w: 116, h: 48, label: "Web server", zone: "DMZ" },
    db:   { x: 336, y: 30, w: 116, h: 48, label: "Database", zone: "internal" },
    api:  { x: 336, y: 152, w: 116, h: 48, label: "Third-party API", zone: "external" }
  };
  const FLOWS = [
    { id: "f1", from: "user", to: "web", label: "HTTP request", risks: [
      { s: "Spoofing", c: "Require authentication; use passkeys or multi-factor." },
      { s: "Tampering / Info disclosure", c: "Serve over TLS so data can't be read or altered in transit." },
      { s: "Denial of service", c: "Rate-limit and shed load at the edge." }
    ]},
    { id: "f2", from: "web", to: "db", label: "SQL query", risks: [
      { s: "Tampering (injection)", c: "Parameterized queries — never build SQL from input." },
      { s: "Info disclosure", c: "Least-privilege database account; encrypt data at rest." },
      { s: "Elevation of privilege", c: "The app's DB user gets only the rows and verbs it needs." }
    ]},
    { id: "f3", from: "web", to: "api", label: "Outbound API call", risks: [
      { s: "Server-Side Request Forgery", c: "Allowlist destinations; block internal/metadata addresses." },
      { s: "Info disclosure", c: "Keep secrets server-side; send over TLS; log without secrets." },
      { s: "Availability", c: "Timeouts and a circuit breaker so a slow third party can't stall you." }
    ]}
  ];
  const crosses = (f) => NODES[f.from].zone !== NODES[f.to].zone; // every zone change is a boundary

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.threatmodel = function (root) {
    let selected = "f1";
    const controls = {};             // flowId -> bool (controls applied)
    FLOWS.forEach((f) => (controls[f.id] = false));

    const svg = s("svg", { viewBox: "0 0 460 232", class: "tm-svg", role: "img", "aria-label": "data-flow diagram with trust boundaries" });

    function center(id) { const n = NODES[id]; return [n.x + n.w / 2, n.y + n.h / 2]; }
    function draw() {
      svg.textContent = "";
      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue("--ink").trim() || "#e8e4da";
      const line = css.getPropertyValue("--line").trim() || "#26374f";
      const panel = css.getPropertyValue("--panel").trim() || "#16273f";
      const accent = css.getPropertyValue("--accent").trim() || "#d59a45";
      const teal = css.getPropertyValue("--teal").trim() || "#46b3a2";
      const rust = css.getPropertyValue("--rust").trim() || "#d97059";
      // flows first (under nodes)
      FLOWS.forEach((f) => {
        const [x1, y1] = center(f.from), [x2, y2] = center(f.to);
        const cx = crosses(f), done = controls[f.id], sel = selected === f.id;
        const col = done ? teal : cx ? rust : line;
        const ln = s("line", { x1, y1, x2, y2, stroke: col, "stroke-width": sel ? 3.5 : 2, "stroke-dasharray": cx && !done ? "6 4" : "0" });
        svg.append(ln);
        if (cx) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const t = s("text", { x: mx, y: my - 5, fill: col, "font-size": "13", "text-anchor": "middle", "font-family": "IBM Plex Mono, monospace" }); t.textContent = done ? "✓" : "⚠"; svg.append(t); }
      });
      // nodes
      for (const id in NODES) {
        const n = NODES[id];
        const r = s("rect", { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, fill: panel, stroke: line, "stroke-width": 1 });
        svg.append(r);
        const t1 = s("text", { x: n.x + n.w / 2, y: n.y + 22, fill: ink, "font-size": "12", "text-anchor": "middle", "font-weight": "600" }); t1.textContent = n.label; svg.append(t1);
        const t2 = s("text", { x: n.x + n.w / 2, y: n.y + 38, fill: accent, "font-size": "10", "text-anchor": "middle", "font-family": "IBM Plex Mono, monospace" }); t2.textContent = n.zone; svg.append(t2);
      }
    }

    const chooser = el("div", { class: "seg tm-seg" });
    FLOWS.forEach((f) => {
      const btn = el("button", { type: "button", "aria-pressed": String(selected === f.id) }, f.label);
      btn.addEventListener("click", () => { selected = f.id; sync(); });
      chooser.append(btn);
      f._btn = btn;
    });
    const panel = el("div", { class: "tm-panel" });
    const applyBtn = el("button", { type: "button", class: "btn btn-ghost" });

    function sync() {
      FLOWS.forEach((f) => f._btn.setAttribute("aria-pressed", String(selected === f.id)));
      const f = FLOWS.find((x) => x.id === selected);
      const cx = crosses(f), done = controls[f.id];
      panel.textContent = "";
      const head = el("p", { class: "pane-title" });
      head.append(NODES[f.from].label + " → " + NODES[f.to].label + "  ");
      head.append(el("span", { class: "state " + (done ? "safe" : cx ? "vuln" : "") }, done ? "controls applied" : cx ? "crosses a trust boundary (" + NODES[f.from].zone + " → " + NODES[f.to].zone + ")" : "same zone"));
      panel.append(head);
      const ul = el("div", { class: "tm-risks" });
      f.risks.forEach((r) => {
        ul.append(el("div", { class: "tm-risk" + (done ? " ok" : "") },
          el("span", { class: "tm-s" }, r.s), el("span", { class: "tm-c" }, r.c)));
      });
      panel.append(ul);
      applyBtn.textContent = done ? "Controls applied ✓ (reset)" : "Apply recommended controls";
      draw();
    }
    applyBtn.addEventListener("click", () => { controls[selected] = !controls[selected]; sync(); });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "THREAT MODEL"), el("h3", null, "Trust-boundary canvas")),
      el("div", { class: "widget-body" },
        svg,
        el("p", { class: "hint" }, "Dashed red flows cross a trust boundary — where data moves between zones you control differently. Pick a flow to see what could go wrong (using the STRIDE categories) and the control that closes it."),
        chooser, panel, applyBtn));
    sync();
  };
})();
