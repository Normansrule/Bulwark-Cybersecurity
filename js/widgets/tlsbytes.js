/* widgets/tlsbytes.js — a byte-level walk through a TLS 1.3 ClientHello.
   The message is assembled here from its fields, so every length byte is
   internally consistent (a test re-checks the arithmetic). Click a field to
   highlight its bytes and read what they mean. This is a representative
   ClientHello for teaching structure; a full real capture lives at
   tls13.xargs.org. */
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
  const seq = (n, start) => Array.from({ length: n }, (_v, i) => (start + i) & 0xff);

  // Build the ClientHello field by field; compute lengths so they're consistent.
  function build() {
    const random = seq(32, 0xa0);
    const sid = seq(32, 0x10);
    const cs = [0x13, 0x01, 0x13, 0x02, 0x13, 0x03];          // AES-128-GCM, AES-256-GCM, CHACHA20
    const key = seq(32, 0x40);                                 // ephemeral X25519 public key
    // extensions
    const extSV = [0x00, 0x2b, 0x00, 0x03, 0x02, 0x03, 0x04]; // supported_versions -> TLS 1.3 (03 04)
    const ksEntry = [0x00, 0x1d, 0x00, 0x20, ...key];         // group x25519 (001d) + keylen 32 + key
    const ksList = [0x00, ksEntry.length, ...ksEntry];        // client_shares list
    const extKS = [0x00, 0x33, 0x00, ksList.length, ...ksList];
    const exts = [...extSV, ...extKS];

    const fields = [];
    let off = 0;
    const add = (bytes, label, desc) => { fields.push({ off, len: bytes.length, bytes, label, desc }); off += bytes.length; };

    // handshake body first (so we can size the headers)
    const bodyStart = off; // we'll prepend headers after; simpler: build headers with known body length
    // legacy_version + random + session id + cipher suites + compression + extensions
    const bodyFields = [];
    let boff = 0;
    const addB = (bytes, label, desc) => { bodyFields.push({ boff, len: bytes.length, bytes, label, desc }); boff += bytes.length; };
    addB([0x03, 0x03], "legacy_version", "0x0303 = TLS 1.2, kept for compatibility. The real version is negotiated in the supported_versions extension below.");
    addB(random, "random", "32 bytes of client randomness, mixed into the key schedule so each session's keys are unique.");
    addB([sid.length], "session_id length", "Length of the legacy session id that follows (32).");
    addB(sid, "session_id", "A legacy field in TLS 1.3; echoed by the server. Not used for real session resumption anymore.");
    addB([0x00, cs.length], "cipher_suites length", "Bytes of cipher suites that follow (6 = three suites).");
    addB(cs, "cipher_suites", "The AEAD + hash combinations the client offers: TLS_AES_128_GCM_SHA256, _AES_256_GCM_SHA384, _CHACHA20_POLY1305_SHA256.");
    addB([0x01, 0x00], "compression_methods", "One method: null (0x00). TLS 1.3 forbids compression, which had leaked secrets (the CRIME attack).");
    addB([0x00, exts.length], "extensions length", "Total bytes of extensions that follow.");
    addB(extSV, "ext: supported_versions", "This is where TLS 1.3 is actually chosen: the 03 04 at the end means TLS 1.3.");
    addB(extKS, "ext: key_share", "The client's ephemeral Diffie–Hellman public key (group x25519). Sending it now is why 1.3 sets up keys in one round trip.");

    const bodyLen = boff;
    const hsHeader = [0x01, (bodyLen >> 16) & 0xff, (bodyLen >> 8) & 0xff, bodyLen & 0xff]; // type=ClientHello + 3-byte length
    const recLen = hsHeader.length + bodyLen;
    const recHeader = [0x16, 0x03, 0x01, (recLen >> 8) & 0xff, recLen & 0xff]; // type=handshake, legacy record version, length

    add(recHeader, "record header", "TLS record: 0x16 = handshake, 0x0301 legacy record version, then the 2-byte record length (" + recLen + ").");
    add(hsHeader, "handshake header", "0x01 = ClientHello, then a 3-byte length of the message body (" + bodyLen + ").");
    bodyFields.forEach((bf) => add(bf.bytes, bf.label, bf.desc));

    const all = fields.flatMap((f) => f.bytes);
    return { all, fields, recLen, bodyLen };
  }

  window.BulwarkWidgets = window.BulwarkWidgets || {};
  window.BulwarkWidgets.tlsbytes = function (root) {
    const model = build();
    let sel = 0;

    const grid = el("div", { class: "hex" });
    const cells = [];
    model.all.forEach((b, i) => {
      const c = el("span", { class: "hexb" }, b.toString(16).padStart(2, "0"));
      c.addEventListener("click", () => { sel = fieldOf(i); render(); });
      cells.push(c); grid.append(c);
    });
    function fieldOf(i) { return model.fields.findIndex((f) => i >= f.off && i < f.off + f.len); }

    const legend = el("div", { class: "seg hex-legend" });
    model.fields.forEach((f, k) => {
      const btn = el("button", { type: "button", "aria-pressed": String(k === 0) }, f.label);
      btn.addEventListener("click", () => { sel = k; render(); });
      f._btn = btn; legend.append(btn);
    });
    const detail = el("div", { class: "tm-panel" });

    function render() {
      const f = model.fields[sel];
      cells.forEach((c, i) => { c.className = "hexb" + (i >= f.off && i < f.off + f.len ? " on" : ""); });
      model.fields.forEach((ff, k) => ff._btn.setAttribute("aria-pressed", String(k === sel)));
      detail.textContent = "";
      detail.append(el("p", { class: "pane-title" }, f.label + "  ·  bytes " + f.off + "–" + (f.off + f.len - 1) + " (" + f.len + ")"));
      detail.append(el("p", { class: "hint" }, f.desc));
    }

    root.append(
      el("div", { class: "widget-head" }, el("span", { class: "tag" }, "BYTES"), el("h3", null, "Inside a ClientHello — every field explained")),
      el("div", { class: "widget-body" },
        el("div", { class: "hex-scroll" }, grid),
        legend, detail,
        el("p", { class: "hint" }, "A representative TLS 1.3 ClientHello (" + (model.all.length) + " bytes), assembled so its length fields are consistent. For a full byte-for-byte capture of a real connection, see The Illustrated TLS 1.3 Connection on the Sources page.")));
    render();
  };
})();
