/*
 * content.js — the curriculum as data.
 *
 * Lessons are structured objects, not hand-written HTML, so the renderer in
 * app.js can escape every string before it reaches the DOM. Authored prose may
 * use a tiny, fixed markup vocabulary: **bold**, `code`, and [text](https://url).
 * Anything a learner types is inserted with textContent by the widgets — never
 * through this path.
 *
 * Block types understood by app.renderBlocks():
 *   {t:'p',    md}                      paragraph
 *   {t:'h',    text}                    sub-heading
 *   {t:'list', items:[md], ordered?}    bullet / numbered list
 *   {t:'note', kind, md}               callout: 'info'|'defend'|'attack'|'history'
 *   {t:'steps',items:[{h,md}]}         numbered walkthrough
 *   {t:'eq',   intuition, expr, where:[{sym,def}], example}   equation block
 *   {t:'table',head:[], rows:[[md]]}   table
 *   {t:'quote',md, cite}               pull quote
 *   {t:'widget',id}                    mount an interactive widget by id
 *
 * Each lesson also carries `verified`: the date its claims and cited sources
 * were last checked. It's shown as a badge; re-check and bump it on review.
 */
window.BULWARK = (function () {
  "use strict";

  const eras = [
    { id: "foundations", num: "01", period: "~50 BCE – 1945", title: "Foundations", tagline: "Ciphers, and how each one fell." },
    { id: "core",        num: "02", period: "the vocabulary",  title: "Core concepts", tagline: "What we mean by “secure.”" },
    { id: "live",        num: "03", period: "today's internet", title: "Live cryptography", tagline: "The math that protects every request." },
    { id: "applied",     num: "04", period: "the running web",  title: "Applied security", tagline: "Where real systems get broken." },
    { id: "api",         num: "05", period: "the API layer",  title: "API security", tagline: "Every endpoint is a front door." },
    { id: "detection",   num: "06", period: "when it happens",  title: "Detection & response", tagline: "Assume breach; see it; survive it." },
    { id: "frontier",    num: "07", period: "2024 →",       title: "Frontier", tagline: "Post-quantum and beyond." }
  ];

  const lessons = {

    /* ---------- ERA 1 ---------- */
    "classical-ciphers": {
      era: "foundations",
      title: "Classical ciphers, and how they broke",
      subtitle: "Caesar to Vigenère — and the single idea that defeats them all.",
      minutes: 12,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "A **cipher** turns readable text (the *plaintext*) into scrambled text (the *ciphertext*) using a rule and a secret *key*. Decryption reverses it. The oldest ciphers hid the *rule*; every one of them fell. The lasting lesson is the opposite instinct — keep the rule public and the key secret." },
        { t: "note", kind: "history", md: "The **Caesar cipher** (1st century BCE) shifts every letter a fixed number of places: with a shift of 3, `A→D`, `B→E`. There are only 25 useful shifts, so an attacker just tries them all — a *brute-force* attack the size of a coffee break." },
        { t: "h", text: "Try it" },
        { t: "p", md: "Type a message below. Watch the cipher transform it letter by letter, then let the tool **break** a Caesar cipher without the key by counting letters." },
        { t: "widget", id: "cipher" },
        { t: "h", text: "Why frequency analysis works" },
        { t: "p", md: "Natural language is lumpy. In English, `E` is about 12.7% of letters; `Z` is under 0.1%. A simple shift or substitution moves the letters around but preserves those proportions — so the tallest bar in the ciphertext is almost certainly `E` in disguise. Al-Kindi described this attack in 9th-century Baghdad, centuries before the ciphers it beats went out of use." },
        { t: "eq",
          intuition: "Score each candidate shift by how far its letter counts sit from real English. The smallest score wins.",
          expr: "χ²(shift) = Σᵢ  (Oᵢ − Eᵢ)² / Eᵢ",
          where: [
            { sym: "Oᵢ", def: "observed count of letter i after undoing the shift" },
            { sym: "Eᵢ", def: "expected count of letter i for English of the same length" },
            { sym: "Σᵢ", def: "sum over all 26 letters" }
          ],
          example: "For a 200-letter message, the true shift typically scores a χ² several times smaller than any wrong shift — which is exactly what the break button ranks."
        },
        { t: "h", text: "Vigenère: the same weakness, delayed" },
        { t: "p", md: "The **Vigenère cipher** uses a keyword to vary the shift per position, flattening the frequency graph. It held a reputation as *le chiffre indéchiffrable* for 300 years — until Kasiski and Babbage noticed that once you find the key **length**, the message splits into several Caesar ciphers, each breakable by the graph above. Complexity delayed the break; it did not prevent it." },
        { t: "note", kind: "defend", md: "**The principle that survived (Kerckhoffs, 1883):** a system should stay secure even if everything about it *except the key* is public. “Security through obscurity” — hoping the attacker never learns your method — is the mistake every classical cipher made. Modern cryptography is published, scrutinized, and secure anyway." },
        { t: "widget", id: "quiz", data: [
          { q: "Why does frequency analysis break a Caesar cipher?", choices: ["It tries every possible key until one works", "A fixed shift preserves each letter's relative frequency", "It guesses the key length first", "It exploits a flaw in modern computers"], answer: 1, explain: "A single shift just relabels letters, so the frequency pattern (E most common, etc.) survives and gives the shift away." },
          { q: "Kerckhoffs's principle says security should depend on…", choices: ["keeping the algorithm secret", "the secrecy of the key alone", "using the longest possible cipher", "never reusing a message"], answer: 1, explain: "Assume the attacker knows your method; only the key should need to stay secret. Secrecy of the method is not a durable defense." }
        ]}
      ]
    },

    /* ---------- ERA 2 ---------- */
    "cia-triad": {
      era: "core",
      title: "The CIA triad and the shape of defense",
      subtitle: "Three properties, and the habits that protect them.",
      minutes: 9,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "Before any tool or attack, security has a vocabulary. Almost everything reduces to protecting three properties of information, known as the **CIA triad** — no relation to the agency." },
        { t: "table",
          head: ["Property", "Means", "Broken when…"],
          rows: [
            ["**Confidentiality**", "only the right people can read it", "data leaks or is decrypted by an attacker"],
            ["**Integrity**", "it hasn't been changed without notice", "a record is tampered with silently"],
            ["**Availability**", "it's there when you need it", "a service is knocked offline (see the DDoS lesson)"]
          ]
        },
        { t: "p", md: "Naming the property under threat keeps a response focused. Ransomware attacks *availability* (and often confidentiality). A forged bank transfer attacks *integrity*. Eavesdropping attacks *confidentiality*. The fixes differ per property, which is why the label matters." },
        { t: "h", text: "Four habits that do most of the work" },
        { t: "list", items: [
          "**Least privilege** — every user, process, and key gets the minimum access it needs, so a compromise stays small.",
          "**Defense in depth** — layer independent controls, so one failure isn't a breach. The bundled labs are themselves layered: sandboxed *and* offline *and* resource-limited.",
          "**Kerckhoffs's principle** — assume the attacker knows your design; rely on the key, not on secrecy of the method.",
          "**Threat modeling** — before building, ask: what are we protecting, who wants it, and where does trusted data meet untrusted input? That last boundary is where the next lesson lives."
        ]},
        { t: "note", kind: "info", md: "A **trust boundary** is any line where data crosses from a place you control to one you don't, or back. Almost every serious web bug is untrusted input treated as if it were trusted — a theme you'll see literally executed in the injection lesson." }
      ]
    },

    /* ---------- ERA 3 ---------- */
    "hashing": {
      era: "live",
      title: "Hashing and the avalanche effect",
      subtitle: "A one-way fingerprint for data — and why one changed bit changes everything.",
      minutes: 11,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "A **cryptographic hash function** takes any input and returns a fixed-size fingerprint (a *digest*). SHA-256 always returns 256 bits, whether you feed it one letter or a movie. It's the workhorse behind password storage, file-integrity checks, digital signatures, and blockchains." },
        { t: "h", text: "The three properties that make it cryptographic" },
        { t: "list", items: [
          "**Pre-image resistance** — given a digest, you can't find an input that produces it. (The one-way part.)",
          "**Second pre-image resistance** — given one input, you can't find a *different* input with the same digest.",
          "**Collision resistance** — you can't find *any* two inputs that share a digest."
        ]},
        { t: "h", text: "See the avalanche" },
        { t: "p", md: "Change a single character and the digest changes completely — about half its bits flip, with no hint of how small the input change was. That's the **avalanche effect**, and it's what makes a hash usable as a tamper-evident fingerprint." },
        { t: "widget", id: "hash" },
        { t: "note", kind: "defend", md: "This widget hashes with the browser's audited **Web Crypto** implementation (`crypto.subtle.digest`), not a hand-rolled one. That's the repo's standing rule: teach the idea, but call vetted libraries for anything real. Never ship your own crypto to production." },
        { t: "h", text: "Why collisions are easier than they look: the birthday bound" },
        { t: "eq",
          intuition: "You don't need to check every digest to find a collision. Thanks to the same math behind the “birthday paradox,” the work is roughly the square root of the output space — which is why digest sizes are chosen with a safety margin.",
          expr: "collision work ≈ 2^(n/2)   for an n-bit digest",
          where: [
            { sym: "n", def: "digest size in bits (256 for SHA-256)" },
            { sym: "2^(n/2)", def: "approximate number of hashes before a collision is likely" }
          ],
          example: "SHA-256's 256 bits give a collision workload around 2^128 — far beyond any computer. MD5's 128 bits give 2^64, which fell to real attacks years ago. That's why MD5 and SHA-1 are retired for security use."
        },
        { t: "note", kind: "info", md: "Password storage adds two more ingredients on top of hashing: a **salt** (a random per-password value that defeats precomputed tables) and a deliberately **slow** function (bcrypt, scrypt, or Argon2) so guessing is expensive. A fast hash like SHA-256 alone is *not* how you store passwords." },
        { t: "widget", id: "quiz", data: [
          { q: "What is the avalanche effect?", choices: ["The hash gets longer as input grows", "A tiny input change flips about half the output bits", "Two inputs always collide eventually", "The hash can be reversed with enough tries"], answer: 1, explain: "A one-character change should change roughly half the digest bits, with no hint of how small the input change was." },
          { q: "Why is SHA-256 alone a poor way to store passwords?", choices: ["It's too slow", "It's reversible", "It's fast and unsalted, so guessing is cheap", "It produces collisions"], answer: 2, explain: "Password storage needs a salt plus a deliberately slow function (bcrypt/scrypt/Argon2). A fast hash makes mass guessing easy." }
        ]}
      ]
    },

    /* ---------- ERA 4 ---------- */
    "injection": {
      era: "applied",
      title: "Injection: when data becomes code",
      subtitle: "The single idea behind SQL injection and Cross-Site Scripting — and how to end it.",
      minutes: 14,
      verified: "2026-09-30",
      body: [
        { t: "note", kind: "attack", md: "**Everything on this page runs against a fake target built into the page** — an in-memory array for the database, a sandboxed `iframe` for the browser. Nothing here can reach another machine. That's the same rule the full labs enforce: you only ever attack something you started." },
        { t: "p", md: "**Broken Access Control** tops the OWASP Top 10, but **injection** is the most instructive class, because it's one idea wearing many costumes: *untrusted input gets interpreted as code or structure instead of staying data.* Fix the boundary and the whole family disappears." },
        { t: "h", text: "SQL injection" },
        { t: "p", md: "When an app builds a database query by gluing user input into a string, a crafted input can change the query's **meaning**. The classic `' OR '1'='1` turns a login check into a condition that's always true. Toggle the code below between the naive version and the parameterized fix, and watch the same input go from dangerous to inert." },
        { t: "widget", id: "sqli" },
        { t: "note", kind: "defend", md: "**The fix is structural, not a blocklist.** A *parameterized query* (prepared statement) sends the query and the data on separate channels, so the database always treats input as a value, never as syntax. Don't try to “escape bad characters” by hand — use parameters, and let an Object-Relational Mapper (ORM) enforce it." },
        { t: "h", text: "Command injection: the same bug at the shell" },
        { t: "p", md: "Swap the database for a shell and the pattern repeats. If an app builds a shell command by pasting input into a string, a metacharacter like `;` or `|` lets the attacker append their own command. Toggle between the naive shell string and the fix — passing an **argument vector** so no shell parses the input at all." },
        { t: "widget", id: "cmdi" },
        { t: "note", kind: "defend", md: "**Don't call a shell.** Use an argument-vector API (`execFile`, `subprocess.run([...])`) that hands the program its arguments directly, so `;`, `|`, and `$()` are inert characters. If you must build a command, allowlist the exact values — never blocklist “bad” ones." },
        { t: "h", text: "Cross-Site Scripting (XSS)" },
        { t: "p", md: "Same bug, different interpreter. If a page drops user input into HTML without encoding it, the browser can run it as script. Below, the vulnerable pane inserts your input with `innerHTML`; the fixed pane uses `textContent`. Try a payload like `<img src=x onerror=alert(1)>` — it fires in the vulnerable pane and shows up as plain text in the fixed one." },
        { t: "widget", id: "xss" },
        { t: "note", kind: "defend", md: "**Two independent layers.** (1) Context-aware output encoding — render data as text, not markup. (2) A strict **Content Security Policy** — the header this very site ships — so that even if a payload lands, the browser refuses to execute inline script. Defense in depth from the last lesson, made concrete." },
        { t: "p", md: "That second layer is worth building by hand. Toggle directives below and watch which attacks each one shuts down." },
        { t: "widget", id: "cspbuilder" },
        { t: "h", text: "The detection habit" },
        { t: "p", md: "Fixing is half the job; noticing is the other half. Injection attempts leave signatures: SQL syntax errors spiking in logs, boolean tautologies like `OR 1=1`, or script-like payloads (`<script`, `onerror=`) landing in stored fields. The simulation flags these in its log panel so you can see what a detection rule would key on." },
        { t: "quote", md: "Data crossing a trust boundary must never be interpreted as code or structure.", cite: "The one rule behind this entire lesson" }
      ]
    },

    /* ---------- ERA 5 ---------- */
    "availability-ddos": {
      era: "detection",
      title: "Availability under attack: DDoS, defensively",
      subtitle: "How denial-of-service works, and how a service is built to withstand it.",
      minutes: 10,
      verified: "2026-09-30",
      body: [
        { t: "note", kind: "attack", md: "**This lesson generates no traffic.** It is a concept visualizer and a defense guide. Bulwark ships no load or stress tool, no list of amplifiers, and no attack code — attacking a system you don't own is a crime, and the tool makes it impossible, not merely discouraged. See [the ethics policy](docs/ETHICS.md)." },
        { t: "p", md: "A **Denial-of-Service** attack goes after the *availability* leg of the CIA triad: make a service unusable rather than steal from it. **Distributed** means the traffic comes from many sources at once — which is the whole reason it's hard to block, and the reason botnets exist." },
        { t: "h", text: "The three families" },
        { t: "list", items: [
          "**Volumetric** — saturate the target's bandwidth (floods, and *amplification* below).",
          "**Protocol / state-exhaustion** — exhaust connection tables, e.g. a SYN flood that opens half-connections and never finishes them.",
          "**Application-layer** — cheap requests that are expensive to serve, like hammering a search endpoint."
        ]},
        { t: "h", text: "Amplification: the leverage, and why it's fragile" },
        { t: "p", md: "Amplification abuses a third-party server: send it a small request with a **forged source address** (the victim's), and its much larger reply lands on the victim. The leverage is simply the ratio of reply size to request size. Move the sliders to see why a defender's job is to remove the leverage, not chase the flood." },
        { t: "widget", id: "ddos" },
        { t: "note", kind: "defend", md: "**Spoofing is the enabler, so filtering source addresses is the root fix.** BCP 38 (ingress filtering) at networks worldwide would kill reflection attacks at the source. Because not everyone deploys it, defenders also absorb and filter closer to home — see the layers below." },
        { t: "h", text: "Defense in depth for availability" },
        { t: "table",
          head: ["Layer", "What you do"],
          rows: [
            ["Network", "Anycast + Content Delivery Network (CDN) absorption; upstream scrubbing; BCP 38 ingress filtering"],
            ["Transport", "SYN cookies; connection rate and duration limits; sensible timeouts"],
            ["Application", "Per-client rate limiting; caching; cheap error paths; load shedding"],
            ["Operational", "A runbook, traffic baselines, and an escalation path decided *before* an incident"]
          ]
        },
        { t: "h", text: "A concrete defense: the token bucket" },
        { t: "p", md: "Most availability defense is unglamorous **rate limiting**. The standard algorithm is the *token bucket*: each client gets a bucket that refills steadily; a request costs a token, and an empty bucket means a cheap rejection instead of real work. Bursts up to the capacity are absorbed; a sustained flood is throttled to the refill rate — hold down the burst button to see it." },
        { t: "widget", id: "ratelimit" },
        { t: "note", kind: "history", md: "**Case study, defensively:** the 2016 Mirai botnet took down large parts of the internet by enlisting Internet-of-Things devices that still used **default passwords**. The takeaway is a hardening checklist — change defaults, segment device networks, patch — not a blueprint. Mirai's ancestor, the 1988 Morris worm, taught the same lesson about unpatched services." }
      ]
    },

    /* ---------- ERA 3 (public key) ---------- */
    "public-key": {
      era: "live",
      title: "Public-key cryptography",
      subtitle: "How two strangers agree on a secret in the open — and sign things nobody can forge.",
      minutes: 15,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "Symmetric ciphers like AES are fast, but they need both sides to already share a key. That's the chicken-and-egg problem public-key cryptography solves: a **key pair** where one key is public and one is private, linked by a math problem that's easy one way and infeasible to reverse." },
        { t: "h", text: "Diffie–Hellman: a shared secret over an open wire" },
        { t: "p", md: "Alice and Bob agree on public numbers, each mixes in a private one, they swap the results, and each mixes in their private number again. Both arrive at the same secret — yet an eavesdropper who saw everything on the wire cannot reproduce it." },
        { t: "note", kind: "info", md: "**The mixing-paint picture.** Start with a public paint everyone can see. Each person adds a secret color and sends the mixture. Each adds their secret color again — both end with the same final blend. Separating paint back into its components is the hard part; that's the discrete-logarithm problem doing the work." },
        { t: "widget", id: "dh" },
        { t: "h", text: "Elliptic curves: the same idea, smaller keys" },
        { t: "p", md: "Elliptic-curve cryptography swaps modular exponentiation for adding points on a curve. Adding a point to itself many times is easy; figuring out how many times from the result is the elliptic-curve discrete-log problem. Because that problem is harder per bit, a 256-bit elliptic-curve key gives roughly the security of a 3072-bit RSA key." },
        { t: "widget", id: "ec" },
        { t: "h", text: "RSA: encryption and signatures from factoring" },
        { t: "p", md: "RSA builds a key pair from two large primes. Its security rests on the fact that multiplying primes is easy but factoring the product is not." },
        { t: "eq",
          intuition: "Pick two primes, publish their product and an exponent, keep the matching inverse exponent private. Encryption and decryption are the same operation with different exponents.",
          expr: "c = m^e mod n     m = c^d mod n     n = p·q",
          where: [
            { sym: "p, q", def: "secret primes" },
            { sym: "n", def: "public modulus, p·q" },
            { sym: "e", def: "public exponent (coprime to (p−1)(q−1))" },
            { sym: "d", def: "private exponent, the inverse of e mod (p−1)(q−1)" }
          ],
          example: "Textbook values p=61, q=53 give n=3233, φ=3120; with e=17, d=2753. Encrypting m=65: 65^17 mod 3233 = **2790**. Decrypting: 2790^2753 mod 3233 = **65**. This exact round-trip is checked in `tests/`." },
        { t: "note", kind: "defend", md: "**Never hand-roll this.** The math is teachable in a few lines; a *secure* implementation handles padding, timing, and parameter choice that took the field decades to get right. Use a vetted library (libsodium, the platform's crypto) for anything real — the same rule as the hashing lesson." }
      ]
    },

    "tls-handshake": {
      era: "live",
      title: "TLS 1.3: how a secure connection is built",
      subtitle: "Where key exchange, certificates, hashing, and symmetric crypto all come together.",
      minutes: 10,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "Every `https://` request rides on Transport Layer Security. TLS 1.3 composes the pieces from the last three lessons: an ephemeral **Diffie–Hellman** exchange for the keys, a **certificate** and signature for identity, a **hash-based** check for integrity, and fast **symmetric** encryption for the data. It does the whole setup in a single round trip." },
        { t: "widget", id: "tls" },
        { t: "note", kind: "info", md: "**Why the certificate matters.** The key exchange alone stops eavesdropping, but not impersonation — you could be exchanging keys with an attacker in the middle. The certificate, signed by a Certificate Authority your system already trusts, is what binds the key to the real server. Chain of trust, not blind trust." },
        { t: "h", text: "Now the actual bytes" },
        { t: "p", md: "The stepper above is the story; this is the wire. Below is a real ClientHello laid out byte by byte — click any field to see what it does. Notice that the version negotiation and the key share are both just extensions near the end." },
        { t: "widget", id: "tlsbytes" },
        { t: "h", text: "The chain of trust" },
        { t: "p", md: "The certificate is only believable because of the chain behind it: the server's *leaf* certificate is signed by an *intermediate* Certificate Authority, which is signed by a *root* that already lives in your device's trust store. Click through the chain, then break a link and watch validation fail exactly where a browser would stop." },
        { t: "widget", id: "certchain" },
        { t: "note", kind: "defend", md: "**Go deeper.** For a full byte-for-byte trace of an entire handshake — both sides, keys derived, records decrypted — The Illustrated TLS 1.3 Connection (on the Sources page) is the definitive walkthrough this widget is modeled on." }
      ]
    },

    /* ---------- ERA 4 (applied) ---------- */
    "owasp-top10": {
      era: "applied",
      title: "The OWASP Top 10 (2025)",
      subtitle: "The industry's shared shortlist of what actually goes wrong in web apps.",
      minutes: 9,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "The Open Worldwide Application Security Project (OWASP) publishes a data-driven ranking of the most serious web-application risks. The **2025** edition, released 2025-11-06, is the current one. It's not a checklist to pass — it's a map of where real breaches come from, so you know where to spend attention." },
        { t: "widget", id: "owasp" },
        { t: "note", kind: "info", md: "**What changed in 2025.** Two categories are new: **A03 Software Supply Chain Failures** (dependencies and build pipelines, broadened from the old “vulnerable components” entry) and **A10 Mishandling of Exceptional Conditions**. Security Misconfiguration rose to A02, and Broken Access Control remains #1. Injection — the subject of its own lesson here — sits at A05." },
        { t: "note", kind: "defend", md: "**Supply chain is why this repo pins and signs.** A03 is the reason a security tool ships a lockfile, a Software Bill of Materials, signed releases with checksums, and dependency scanning — the practices in this project's own [security policy](./docs/SECURITY.md)." }
      ]
    },

    "passwords-auth": {
      era: "applied",
      title: "Authentication: passwords, entropy, and passkeys",
      subtitle: "Proving who you are — and why length beats punctuation.",
      minutes: 12,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "**Authentication** proves *who you are*; **authorization** decides *what you may do* (that's the A01 access-control risk from the last lesson). This lesson is about the first one, starting with the weakest common form: the password." },
        { t: "h", text: "Entropy: measuring guessing resistance" },
        { t: "p", md: "A password's strength is how many guesses an attacker needs, measured in **bits of entropy**. Each bit doubles the work. The counter-intuitive result: a long passphrase of ordinary words beats a short string of symbols, because length multiplies harder than complexity does." },
        { t: "widget", id: "entropy" },
        { t: "eq",
          intuition: "If a password is chosen at random from a pool of symbols, each position adds the same number of bits, so entropy grows linearly with length.",
          expr: "H = L · log₂(N)   bits",
          where: [
            { sym: "H", def: "entropy in bits" },
            { sym: "L", def: "length (number of characters)" },
            { sym: "N", def: "size of the character pool drawn from" }
          ],
          example: "A 12-character password from the 95 printable ASCII characters gives 12 · log₂(95) ≈ **79 bits** — but only if it's truly random. Human-chosen passwords fall far short, which is why the number above is an upper bound." },
        { t: "h", text: "Storing and beating passwords properly" },
        { t: "list", items: [
          "**Store** them salted and slow-hashed (bcrypt, scrypt, or Argon2) — never as a plain fast hash. That's the tail of the hashing lesson made mandatory.",
          "**Add a second factor.** A time-based one-time code (Time-based One-Time Password, TOTP) or, better, a **passkey**.",
          "**Passkeys / WebAuthn** are public-key authentication: your device holds a private key and signs a challenge, so there's no shared secret to phish or leak — the public-key lesson, applied to login. They're phishing-resistant by design.",
          "**OAuth** is often confused with login but is really delegated *authorization* — letting one app act on your behalf at another without handing over your password."
        ]},
        { t: "note", kind: "defend", md: "**Modern guidance flipped the old rules.** Current NIST advice (SP 800-63B) favors length over forced complexity, drops mandatory periodic resets, and says to screen new passwords against known-breached lists rather than nagging users into predictable patterns." }
      ]
    },

    /* ---------- ERA 6 (frontier) ---------- */
    "frontier-pqc": {
      era: "frontier",
      title: "The post-quantum frontier",
      subtitle: "Which of today's cryptography a large quantum computer would break — and what replaces it.",
      minutes: 11,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "A sufficiently large quantum computer would not break all cryptography — it would break a specific, load-bearing part of it. Knowing exactly which part is the difference between panic and a migration plan." },
        { t: "widget", id: "pqc" },
        { t: "h", text: "Two algorithms, two very different threats" },
        { t: "table",
          head: ["Quantum algorithm", "What it speeds up", "Consequence"],
          rows: [
            ["**Shor's**", "factoring and discrete logs — an exponential speedup", "RSA, elliptic-curve, and Diffie–Hellman fall completely"],
            ["**Grover's**", "brute-force search — a quadratic (square-root) speedup", "symmetric keys and hashes only need to roughly double in size"]
          ]
        },
        { t: "p", md: "That asymmetry is the whole story: the public-key algorithms that set up nearly every secure connection are the ones at risk, while AES-256 and SHA-256 stay comfortable. So the migration is about replacing key exchange and signatures, not encryption of bulk data." },
        { t: "note", kind: "history", md: "**The standards are here.** NIST finalized the first post-quantum standards on 2024-08-13: **ML-KEM** (FIPS 203) for key exchange, **ML-DSA** (FIPS 204) and **SLH-DSA** (FIPS 205) for signatures. **HQC** was selected as a backup key-encapsulation mechanism in March 2025, and **FN-DSA** (FIPS 206, from Falcon) is still in draft. This is a fast-moving area — the Sources page carries the “last verified” dates." },
        { t: "quote", md: "Record the encrypted traffic today; decrypt it whenever the hardware finally exists.", cite: "The “harvest now, decrypt later” threat, in one line" },
        { t: "widget", id: "quiz", data: [
          { q: "Which of today's algorithms does Shor's algorithm break?", choices: ["AES-256", "SHA-256", "RSA and elliptic-curve crypto", "bcrypt"], answer: 2, explain: "Shor's efficiently solves factoring and discrete logs, breaking RSA, ECC, and Diffie–Hellman. Symmetric and hash functions are only weakened, not broken." },
          { q: "Why migrate to post-quantum crypto now, before quantum computers exist?", choices: ["The algorithms are faster", "“Harvest now, decrypt later” — today's recorded traffic can be decrypted in future", "Regulations already require it everywhere", "Classical crypto stopped working"], answer: 1, explain: "Adversaries can store encrypted data today and decrypt it once capable hardware arrives, so long-lived secrets need protecting now." }
        ]}
      ]
    },

    /* ---------- ERA 2 (threat modeling) ---------- */
    "threat-modeling": {
      era: "core",
      title: "Threat modeling: finding the flaws before you build",
      subtitle: "Four questions, the STRIDE checklist, and where trust actually breaks.",
      minutes: 11,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "The cheapest bug to fix is the one you catch on a whiteboard. **Threat modeling** is the habit of asking, before writing code, where a system could be attacked — and it comes down to four questions (Adam Shostack's framing): *What are we building? What can go wrong? What are we going to do about it? Did we do a good job?*" },
        { t: "h", text: "STRIDE: a checklist for “what can go wrong”" },
        { t: "p", md: "STRIDE is a mnemonic for six threat categories. Each maps cleanly to a defense — which is why naming the threat is the first step to closing it." },
        { t: "table",
          head: ["Threat", "The attacker…", "Defense"],
          rows: [
            ["**S**poofing", "pretends to be someone else", "Authentication (passwords, passkeys)"],
            ["**T**ampering", "alters data or code", "Integrity checks, input validation, signing"],
            ["**R**epudiation", "denies doing something", "Logging and audit trails"],
            ["**I**nformation disclosure", "reads what they shouldn't", "Encryption, access control"],
            ["**D**enial of service", "makes it unavailable", "Rate limiting, redundancy, absorption"],
            ["**E**levation of privilege", "gains rights they shouldn't have", "Authorization, least privilege"]
          ]
        },
        { t: "h", text: "Trust boundaries are where you look" },
        { t: "p", md: "A **trust boundary** is any line where data moves between zones you control differently — the internet to your server, your server to a third-party API, your app to its database. Threats cluster on flows that cross these lines. Select a flow below to see the STRIDE risks it invites and the control for each." },
        { t: "widget", id: "threatmodel" },
        { t: "note", kind: "defend", md: "**Least privilege ties it together.** Most STRIDE defenses shrink what an attacker gains from a single foothold: a database account that can only read the rows it needs turns a full breach into a contained one. Design the boundaries first, then grant the minimum across each." }
      ]
    },

    /* ---------- ERA 5 (detection & response) ---------- */
    "detection-response": {
      era: "detection",
      title: "Detection and response: assume breach",
      subtitle: "Prevention is never perfect, so the second job is seeing it and recovering.",
      minutes: 11,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "Every control on this site can fail or be bypassed. Mature security **assumes breach** and invests in the other half: noticing quickly and recovering cleanly. A breach that's caught in minutes is an incident; one caught in months is a headline." },
        { t: "h", text: "Logging and alerting" },
        { t: "p", md: "You can't respond to what you can't see. Log security-relevant events — logins, privilege changes, failures, suspicious input — and alert on the signatures that matter, not every line. The injection lesson's detection panel is a micro-example: it flags tautologies and comment tokens in the input, which is exactly the kind of signal an alert would key on." },
        { t: "note", kind: "info", md: "**Signal, not noise.** The failure mode isn't too few logs — it's too many, so the real alert drowns. Tune for the handful of events that actually indicate compromise, and rehearse what happens when one fires." },
        { t: "h", text: "ATT&CK: a shared vocabulary for what attackers do" },
        { t: "p", md: "MITRE ATT&CK catalogs real adversary behavior as **tactics** (the goal) and **techniques** (how). It gives defenders a common language — “we saw credential stuffing followed by lateral movement” — and, for each technique, a place to hang a detection and a defense. Explore a slice of it below; each technique links to the Bulwark lesson that covers its defense." },
        { t: "widget", id: "attack" },
        { t: "h", text: "The response loop" },
        { t: "steps", items: [
          { h: "Prepare.", md: "Backups, a runbook, contacts, and baselines — decided before anything happens." },
          { h: "Detect & analyze.", md: "Confirm it's real, scope it, and identify what's affected." },
          { h: "Contain, eradicate, recover.", md: "Stop the spread, remove the foothold, restore from known-good state." },
          { h: "Learn.", md: "A blameless post-incident review that turns the event into a fix and a new detection." }
        ]},
        { t: "note", kind: "defend", md: "**This is the blue-team loop** (aligned with NIST SP 800-61). It closes back on prevention: every incident should leave behind a control that would have stopped it and an alert that would have caught it sooner." }
      ]
    },

    /* ---------- ERA 6 (zero trust) ---------- */
    "zero-trust": {
      era: "frontier",
      title: "Zero trust and confidential computing",
      subtitle: "Dropping the idea of a safe inside — and protecting data even while it's in use.",
      minutes: 8,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "The old model was a **perimeter**: a hard shell (the firewall) around a soft, trusted interior. Once inside, you were trusted. Cloud, remote work, and breaches that pivot laterally (the ATT&CK lesson) killed that assumption. The replacement is **zero trust**: never trust, always verify — every request is authenticated and authorized on its own merits, wherever it comes from." },
        { t: "list", items: [
          "**Verify explicitly.** Every request proves identity and device posture; being “on the network” grants nothing.",
          "**Least privilege, per request.** Access is narrow, time-bound, and re-checked — the CIA-triad habit taken to its conclusion.",
          "**Assume breach.** Segment the network so a foothold can't roam, and log everything for the detection loop.",
          "**Microsegmentation.** Workloads talk only to what they must, so lateral movement hits walls."
        ]},
        { t: "note", kind: "info", md: "**Confidential computing** closes the last gap. We routinely encrypt data at rest and in transit, but it's normally decrypted in memory while being processed. Trusted Execution Environments (hardware enclaves) keep data encrypted even *in use*, so the operator of the machine — or an attacker who owns it — still can't read it. It pairs naturally with zero trust: verify everything, and expose nothing, even during computation." },
        { t: "p", md: "Neither idea is a product you buy; both are architectures you grow into. Together with post-quantum migration, they're where a security-minded engineer's attention is heading next." }
      ]
    },

    /* ---------- ERA 4 (tokens & OAuth) ---------- */
    "tokens-oauth": {
      era: "applied",
      title: "Tokens, sessions, and OAuth",
      subtitle: "How modern apps stay logged in and let you “sign in with…” without sharing passwords.",
      minutes: 13,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "Once you've authenticated (the last lesson), the app needs to *remember* it across requests without asking for your password each time. Two ideas dominate today: signed **tokens** and delegated authorization with **OAuth**." },
        { t: "h", text: "JSON Web Tokens" },
        { t: "p", md: "A **JSON Web Token (JWT)** is three base64url parts — header, payload, signature — joined by dots. The payload is *readable by anyone* (it's not encrypted), but the signature makes it *tamper-evident*: change one character and verification fails. Edit the payload below and watch it break, then re-sign it." },
        { t: "widget", id: "jwt" },
        { t: "note", kind: "info", md: "**A token is not a secret box.** Never put anything private in a JWT payload — it's plainly visible. The signature protects integrity, not confidentiality. And a token is only as safe as the key that signs it and the storage that holds it in the browser." },
        { t: "h", text: "OAuth 2.0: authorization without sharing your password" },
        { t: "p", md: "When you “sign in with” another service, that's **OAuth 2.0** doing *delegated authorization*: you let one app act at another on your behalf, without handing over your password. The modern, safe variant is the Authorization Code flow with **PKCE**. Step through it:" },
        { t: "widget", id: "oauth" },
        { t: "note", kind: "defend", md: "**Authorization vs. authentication.** OAuth grants *access* (authorization). To prove *identity* (authentication) you add **OpenID Connect**, which returns an id token. Confusing the two — treating an access token as proof of who someone is — is a classic, dangerous mistake." }
      ]
    },

    "llm-security": {
      era: "applied",
      title: "Securing AI systems",
      subtitle: "The newest attack surface: large language models, and the OWASP LLM Top 10.",
      minutes: 12,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "Applications built on large language models (LLMs) inherit every classic web risk *and* add new ones. OWASP now maintains a dedicated **Top 10 for LLM Applications**, and the risk at #1 is unlike anything in the web list: prompt injection." },
        { t: "h", text: "Prompt injection (LLM01)" },
        { t: "p", md: "An LLM can't reliably tell its *instructions* apart from the *data* it's asked to process — they're all just text in the same window. So untrusted input can carry instructions that override the developer's. It's injection again (“data becomes code”), but with no clean parser to fix it. Try the simulated assistant:" },
        { t: "widget", id: "promptinject" },
        { t: "h", text: "The OWASP LLM Top 10 (2025)" },
        { t: "table",
          head: ["#", "Risk", "In one line"],
          rows: [
            ["LLM01", "**Prompt Injection**", "Untrusted input overrides the model's instructions."],
            ["LLM02", "Sensitive Information Disclosure", "The model reveals secrets, training data, or personal information."],
            ["LLM03", "Supply Chain", "Compromised models, datasets, or plugins."],
            ["LLM04", "Data & Model Poisoning", "Malicious training or fine-tuning data warps behavior."],
            ["LLM05", "Improper Output Handling", "Trusting model output as if it were safe code or commands."],
            ["LLM06", "Excessive Agency", "The model is given too much power to act (tools, APIs)."],
            ["LLM07", "System Prompt Leakage", "Hidden instructions get exposed."],
            ["LLM08", "Vector & Embedding Weaknesses", "Attacks on retrieval / embedding stores."],
            ["LLM09", "Misinformation", "Confident, wrong, or fabricated output."],
            ["LLM10", "Unbounded Consumption", "Runaway cost or denial of service from heavy use."]
          ]
        },
        { t: "note", kind: "defend", md: "**Design for it, don't prompt your way out.** Keep secrets out of the prompt; separate trusted instructions from untrusted input; give the model the *least agency* it needs (limit tools and permissions); validate and filter both input and output; and cap consumption. Treat the model as an untrusted, unpredictable component — because it is." }
      ]
    },

    /* ---------- ERA 6 (quantum cryptography) ---------- */
    "quantum-crypto": {
      era: "frontier",
      title: "Quantum cryptography",
      subtitle: "Using the laws of physics — not just hard math — to share a key an eavesdropper can't take unseen.",
      minutes: 12,
      verified: "2026-09-30",
      body: [
        { t: "note", kind: "info", md: "**Two different “quantum” stories, don't mix them up.** *Post-quantum cryptography* (last lesson) is ordinary math run on classical computers, chosen because it resists quantum attacks. *Quantum key distribution* (this lesson) uses actual quantum hardware to move a key. PQC is deploying everywhere now; QKD is niche. They solve overlapping problems in opposite ways." },
        { t: "p", md: "The magic ingredient is the **no-cloning theorem**: an unknown quantum state cannot be copied, and *measuring* it disturbs it. So if a key is encoded in single photons, an eavesdropper who intercepts them can't copy them and can't measure them without leaving fingerprints. Detection, built into physics." },
        { t: "h", text: "BB84, the original protocol" },
        { t: "p", md: "In BB84 (Bennett & Brassard, 1984), Alice sends each bit as a photon polarized in one of two randomly chosen **bases**. Bob measures each in a randomly chosen basis. Afterward they compare *which bases they used* (never the bits) over a public channel and keep only the positions where the bases matched. Run it — then switch on Eve." },
        { t: "widget", id: "bb84" },
        { t: "p", md: "The genius is in the error rate. Eve has to guess a basis to measure; when she guesses wrong she corrupts the photon, and Alice and Bob see those corruptions as a raised **Quantum Bit Error Rate (QBER)** — around 25% if she intercepts everything. Sacrifice a random sample of the key to estimate the QBER; if it's too high, throw the whole thing away and try again." },
        { t: "note", kind: "defend", md: "**What QKD does and doesn't do.** It distributes a *shared secret key*; you still encrypt the actual data with a fast symmetric cipher like AES. It needs a real quantum channel (special fiber or free-space/satellite links), it's distance-limited, and it still needs an *authenticated* classical channel or Eve can impersonate an endpoint. For almost everyone, post-quantum cryptography — not QKD — is the practical answer to the quantum threat." },
        { t: "widget", id: "quiz", data: [
          { q: "Why can't an eavesdropper silently copy the qubits in BB84?", choices: ["They're encrypted with AES", "The no-cloning theorem — measuring disturbs the state", "They travel too fast", "Bob signs each one"], answer: 1, explain: "An unknown quantum state can't be cloned, and measuring it disturbs it, so interception shows up as errors." },
          { q: "QKD distributes a key. What still encrypts the actual data?", choices: ["Nothing — QKD encrypts it", "A fast symmetric cipher like AES", "RSA", "The quantum channel itself"], answer: 1, explain: "QKD only shares a key; bulk data is encrypted with a symmetric cipher such as AES." }
        ]}
      ]
    },

    /* ---------- ERA 1 (steganography) ---------- */
    "steganography": {
      era: "foundations",
      title: "Steganography: hiding in plain sight",
      subtitle: "Concealing that a message even exists — and why that isn't the same as protecting it.",
      minutes: 8,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "Cryptography scrambles a message so it can't be *read*. **Steganography** hides the fact that a message is *there at all* — invisible ink, microdots, a note tucked inside an image. The two solve different problems, and the strongest approach uses both." },
        { t: "h", text: "The least-significant-bit trick" },
        { t: "p", md: "A digital image stores each pixel as color values. Flipping the *lowest* bit of each value changes the color so slightly no eye can tell — so those low bits are free space to stash data. Hide a message below, then read it back out of the visually-identical image." },
        { t: "widget", id: "stego" },
        { t: "note", kind: "defend", md: "**Hiding is not encrypting.** Anyone who suspects LSB steganography can extract the message in seconds — you just did. This is *security through obscurity*, the same mistake the classical ciphers made (see Kerckhoffs). Encrypt the message first; then hiding it is a bonus layer, not the protection." },
        { t: "p", md: "The defensive side is **steganalysis**: statistical tests that detect the tell-tale evenness LSB embedding leaves behind. Data-loss-prevention tools use it to catch secrets being smuggled out inside innocent-looking files." }
      ]
    },

    /* ---------- ERA 4 (supply chain) ---------- */
    "supply-chain": {
      era: "applied",
      title: "Software supply-chain security",
      subtitle: "Most of your app is other people's code. OWASP A03 is about trusting it wisely.",
      minutes: 11,
      verified: "2026-09-30",
      body: [
        { t: "p", md: "A modern application is mostly dependencies — hundreds of packages you didn't write, pulling in hundreds more. **Software Supply Chain Failures** is new at #3 in the OWASP Top 10:2025 because attackers noticed: why breach one app when you can compromise a package a thousand apps import?" },
        { t: "h", text: "How the attacks work" },
        { t: "list", items: [
          "**Dependency confusion** — a public package with the same name as your internal one gets pulled in instead.",
          "**Typosquatting** — a malicious `colour-utils` posing as the popular `color-utils`.",
          "**Compromised packages** — a legitimate package is hijacked and a new version ships malware.",
          "**Build-pipeline attacks** — the CI/CD system itself is tampered with (the 2020 SolarWinds incident, studied as a defensive case)."
        ]},
        { t: "p", md: "The through-line: you can't defend what you can't see. Explore a small dependency set below, then apply the controls and watch the hidden risk become visible and managed." },
        { t: "widget", id: "depgraph" },
        { t: "note", kind: "defend", md: "**The control set (what this repo itself does).** Pin exact versions in a **lockfile**; generate a **Software Bill of Materials (SBOM)** so you know what you ship; verify **signatures / provenance** (see SLSA) so a package's publisher is who you expect; run continuous **scanning** (Dependabot, CodeQL, secret scanning); and give CI/CD **least privilege**. See this project's [security policy](./docs/SECURITY.md)." },
        { t: "widget", id: "quiz", data: [
          { q: "Why did software supply chain rise to #3 in OWASP 2025?", choices: ["Dependencies are slow", "One compromised package can hit thousands of apps at once", "Open source is inherently unsafe", "Lockfiles were removed"], answer: 1, explain: "Attacking a widely-used dependency scales far better than attacking one application." },
          { q: "Which control most directly stops dependency confusion?", choices: ["Hiding your package names", "Pinning exact versions in a lockfile", "Writing more tests", "Using a faster CI"], answer: 1, explain: "Pinning exact, verified versions stops a surprise substitute from being pulled in." }
        ]}
      ]
    },
    /* ---------- added 2026-10: secrets, web walkthroughs, API track ---------- */
    "storing-secrets": {
      era: "applied",
      title: "Storing secrets so a breach isn't a catastrophe",
      subtitle: "Password hashing, envelope encryption, KMS and HSMs, secret managers, rotation, and keeping keys out of git.",
      minutes: 18,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "Every system holds things an adversary wants: user passwords, database credentials, API keys, signing keys, customer records. The working assumption of real-world secret storage is **assume the database will leak someday**. The question is what the attacker can do with the copy. Done well, the answer is *very little*." },
        { t: "table",
          head: ["What you're protecting", "Store it as", "Real-world implementation"],
          rows: [
            ["User passwords (you only ever *check* them)", "a salted, slow, one-way hash", "**Argon2id** (preferred), scrypt, bcrypt; PBKDF2 where FIPS validation is required"],
            ["Data you must read back (records, files)", "ciphertext under a per-record data key, which is itself encrypted", "**Envelope encryption** with a cloud KMS (AWS KMS, Google Cloud KMS, Azure Key Vault) or an HSM"],
            ["Credentials your services use (DB passwords, API keys)", "a reference to a secret manager, fetched at runtime", "**HashiCorp Vault**, AWS Secrets Manager, Google Secret Manager, Azure Key Vault"],
            ["Root and signing keys", "non-extractable keys inside certified hardware", "**HSMs** validated to FIPS 140-3; cloud HSM services"]
          ] },

        { t: "h", text: "1 · Passwords: hash, never encrypt" },
        { t: "p", md: "You never need a user's password back; you only need to check a guess. So store a **one-way** hash, never ciphertext (anything you can decrypt, a thief with your key can decrypt). Three ingredients, all required:" },
        { t: "list", items: [
          "**A unique random salt per password** (16 bytes from a cryptographic RNG), stored next to the hash. Identical passwords then hash differently, so precomputed tables are useless and each guess targets one account.",
          "**A deliberately slow, tunable function.** Fast hashes like SHA-256 are designed for speed, which is exactly wrong here. The work factor is a dial you raise as hardware gets faster.",
          "**Memory-hardness, ideally.** Argon2id (RFC 9106, winner of the Password Hashing Competition) and scrypt (RFC 7914) force each guess to use lots of RAM, which blunts the GPU and ASIC farms attackers use."
        ]},
        { t: "widget", id: "kdf" },
        { t: "table",
          head: ["Algorithm", "OWASP minimum configuration", "Watch out for"],
          rows: [
            ["**Argon2id**", "19 MiB memory, 2 iterations, 1 degree of parallelism", "Use the *id* variant; tune memory up as far as your login latency allows"],
            ["**scrypt**", "N = 2¹⁷ (128 MiB), r = 8, p = 1", "Memory cost and CPU cost are tied together"],
            ["**bcrypt**", "work factor 10 or more", "Only the first **72 bytes** of input are used; don't pre-hash with a raw fast hash without care"],
            ["**PBKDF2-HMAC-SHA256**", "600,000 iterations", "Not memory-hard; choose it when you need FIPS-140 validated primitives"]
          ] },
        { t: "note", kind: "defend", md: "**Use a library, never hand-roll.** Every major language has a vetted Argon2id or bcrypt binding that encodes the algorithm, parameters and salt into one string (for example `$argon2id$v=19$m=19456,t=2,p=1$…`). Store that whole string; when you raise parameters, re-hash on the user's next successful login. An optional **pepper** (a secret key mixed in and kept in a KMS or HSM, *not* the database) means a stolen database alone can't even be attacked offline." },

        { t: "h", text: "2 · Data you need back: envelope encryption" },
        { t: "p", md: "For records you must decrypt, the real-world pattern is **envelope encryption**, used by every major cloud KMS. Each record (or file, or tenant) is encrypted with its own random **data-encryption key (DEK)**. The DEK is then encrypted (\"wrapped\") by a **key-encryption key (KEK)** that never leaves the Key Management Service or Hardware Security Module. You store the ciphertext *and the wrapped DEK* together; the plaintext DEK exists only briefly in memory." },
        { t: "steps", items: [
          { h: "Generate.", md: "Ask the KMS for a fresh DEK. It returns the DEK in plaintext *and* wrapped under the KEK." },
          { h: "Encrypt locally.", md: "Encrypt the data with the plaintext DEK using an AEAD cipher (AES-256-GCM), with a unique nonce. Then wipe the plaintext DEK." },
          { h: "Store.", md: "Save ciphertext + nonce + wrapped DEK + KEK version. A database dump now contains nothing directly usable." },
          { h: "Decrypt.", md: "Send the wrapped DEK to the KMS. The KMS checks the caller's identity and policy, **logs the request**, and returns the DEK." },
          { h: "Rotate.", md: "Make a new KEK version and re-wrap the small DEKs. The bulk data never has to be re-encrypted." }
        ]},
        { t: "widget", id: "envelope" },
        { t: "p", md: "Why this shape wins: the KEK sits inside hardware that will **use** it but never **export** it (the widget's KEK is created `extractable: false` for the same reason), every decryption leaves an audit trail, access can be revoked in one place, and a leaked backup is ciphertext. **HSMs** are tamper-resistant devices validated under **FIPS 140-3**; cloud KMS services are built on fleets of them." },

        { t: "h", text: "3 · Service credentials: a secret manager, not a config file" },
        { t: "list", items: [
          "**Centralize.** Keep credentials in a secret manager (HashiCorp Vault, AWS Secrets Manager, Google Secret Manager, Azure Key Vault). Applications authenticate with their *workload identity* (a cloud IAM role, a Kubernetes service account) and fetch what they need at runtime.",
          "**Prefer short-lived, dynamic secrets.** Vault's database engine can mint a unique username and password per application instance with a lease that expires on its own. A leaked credential that dies in an hour is a much smaller incident.",
          "**Rotate on a schedule and on suspicion.** NIST SP 800-57 calls a key's allowed lifetime its *cryptoperiod*. Automate rotation (AWS Secrets Manager runs rotation functions for you) so it's routine, not an emergency.",
          "**Least privilege per secret.** Each service reads only its own secrets; every read is logged.",
          "**Know your platform's defaults.** Kubernetes Secrets are only base64-encoded and stored unencrypted in etcd unless you enable encryption at rest (ideally with a KMS provider)."
        ]},
        { t: "note", kind: "info", md: "**Environment variables are a delivery mechanism, not a vault.** They leak into crash dumps, debug pages, child processes and logs. If you use them, inject them at runtime from a secret manager; never commit `.env` files." },

        { t: "h", text: "4 · Keeping secrets out of git" },
        { t: "p", md: "A secret pushed to a repository should be treated as **public**, even if the repo is private and even if you delete the commit a minute later: clones, forks, CI caches and mirrors keep it. The defenses are layered:" },
        { t: "list", items: [
          "**Block it before it lands:** a pre-commit hook or CI step running a scanner such as **gitleaks**, plus GitHub **push protection**, which rejects pushes containing recognized credential formats.",
          "**Keep config and secret apart:** commit `settings.example` with placeholder names; load real values from the secret manager. For GitOps, commit only *encrypted* files (e.g. with SOPS backed by a KMS key).",
          "**If one leaks: rotate first, then clean up.** Revoke and reissue the credential immediately, check its access logs for misuse, then purge it from history. Purging alone does not un-leak anything."
        ]},
        { t: "widget", id: "secretscan" },

        { t: "h", text: "5 · Client-side: the browser can't keep a secret from its user" },
        { t: "list", items: [
          "**Anything shipped to the browser or a mobile app is public.** API keys in a JavaScript bundle can be read by anyone. Keep privileged keys on a server you control (a backend-for-frontend), and give clients only narrowly scoped, short-lived tokens.",
          "**Session tokens belong in cookies marked `HttpOnly; Secure; SameSite`.** `localStorage` is readable by any script on the page, so a single XSS flaw can steal everything stored there.",
          "**When the client must hold a key,** use the platform keystore: Web Crypto keys created non-extractable, iOS Keychain / Secure Enclave, Android Keystore. The key can be used but not copied out.",
          "**This site practices it:** Bulwark stores only lesson progress in `localStorage`, has no server, and no secrets."
        ]},
        { t: "widget", id: "quiz", data: [
          { q: "Why store passwords with a slow, salted hash rather than encrypting them?", choices: ["Encryption is slower", "You only need to verify guesses, and anything decryptable can be decrypted by whoever steals the key", "Hashes are shorter", "Encryption can't handle Unicode"], answer: 1, explain: "Verification needs only a one-way function. Reversible storage turns a key theft into a full password dump." },
          { q: "In envelope encryption, what does rotating the KEK require?", choices: ["Re-encrypting every record", "Re-wrapping the small data keys under the new KEK", "Changing every user's password", "Nothing; KEKs never rotate"], answer: 1, explain: "Only the wrapped DEKs change. Bulk ciphertext stays put, which is why rotation becomes cheap enough to do routinely." },
          { q: "An AWS key was pushed to a public repo and the commit was force-deleted 30 seconds later. First step?", choices: ["Nothing, it was only 30 seconds", "Rewrite history again to be sure", "Revoke and rotate the key, then review its usage logs", "Make the repo private"], answer: 2, explain: "Automated scrapers find leaked keys within minutes. Assume it was copied: revoke it, then investigate, then clean up." },
          { q: "Where should a single-page app keep its session token?", choices: ["localStorage", "A JavaScript global", "An HttpOnly, Secure, SameSite cookie", "In the URL"], answer: 2, explain: "HttpOnly cookies can't be read by page scripts, so an XSS bug can't simply exfiltrate them." }
        ]}
      ]
    },

    "csrf-samesite": {
      era: "applied",
      title: "Cross-site request forgery and SameSite cookies",
      subtitle: "When your browser helpfully attaches your login to someone else's request.",
      minutes: 9,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "Browsers attach cookies to requests based on **where the request is going**, not **which page started it**. **Cross-Site Request Forgery (CSRF)** abuses that: a page on another site causes your browser to send a state-changing request to a site where you're logged in, and your session cookie rides along." },
        { t: "widget", id: "walkthrough", data: {
          title: "A forged transfer at a fictional bank",
          attack: [
            { who: "victim", say: "You log in to your bank. It sets a session cookie, and you leave the tab open.", screen: { kind: "browser", url: "https://bank.example/account", lines: ["Welcome back, Sam.", "Balance: $4,210.00"] } },
            { who: "attacker", say: "Later you open a link from a forum. The page looks harmless, but it contains a hidden form addressed to the bank's transfer endpoint.", screen: { kind: "browser", url: "https://prizes.example/claim", lines: ["Congratulations! You won a cruise.", "Click below to claim."], button: "Claim prize", decoy: true } },
            { who: "browser", say: "When the page submits that form, your browser sends the request to bank.example and attaches your bank cookie automatically.", screen: { kind: "request", lines: ["POST /transfer  Host: bank.example", "Cookie: session=7f3c…", "to=account-of-stranger&amount=900"], hl: "Cookie: session=7f3c…" } },
            { who: "server", say: "The bank sees a valid session and a well-formed request. It can't tell you never meant to send it, so the money moves.", screen: { kind: "response", lines: ["200 OK", "Transfer complete: $900.00"] } }
          ],
          defend: [
            { who: "defender", label: "SameSite cookie", say: "The bank marks its session cookie SameSite=Lax (or Strict). The browser now withholds it on cross-site POSTs.", screen: { kind: "response", title: "Set-Cookie header", lines: ["Set-Cookie: session=7f3c…; Secure; HttpOnly; SameSite=Lax"], hl: "SameSite=Lax" } },
            { who: "defender", label: "Anti-CSRF token", say: "Every form also carries a random token tied to the session. The other site can't read it, so it can't include it.", screen: { kind: "request", lines: ["POST /transfer  Host: bank.example", "csrf_token=(missing)", "→ 403 Forbidden"], hl: "csrf_token=(missing)" } },
            { who: "defender", label: "Origin check", say: "The server also checks the Origin header and rejects state changes that come from other sites.", screen: { kind: "terminal", lines: ["reject POST /transfer: Origin https://prizes.example ≠ https://bank.example"] } },
            { who: "victim", say: "The forged request fails three independent ways. You keep your $4,210.", screen: { kind: "browser", url: "https://bank.example/account", lines: ["Balance: $4,210.00", "No new transfers."] } }
          ] } },
        { t: "h", text: "The defenses, in order of strength" },
        { t: "list", items: [
          "**Synchronizer or double-submit tokens** on every state-changing request, verified server-side (most frameworks do this for you; don't turn it off).",
          "**`SameSite=Lax` or `Strict`** on session cookies. Chrome and Edge treat cookies without the attribute as Lax; Firefox and Safari don't, so always set it explicitly.",
          "**Check `Origin` / `Sec-Fetch-Site`** headers for state-changing requests.",
          "**Never change state on GET.** Links and images can trigger GETs from anywhere."
        ]},
        { t: "widget", id: "quiz", data: [
          { q: "Why does CSRF work at all?", choices: ["The attacker steals your password", "Browsers attach cookies based on the destination, not the page that triggered the request", "TLS is broken", "The bank uses HTTP"], answer: 1, explain: "The cookie is sent because the request goes to the bank, even though a different site caused it." },
          { q: "Which cookie attribute stops it being sent on cross-site POSTs?", choices: ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"], answer: 2, explain: "SameSite controls cross-site sending. HttpOnly only hides the cookie from page scripts." }
        ]}
      ]
    },

    "clickjacking": {
      era: "applied",
      title: "Clickjacking and frame-ancestors",
      subtitle: "A real button, hidden under a fake one.",
      minutes: 7,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "**Clickjacking** (UI redressing) loads a real site invisibly inside a frame and lines up one of its buttons under something enticing. You think you're clicking \"Play\"; you're clicking \"Delete account\" on a site where you're logged in." },
        { t: "widget", id: "walkthrough", data: {
          title: "A hidden settings page under a game",
          attack: [
            { who: "attacker", say: "A page offers a simple game with one big button.", screen: { kind: "browser", url: "https://game.example", lines: ["Click PLAY to start!"], button: "PLAY", decoy: true } },
            { who: "browser", say: "Underneath, at zero opacity, the page frames the real settings page of a site you're logged in to, positioned so its button sits exactly under PLAY.", screen: { kind: "code", title: "page layout", lines: ["layer 1 (visible):   the PLAY button", "layer 2 (invisible): framed https://social.example/settings", "                     its 'Make profile public' button under PLAY"], hl: "invisible" } },
            { who: "victim", say: "Your click lands on the invisible frame. The real site sees a genuine click from a logged-in user and changes the setting.", screen: { kind: "response", lines: ["Profile visibility: PUBLIC"] } }
          ],
          defend: [
            { who: "defender", label: "frame-ancestors", say: "The site sends a Content-Security-Policy response header saying who may frame it. The browser refuses to render it inside game.example.", screen: { kind: "response", title: "response header", lines: ["Content-Security-Policy: frame-ancestors 'none'"], hl: "frame-ancestors 'none'" } },
            { who: "defender", label: "Legacy header", say: "Older browsers honor X-Frame-Options: DENY. Sending both is common.", screen: { kind: "response", title: "response header", lines: ["X-Frame-Options: DENY"] } },
            { who: "victim", say: "The frame stays blank. Your click hits only the game.", screen: { kind: "browser", url: "https://game.example", lines: ["(framed content refused by the browser)"] } }
          ] } },
        { t: "note", kind: "info", md: "**A lesson from this very site.** `frame-ancestors` only works as an HTTP *response header*; browsers ignore it inside a `<meta>` CSP tag. GitHub Pages can't set custom headers, so Bulwark's static deployment can't enforce it. That's an honest limitation, documented in `docs/SECURITY.md`; a host or CDN that sets headers closes it." },
        { t: "widget", id: "quiz", data: [
          { q: "What stops a page from being framed by another site?", choices: ["HttpOnly cookies", "Content-Security-Policy: frame-ancestors (as a response header)", "Hiding the button", "Using HTTPS"], answer: 1, explain: "frame-ancestors tells the browser which origins may embed the page." }
        ]}
      ]
    },

    "api-security": {
      era: "api",
      title: "API security: every endpoint is a front door",
      subtitle: "The OWASP API Security Top 10, and the handful of controls that cover most of it.",
      minutes: 14,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "Modern apps are mostly APIs: the mobile app, the single-page front end and partner integrations all talk to JSON endpoints. APIs fail differently from classic web pages, because the client is fully under the user's control. Anyone can call any endpoint with any ID, any field and any rate. The server is the only place a rule can live." },
        { t: "table",
          head: ["OWASP API (2023)", "In one line", "The core fix"],
          rows: [
            ["**API1** Broken Object Level Authorization", "Change an ID in the request, get someone else's record", "Check ownership of *every* object, every time, server-side"],
            ["**API2** Broken Authentication", "Weak login, unthrottled guessing, unverified tokens", "Throttling, MFA, generic errors, strict token validation"],
            ["**API3** Broken Object Property Level Authorization", "Reading or writing fields you shouldn't (mass assignment, over-sharing)", "Response DTOs and an allowlist of writable fields"],
            ["**API4** Unrestricted Resource Consumption", "Huge pages, uploads or request floods", "Rate limits, page-size caps, timeouts, quotas"],
            ["**API5** Broken Function Level Authorization", "A regular user calls an admin route", "Deny-by-default role checks on every function"],
            ["**API6** Unrestricted Access to Sensitive Business Flows", "Bots buying out stock, mass sign-ups", "Business-aware limits, device fingerprinting, CAPTCHAs where justified"],
            ["**API7** Server-Side Request Forgery", "The server fetches a URL the user chose, including internal ones", "Outbound allowlist, block private ranges after DNS resolution, no redirects"],
            ["**API8** Security Misconfiguration", "Verbose errors, permissive CORS, missing TLS", "Hardened, reviewed, automated configuration"],
            ["**API9** Improper Inventory Management", "Forgotten v1 endpoints, shadow APIs", "An up-to-date inventory (OpenAPI), retire old versions"],
            ["**API10** Unsafe Consumption of APIs", "Trusting data from third-party APIs", "Validate and bound everything you receive, from anyone"]
          ] },
        { t: "h", text: "See the controls work" },
        { t: "p", md: "Below is a replay of traffic against a pretend API that lives inside this page. Some requests are normal use; the rest each map to an OWASP API category. Switch on the controls one at a time and watch which red rows turn green. Notice that no control blocks legitimate traffic: good API defenses are precise, not blunt." },
        { t: "widget", id: "apidefense" },
        { t: "h", text: "Patterns that make the controls stick" },
        { t: "list", items: [
          "**Authorize in one place.** A single policy function (or a policy engine) that every handler calls, with deny-by-default. Scattered `if user.isAdmin` checks are where gaps hide.",
          "**Never bind request bodies straight onto models.** Define an input schema per endpoint and copy only allowed fields. Define an output DTO so internal fields never leave.",
          "**Make IDs meaningless to guess, but don't rely on it.** Random UUIDs slow enumeration; ownership checks *stop* it.",
          "**Return 404 for \"not yours\"** where appropriate, so callers can't map which IDs exist.",
          "**Log authorization failures** and alert on bursts. A user hitting hundreds of other users' IDs is a signal, not noise."
        ]},
        { t: "widget", id: "quiz", data: [
          { q: "A user changes /orders/1001 to /orders/1003 and sees another customer's order. Which OWASP API risk?", choices: ["API4 Resource consumption", "API1 Broken Object Level Authorization", "API7 SSRF", "API9 Inventory"], answer: 1, explain: "The server didn't check that the caller owns object 1003." },
          { q: "Does switching to random UUIDs fix BOLA?", choices: ["Yes, completely", "No; it slows guessing, but only an ownership check fixes it", "Only for admins", "Only over HTTPS"], answer: 1, explain: "IDs leak through URLs, logs and shared links. The server must still check ownership." },
          { q: "Best defense against mass assignment?", choices: ["Hide the field in the UI", "An allowlist of client-writable fields per endpoint", "Rename the field", "Rate limiting"], answer: 1, explain: "Bind only fields the client is allowed to set; ignore or reject the rest." }
        ]}
      ]
    },

    "automated-pentesting": {
      era: "api",
      title: "Automated and AI pentesters: testing your own app",
      subtitle: "What tools like Shannon look for, and how to put them to work on your side.",
      minutes: 10,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "A new class of tools runs penetration tests autonomously. [Shannon](https://github.com/KeygraphHQ/shannon), an open-source AI pentester, reads an application's source code, maps its trust boundaries and data flows, then drives a browser and command-line tools against a **running copy of the app you own** to confirm findings with proof. Its documented focus is the OWASP classes this track covers: injection, XSS, SSRF, broken authentication and broken authorization." },
        { t: "note", kind: "attack", md: "**Authorization is the whole difference between a test and a crime.** Tools like this mutate state: they create users, submit forms and trigger outbound requests. Their own documentation says to run them only against systems you own or are explicitly authorized to test, in staging or local environments with disposable data. Bulwark doesn't bundle or drive any such tool." },
        { t: "h", text: "What changes when attackers have automation too" },
        { t: "list", items: [
          "**Coverage is cheap.** An automated tester will try every endpoint and every ID, not just the obvious ones. The forgotten v1 route (API9) gets found.",
          "**Speed is high.** Probing that took a human a week takes an agent hours, so controls must be systematic (shared authorization, schema validation, rate limits), not patched one bug at a time.",
          "**Source-aware testing finds logic bugs.** Reading the code reveals where ownership checks are missing, which a black-box scanner often can't."
        ]},
        { t: "h", text: "Putting it on the defender's side" },
        { t: "steps", items: [
          { h: "Scope it.", md: "Write down which hosts and accounts are in scope. Point the tool only at a staging or local deployment you control." },
          { h: "Use disposable data.", md: "Seed test accounts and fake records; never production data or real customer accounts." },
          { h: "Contain egress.", md: "Run the target where outbound network is restricted, so an SSRF finding can't reach anything real." },
          { h: "Run it in CI.", md: "Test every release, not once a year; gate merges on confirmed findings." },
          { h: "Fix the class, not the instance.", md: "When it finds one missing ownership check, add the shared policy check everywhere, plus a regression test." },
          { h: "Keep humans in the loop.", md: "Reports from AI tools can be wrong; review findings. And don't point AI tools at untrusted code: the code itself can carry prompt injection (see the AI-security lesson)." }
        ]},
        { t: "widget", id: "quiz", data: [
          { q: "What makes running an automated pentester legitimate?", choices: ["Using a popular tool", "Explicit authorization and a target you own, ideally staging with disposable data", "Running it at night", "Running it from a VPN"], answer: 1, explain: "Authorization and scope are what separate testing from attacking." },
          { q: "A tool finds one endpoint missing an ownership check. Best response?", choices: ["Patch that endpoint only", "Add a shared authorization check used by every handler, plus tests", "Rename the endpoint", "Block the tool"], answer: 1, explain: "Fix the class of bug so the next endpoint doesn't repeat it." }
        ]}
      ]
    }
