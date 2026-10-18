/* widgets/challenge.js — a defensive capture-the-flag runner. Reads challenges
   from window.BULWARK.challenges, checks answers with each challenge's own pure
   function, and persists solved state + score in localStorage. Every challenge is
   a puzzle you reason through — none require attacking anything real. */
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
  const KEY = "bulwark.ctf";
  function loadSolved() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) { return new Set(); } }
  function saveSolved(set) { try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch (e) {} }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.challenge = function (root) {
    const challenges = (window.BULWARK && window.BULWARK.challenges) || [];
    const solved = loadSolved();
    const totalPts = challenges.reduce((s, c) => s + c.points, 0);

    const scoreLine = el("div", { class: "ctf-score" });
    const bar = el("div", { class: "bar" }, el("span"));
    const barFill = bar.firstChild;
    function refreshScore() {
      const got = challenges.filter((c) => solved.has(c.id)).reduce((s, c) => s + c.points, 0);
      scoreLine.textContent = "";
      scoreLine.append(el("span", { class: "state safe" }, got + " / " + totalPts + " points"), " ", el("span", { class: "src-meta" }, solved.size + " of " + challenges.length + " solved"));
      barFill.style.width = (totalPts ? got / totalPts * 100 : 0) + "%";
    }

    const list = el("div", { class: "ctf-list" });
    challenges.forEach((c) => {
      const card = el("div", { class: "ctf-card" + (solved.has(c.id) ? " done" : "") });
      const head = el("div", { class: "ctf-head" });
      head.append(el("span", { class: "chip" }, c.cat), el("span", { class: "ctf-title" }, c.title), el("span", { class: "ctf-pts" }, c.points + " pts"));
      card.append(head);
      card.append(el("p", { class: "ctf-prompt" }, c.prompt));
      if (c.code) card.append(el("pre", { class: "ctf-code" }, c.code));

      const input = el("input", { class: "input", type: "text", spellcheck: "false", placeholder: c.placeholder || "Your answer…" });
      const submit = el("button", { type: "button", class: "btn btn-primary" }, "Submit");
      const fb = el("span", { class: "ctf-fb" });
      const hintBtn = el("button", { type: "button", class: "btn btn-ghost" }, "Hint");
      const hint = el("p", { class: "hint", hidden: "" }, c.hint || "No hint for this one.");
      hintBtn.addEventListener("click", () => { hint.hidden = !hint.hidden; });

      function markSolved() {
        card.classList.add("done");
        input.disabled = true; submit.disabled = true;
        fb.className = "ctf-fb ok"; fb.textContent = "✓ Solved";
      }
      function tryAnswer() {
        let ok = false;
        try { ok = !!c.check(input.value); } catch (e) { ok = false; }
        if (ok) { solved.add(c.id); saveSolved(solved); refreshScore(); markSolved(); }
        else { fb.className = "ctf-fb no"; fb.textContent = "Not quite — try again"; }
      }
      submit.addEventListener("click", tryAnswer);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryAnswer(); });

      card.append(el("div", { class: "ctf-actions" }, input, submit, hintBtn, fb), hint);
      if (solved.has(c.id)) markSolved();
      list.append(card);
    });

    const reset = el("button", { type: "button", class: "btn btn-ghost" }, "Reset progress");
    reset.addEventListener("click", () => { solved.clear(); saveSolved(solved); location.reload(); });

    root.append(
      el("div", { class: "ctf-top" }, scoreLine, bar),
      list,
      el("div", { class: "ctf-footer" }, reset));
    refreshScore();
  };
})();
