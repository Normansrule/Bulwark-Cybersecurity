/* widgets/quiz.js — a per-lesson knowledge check. Receives its questions as the
   second argument from the lesson's widget block: fn(root, data), where data is
   [{ q, choices:[...], answer:<index>, explain }]. Renders radio questions, grades
   on submit, and shows the explanation for each. */
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
  let uid = 0;

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.quiz = function (root, data) {
    const qs = Array.isArray(data) ? data : [];
    if (!qs.length) { root.append(el("div", { class: "widget-body" }, "No questions.")); return; }
    const gid = "q" + (uid++);
    const items = [];

    const body = el("div", { class: "widget-body quiz" });
    qs.forEach((item, qi) => {
      const block = el("div", { class: "quiz-q" });
      block.append(el("p", { class: "quiz-prompt" }, (qi + 1) + ". " + item.q));
      const opts = [];
      item.choices.forEach((choice, ci) => {
        const id = gid + "_" + qi + "_" + ci;
        const input = el("input", { type: "radio", name: gid + "_" + qi, id: id, value: String(ci) });
        const label = el("label", { class: "quiz-opt", for: id }, input, el("span", null, choice));
        opts.push({ input, label, ci });
        block.append(label);
      });
      const fb = el("p", { class: "quiz-fb", hidden: "" });
      block.append(fb);
      items.push({ item, opts, fb, qi });
      body.append(block);
    });

    const check = el("button", { type: "button", class: "btn btn-primary" }, "Check answers");
    const score = el("span", { class: "state quiz-score", hidden: "" });
    const reset = el("button", { type: "button", class: "btn btn-ghost", hidden: "" }, "Try again");

    check.addEventListener("click", () => {
      let correct = 0;
      items.forEach(({ item, opts, fb }) => {
        const chosen = opts.find((o) => o.input.checked);
        opts.forEach((o) => {
          o.label.classList.remove("right", "wrong");
          if (o.ci === item.answer) o.label.classList.add("right");
          else if (chosen && o.ci === chosen.ci) o.label.classList.add("wrong");
        });
        const ok = chosen && chosen.ci === item.answer;
        if (ok) correct++;
        fb.hidden = false;
        fb.textContent = (ok ? "Correct. " : chosen ? "Not quite. " : "No answer. ") + item.explain;
        fb.className = "quiz-fb " + (ok ? "ok" : "no");
      });
      score.hidden = false; score.className = "state quiz-score " + (correct === items.length ? "safe" : "");
      score.textContent = correct + " / " + items.length;
      reset.hidden = false;
    });
    reset.addEventListener("click", () => {
      items.forEach(({ opts, fb }) => { opts.forEach((o) => { o.input.checked = false; o.label.classList.remove("right", "wrong"); }); fb.hidden = true; });
      score.hidden = true; reset.hidden = true;
    });

    body.append(el("div", { class: "quiz-actions" }, check, reset, score));
    root.append(el("div", { class: "widget-head" }, el("span", { class: "tag" }, "CHECK"), el("h3", null, "Quick knowledge check")), body);
  };
})();
