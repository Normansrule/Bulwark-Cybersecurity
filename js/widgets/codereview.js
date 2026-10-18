/* widgets/codereview.js — secure code review practice. Shows a short server
   snippet; the learner clicks the line with the flaw, then picks the fix.
   Snippets are authored data (content.js) rendered with textContent and never
   executed. data: [{ title, file, lines:[...], bug:<line index>, why, fixes:[...], answer:<index>, explain }] */
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

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.codereview = function (root, data) {
    const items = Array.isArray(data) ? data : [];
    let i = 0, found = false, score = 0;
    const done = new Set();

    const title = el("p", { class: "pane-title" });
    const code = el("div", { class: "cr-code", role: "listbox", "aria-label": "Code lines; pick the one with the flaw" });
    const step = el("p", { class: "hint" });
    const fixes = el("div", { class: "cr-fixes" });
    const fb = el("p", { class: "quiz-fb", hidden: "" });
    const prev = el("button", { type: "button", class: "btn btn-ghost" }, "← Previous");
    const next = el("button", { type: "button", class: "btn btn-primary" }, "Next snippet →");
    const tally = el("span", { class: "state" });

    function paint() {
      const it = items[i];
      found = false;
      title.textContent = (i + 1) + " / " + items.length + " · " + it.title + "  —  " + it.file;
      code.textContent = "";
      it.lines.forEach((ln, k) => {
        const row = el("button", { type: "button", class: "cr-line", role: "option" }, el("span", { class: "cr-no" }, String(k + 1)), el("span", { class: "cr-src" }, ln || " "));
        row.addEventListener("click", () => pickLine(k, row));
        code.append(row);
      });
      step.textContent = "Step 1: click the line that introduces the vulnerability.";
      fixes.textContent = ""; fixes.hidden = true;
      fb.hidden = true;
      prev.disabled = i === 0;
      next.disabled = i === items.length - 1;
      tally.textContent = score + " / " + items.length + " fixed";
      tally.className = "state" + (score === items.length ? " safe" : "");
    }
    function pickLine(k, row) {
      if (found) return;
      const it = items[i];
      [...code.children].forEach((r) => r.classList.remove("cr-wrong"));
      if (k !== it.bug) { row.classList.add("cr-wrong"); step.textContent = "Not that one — line " + (k + 1) + " is fine. Keep looking."; return; }
      found = true;
      row.classList.add("cr-bug");
      step.textContent = "Found it: " + it.why + "  Step 2: choose the fix.";
      fixes.hidden = false;
      it.fixes.forEach((f, fi) => {
        const b = el("button", { type: "button", class: "quiz-opt cr-fix" }, f);
        b.addEventListener("click", () => {
          [...fixes.children].forEach((c) => c.classList.remove("right", "wrong"));
          const ok = fi === it.answer;
          b.classList.add(ok ? "right" : "wrong");
          fb.hidden = false;
          fb.className = "quiz-fb " + (ok ? "ok" : "no");
          fb.textContent = (ok ? "Correct. " : "Not the best fix. ") + it.explain;
          if (ok && !done.has(i)) { done.add(i); score++; tally.textContent = score + " / " + items.length + " fixed"; tally.className = "state" + (score === items.length ? " safe" : ""); }
        });
        fixes.append(b);
      });
    }
    prev.addEventListener("click", () => { if (i > 0) { i--; paint(); } });
    next.addEventListener("click", () => { if (i < items.length - 1) { i++; paint(); } });

    if (!items.length) { root.append(el("div", { class: "widget-body" }, "No snippets.")); return; }
    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "CODE REVIEW"), el("h3", null, "Spot the flaw, then pick the fix")),
      el("div", { class: "widget-body" }, title, code, step, fixes, fb, el("div", { class: "quiz-actions" }, prev, next, tally)));
    paint();
  };
})();
