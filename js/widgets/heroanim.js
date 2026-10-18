/* widgets/heroanim.js — a restrained "decoder" effect for the hero: a rotating
   word scrambles through random glyphs and resolves. One orchestrated motion,
   disabled under prefers-reduced-motion, and self-terminating when off-screen. */
(function () {
  "use strict";
  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.heroanim = function (root) {
    const words = ["ciphers", "the handshake", "key exchange", "zero trust", "the quantum frontier"];
    const span = document.createElement("span");
    span.className = "hero-scramble";
    root.append(span);

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { span.textContent = words[0]; return; }

    const glyphs = "!<>-_\\/[]{}=+*^?#01x×";
    let wi = 0;
    function scrambleTo(target, done) {
      const dur = 520, start = performance.now();
      function frame(now) {
        if (!document.contains(span)) return;
        const p = Math.min(1, (now - start) / dur);
        const reveal = Math.floor(p * target.length);
        let out = target.slice(0, reveal);
        for (let i = reveal; i < target.length; i++) out += glyphs[(Math.random() * glyphs.length) | 0];
        span.textContent = out;
        if (p < 1) requestAnimationFrame(frame); else done && setTimeout(done, 1500);
      }
      requestAnimationFrame(frame);
    }
    function next() { if (!document.contains(span)) return; scrambleTo(words[wi = (wi + 1) % words.length], next); }
    scrambleTo(words[0], next);
  };
})();