,
    "session-attacks": {
      era: "applied",
      title: "Session fixation and open redirects",
      subtitle: "Two small mistakes in login flows, and the one-line habits that prevent them.",
      minutes: 9,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "After you log in, a **session ID** in a cookie is your identity. Two classic bugs abuse the moments around login: letting someone else choose your session ID before you log in (**session fixation**), and letting a link choose where the site sends you afterwards (**open redirect**)." },
        { t: "h", text: "Session fixation" },
        { t: "widget", id: "walkthrough", data: {
          title: "A session ID chosen in advance",
          attack: [
            { who: "attacker", say: "The attacker visits the shop and is given an anonymous session ID. They note it down.", screen: { kind: "response", title: "Set-Cookie header", lines: ["Set-Cookie: sid=A1B2C3; Secure; HttpOnly"], hl: "sid=A1B2C3" } },
            { who: "attacker", say: "On this flawed site the session ID can also travel in the URL. The attacker sends you a link carrying their ID.", screen: { kind: "browser", url: "https://shop.example/login?sid=A1B2C3", lines: ["Sign in to Shop"], hl: "sid=A1B2C3" } },
            { who: "victim", say: "You sign in normally. The site upgrades the existing session to \"logged in as you\" but keeps the same ID.", screen: { kind: "terminal", lines: ["session A1B2C3: anonymous → user=sam (ID unchanged)"], hl: "ID unchanged" } },
            { who: "attacker", say: "The attacker already holds A1B2C3, so they are now logged in as you.", screen: { kind: "browser", url: "https://shop.example/account", lines: ["Hello, Sam.", "Saved card ending 4242"] } }
          ],
          defend: [
            { who: "defender", label: "Rotate on login", say: "The server issues a brand-new random session ID at login and throws the old one away. The ID the attacker holds is now worthless.", screen: { kind: "terminal", lines: ["login ok for sam: session A1B2C3 destroyed, new session 9F7E… issued"], hl: "new session" } },
            { who: "defender", label: "Cookies only", say: "Session IDs are accepted only from a Secure, HttpOnly, SameSite cookie, never from the URL, so they can't be planted with a link.", screen: { kind: "response", title: "Set-Cookie header", lines: ["Set-Cookie: __Host-sid=9F7E…; Secure; HttpOnly; SameSite=Lax; Path=/"], hl: "__Host-" } },
            { who: "victim", say: "Same on every privilege change (password reset, MFA step-up, switching to admin): new privileges, new session ID.", screen: { kind: "browser", url: "https://shop.example/account", lines: ["Hello, Sam.", "(only you hold this session)"] } }
          ] } },
        { t: "h", text: "Open redirects" },
        { t: "widget", id: "walkthrough", data: {
          title: "A trusted link that lands somewhere else",
          attack: [
            { who: "app", say: "After login, the bank sends you back to the page you came from, read from a next= parameter.", screen: { kind: "browser", url: "https://bank.example/login?next=/statements", lines: ["Sign in to continue"], hl: "next=/statements" } },
            { who: "attacker", say: "A phishing email uses the real bank domain, but the next= value points to a look-alike site.", screen: { kind: "browser", url: "https://bank.example/login?next=https://bank-secure.example/verify", lines: ["(the real bank's real login page)"], hl: "next=https://bank-secure.example/verify" } },
            { who: "victim", say: "You check the domain, it's genuine, and you sign in. The bank then forwards you to the look-alike, which asks you to \"re-enter your card details\".", screen: { kind: "browser", url: "https://bank-secure.example/verify", lines: ["Session expired. Please confirm your card number."], button: "Confirm", decoy: true } }
          ],
          defend: [
            { who: "defender", label: "Allowlist", say: "The server only redirects to its own relative paths, or to an explicit allowlist. Anything else falls back to the home page.", screen: { kind: "code", lines: ["next = request.query.next", "if not is_safe_relative_path(next):  # starts with a single '/', no scheme or host", "    next = '/'", "redirect(next)"], hl: "is_safe_relative_path" } },
            { who: "defender", label: "Indirect references", say: "Better still, the link carries an ID (next=statements) that the server maps to a path, so no URL from the user is ever followed.", screen: { kind: "code", lines: ["DESTINATIONS = {'statements': '/statements', 'cards': '/cards'}", "redirect(DESTINATIONS.get(request.query.next, '/'))"] } },
            { who: "victim", say: "The phishing link now just drops you on the bank's own home page.", screen: { kind: "browser", url: "https://bank.example/", lines: ["Welcome back."] } }
          ] } },
        { t: "widget", id: "quiz", data: [
          { q: "What single change defeats session fixation?", choices: ["Longer session IDs", "Issue a new session ID at login and every privilege change", "Shorter timeouts", "Hashing the session ID"], answer: 1, explain: "A fresh ID at authentication makes any ID the attacker planted beforehand useless." },
          { q: "Why are open redirects useful to phishers?", choices: ["They break TLS", "The link shows a trusted domain, which then forwards to an untrusted one", "They steal cookies directly", "They disable MFA"], answer: 1, explain: "Victims (and filters) trust the real domain at the start of the link." }
        ]}
      ]
    },

    "network-exposure": {
      era: "detection",
      title: "Port scanning and attack surface",
      subtitle: "What an internet-wide scan sees of your server, and how to make it see almost nothing.",
      minutes: 10,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "Every service listening on a network port is a door. **Port scanning** is the act of knocking on many doors to see which answer, and it happens to every internet-facing address, constantly, from researchers and criminals alike. You can't stop being scanned; you can control what the scan finds." },
        { t: "table",
          head: ["A scan reports…", "Meaning", "What it tells an outsider"],
          rows: [
            ["**open**", "a service accepted the connection", "something is running here; they'll try to identify it"],
            ["**closed**", "the host answered, but nothing is listening", "the machine exists and is reachable"],
            ["**filtered**", "no answer: a firewall dropped the probe", "very little, which is the point"]
          ] },
        { t: "widget", id: "exposure" },
        { t: "h", text: "Shrinking the attack surface" },
        { t: "list", items: [
          "**Default-deny inbound.** Allow only the ports the product needs (usually 443, plus 80 to redirect) and drop everything else.",
          "**Bind internal services privately.** Databases, caches and admin APIs should listen on `127.0.0.1` or a private subnet, never `0.0.0.0` on a public interface. A firewall mistake then exposes nothing.",
          "**Put admin access behind a VPN or bastion** with key-based SSH, not open to the world.",
          "**Scan yourself.** Run an authorized external scan of *your own* address ranges on a schedule and diff the results, so a newly opened port is caught by you first. Cloud providers' security tools can do this continuously.",
          "**Detect scans in your logs.** One source touching many ports in seconds is MITRE ATT&CK **T1046 (Network Service Discovery)**. Alone it's noise; followed by login attempts it's a lead."
        ]},
        { t: "note", kind: "attack", md: "Scanning networks you don't own or have written permission to test can be illegal. Bulwark's widget computes its \"scan\" from a table on the page; it sends nothing." },
        { t: "widget", id: "quiz", data: [
          { q: "A probe gets no reply at all. The port is reported as…", choices: ["open", "closed", "filtered", "vulnerable"], answer: 2, explain: "Silence usually means a firewall dropped the packet." },
          { q: "Best place for a database to listen?", choices: ["0.0.0.0 on the public interface with a strong password", "127.0.0.1 or a private subnet, behind a default-deny firewall", "Port 443 so it looks like a website", "A random high port"], answer: 1, explain: "Layer it: not listening publicly and blocked by the firewall. Obscure ports are found by any full scan." }
        ]}
      ]
    },

    "secure-code-review": {
      era: "api",
      title: "Secure code review: find it before an attacker does",
      subtitle: "Six short server snippets. Click the flawed line, then choose the fix.",
      minutes: 12,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "Code review is the cheapest place to stop a vulnerability: no exploit, no incident, just a comment on a pull request. Reviewers who know the common shapes of security bugs catch them in seconds. Each snippet below has **one** line that creates a vulnerability from earlier lessons. Find it, then pick the fix a senior reviewer would ask for." },
        { t: "widget", id: "codereview", data: [
          { title: "Order lookup", file: "routes/orders.js",
            lines: ["router.get('/api/orders/:id', requireLogin, async (req, res) => {", "  const order = await db.orders.findById(req.params.id);", "  if (!order) return res.status(404).end();", "  res.json(order);", "});"],
            bug: 1, why: "the query fetches any order by ID without checking it belongs to the logged-in user (BOLA, OWASP API1).",
            fixes: ["Switch to random UUIDs for order IDs", "Scope the query to the caller: findOne({ id, ownerId: req.user.id }), returning 404 otherwise", "Hide the order ID from the URL", "Add rate limiting to the route"],
            answer: 1, explain: "Ownership must be enforced in the query or a shared policy check. UUIDs and rate limits only slow enumeration." },
          { title: "Profile update", file: "routes/profile.js",
            lines: ["router.patch('/api/users/me', requireLogin, async (req, res) => {", "  const user = await db.users.findById(req.user.id);", "  Object.assign(user, req.body);", "  await user.save();", "  res.json(toPublicProfile(user));", "});"],
            bug: 2, why: "every field in the request body is copied onto the user record, including role or balance (mass assignment, OWASP API3).",
            fixes: ["Validate that req.body is JSON", "Copy only allowlisted fields: const { displayName, bio } = req.body", "Remove the role field from the HTML form", "Run the update in a transaction"],
            answer: 1, explain: "Bind only the fields this endpoint lets clients change. Hiding a form field doesn't stop someone sending it." },
          { title: "Search", file: "repo/products.py",
            lines: ["def search(term):", "    sql = \"SELECT id, name FROM products WHERE name LIKE '%\" + term + \"%'\"", "    return db.execute(sql).fetchall()"],
            bug: 1, why: "user input is concatenated into SQL text, so it can change the query's structure (injection).",
            fixes: ["Escape single quotes in term", "Use a bound parameter: execute(\"… LIKE ?\", ('%' + term + '%',))", "Limit term to 50 characters", "Catch database errors so nothing is shown"],
            answer: 1, explain: "Parameters travel separately from the query, so input can never become SQL. Escaping by hand is fragile." },
          { title: "Account creation", file: "auth/register.py",
            lines: ["def register(email, password):", "    digest = hashlib.sha256(password.encode()).hexdigest()", "    db.users.insert(email=email, password_hash=digest)"],
            bug: 1, why: "a single fast, unsalted SHA-256 lets a stolen database be cracked at billions of guesses per second.",
            fixes: ["Use SHA-512 instead", "Hash with Argon2id via a vetted library, e.g. PasswordHasher().hash(password)", "Encrypt the password with AES", "Hash it twice"],
            answer: 1, explain: "Password storage needs a slow, salted, ideally memory-hard function. Bigger or repeated fast hashes don't fix it, and encryption is reversible." },
          { title: "Payment client", file: "services/payments.js",
            lines: ["const client = new PaymentsClient({", "  apiKey: 'live_51HxQfake0nly4teachingXyZ',", "  timeoutMs: 5000,", "});"],
            bug: 1, why: "a live credential is hardcoded in source, so everyone with repo access (and every clone, fork and CI log) has it.",
            fixes: ["Base64-encode the key", "Load it at runtime from a secret manager or injected env var, and rotate the exposed key", "Move it to a config.json file", "Make the repository private"],
            answer: 1, explain: "Secrets belong in a secret manager, referenced by name. Once committed, the key must also be rotated." },
          { title: "Link preview", file: "routes/preview.js",
            lines: ["router.post('/api/preview', requireLogin, async (req, res) => {", "  const page = await httpGet(req.body.url, { followRedirects: true });", "  res.json({ title: extractTitle(page) });", "});"],
            bug: 1, why: "the server fetches whatever URL the user supplies, including internal and cloud-metadata addresses (SSRF, OWASP API7).",
            fixes: ["Check that the URL string doesn't contain 'localhost'", "Allow only https to approved hosts, resolve DNS and refuse private/loopback/link-local addresses, and disable redirects", "Set a shorter timeout", "Only allow logged-in users"],
            answer: 1, explain: "String blocklists are bypassed by alternate address forms and redirects. Validate the resolved destination against an allowlist." }
        ]},
        { t: "note", kind: "defend", md: "**Make the review systematic.** A short checklist on every pull request that touches a route: *Who may call this? Which object, which fields? Is input bound as data? Where do secrets come from? What can this make the server fetch?* Static analysis (this repo runs CodeQL) catches some of these automatically; the authorization questions still need a human." }
      ]
    }
