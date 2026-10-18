/* widgets/exposure.js — port scanning from the defender's side. A pretend
   server in the page runs a handful of services; the learner sets firewall and
   binding choices and sees what an outside scan *would* report (open / closed /
   filtered) plus what such a scan looks like in the defender's logs. No packets
   are sent: the "scan" is a lookup over the table below. */
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

  // public: should the internet reach it?  risk: why exposure matters.
  const SERVICES = [
    { port: 443,  name: "HTTPS (web app)", public: true,  risk: "Intended. This is the front door." },
    { port: 80,   name: "HTTP (redirects to HTTPS)", public: true, risk: "Fine if it only redirects to 443." },
    { port: 22,   name: "SSH (admin)", public: false, risk: "Constant password-guessing from the whole internet; restrict to a VPN or bastion and use keys." },
    { port: 5432, name: "PostgreSQL", public: false, risk: "A database should never face the internet; bind it to a private interface." },
    { port: 6379, name: "Redis cache", public: false, risk: "Often runs without authentication by default; exposed instances get wiped or abused." },
    { port: 9200, name: "Search index (admin API)", public: false, risk: "Exposed search clusters are a classic source of large data leaks." }
  ];
  const UNUSED = [21, 23, 25, 3389, 8080];

  function scanView(cfg) {
    const rows = SERVICES.map((s) => {
      let state;
      if (s.public) state = "open";
      else if (cfg.localOnly && s.port !== 22) state = cfg.defaultDeny ? "filtered" : "closed";  // not listening publicly
      else if (s.port === 22 && cfg.vpnSsh) state = "filtered";                                 // only the admin network gets through
      else state = cfg.defaultDeny ? "filtered" : "open";
      return { port: s.port, name: s.name, state, should: s.public, risk: s.risk };
    });
    UNUSED.forEach((p) => rows.push({ port: p, name: "(nothing running)", state: cfg.defaultDeny ? "filtered" : "closed", should: false, risk: "" }));
    return rows.sort((a, b) => a.port - b.port);
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.exposure = function (root) {
    const cfg = { defaultDeny: false, vpnSsh: false, localOnly: false };
    const opts = [
      ["defaultDeny", "Firewall: default deny inbound", "Only 80 and 443 are allowed in; everything else is dropped silently."],
      ["vpnSsh", "SSH only via VPN / bastion", "Port 22 accepts connections only from the admin network."],
      ["localOnly", "Bind data services to a private interface", "Database, cache and search listen on 127.0.0.1 or a private subnet, not 0.0.0.0."]
    ];
    const ctl = el("div", { class: "api-ctl" });
    opts.forEach(([k, name, what]) => {
      const box = el("input", { type: "checkbox", id: "exp-" + k });
      box.addEventListener("change", () => { cfg[k] = box.checked; paint(); });
      ctl.append(el("label", { class: "api-opt", for: "exp-" + k }, box, el("span", null, el("b", null, name), el("span", { class: "src-meta" }, what))));
    });
    const table = el("div", { class: "api-rows" });
    const summary = el("p", { class: "hint" });
    const log = el("div", { class: "log" });

    function paint() {
      const rows = scanView(cfg);
      table.textContent = "";
      let bad = 0;
      rows.forEach((r) => {
        const exposed = r.state === "open" && !r.should;
        if (exposed) bad++;
        const cls = exposed ? "api-row vuln" : (r.state === "open" ? "api-row" : "api-row safe");
        table.append(el("div", { class: cls },
          el("span", { class: "api-cls" }, "tcp/" + r.port),
          el("span", null, r.name + (exposed ? " — " + r.risk : "")),
          el("span", { class: "api-status" }, r.state)));
      });
      summary.textContent = bad
        ? bad + " service" + (bad > 1 ? "s" : "") + " that should be private would answer anyone on the internet. Automated scanners sweep the whole IPv4 space continuously, so assume they will be found within hours."
        : "Only the web front door answers. Everything else is filtered (dropped) or not listening publicly: the smallest possible attack surface.";
      log.textContent = "";
      const t = (s) => "03:12:" + String(s).padStart(2, "0");
      const fp = cfg.defaultDeny ? "DROP" : "SYN";
      [21, 22, 23, 25, 80, 443, 3389, 5432].forEach((p, k) => log.append(el("div", null, t(k) + "  " + fp + " from 198.51.100.7 to tcp/" + p)));
      log.append(el("div", { class: "flag" }, t(9) + "  ALERT one source touched 8 distinct ports in 9 s: likely port scan (ATT&CK T1046). Rate-limit and watch for follow-up logins."));
    }

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "EXPOSURE"), el("h3", null, "What would a port scan see? Shrink it.")),
      el("div", { class: "widget-body" },
        el("div", { class: "field" }, el("label", null, "Your server's configuration"), ctl),
        el("div", { class: "field" }, el("label", null, "Outside view (computed from the table, nothing is sent)"), table),
        summary,
        el("div", { class: "field" }, el("label", null, "Your firewall log during a scan (198.51.100.0/24 is a documentation range)"), log)));
    paint();
  };
  window.BulwarkWidgets.exposure._scanView = scanView;
})();
