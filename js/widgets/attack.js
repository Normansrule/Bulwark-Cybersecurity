/* widgets/attack.js — a teaching subset of the MITRE ATT&CK matrix.
   Columns are tactics (the attacker's goal), cells are example techniques. Pick a
   technique to see it in plain language plus the defensive move and, where one
   exists, the Bulwark lesson that covers it. This is a curated slice for learning,
   not the full matrix; the real one is at attack.mitre.org. */
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
  const TACTICS = [
    { name: "Initial Access", techs: [
      { t: "Exploit Public-Facing App", d: "Break in through a bug in an internet-facing service — often an injection flaw.", fix: "Patch, validate input, and parameterize queries.", lesson: "injection" },
      { t: "Valid Accounts", d: "Log in with stolen or guessed credentials — no exploit needed.", fix: "Multi-factor and passkeys; screen against breached-password lists.", lesson: "passwords-auth" }
    ]},
    { name: "Execution", techs: [
      { t: "Command & Scripting", d: "Run attacker commands via a shell or interpreter the app exposes.", fix: "Never pass input to a shell; use fixed argument vectors and allowlists.", lesson: "injection" }
    ]},
    { name: "Persistence", techs: [
      { t: "Create Account", d: "Add a new account so access survives a password reset.", fix: "Alert on account creation; review privileged accounts regularly.", lesson: "detection-response" }
    ]},
    { name: "Credential Access", techs: [
      { t: "Brute Force", d: "Guess passwords at scale, including credential stuffing.", fix: "Rate-limit, lock out, slow salted hashing, and require a second factor.", lesson: "passwords-auth" },
      { t: "Unsecured Credentials", d: "Find secrets left in code, configs, or logs.", fix: "Keep secrets out of the repo; scan for them; rotate on exposure.", lesson: "owasp-top10" }
    ]},
    { name: "Lateral Movement", techs: [
      { t: "Use Alternate Auth", d: "Reuse a stolen token or key to hop to another system.", fix: "Least privilege and network segmentation shrink where a token works.", lesson: "cia-triad" }
    ]},
    { name: "Exfiltration", techs: [
      { t: "Exfil Over Web", d: "Smuggle stolen data out over ordinary web traffic.", fix: "Egress filtering and alerting on unusual outbound volume.", lesson: "detection-response" }
    ]},
    { name: "Impact", techs: [
      { t: "Endpoint DoS", d: "Overwhelm a service so it can't serve real users.", fix: "Rate limiting, caching, absorption — the availability lesson.", lesson: "availability-ddos" },
      { t: "Data Encrypted (Ransomware)", d: "Encrypt the victim's data and demand payment.", fix: "Tested offline backups; least privilege; fast detection.", lesson: "detection-response" }
    ]}
  ];

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.attack = function (root) {
    const detail = el("div", { class: "atk-detail" });
    const grid = el("div", { class: "atk-grid" });
    let current = null;

    function select(btn, tech) {
      if (current) current.setAttribute("aria-pressed", "false");
      current = btn; btn.setAttribute("aria-pressed", "true");
      detail.textContent = "";
      detail.append(el("p", { class: "pane-title" }, tech.t));
      detail.append(el("p", { class: "hint" }, tech.d));
      const fix = el("p", { class: "hint" }); fix.append(el("b", { class: "atk-fixlabel" }, "Defense: "), tech.fix);
      detail.append(fix);
      const link = el("a", { class: "btn btn-ghost" }, "Go to the lesson →");
      link.href = "#/lesson/" + tech.lesson;
      detail.append(link);
    }

    TACTICS.forEach((tac) => {
      const col = el("div", { class: "atk-col" });
      col.append(el("div", { class: "atk-tac" }, tac.name));
      tac.techs.forEach((tech) => {
        const b = el("button", { type: "button", class: "atk-tech", "aria-pressed": "false" }, tech.t);
        b.addEventListener("click", () => select(b, tech));
        col.append(b);
      });
      grid.append(col);
    });

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "ATT&CK"), el("h3", null, "Adversary techniques → defenses")),
      el("div", { class: "widget-body" },
        el("p", { class: "hint" }, "A teaching subset of the MITRE ATT&CK matrix. Columns are the attacker's goals; tap a technique to see the defensive move. The full matrix lives at attack.mitre.org."),
        el("div", { class: "atk-scroll" }, grid),
        detail));
    // open the first technique so the panel isn't empty
    const first = grid.querySelector(".atk-tech");
    if (first) select(first, TACTICS[0].techs[0]);
  };
})();
