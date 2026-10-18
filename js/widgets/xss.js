/* widgets/xss.js — Cross-Site Scripting: innerHTML (vulnerable) vs textContent (safe).
   Learner input runs inside a sandboxed iframe (opaque origin, allow-scripts only)
   so it can never touch this page. Two rendering modes:
     - 'src'    : load the real xss-sandbox.html file (used by the deployed site;
                  the frame has no CSP, so an injected handler actually executes).
     - 'srcdoc' : inline the sandbox (used in a single-file preview; the frame
                  inherits the host CSP, so a strict CSP visibly blocks execution).
   Set window.BULWARK_XSS_MODE to choose; defaults to 'src'. */
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

  // Inlined copy of xss-sandbox.html for srcdoc mode (kept in sync with the file).
  const SANDBOX_SRCDOC =
    '<!doctype html><meta charset="utf-8"><style>html,body{margin:0}body{font:13px/1.5 system-ui,sans-serif;color:#111;background:#fff;padding:8px}#s{min-height:2.5rem}</style>' +
    '<div id="s"></div><script>(function(){var s=document.getElementById("s"),f=false;' +
    'window.alert=function(){f=true};window.confirm=function(){f=true;return false};window.prompt=function(){f=true;return null};' +
    'window.addEventListener("error",function(){});' +
    'window.addEventListener("message",function(e){var m=e.data||{};if(m.type!=="render")return;f=false;' +
    'try{if(m.mode==="html"){s.innerHTML=String(m.payload)}else{s.textContent=String(m.payload)}}catch(x){}' +
    'setTimeout(function(){parent.postMessage({type:"result",mode:m.mode,fired:f,nodeCount:s.querySelectorAll("*").length},"*")},30)});' +
    'parent.postMessage({type:"ready"},"*")})();<\/script>';

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.xss = function (root) {
    const useSrc = (window.BULWARK_XSS_MODE || "src") === "src";

    function makeFrame() {
      const f = el("iframe", { class: "xss-frame", sandbox: "allow-scripts", title: "sandboxed render" });
      if (useSrc) f.src = "xss-sandbox.html"; else f.srcdoc = SANDBOX_SRCDOC;
      return f;
    }
    const vFrame = makeFrame(), sFrame = makeFrame();
    const vStatus = el("p", { class: "hint" }), sStatus = el("p", { class: "hint" });
    const readyFor = new WeakSet();

    function post(frame, mode, payload) {
      try { frame.contentWindow.postMessage({ type: "render", mode: mode, payload: payload }, "*"); } catch (e) {}
    }
    function refresh() {
      post(vFrame, "html", input.value);
      post(sFrame, "text", input.value);
    }
    window.addEventListener("message", function (e) {
      const m = e.data || {};
      const frame = e.source === vFrame.contentWindow ? vFrame : e.source === sFrame.contentWindow ? sFrame : null;
      if (!frame) return;
      if (m.type === "ready") { readyFor.add(frame); refresh(); return; }
      if (m.type !== "result") return;
      if (frame === vFrame) {
        vStatus.textContent = m.fired
          ? "⚠ Injected script executed (contained in the sandbox). innerHTML parsed your input as markup."
          : (m.nodeCount ? "Markup injected as " + m.nodeCount + " live element(s). Any inline handler was blocked here by the page's Content Security Policy — that block is the defense working."
                         : "Rendered as elements.");
        vStatus.className = "hint";
      } else {
        sStatus.textContent = "Rendered as literal text — inert. textContent never lets input become markup.";
      }
    });

    const input = el("textarea", { class: "input", rows: "2", spellcheck: "false" });
    input.value = "<img src=x onerror=\"alert('xss')\">";
    const benign = el("button", { type: "button", class: "btn btn-ghost" }, "Benign markup");
    const attack = el("button", { type: "button", class: "btn btn-ghost" }, "Attack payload");
    benign.addEventListener("click", () => { input.value = "<b>hello</b> <i>there</i>"; refresh(); });
    attack.addEventListener("click", () => { input.value = "<img src=x onerror=\"alert('xss')\">"; refresh(); });
    input.addEventListener("input", () => { clearTimeout(input._t); input._t = setTimeout(refresh, 150); });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "LAB / SIM"), el("h3", null, "Cross-Site Scripting — innerHTML vs. textContent")),
      el("div", { class: "widget-body" },
        el("div", { class: "field" }, el("label", null, "Comment field (your input is rendered two ways below)"), input),
        el("div", null, benign, "  ", attack),
        el("div", { class: "two-col" },
          el("div", null, el("p", { class: "pane-title" }, el("span", { class: "state vuln" }, "innerHTML"), " Vulnerable"), vFrame, vStatus),
          el("div", null, el("p", { class: "pane-title" }, el("span", { class: "state safe" }, "textContent"), " Fixed"), sFrame, sStatus))));

    // Fallback in case a frame's ready message is missed.
    setTimeout(refresh, 400);
  };
})();