,
    "hsts-ct": {
      era: "live",
      title: "HSTS and Certificate Transparency",
      subtitle: "Closing the gap before HTTPS starts, and catching certificates that should never have existed.",
      minutes: 11,
      verified: "2026-10-18",
      body: [
        { t: "p", md: "TLS protects a connection once it exists. Two gaps remain: the moment *before* a browser decides to use HTTPS, and the possibility that a Certificate Authority (CA) issues a valid-looking certificate for your domain to someone else. **HTTP Strict Transport Security (HSTS)** closes the first. **Certificate Transparency (CT)** makes the second visible." },
        { t: "h", text: "The first gap: the plain-HTTP moment" },
        { t: "widget", id: "walkthrough", data: {
          title: "Downgraded on café Wi-Fi",
          attack: [
            { who: "victim", say: "You type bank.example into the address bar. With no scheme given, the browser's first request goes out over plain HTTP, expecting a redirect to HTTPS.", screen: { kind: "request", lines: ["GET / HTTP/1.1", "Host: bank.example", "(unencrypted)"], hl: "(unencrypted)" } },
            { who: "attacker", say: "Someone controlling the café network intercepts that unencrypted request. They talk HTTPS to the bank themselves, but keep talking plain HTTP to you, rewriting https:// links to http://. This is \"SSL stripping\", demonstrated publicly in 2009.", screen: { kind: "code", title: "the network in the middle", lines: ["you  ⇄  café router (HTTP, readable)", "café router  ⇄  bank (HTTPS)"], hl: "HTTP, readable" } },
            { who: "victim", say: "The page looks normal; only the missing padlock gives it away. Your login travels in the clear.", screen: { kind: "browser", url: "http://bank.example/login", lines: ["Sign in", "(no padlock)"], hl: "http://" } }
          ],
          defend: [
            { who: "defender", label: "HSTS header", say: "Over HTTPS, the bank sends Strict-Transport-Security. From then on, for max-age seconds, the browser rewrites every bank.example request to HTTPS itself, before anything touches the network, and refuses to click through certificate errors.", screen: { kind: "response", title: "response header", lines: ["Strict-Transport-Security: max-age=63072000; includeSubDomains"], hl: "max-age=63072000" } },
            { who: "defender", label: "Preload list", say: "HSTS only helps after a first secure visit. Submitting the domain to the browsers' preload list ships the rule inside the browser, so even the very first visit is HTTPS.", screen: { kind: "response", title: "preload-eligible header", lines: ["Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"], hl: "preload" } },
            { who: "victim", say: "The café network never sees a plain-HTTP request to strip.", screen: { kind: "browser", url: "https://bank.example/login", lines: ["Sign in", "🔒 connection secure"] } }
          ] } },
        { t: "list", items: [
          "Browsers **ignore** an HSTS header received over plain HTTP (RFC 6797 §8.1), so a network attacker can't plant or remove it.",
          "Roll out gradually: start with a short `max-age` (a day), confirm every subdomain serves HTTPS, then raise it to one or two years.",
          "**Preloading is hard to undo**; the preload list requires `max-age` of at least one year, `includeSubDomains`, and `preload`, plus an HTTP→HTTPS redirect.",
          "GitHub Pages serves `*.github.io` sites over HTTPS, so a Bulwark deployment there starts from a secure default; a custom domain needs its own HSTS header."
        ]},
        { t: "h", text: "The second gap: a certificate for your domain you didn't ask for" },
        { t: "widget", id: "walkthrough", data: {
          title: "A rogue certificate, and how CT exposes it",
          attack: [
            { who: "attacker", say: "An attacker breaks into a Certificate Authority's systems and issues themselves a certificate for a big site. This really happened: in 2011 the DigiNotar CA issued a fraudulent *.google.com certificate.", screen: { kind: "code", title: "certificate", lines: ["Subject: *.google.com", "Issuer: DigiNotar Public CA 2025", "Signature: valid ✓"], hl: "valid ✓" } },
            { who: "browser", say: "Because the CA was trusted, browsers accepted the certificate. It was used to intercept connections, mostly from users in Iran.", screen: { kind: "browser", url: "https://mail.google.com", lines: ["🔒 connection secure  (it wasn't)"] } },
            { who: "victim", say: "Nothing on screen looked wrong. The certificate was valid, just issued to the wrong party, and nobody but the attacker knew it existed.", screen: { kind: "terminal", lines: ["who knew the certificate existed: the attacker"], hl: "the attacker" } }
          ],
          defend: [
            { who: "defender", label: "CT logs", say: "Today, every publicly trusted certificate must be recorded in public, append-only Certificate Transparency logs. Chrome and Apple platforms refuse certificates that don't carry proof of logging (Signed Certificate Timestamps).", screen: { kind: "code", title: "certificate", lines: ["Subject: shop.example", "SCTs: 3 (from 2+ independent log operators)"], hl: "SCTs" } },
            { who: "defender", label: "Monitoring", say: "Because the logs are public, a domain owner can watch them. Monitors (crt.sh is one public search) alert you within hours to any certificate issued for your names.", screen: { kind: "terminal", lines: ["ALERT new certificate for shop.example", "issuer: Unknown CA Ltd · not in our inventory · revoke + investigate"], hl: "not in our inventory" } },
            { who: "defender", label: "CAA record", say: "A DNS CAA record also tells every CA which ones may issue for your domain; CAs must check it before issuing.", screen: { kind: "response", title: "DNS record", lines: ["shop.example.  CAA 0 issue \"letsencrypt.org\""] } }
          ] } },
        { t: "table",
          head: ["Control", "Stops", "Where it lives"],
          rows: [
            ["**HSTS** (+ preload)", "SSL stripping, clicking through certificate warnings", "an HTTP response header; the browser's built-in preload list"],
            ["**Certificate Transparency**", "mis-issued certificates going unnoticed", "public logs (RFC 6962), enforced by Chrome and Apple"],
            ["**CT monitoring**", "slow discovery of a rogue certificate", "your alerting, fed by log monitors"],
            ["**CAA**", "unauthorized CAs issuing in the first place", "a DNS record (RFC 8659)"]
          ] },
        { t: "note", kind: "info", md: "**Which CT version?** Browsers enforce CT as specified in RFC 6962. RFC 9162 (\"CT 2.0\") exists but is an Experimental successor that browsers don't require. Exact SCT-count rules change over time, so read the current Chrome and Apple policy pages rather than memorizing numbers." },
        { t: "widget", id: "quiz", data: [
          { q: "Why does HSTS need a first secure visit (unless preloaded)?", choices: ["The header is only honored when received over HTTPS", "It's too large for HTTP", "HTTP has no headers", "It requires a cookie"], answer: 0, explain: "A browser ignores HSTS headers sent over plain HTTP, otherwise an attacker could set or strip them." },
          { q: "What does Certificate Transparency actually provide?", choices: ["Encryption of certificates", "A public, append-only record of every issued certificate, so mis-issuance can be detected", "Faster TLS handshakes", "Free certificates"], answer: 1, explain: "CT doesn't prevent issuance; it makes every certificate visible so domain owners can spot ones they didn't request." },
          { q: "Which record limits which CAs may issue for your domain?", choices: ["MX", "CAA", "TXT SPF", "AAAA"], answer: 1, explain: "CAA (RFC 8659) lists the CAs allowed to issue; CAs must check it." }
        ]}
      ]
    }

  };

  /* Ordered lesson ids per era, for navigation. */
  const order = {
    foundations: ["classical-ciphers", "steganography"],
    core: ["cia-triad", "threat-modeling"],
    live: ["hashing", "public-key", "tls-handshake", "hsts-ct"],
    applied: ["injection", "csrf-samesite", "clickjacking", "session-attacks", "owasp-top10", "passwords-auth", "storing-secrets", "tokens-oauth", "llm-security", "supply-chain"],
    api: ["api-security", "secure-code-review", "automated-pentesting"],
    detection: ["network-exposure", "availability-ddos", "detection-response"],
    frontier: ["frontier-pqc", "quantum-crypto", "zero-trust"]
  };

  const sources = [
    { title: "OWASP Top 10:2025", pub: "OWASP", url: "https://owasp.org/Top10/", verified: "2026-09-30", status: "consensus",
      note: "Released 2025-11-06. Broken Access Control at #1; new categories A03 Software Supply Chain Failures and A10 Mishandling of Exceptional Conditions." },
    { title: "SHA-2 family — FIPS 180-4", pub: "NIST", url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final", verified: "2026-09-30", status: "consensus",
      note: "Defines SHA-256 and relatives, used by the hash-avalanche widget via Web Crypto." },
    { title: "SHA-3 — FIPS 202", pub: "NIST", url: "https://csrc.nist.gov/pubs/fips/202/final", verified: "2026-09-30", status: "consensus", note: "The Keccak-based hash standard." },
    { title: "TLS 1.3 — RFC 8446", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc8446", verified: "2026-09-30", status: "consensus", note: "The protocol targeted by the milestone-2 byte-walkthrough." },
    { title: "ML-KEM — FIPS 203", pub: "NIST", url: "https://csrc.nist.gov/pubs/fips/203/final", verified: "2026-09-30", status: "consensus", note: "Post-quantum key encapsulation. Finalized 2024-08-13." },
    { title: "ML-DSA — FIPS 204", pub: "NIST", url: "https://csrc.nist.gov/pubs/fips/204/final", verified: "2026-09-30", status: "consensus", note: "Post-quantum digital signatures. Finalized 2024-08-13." },
    { title: "SLH-DSA — FIPS 205", pub: "NIST", url: "https://csrc.nist.gov/pubs/fips/205/final", verified: "2026-09-30", status: "consensus", note: "Hash-based signatures. Finalized 2024-08-13." },
    { title: "MITRE ATT&CK", pub: "MITRE", url: "https://attack.mitre.org/", verified: "2026-09-30", status: "consensus", note: "Shared vocabulary of adversary techniques; the milestone-3 explorer's data source." },
    { title: "The Illustrated TLS 1.3 Connection", pub: "syncsynchalt", url: "https://tls13.xargs.org/", verified: "2026-09-30", status: "reference", note: "Teaching-style model for the byte-walkthrough widget." },
    { title: "DDoS attacks (Learning Center)", pub: "Cloudflare", url: "https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/", verified: "2026-09-30", status: "reference", note: "Defense-first framing used for the availability lesson." },
    { title: "The Case for Memory-Safe Roadmaps", pub: "CISA et al.", url: "https://www.cisa.gov/resources-tools/resources/case-memory-safe-roadmaps", verified: "2026-09-30", status: "consensus", note: "Why the memory-safety track pushes safe languages." },
    { title: "New Directions in Cryptography", pub: "Diffie & Hellman, 1976", url: "https://doi.org/10.1109/TIT.1976.1055638", verified: "2026-09-30", status: "consensus", note: "Public-key cryptography's founding paper." },
    { title: "Algorithms for quantum computation: discrete logs and factoring", pub: "Shor, 1994", url: "https://doi.org/10.1109/SFCS.1994.365700", verified: "2026-09-30", status: "consensus", note: "Why RSA and ECC fall to a large quantum computer." },
    { title: "A method for obtaining digital signatures and public-key cryptosystems", pub: "Rivest, Shamir & Adleman, 1978", url: "https://doi.org/10.1145/359340.359342", verified: "2026-09-30", status: "consensus", note: "The original RSA paper; the worked example mirrors its scheme." },
    { title: "A fast quantum mechanical algorithm for database search", pub: "Grover, 1996", url: "https://doi.org/10.1145/237814.237866", verified: "2026-09-30", status: "consensus", note: "The quadratic search speedup — why symmetric keys only need to double." },
    { title: "Web Authentication (WebAuthn) Level 3", pub: "W3C", url: "https://www.w3.org/TR/webauthn-3/", verified: "2026-09-30", status: "consensus", note: "The standard behind passkeys / phishing-resistant public-key login." },
    { title: "Digital Identity Guidelines — SP 800-63B", pub: "NIST", url: "https://pages.nist.gov/800-63-3/sp800-63b.html", verified: "2026-09-30", status: "consensus", note: "Modern authentication guidance: length over composition, no forced resets." },
    { title: "HQC selected as fifth PQC algorithm", pub: "NIST", url: "https://csrc.nist.gov/news/2025/hqc-announcement", verified: "2026-09-30", status: "active", note: "Backup key-encapsulation mechanism selected March 2025; standard drafting ongoing." },
    { title: "The STRIDE Threat Model", pub: "Microsoft", url: "https://learn.microsoft.com/en-us/previous-versions/commerce-server/ee823878(v=cs.20)", verified: "2026-09-30", status: "reference", note: "The six-category checklist used in the threat-modeling lesson." },
    { title: "Computer Security Incident Handling Guide — SP 800-61", pub: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/61/r2/final", verified: "2026-09-30", status: "consensus", note: "The response-loop phases in the detection lesson." },
    { title: "JSON Web Token (JWT) — RFC 7519", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc7519", verified: "2026-09-30", status: "consensus", note: "The token format the JWT inspector decodes and verifies." },
    { title: "The OAuth 2.0 Authorization Framework — RFC 6749", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc6749", verified: "2026-09-30", status: "consensus", note: "Delegated authorization; basis of the OAuth flow widget." },
    { title: "PKCE — RFC 7636", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc7636", verified: "2026-09-30", status: "consensus", note: "Proof Key for Code Exchange — stops authorization-code interception." },
    { title: "OWASP Top 10 for LLM Applications (2025)", pub: "OWASP", url: "https://genai.owasp.org/llm-top-10/", verified: "2026-09-30", status: "consensus", note: "The AI-security risk list; Prompt Injection at #1." },
    { title: "Content Security Policy Level 3", pub: "W3C", url: "https://www.w3.org/TR/CSP3/", verified: "2026-09-30", status: "consensus", note: "The header the CSP builder assembles." },
    { title: "Quantum cryptography: public key distribution and coin tossing", pub: "Bennett & Brassard, 1984", url: "https://doi.org/10.1016/j.tcs.2014.05.025", verified: "2026-09-30", status: "consensus", note: "The original BB84 protocol behind the QKD widget." },
    { title: "SLSA — Supply-chain Levels for Software Artifacts", pub: "OpenSSF", url: "https://slsa.dev/", verified: "2026-09-30", status: "consensus", note: "Provenance and integrity framework referenced in the supply-chain lesson." },
    { title: "Secure Software Development Framework — SP 800-218", pub: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/218/final", verified: "2026-09-30", status: "consensus", note: "Supply-chain and secure-development practices." },
    { title: "OWASP API Security Top 10 (2023)", pub: "OWASP", url: "https://api-security.owasp.org/editions/2023/en/0x11-t10/", verified: "2026-10-18", status: "consensus", note: "The ten API risk categories (API1 BOLA through API10 Unsafe Consumption) used by the API security track." },
    { title: "Password Storage Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Argon2id m=19 MiB t=2 p=1; scrypt N=2^17 r=8 p=1; bcrypt cost ≥10 and the 72-byte limit; PBKDF2-HMAC-SHA256 600,000 iterations; peppers kept in a vault or HSM." },
    { title: "Secrets Management Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Centralization, rotation, dynamic secrets, and leak response." },
    { title: "Argon2 — RFC 9106", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc9106", verified: "2026-10-18", status: "consensus", note: "The memory-hard password-hashing function; Argon2id is the recommended variant." },
    { title: "scrypt — RFC 7914", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc7914", verified: "2026-10-18", status: "consensus", note: "Memory-hard key derivation; also carries PBKDF2-HMAC-SHA256 test vectors used in tests/." },
    { title: "A Future-Adaptable Password Scheme (bcrypt)", pub: "Provos & Mazières, USENIX 1999", url: "https://www.usenix.org/legacy/events/usenix99/provos/provos.pdf", verified: "2026-10-18", status: "consensus", note: "The original bcrypt paper: a tunable cost so hashing keeps pace with hardware." },
    { title: "Password-Based Key Derivation — SP 800-132", pub: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/132/final", verified: "2026-10-18", status: "consensus", note: "PBKDF2 guidance; NIST has announced a planned revision." },
    { title: "Recommendation for Key Management — SP 800-57 Part 1 Rev. 5", pub: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final", verified: "2026-10-18", status: "consensus", note: "Cryptoperiods, key hierarchies and rotation." },
    { title: "Security Requirements for Cryptographic Modules — FIPS 140-3", pub: "NIST", url: "https://csrc.nist.gov/pubs/fips/140-3/final", verified: "2026-10-18", status: "consensus", note: "The validation standard for HSMs and other crypto modules." },
    { title: "AES Key Wrap — RFC 3394", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc3394", verified: "2026-10-18", status: "consensus", note: "The AES-KW algorithm the envelope widget uses to wrap data keys." },
    { title: "GCM and GMAC — SP 800-38D", pub: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/38/d/final", verified: "2026-10-18", status: "consensus", note: "AES-GCM, the AEAD mode used for data encryption; NIST has announced a revision." },
    { title: "AWS KMS cryptography essentials: envelope encryption", pub: "AWS", url: "https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html#enveloping", verified: "2026-10-18", status: "reference", note: "How a cloud KMS wraps data keys under a key that never leaves it." },
    { title: "Envelope encryption (Cloud KMS)", pub: "Google Cloud", url: "https://docs.cloud.google.com/kms/docs/envelope-encryption", verified: "2026-10-18", status: "reference", note: "The same DEK/KEK pattern as implemented by Google Cloud KMS." },
    { title: "Database secrets engine", pub: "HashiCorp Vault", url: "https://developer.hashicorp.com/vault/docs/secrets/databases", verified: "2026-10-18", status: "reference", note: "Dynamic, leased database credentials generated per role." },
    { title: "Rotate AWS Secrets Manager secrets", pub: "AWS", url: "https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html", verified: "2026-10-18", status: "reference", note: "Managed, scheduled secret rotation." },
    { title: "Kubernetes Secrets", pub: "Kubernetes", url: "https://kubernetes.io/docs/concepts/configuration/secret/", verified: "2026-10-18", status: "reference", note: "States that Secrets are stored unencrypted in etcd by default." },
    { title: "Encrypting Confidential Data at Rest", pub: "Kubernetes", url: "https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/", verified: "2026-10-18", status: "reference", note: "Turning on encryption at rest for Secrets, including KMS providers." },
    { title: "Push protection", pub: "GitHub Docs", url: "https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection", verified: "2026-10-18", status: "reference", note: "Blocking pushes that contain recognized credentials." },
    { title: "gitleaks", pub: "gitleaks", url: "https://github.com/gitleaks/gitleaks", verified: "2026-10-18", status: "reference", note: "Open-source secret scanner run in this repo's CI. Its README notes it is now feature-complete (security fixes only)." },
    { title: "SOPS", pub: "getsops (CNCF)", url: "https://github.com/getsops/sops", verified: "2026-10-18", status: "reference", note: "Encrypting secret files for GitOps with KMS-backed keys." },
    { title: "Web Cryptography API", pub: "W3C", url: "https://www.w3.org/TR/webcrypto-1/", verified: "2026-10-18", status: "consensus", note: "Non-extractable keys, AES-GCM, AES-KW and PBKDF2 used by the secrets widgets." },
    { title: "HTML5 Security Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Don't store session identifiers or sensitive data in localStorage." },
    { title: "Set-Cookie header", pub: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie", verified: "2026-10-18", status: "reference", note: "HttpOnly, Secure and SameSite attributes." },
    { title: "Cookies: HTTP State Management Mechanism (rfc6265bis)", pub: "IETF", url: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/", verified: "2026-10-18", status: "active", note: "Defines SameSite; draft -22 is in the RFC Editor queue. Chrome/Edge default to Lax; Firefox and Safari do not." },
    { title: "Cross-Site Request Forgery Prevention Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Tokens, SameSite, and Origin checks." },
    { title: "Clickjacking Defense Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "frame-ancestors must be an HTTP response header, not a meta tag (also CSP3 §3.3)." },
    { title: "Authorization Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Deny by default; check authorization on every request." },
    { title: "Mass Assignment Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Allowlists and DTOs." },
    { title: "Server-Side Request Forgery Prevention Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Outbound allowlists and post-resolution address checks." },
    { title: "Credential Stuffing Prevention Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "MFA, throttling and generic login errors." },
    { title: "Additional HTTP Status Codes — RFC 6585", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc6585", verified: "2026-10-18", status: "consensus", note: "Defines 429 Too Many Requests." },
    { title: "Reserved Top Level DNS Names — RFC 2606", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc2606", verified: "2026-10-18", status: "consensus", note: "Why every host in the walkthroughs ends in .example." },
    { title: "Shannon — autonomous AI pentester", pub: "Keygraph", url: "https://github.com/KeygraphHQ/shannon", verified: "2026-10-18", status: "reference", note: "Source-aware AI pentesting for web apps and APIs; focuses on injection, XSS, SSRF, broken authn/authz. AGPL-3.0; referenced, not bundled." },
    { title: "Hacksplaining", pub: "Hacksplaining", url: "https://www.hacksplaining.com/", verified: "2026-10-18", status: "reference", note: "Style inspiration for the short, visual step-by-step walkthroughs. No content copied." },
    { title: "Session Management Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Regenerate the session ID after authentication and any privilege change to prevent session fixation." },
    { title: "Unvalidated Redirects and Forwards Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Don't take redirect destinations from user input; allowlist approved destinations." },
    { title: "Network Service Discovery (T1046)", pub: "MITRE ATT&CK", url: "https://attack.mitre.org/techniques/T1046/", verified: "2026-10-18", status: "consensus", note: "The ATT&CK technique for port and service scanning." },
    { title: "Port Scanning Basics", pub: "Nmap Network Scanning", url: "https://nmap.org/book/man-port-scanning-basics.html", verified: "2026-10-18", status: "reference", note: "Definitions of the open, closed and filtered port states." },
    { title: "Guidelines on Firewalls and Firewall Policy — SP 800-41 Rev. 1", pub: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/41/r1/final", verified: "2026-10-18", status: "consensus", note: "Recommends deny-by-default for inbound traffic (Executive Summary and §4)." },
    { title: "Database Security Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Bind databases to localhost or restrict network access with firewall rules." },
    { title: "IPv4 Address Blocks Reserved for Documentation — RFC 5737", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc5737", verified: "2026-10-18", status: "consensus", note: "198.51.100.0/24 (TEST-NET-2), used in the firewall-log example." },
    { title: "Secure Code Review Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "How to run security-focused code review." },
    { title: "OWASP Code Review Guide", pub: "OWASP", url: "https://owasp.org/www-project-code-review-guide/", verified: "2026-10-18", status: "reference", note: "The longer book-length companion (v2, 2017)." },
    { title: "HTTP Strict Transport Security (HSTS) — RFC 6797", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc6797", verified: "2026-10-18", status: "consensus", note: "max-age and includeSubDomains; §8.1: headers received over insecure transport must be ignored." },
    { title: "HSTS Preload List Submission", pub: "Chromium", url: "https://hstspreload.org/", verified: "2026-10-18", status: "reference", note: "Requirements: valid cert, HTTP→HTTPS redirect, all subdomains on HTTPS, max-age ≥ 31536000 with includeSubDomains and preload." },
    { title: "HTTP Strict Transport Security Cheat Sheet", pub: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html", verified: "2026-10-18", status: "consensus", note: "Rollout guidance, and the warning that preload is hard to undo." },
    { title: "New Tricks for Defeating SSL in Practice (sslstrip)", pub: "Marlinspike, Black Hat DC 2009", url: "https://www.blackhat.com/presentations/bh-dc-09/Marlinspike/BlackHat-DC-09-Marlinspike-Defeating-SSL.pdf", verified: "2026-10-18", status: "reference", note: "The SSL-stripping talk that motivated HSTS." },
    { title: "Certificate Transparency — RFC 6962", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc6962", verified: "2026-10-18", status: "consensus", note: "The CT version browsers enforce." },
    { title: "Certificate Transparency Version 2.0 — RFC 9162", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc9162", verified: "2026-10-18", status: "active", note: "Experimental successor to RFC 6962; not what browsers require today." },
    { title: "Certificate Transparency", pub: "certificate.transparency.dev", url: "https://certificate.transparency.dev/", verified: "2026-10-18", status: "reference", note: "Project overview: detecting maliciously or mistakenly issued certificates; list of log monitors." },
    { title: "Chrome Certificate Transparency Policy", pub: "Google Chrome", url: "https://googlechrome.github.io/CertificateTransparency/ct_policy.html", verified: "2026-10-18", status: "consensus", note: "Publicly trusted certificates must be CT-compliant (SCT requirements) in Chrome." },
    { title: "Apple's Certificate Transparency policy", pub: "Apple", url: "https://support.apple.com/en-us/103214", verified: "2026-10-18", status: "consensus", note: "Apple platforms fail TLS for non-compliant certificates; at least one SCT from an RFC 6962 log." },
    { title: "crt.sh Certificate Search", pub: "Sectigo", url: "https://crt.sh/", verified: "2026-10-18", status: "reference", note: "Public search over CT logs; one of the listed CT monitors." },
    { title: "An update on attempted man-in-the-middle attacks", pub: "Google Security Blog, 2011", url: "https://security.googleblog.com/2011/08/update-on-attempted-man-in-middle.html", verified: "2026-10-18", status: "consensus", note: "The fraudulent DigiNotar certificate, used mainly against users in Iran." },
    { title: "DigiNotar breach interim report (Operation Black Tulip)", pub: "Fox-IT, 2011", url: "https://www.sec.gov/Archives/edgar/data/1044777/000119312511241796/dex992.htm", verified: "2026-10-18", status: "consensus", note: "Forensic report on the CA compromise and the rogue *.google.com certificate." },
    { title: "DNS Certification Authority Authorization (CAA) — RFC 8659", pub: "IETF", url: "https://www.rfc-editor.org/rfc/rfc8659", verified: "2026-10-18", status: "consensus", note: "Domain holders list which CAs may issue; CAs must check before issuing." }
  ];

  const glossary = [
    { term: "AEAD", def: "Authenticated Encryption with Associated Data — a cipher mode that provides both confidentiality and integrity in one step (e.g., AES-GCM).", lesson: "tls-handshake" },
    { term: "Avalanche effect", def: "A property of good hash functions: a tiny input change flips about half the output bits.", lesson: "hashing" },
    { term: "Birthday bound", def: "The rule that finding a hash collision takes about 2^(n/2) work for an n-bit digest — far less than 2^n.", lesson: "hashing" },
    { term: "CIA triad", def: "Confidentiality, Integrity, Availability — the three properties most security work protects.", lesson: "cia-triad" },
    { term: "Content Security Policy (CSP)", def: "A browser header that restricts where scripts, styles, and other resources may load from, limiting the damage of an XSS flaw.", lesson: "injection" },
    { term: "Defense in depth", def: "Layering independent controls so that one failure is not a breach.", lesson: "cia-triad" },
    { term: "Diffie–Hellman", def: "A key-exchange method that lets two parties derive a shared secret over an open channel.", lesson: "public-key" },
    { term: "Discrete logarithm problem", def: "The hard problem (recover x from g^x mod p) underpinning Diffie–Hellman and much public-key crypto.", lesson: "public-key" },
    { term: "Entropy", def: "A measure of unpredictability, in bits; each bit doubles an attacker's guessing work.", lesson: "passwords-auth" },
    { term: "Injection", def: "A flaw where untrusted input is interpreted as code or structure (SQL, shell, HTML).", lesson: "injection" },
    { term: "Kerckhoffs's principle", def: "A system should remain secure even if everything except the key is public.", lesson: "classical-ciphers" },
    { term: "Least privilege", def: "Granting each user, process, or key the minimum access it needs, so a compromise stays small.", lesson: "cia-triad" },
    { term: "MITRE ATT&CK", def: "A catalog of real adversary tactics and techniques, used as a shared defensive vocabulary.", lesson: "detection-response" },
    { term: "Parameterized query", def: "Sending a query and its data on separate channels so input can never change the query's structure — the fix for SQL injection.", lesson: "injection" },
    { term: "Passkey / WebAuthn", def: "Public-key authentication where your device signs a challenge, so there is no shared secret to phish.", lesson: "passwords-auth" },
    { term: "Post-quantum cryptography", def: "Algorithms designed to resist attacks by a large quantum computer (e.g., ML-KEM, ML-DSA).", lesson: "frontier-pqc" },
    { term: "Salt", def: "A random per-password value added before hashing so identical passwords hash differently and precomputed tables fail.", lesson: "hashing" },
    { term: "Shor's algorithm", def: "A quantum algorithm that efficiently factors integers and solves discrete logs, breaking RSA and ECC.", lesson: "frontier-pqc" },
    { term: "STRIDE", def: "A threat-modeling checklist: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.", lesson: "threat-modeling" },
    { term: "Trust boundary", def: "A line where data crosses between zones you control differently — where threats cluster.", lesson: "threat-modeling" },
    { term: "TLS 1.3", def: "The current Transport Layer Security protocol; sets up an encrypted, authenticated channel in one round trip.", lesson: "tls-handshake" },
    { term: "Zero trust", def: "An architecture that trusts no request by default — every one is authenticated and authorized on its own.", lesson: "zero-trust" },
    { term: "JSON Web Token (JWT)", def: "A signed, base64url-encoded token (header.payload.signature). Readable by anyone; tamper-evident via its signature.", lesson: "tokens-oauth" },
    { term: "OAuth 2.0", def: "A framework for delegated authorization — letting one app act at another on your behalf without sharing your password.", lesson: "tokens-oauth" },
    { term: "PKCE", def: "Proof Key for Code Exchange — an OAuth add-on that stops a stolen authorization code from being redeemed.", lesson: "tokens-oauth" },
    { term: "Prompt injection", def: "Untrusted input that carries instructions an LLM follows, overriding the developer's — OWASP LLM01.", lesson: "llm-security" },
    { term: "Rate limiting", def: "Capping how many requests a client may make, commonly via a token bucket, to blunt floods and abuse.", lesson: "availability-ddos" },
    { term: "Token bucket", def: "A rate-limiting algorithm: a bucket refills at a steady rate and each request spends a token; empty means throttled.", lesson: "availability-ddos" },
    { term: "Quantum Key Distribution (QKD)", def: "Sharing a secret key using quantum states, so any eavesdropping disturbs them and is detected.", lesson: "quantum-crypto" },
    { term: "BB84", def: "The first QKD protocol (Bennett & Brassard, 1984): random bases, then keep the positions where they matched.", lesson: "quantum-crypto" },
    { term: "No-cloning theorem", def: "An unknown quantum state cannot be copied — the physics that makes QKD eavesdropping detectable.", lesson: "quantum-crypto" },
    { term: "QBER", def: "Quantum Bit Error Rate — the error fraction in a sifted key; a high value signals an eavesdropper.", lesson: "quantum-crypto" },
    { term: "Steganography", def: "Hiding the existence of a message (e.g., in an image's low bits), as opposed to encrypting its contents.", lesson: "steganography" },
    { term: "Chain of trust", def: "The signed path from a server's leaf certificate up through intermediate CAs to a trusted root.", lesson: "tls-handshake" },
    { term: "Certificate Authority (CA)", def: "An entity that signs certificates, vouching that a public key belongs to a named subject.", lesson: "tls-handshake" },
    { term: "Software Bill of Materials (SBOM)", def: "A machine-readable inventory of every component and dependency shipped in a piece of software.", lesson: "supply-chain" },
    { term: "Dependency confusion", def: "A supply-chain attack where a public package is pulled in place of an intended internal one.", lesson: "supply-chain" },
    { term: "Argon2id", def: "A memory-hard password-hashing function (RFC 9106); the current first choice for storing passwords.", lesson: "storing-secrets" },
    { term: "Envelope encryption", def: "Encrypting data with a per-record data key (DEK), then encrypting that key with a key-encryption key (KEK) held in a KMS or HSM.", lesson: "storing-secrets" },
    { term: "Data-encryption key (DEK)", def: "The key that actually encrypts a piece of data; stored only in wrapped (encrypted) form.", lesson: "storing-secrets" },
    { term: "Key-encryption key (KEK)", def: "A key used only to wrap other keys; kept inside a KMS or HSM and never exported.", lesson: "storing-secrets" },
    { term: "Hardware Security Module (HSM)", def: "Tamper-resistant hardware that stores keys and performs crypto without ever releasing the key material.", lesson: "storing-secrets" },
    { term: "Key Management Service (KMS)", def: "A managed service, built on HSMs, that creates, wraps, rotates and audits use of keys.", lesson: "storing-secrets" },
    { term: "Secret manager", def: "A central, audited store for credentials (Vault, AWS Secrets Manager, etc.) that apps read at runtime.", lesson: "storing-secrets" },
    { term: "Pepper", def: "A secret key mixed into password hashing and stored apart from the database, e.g. in an HSM.", lesson: "storing-secrets" },
    { term: "Key rotation", def: "Replacing a key on a schedule or after suspected exposure, limiting how much data any one key protects.", lesson: "storing-secrets" },
    { term: "CSRF", def: "Cross-Site Request Forgery — another site makes your browser send an authenticated request you didn't intend.", lesson: "csrf-samesite" },
    { term: "SameSite cookie", def: "A cookie attribute (Strict, Lax, None) controlling whether the cookie is sent on cross-site requests.", lesson: "csrf-samesite" },
    { term: "Clickjacking", def: "Tricking a user into clicking a hidden, framed element of another site.", lesson: "clickjacking" },
    { term: "BOLA", def: "Broken Object Level Authorization (OWASP API1) — the API returns records without checking the caller owns them.", lesson: "api-security" },
    { term: "BFLA", def: "Broken Function Level Authorization (OWASP API5) — a user can call functions (often admin ones) they shouldn't.", lesson: "api-security" },
    { term: "Mass assignment", def: "Binding every field of a request onto a data model, letting clients set fields like role or balance.", lesson: "api-security" },
    { term: "SSRF", def: "Server-Side Request Forgery — making a server fetch a URL of the requester's choosing, often an internal one.", lesson: "api-security" },
    { term: "Session fixation", def: "Planting a known session ID before the victim logs in, so the attacker shares the authenticated session. Fixed by issuing a new ID at login.", lesson: "session-attacks" },
    { term: "Open redirect", def: "A site that forwards users to any URL given in a parameter, lending its trusted domain to phishing links.", lesson: "session-attacks" },
    { term: "Port scan", def: "Probing many network ports to see which services answer (open, closed or filtered). ATT&CK T1046.", lesson: "network-exposure" },
    { term: "Attack surface", def: "Everything an outsider can reach and interact with: open ports, endpoints, inputs. Smaller is safer.", lesson: "network-exposure" },
    { term: "Default deny", def: "A firewall or authorization policy that blocks everything not explicitly allowed.", lesson: "network-exposure" },
    { term: "Secure code review", def: "Reading changes specifically for security flaws (authorization, injection, secrets) before they merge.", lesson: "secure-code-review" },
    { term: "HSTS", def: "HTTP Strict Transport Security — a header telling browsers to use only HTTPS for a domain for a set time.", lesson: "hsts-ct" },
    { term: "SSL stripping", def: "Downgrading a victim's connection to plain HTTP by intercepting the first unencrypted request.", lesson: "hsts-ct" },
    { term: "Certificate Transparency (CT)", def: "Public, append-only logs of every publicly trusted certificate, so mis-issuance can be spotted.", lesson: "hsts-ct" },
    { term: "CAA record", def: "A DNS record naming which Certificate Authorities may issue certificates for a domain.", lesson: "hsts-ct" }
  ];

  const challenges = [
    { id: "caesar", cat: "Crypto", points: 10, title: "Shift happens",
      prompt: "This message was encrypted with a Caesar cipher, shift 3. Decrypt it.",
      code: "WKLV LV IXQ", placeholder: "the plaintext",
      hint: "Shift each letter back by 3: W→T, K→H…",
      check: (a) => a.trim().toUpperCase().replace(/\s+/g, " ") === "THIS IS FUN" },
    { id: "b64", cat: "Encoding", points: 10, title: "Base what?",
      prompt: "Decode this Base64 string.", code: "aW5qZWN0aW9u", placeholder: "decoded text",
      hint: "It's a web-security bug class.",
      check: (a) => { try { return a.trim() === atob("aW5qZWN0aW9u"); } catch (e) { return false; } } },
    { id: "hex", cat: "Encoding", points: 10, title: "Hex marks the spot",
      prompt: "These hex bytes spell an ASCII word. What is it?", code: "53 41 46 45", placeholder: "the word",
      hint: "0x53 is the letter 'S'.",
      check: (a) => a.trim().toUpperCase() === "SAFE" },
    { id: "xor", cat: "Crypto", points: 15, title: "Flip a bit",
      prompt: "Compute 0x41 XOR 0x20. Give the result as two hex digits.", placeholder: "e.g. 7f",
      hint: "XOR flips the bits that are set in 0x20. 0x41 is 'A'.",
      check: (a) => parseInt(a.trim().replace(/^0x/i, ""), 16) === (0x41 ^ 0x20) },
    { id: "sqlifix", cat: "Web", points: 15, title: "Pick the real fix",
      prompt: "Best defense against SQL injection? Answer a, b, or c.  a) escape bad characters  b) parameterized queries  c) hide error messages",
      placeholder: "a, b, or c",
      hint: "Structure beats blocklists.",
      check: (a) => a.trim().toLowerCase().replace(/[).]/g, "") === "b" },
    { id: "port", cat: "Networking", points: 10, title: "Knock knock",
      prompt: "What TCP port does HTTPS use by default?", placeholder: "a number",
      hint: "HTTP is 80; the secure version is…",
      check: (a) => a.trim() === "443" },
    { id: "entropy", cat: "Passwords", points: 20, title: "Count the bits",
      prompt: "A passphrase of 4 words chosen randomly from a 2048-word list has how many bits of entropy? (whole number)",
      placeholder: "bits",
      hint: "Each word adds log2(2048) bits.",
      check: (a) => parseInt(a.trim(), 10) === 44 },
    { id: "flag", cat: "Forensics", points: 20, title: "Capture the flag",
      prompt: "Decode this Base64 to recover the flag.", code: "YnVsd2Fya3txa2Rfc2VjdXJlc19rZXlzfQ==", placeholder: "bulwark{…}",
      hint: "Flags here look like bulwark{...}.",
      check: (a) => { try { return a.trim() === atob("YnVsd2Fya3txa2Rfc2VjdXJlc19rZXlzfQ=="); } catch (e) { return false; } } },
    { id: "bola", cat: "API", points: 15, title: "Whose order is it?",
      prompt: "Changing /orders/1001 to /orders/1003 returns another customer's order. Give the OWASP API 2023 ID (e.g. API9).", placeholder: "APIn",
      hint: "It's the very first item on the list.",
      check: (a) => /^api ?1(:2023)?$/i.test(a.trim()) },
    { id: "bcrypt72", cat: "Secrets", points: 15, title: "The long-password trap",
      prompt: "bcrypt silently ignores input past how many bytes?", placeholder: "a number",
      hint: "It's in the OWASP Password Storage Cheat Sheet.",
      check: (a) => a.trim() === "72" },
    { id: "envelope", cat: "Secrets", points: 20, title: "Key for the key",
      prompt: "In envelope encryption, the key that wraps data keys and never leaves the KMS is called the ___ (three letters).", placeholder: "abbreviation",
      hint: "Key-Encryption Key.",
      check: (a) => a.trim().toUpperCase() === "KEK" },
    { id: "samesite", cat: "Web", points: 10, title: "Stay on your side",
      prompt: "Which cookie attribute stops a session cookie riding along on cross-site POSTs?", placeholder: "attribute name",
      hint: "Its values are Strict, Lax and None.",
      check: (a) => /^samesite(=(lax|strict))?$/i.test(a.trim()) },
    { id: "filtered", cat: "Networking", points: 10, title: "Silence is golden",
      prompt: "A port probe gets no response at all because a firewall dropped it. What state does a scanner report? (one word)", placeholder: "state",
      hint: "Not open, not closed…",
      check: (a) => a.trim().toLowerCase() === "filtered" },
    { id: "t1046", cat: "Detection", points: 15, title: "Name that technique",
      prompt: "What is the MITRE ATT&CK technique ID for Network Service Discovery (port scanning)?", placeholder: "Txxxx",
      hint: "It starts with T10.",
      check: (a) => a.trim().toUpperCase() === "T1046" },
    { id: "metaframe", cat: "Web", points: 20, title: "The ignored directive",
      prompt: "Which CSP directive does nothing when the policy is set in a <meta> tag instead of an HTTP header? (it controls who may frame the page)", placeholder: "directive name",
      hint: "Look at the clickjacking lesson.",
      check: (a) => a.trim().toLowerCase() === "frame-ancestors" },
    { id: "argon", cat: "Secrets", points: 10, title: "Pick the variant",
      prompt: "Argon2 comes in three variants: Argon2d, Argon2i and Argon2__. Which letters complete the one OWASP recommends?", placeholder: "letters",
      hint: "It combines the other two.",
      check: (a) => /^(argon2)?id$/i.test(a.trim()) },
    { id: "fixation", cat: "Web", points: 15, title: "Fresh start",
      prompt: "To defeat session fixation, what must the server issue at the moment a user logs in? (two words)", placeholder: "…",
      hint: "Out with the old ___ ___.",
      check: (a) => /^(a )?new session( id)?$/i.test(a.trim()) || /^(fresh|new) (session )?id$/i.test(a.trim()) },
    { id: "hstsyear", cat: "Web", points: 15, title: "A year in seconds",
      prompt: "The HSTS preload list requires max-age of at least one year. How many seconds is that (365 days)?", placeholder: "seconds",
      hint: "365 × 24 × 60 × 60.",
      check: (a) => a.trim().replace(/[,_ ]/g, "") === "31536000" },
    { id: "ctrfc", cat: "Crypto", points: 15, title: "The log everyone checks",
      prompt: "Which RFC number specifies the Certificate Transparency version browsers enforce today?", placeholder: "RFC number",
      hint: "Not the 2.0 one (9162).",
      check: (a) => /^(rfc ?)?6962$/i.test(a.trim()) }
  ];

  return { eras, lessons, order, sources, glossary, challenges };
})();
