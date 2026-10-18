/* widgets/stego.js — least-significant-bit image steganography, in the browser.
   Hide text in the low bit of each color channel of a generated image, then read
   it back. The point of the lesson: hiding is not encrypting. Everything is local;
   the image is drawn on a canvas, no upload. */
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
  const W = 200, H = 130;
  const enc = new TextEncoder(), dec = new TextDecoder();

  function paintBase(ctx) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#123"); g.addColorStop(0.5, "#2a6b60"); g.addColorStop(1, "#c8892f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (Math.random() * 0.25) + ")";
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 14, 0, 7); ctx.fill();
    }
  }
  function bitsOf(bytes) { const b = []; for (const byte of bytes) for (let i = 7; i >= 0; i--) b.push((byte >> i) & 1); return b; }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.stego = function (root) {
    const head = el("div", { class: "widget-head" }, el("span", { class: "tag" }, "STEGO"), el("h3", null, "Hide a message in an image (LSB)"));
    const orig = el("canvas", { width: W, height: H, class: "stego-canvas" });
    const octx = orig.getContext ? orig.getContext("2d") : null;
    const stego = el("canvas", { width: W, height: H, class: "stego-canvas" });
    const sctx = stego.getContext ? stego.getContext("2d") : null;
    if (!octx || !sctx) {
      root.append(head, el("div", { class: "widget-body" }, el("div", { class: "note note-info" }, el("div", { class: "ico" }, "i"), el("p", null, "Open this in a browser to try the image steganography demo."))));
      return;
    }
    paintBase(octx); sctx.drawImage(orig, 0, 0);

    const msg = el("input", { class: "input", type: "text", value: "meet at dawn", spellcheck: "false" });
    const hideBtn = el("button", { type: "button", class: "btn btn-primary" }, "Hide in image →");
    const extractBtn = el("button", { type: "button", class: "btn btn-ghost" }, "← Extract");
    const out = el("div", { class: "mono-out" });
    const cap = el("p", { class: "hint" });
    const capacity = Math.floor((W * H * 3 - 16) / 8);

    function hide() {
      const bytes = enc.encode(msg.value).slice(0, capacity);
      const len = bytes.length;
      const header = new Uint8Array([(len >> 8) & 0xff, len & 0xff]);
      const bits = bitsOf(header).concat(bitsOf(bytes));
      const img = octx.getImageData(0, 0, W, H);
      const d = img.data;
      let bi = 0;
      for (let p = 0; p < d.length && bi < bits.length; p += 4) {
        for (let c = 0; c < 3 && bi < bits.length; c++) d[p + c] = (d[p + c] & 0xfe) | bits[bi++];
      }
      sctx.putImageData(img, 0, 0);
      cap.textContent = "Hidden " + len + " bytes. The stego image looks identical — the change is one bit per channel. Capacity here is ~" + capacity + " bytes.";
      out.textContent = "";
    }
    function extract() {
      const d = sctx.getImageData(0, 0, W, H).data;
      const read = (count) => { const bits = []; let bi = 0; for (let p = 0; p < d.length && bits.length < count; p += 4) for (let c = 0; c < 3 && bits.length < count; c++) bits.push(d[p + c] & 1); return bits; };
      const all = read(16 + 65535 * 8);
      let L = 0; for (let i = 0; i < 16; i++) L = (L << 1) | all[i];
      const bytes = new Uint8Array(L);
      for (let i = 0; i < L; i++) { let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | all[16 + i * 8 + j]; bytes[i] = v; }
      out.textContent = "Extracted: " + (L ? dec.decode(bytes) : "(nothing hidden yet)");
    }
    hideBtn.addEventListener("click", hide);
    extractBtn.addEventListener("click", extract);

    root.append(head, el("div", { class: "widget-body" },
      el("div", { class: "field" }, el("label", null, "Secret message"), msg),
      el("div", { class: "quiz-actions" }, hideBtn, extractBtn),
      el("div", { class: "two-col" },
        el("div", null, el("p", { class: "pane-title" }, "Original"), orig),
        el("div", null, el("p", { class: "pane-title" }, "With hidden message"), stego)),
      el("div", { class: "field" }, el("label", null, "Read it back"), out),
      cap,
      el("div", { class: "note note-defend" }, el("div", { class: "ico" }, "✓"),
        el("p", null, "Steganography hides that a message exists; it does not protect the message. Anyone who suspects LSB stego can read it in seconds. To keep a message secret, encrypt it first — then hiding is a bonus, not the defense."))));
    hide();
  };
})();
