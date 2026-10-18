/* widgets/apidefense.js — an API gateway control board. A fixed replay of
   requests arrives at a pretend in-page API; the learner switches defensive
   controls on and watches which requests get through. Nothing is sent
   anywhere: each request is a described record, and each control is a small
   predicate. The goal is "every abusive request stopped, every legitimate one
   still served". */
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

  const CONTROLS = [
    { id: "objauthz", name: "Object-level authorization", what: "Every handler checks the caller owns (or may see) the specific record, in one shared policy function." },
    { id: "fnauthz", name: "Function-level authorization", what: "Admin-only routes check the caller's role server-side; hiding the button is not a control." },
    { id: "authn", name: "Strong authentication", what: "Login is throttled per account and per client, errors are generic, MFA is offered, and tokens are verified (signature, expiry, audience)." },
    { id: "schema", name: "Request schema + field allowlist", what: "Bodies are validated against a schema; only fields the client may set are bound, and only fields it may see are returned." },
    { id: "limits", name: "Rate limits + page-size caps", what: "Per-client token buckets and a maximum page size keep one caller from exhausting the service." },
    { id: "egress", name: "Outbound allowlist", what: "Server-side fetches go only to approved hosts over https; private, loopback and metadata addresses are refused after DNS resolution." }
  ];

  // bad: true marks abuse. needs: the control that stops it (null for legit traffic).
  const REQUESTS = [
    { who: "alice", desc: "GET her own order #1001", bad: false, needs: null, cls: "normal use" },
    { who: "alice", desc: "GET order #1003, which belongs to bob", bad: true, needs: "objauthz", cls: "API1 BOLA" },
    { who: "alice", desc: "DELETE /admin/users/bob with a regular-user token", bad: true, needs: "fnauthz", cls: "API5 BFLA" },
    { who: "unknown", desc: "5,000 password guesses against one account in a minute", bad: true, needs: "authn", cls: "API2 Broken authentication" },
    { who: "alice", desc: "PATCH her profile setting role=admin alongside her new display name", bad: true, needs: "schema", cls: "API3 Property-level authorization" },
    { who: "alice", desc: "GET her profile; response would include the password hash field", bad: true, needs: "schema", cls: "API3 Excessive data exposure" },
    { who: "bob", desc: "GET /products?limit=1000000", bad: true, needs: "limits", cls: "API4 Resource consumption" },
    { who: "bob", desc: "Link-preview feature asked to fetch an internal-only address", bad: true, needs: "egress", cls: "API7 SSRF" },
    { who: "bob", desc: "Link-preview of a public news article", bad: false, needs: null, cls: "normal use" },
    { who: "bob", desc: "PATCH his display name", bad: false, needs: null, cls: "normal use" }
  ];

  function evaluate(on) {
    return REQUESTS.map((r) => ({ r, blocked: !!(r.needs && on[r.needs]) }));
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.apidefense = function (root) {
    const on = {};
    const grid = el("div", { class: "api-ctl" });
    const rows = el("div", { class: "api-rows" });
    const score = el("p", { class: "hint" });

    CONTROLS.forEach((c) => {
      const box = el("input", { type: "checkbox", id: "apictl-" + c.id });
      box.addEventListener("change", () => { on[c.id] = box.checked; paint(); });
      grid.append(el("label", { class: "api-opt", for: "apictl-" + c.id }, box, el("span", null, el("b", null, c.name), el("span", { class: "src-meta" }, c.what))));
    });

    function paint() {
      rows.textContent = "";
      let stopped = 0, bad = 0;
      evaluate(on).forEach(({ r, blocked }) => {
        if (r.bad) bad++;
        if (r.bad && blocked) stopped++;
        const status = blocked ? "403/429 blocked" : (r.bad ? "200 served — abuse got through" : "200 served");
        const cls = blocked ? "api-row safe" : (r.bad ? "api-row vuln" : "api-row");
        rows.append(el("div", { class: cls },
          el("span", { class: "api-cls" }, r.cls),
          el("span", null, r.who + ": " + r.desc),
          el("span", { class: "api-status" }, status)));
      });
      score.textContent = stopped + " of " + bad + " abusive requests stopped; legitimate requests are never blocked. " +
        (stopped === bad ? "Every class is covered: this is defense in depth at the API layer." : "Each remaining red row maps to one missing control.");
    }

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "API GATEWAY"), el("h3", null, "Turn on the controls; watch the abuse stop")),
      el("div", { class: "widget-body" },
        el("div", { class: "field" }, el("label", null, "Defensive controls"), grid),
        el("div", { class: "field" }, el("label", null, "Replayed traffic (an in-page record, nothing is sent)"), rows),
        score));
    paint();
  };
  window.BulwarkWidgets.apidefense._evaluate = evaluate;
  window.BulwarkWidgets.apidefense._controls = CONTROLS.map((c) => c.id);
})();
