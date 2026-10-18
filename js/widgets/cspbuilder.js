/* widgets/cspbuilder.js — assemble a Content Security Policy and see what it
   allows or blocks. Toggling directives updates the header string and a set of
   plain-language verdicts. The strict baseline mirrors the policy this site ships. */
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
  function toggle(label, checked, onchange) {
    const input = el("input", { type: "checkbox", id: "csp_" + label.replace(/\W/g, "") });
    input.checked = !!checked;
    input.addEventListener("change", onchange);
    return { row: el("label", { class: "csp-opt" }, input, el("code", null, label)), input };
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.cspbuilder = function (root) {
    const state = { scriptSelf: true, scriptInline: false, scriptCdn: false, styleSelf: true, styleInline: false, styleFonts: false, imgData: false, imgAny: false };
    const header = el("div", { class: "mono-out" });
    const verdicts = el("div", { class: "csp-verdicts" });

    function build() {
      const script = ["'self'"].filter(() => state.scriptSelf);
      const s = ["'self'"];
      if (state.scriptInline) s.push("'unsafe-inline'");
      if (state.scriptCdn) s.push("https://cdnjs.cloudflare.com");
      const st = ["'self'"];
      if (state.styleInline) st.push("'unsafe-inline'");
      if (state.styleFonts) st.push("https://fonts.googleapis.com");
      const img = ["'self'"];
      if (state.imgData) img.push("data:");
      if (state.imgAny) img.push("*");
      const dirs = [
        "default-src 'none'",
        "script-src " + s.join(" "),
        "style-src " + st.join(" "),
        "img-src " + img.join(" "),
        "object-src 'none'",
        "base-uri 'none'"
      ];
      header.textContent = "Content-Security-Policy: " + dirs.join("; ");
      const rows = [
        ["Inline <script> / onclick=…", !state.scriptInline, state.scriptInline ? "runs — an XSS payload would execute" : "blocked — XSS has nothing to run"],
        ["Script from cdnjs", state.scriptCdn ? true : false, state.scriptCdn ? "loads" : "blocked"],
        ["Inline style attributes", !state.styleInline, state.styleInline ? "applied" : "blocked"],
        ["Google Fonts stylesheet", state.styleFonts ? true : false, state.styleFonts ? "loads" : "blocked"],
        ["data: images", state.imgData ? true : false, state.imgData ? "load" : "blocked"],
        ["Any other origin", false, "blocked by default-src 'none'"]
      ];
      verdicts.textContent = "";
      rows.forEach(([what, good, note]) => {
        verdicts.append(el("div", { class: "csp-row" },
          el("span", { class: "state " + (good ? "safe" : "vuln") }, good ? "safe" : "open"),
          el("span", { class: "csp-what" }, what),
          el("span", { class: "csp-note" }, note)));
      });
    }

    const grid = el("div", { class: "csp-grid" });
    const add = (key, label, group) => { const t = toggle(label, state[key], () => { state[key] = t.input.checked; build(); }); group.append(t.row); };
    const gScript = el("div", { class: "csp-group" }, el("p", { class: "pane-title" }, "script-src"));
    add("scriptInline", "'unsafe-inline'", gScript); add("scriptCdn", "cdnjs.cloudflare.com", gScript);
    const gStyle = el("div", { class: "csp-group" }, el("p", { class: "pane-title" }, "style-src"));
    add("styleInline", "'unsafe-inline'", gStyle); add("styleFonts", "fonts.googleapis.com", gStyle);
    const gImg = el("div", { class: "csp-group" }, el("p", { class: "pane-title" }, "img-src"));
    add("imgData", "data:", gImg); add("imgAny", "* (any)", gImg);
    grid.append(gScript, gStyle, gImg);

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "CSP"), el("h3", null, "Build a Content Security Policy")),
      el("div", { class: "widget-body" },
        el("p", { class: "hint" }, "Start from a deny-all baseline and open only what you need. Every box you check widens the attack surface — watch the verdicts."),
        grid,
        el("div", { class: "field" }, el("label", null, "Resulting header"), header),
        verdicts,
        el("p", { class: "hint" }, "This site ships the strict version: no ", el("code", null, "'unsafe-inline'"), " anywhere, scripts and styles from ", el("code", null, "'self'"), " only, fonts from Google. That's why an injected inline script here simply cannot run.")));
    build();
  };
})();
