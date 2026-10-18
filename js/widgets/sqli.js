/* widgets/sqli.js — SQL-injection simulation against a fake in-memory table.
   There is no database and no network: the "query" is interpreted by a tiny
   local function so the mechanism is visible and nothing can leave the page. */
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

  const USERS = [
    { name: "alice", role: "user" },
    { name: "bob", role: "user" },
    { name: "carol", role: "user" },
    { name: "admin", role: "admin" }
  ];

  // Faithful-enough interpretation of a concatenated query for teaching.
  function runVulnerable(input) {
    const query = "SELECT name, role FROM users WHERE name = '" + input + "'";
    const low = input.toLowerCase();
    let rows, note;
    if (/'\s*or\s*'?1'?\s*=\s*'?1|'\s*or\s*1\s*=\s*1|'\s*or\s*''\s*=\s*'/.test(low)) {
      rows = USERS.slice(); note = "Tautology injected — the WHERE clause is always true, so every row returns.";
    } else if (/'\s*--/.test(low) || /'\s*#/.test(low)) {
      const wanted = input.split("'")[0];
      rows = USERS.filter((u) => u.name === wanted);
      note = "A comment (--) truncated the rest of the query; the quote was closed early.";
    } else {
      rows = USERS.filter((u) => u.name === input);
      note = rows.length ? "Exact match." : "No match.";
    }
    return { query, param: null, rows, note };
  }
  function runSafe(input) {
    // Parameters travel separately from the query text, so input is always a value.
    const query = "SELECT name, role FROM users WHERE name = ?";
    const rows = USERS.filter((u) => u.name === input);
    return { query, param: input, rows, note: rows.length ? "Exact match." : "0 rows — the whole input is treated as one literal name." };
  }
  function suspicious(input) {
    const f = [];
    if (input.includes("'")) f.push("unbalanced quote");
    if (/\bor\b.*=/i.test(input)) f.push("boolean tautology (OR …=…)");
    if (/--|#/.test(input)) f.push("SQL comment token");
    return f;
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.sqli = function (root) {
    let mode = "vuln";
    const vBtn = el("button", { type: "button", "aria-pressed": "true" }, "Vulnerable");
    const sBtn = el("button", { type: "button", "aria-pressed": "false" }, "Parameterized (fixed)");
    const seg = el("div", { class: "seg" }, vBtn, sBtn);
    const state = el("span", { class: "state vuln" }, "string-concatenated");

    const input = el("input", { class: "input", type: "text", value: "alice", spellcheck: "false" });
    const payloadBtn = el("button", { type: "button", class: "btn btn-ghost" }, "Load the classic payload");
    const queryOut = el("div", { class: "mono-out" });
    const paramOut = el("div", { class: "hint" });
    const rowsOut = el("div", { class: "log" });
    const note = el("p", { class: "hint" });
    const log = el("div", { class: "log" });

    function render() {
      const val = input.value;
      const r = mode === "vuln" ? runVulnerable(val) : runSafe(val);
      queryOut.textContent = r.query;
      paramOut.textContent = r.param != null ? "bound parameter  ?  =  " + JSON.stringify(r.param) : "";
      paramOut.hidden = r.param == null;
      rowsOut.textContent = "";
      if (!r.rows.length) rowsOut.append(el("div", null, "(no rows)"));
      for (const u of r.rows) rowsOut.append(el("div", { class: u.role === "admin" ? "flag" : "" }, u.name + "  —  " + u.role));
      note.textContent = r.note + (mode === "vuln" && r.rows.length === USERS.length ? "  All accounts, including admin, exposed." : "");

      // detection panel — same in both modes; it flags the *input*, not the outcome
      const flags = suspicious(val);
      log.textContent = "";
      const stamp = new Date().toISOString().slice(11, 19);
      if (flags.length) log.append(el("div", { class: "flag" }, stamp + "  ALERT input matched: " + flags.join(", ")));
      else log.append(el("div", { class: "ok" }, stamp + "  ok  input looks like a plain value"));
    }
    function setMode(m) {
      mode = m;
      vBtn.setAttribute("aria-pressed", m === "vuln");
      sBtn.setAttribute("aria-pressed", m === "safe");
      state.className = "state " + (m === "vuln" ? "vuln" : "safe");
      state.textContent = m === "vuln" ? "string-concatenated" : "parameters bound separately";
      render();
    }
    vBtn.addEventListener("click", () => setMode("vuln"));
    sBtn.addEventListener("click", () => setMode("safe"));
    input.addEventListener("input", render);
    payloadBtn.addEventListener("click", () => { input.value = "' OR '1'='1"; render(); input.focus(); });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "LAB / SIM"), el("h3", null, "SQL injection — vulnerable vs. parameterized")),
      el("div", { class: "widget-body" },
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "Login / search box"), input),
          el("div", { class: "field" }, el("label", null, "Mode"), seg)),
        el("div", null, payloadBtn, "  ", state),
        el("div", { class: "field" }, el("label", null, "Query sent to the database"), queryOut, paramOut),
        el("div", { class: "field" }, el("label", null, "Rows returned"), rowsOut, note),
        el("div", { class: "field" }, el("label", null, "Detection log (keys on the input, not the result)"), log)));
    setMode("vuln");
  };
})();
