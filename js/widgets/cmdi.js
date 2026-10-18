/* widgets/cmdi.js — command-injection simulation against a fake diagnostic tool.
   No shell is ever invoked; a local function models what a shell WOULD do so the
   difference between string-building and an argument vector is visible. Same rule
   as every lab: nothing here can reach another machine. */
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
  const META = /[;&|`$(){}<>]|\|\||&&/;
  function splitChained(input) {
    // teaching-only: show what a shell would treat as separate commands
    return input.split(/;|&&|\|\||\|/).map((s) => s.trim()).filter(Boolean);
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.cmdi = function (root) {
    let mode = "vuln";
    const vBtn = el("button", { type: "button", "aria-pressed": "true" }, "Vulnerable");
    const sBtn = el("button", { type: "button", "aria-pressed": "false" }, "Argument vector (fixed)");
    const seg = el("div", { class: "seg" }, vBtn, sBtn);
    const state = el("span", { class: "state vuln" }, "shell string");

    const input = el("input", { class: "input", type: "text", value: "localhost", spellcheck: "false" });
    const payloadBtn = el("button", { type: "button", class: "btn btn-ghost" }, "Load a chained-command payload");
    const cmdOut = el("div", { class: "mono-out" });
    const resultOut = el("div", { class: "log" });
    const note = el("p", { class: "hint" });
    const log = el("div", { class: "log" });

    function render() {
      const val = input.value;
      resultOut.textContent = "";
      if (mode === "vuln") {
        cmdOut.textContent = "sh -c \"ping -c1 " + val + "\"";
        const parts = splitChained(val);
        if (META.test(val) && parts.length > 1) {
          resultOut.append(el("div", null, "ping -c1 " + parts[0] + "   (the intended command)"));
          for (let i = 1; i < parts.length; i++) resultOut.append(el("div", { class: "flag" }, parts[i] + "   ← attacker-chosen command would run too"));
          note.textContent = "The shell splits on the metacharacter and runs the extra command with the app's privileges. This is remote code execution.";
        } else {
          resultOut.append(el("div", null, "ping -c1 " + val + "   → (simulated) 1 packet, reply from " + (val || "?")));
          note.textContent = "A normal hostname runs as intended — which is exactly why the bug hides until someone sends a metacharacter.";
        }
      } else {
        cmdOut.textContent = "execFile(\"ping\", [\"-c1\", " + JSON.stringify(val) + "])";
        resultOut.append(el("div", null, "ping receives one argument: " + JSON.stringify(val)));
        note.textContent = META.test(val)
          ? "No shell is involved, so ;, |, and $() are just characters in a hostname. The lookup simply fails — nothing extra runs."
          : "The input is passed as a single argument, never parsed as a command.";
      }
      const flags = META.test(val);
      log.textContent = "";
      const stamp = new Date().toISOString().slice(11, 19);
      log.append(flags ? el("div", { class: "flag" }, stamp + "  ALERT shell metacharacter in input")
                       : el("div", { class: "ok" }, stamp + "  ok  input is a plain hostname"));
    }
    function setMode(m) {
      mode = m; vBtn.setAttribute("aria-pressed", m === "vuln"); sBtn.setAttribute("aria-pressed", m === "safe");
      state.className = "state " + (m === "vuln" ? "vuln" : "safe");
      state.textContent = m === "vuln" ? "shell string" : "argument vector, no shell";
      render();
    }
    vBtn.addEventListener("click", () => setMode("vuln"));
    sBtn.addEventListener("click", () => setMode("safe"));
    input.addEventListener("input", render);
    payloadBtn.addEventListener("click", () => { input.value = "localhost; whoami"; render(); input.focus(); });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "LAB / SIM"), el("h3", null, "Command injection — shell string vs. argument vector")),
      el("div", { class: "widget-body" },
        el("div", { class: "controls" },
          el("div", { class: "field" }, el("label", null, "“Ping this host” input"), input),
          el("div", { class: "field" }, el("label", null, "Mode"), seg)),
        el("div", null, payloadBtn, "  ", state),
        el("div", { class: "field" }, el("label", null, "What the server runs"), cmdOut),
        el("div", { class: "field" }, el("label", null, "Result"), resultOut, note),
        el("div", { class: "field" }, el("label", null, "Detection log"), log)));
    setMode("vuln");
  };
})();
