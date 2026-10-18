# Hands-on Labs: Attack → Defend

*Expansion to the project brief. This section specifies the "hacking labs" track: learners see how a flaw is exploited (in a bundled sandbox), then spend most of their time fixing it, detecting it, and designing it out. The exploit is the hook; the defense is the lesson.*

---

## Guiding rule for this track (sharpening the brief's ethics section)

The brief's non-negotiables apply to every lab below. Three of them matter most here:

1. **The attack step is always sandboxed against a bundled target.** Labs ship their own intentionally vulnerable practice app. There is no field to enter an external host, and the runner refuses any target the learner did not start locally. This is enforced in code, not just in docs.
2. **The graded outcome is the fix or the detection — never a reusable weapon.** A learner passes by submitting a patch, a configuration, or a detection rule that the test suite verifies. They never submit "an exploit that works."
3. **Where a topic could cause real harm, we teach the mechanism and the defense, not a runnable tool.** This is the line for the two sharper tracks:
   - **Memory corruption (Track 2):** learners *observe* memory being corrupted in a toy binary under a sanitizer. The platform never ships shellcode, Return-Oriented Programming (ROP) chains, or portable exploit-development tutorials against real software.
   - **Distributed Denial of Service / DDoS (Track 3):** learners *simulate* attack traffic against a bundled localhost service and *configure the mitigations*. The platform never ships a load-testing tool that accepts a remote target, a list of open amplifiers/reflectors, or botnet command-and-control code. Attacking a system you do not own is a crime in most jurisdictions; the labs make that impossible by design, not just discouraged.

Every lab page states, up top: *"You are attacking a machine you started, on your own computer, that talks to nothing else."*

---

## The lab template (every lab uses this shape)

1. **Objective** — one sentence, phrased as a defense ("Prevent untrusted input from changing a Structured Query Language (SQL) query's structure").
2. **Background & a real incident** — why this bug class exists, and one famous case, so it isn't abstract.
3. **The bundled target** — the toy app/binary, and how the sandbox confines it.
4. **See the flaw** — the scripted, sandboxed attack step. Confined to the bundled target, and identical every run so it teaches the mechanism, not target-hunting.
5. **Fix it** — the actual point of the lab. The learner edits code/config.
6. **Detect it** — a log signature, alert, or detection rule (blue-team muscle).
7. **Design it out** — the secure-by-default pattern that would have prevented the whole class.
8. **Passing test** — automated check in `tests/` that verifies the fix holds *and* the detection fires.

---

## Track 1 — Injection & untrusted input

The unifying idea, stated once and reused: **data crossing a trust boundary must never be interpreted as code or structure.** Every lab in this track is a variation on that one failure.

| Lab | Bug class | The fix the learner submits | Detection they write |
|---|---|---|---|
| 1.1 | SQL injection | Parameterized queries / prepared statements | Query-error spikes; unexpected `OR 1=1`-style patterns in app logs |
| 1.2 | Command injection | Drop the shell; pass an argument vector to a fixed binary; allowlist | Process-spawn events with shell metacharacters |
| 1.3 | Cross-Site Scripting (XSS), reflected + stored | Context-aware output encoding; Content Security Policy (CSP) | CSP violation reports; script-like payloads in stored fields |
| 1.4 | Path traversal | Canonicalize then confine to a base directory; reject `..` | File reads outside the intended root |
| 1.5 | Server-Side Request Forgery (SSRF) | Allowlist of destinations; block link-local/metadata ranges | Outbound requests to internal/metadata addresses |

**Lab 1.1 — SQL injection (the anchor lab).**
*Background:* the 2008 Heartland breach and countless others trace back to this one class; it remains near the top of the Open Worldwide Application Security Project (OWASP) list. *Target:* a toy login/search page over a local SQLite database. *See the flaw:* the scripted step submits a classic tautology into the search box and the sandboxed app returns rows it shouldn't. *Fix:* replace string-concatenated SQL with parameterized queries; the test re-runs the same input and confirms it's now treated as a literal. *Design it out:* an Object-Relational Mapper (ORM) or query builder that never exposes raw concatenation. *Detect:* a rule that flags SQL syntax errors and boolean-tautology patterns in the query log.

**Lab 1.3 — XSS** doubles as the platform's own dogfooding lesson: the brief already requires the lesson widgets to treat all rendered strings as untrusted and never `eval` input. This lab shows learners *why* that requirement exists by letting them break a deliberately naive version, then locking it down with output encoding plus a strict CSP — the same CSP the real site ships.

**Lab 1.5 — SSRF** ties directly to the sandbox architecture: the "no outbound network by default" rule is itself an SSRF mitigation. Learners see the connection between a code-level fix (destination allowlist) and an infrastructure-level control (network namespace with no egress).

---

## Track 2 — Memory safety & the off-by-one family

*Framing on every page:* this track exists so learners can **recognize and eliminate** an entire class of bug — the reason modern guidance (including from the U.S. Cybersecurity and Infrastructure Security Agency, CISA) pushes memory-safe languages. Learners watch corruption happen under instrumentation; they do not build working exploits.

| Lab | Bug class | See the flaw (sandboxed) | Fix / design out |
|---|---|---|---|
| 2.1 | Off-by-one / buffer overflow | Toy C program crashes under AddressSanitizer (ASan) when a loop writes one element past a stack buffer | Correct the bound; use a length-checked API; the passing test is a clean ASan run |
| 2.2 | Integer overflow → undersized allocation | A size calculation wraps, `malloc` returns a too-small buffer, ASan catches the overflow | Checked arithmetic; reject implausible sizes before allocating |
| 2.3 | Use-after-free | ASan reports a read of freed memory in a toy linked-list | Null-after-free discipline; smart pointers / ownership; move to a memory-safe language |
| 2.4 | Format-string bug (conceptual + demo) | `printf(user_input)` leaks stack contents in the toy | Always use a fixed format string; enable `-Wformat-security` |

**The prevention toolbox** (the real deliverable of this track — a page learners return to):
- **Sanitizers:** AddressSanitizer and UndefinedBehaviorSanitizer (UBSan) as a default build mode.
- **Fuzzing:** libFuzzer / AFL++ to *find* these bugs before shipping; a short lab where the learner runs a fuzzer against the toy and watches it find the off-by-one on its own.
- **Compiler hardening:** stack canaries (`-fstack-protector-strong`), `_FORTIFY_SOURCE`, and what each actually stops.
- **Runtime mitigations, explained not exploited:** Address Space Layout Randomization (ASLR), Non-Executable stack / Data Execution Prevention (NX/DEP), and why they raise the bar without fixing the underlying bug.
- **The real fix:** memory-safe languages. A side-by-side showing the same logic in C (bug possible) and Rust/Go (bug prevented by construction).

*What this track deliberately does not include:* crafting shellcode, defeating ASLR in practice, ROP-chain construction, or any portable exploit against real software. The lesson is "here is the bug class, here is how it's found automatically, here is how it's designed out" — which is exactly what a defender and a good engineer need.

---

## Track 3 — Availability & Distributed Denial of Service (DDoS), defensive

This is the sharpest-edged track, so it's the most tightly boxed. Learners come away understanding **how these attacks work and how to withstand them**, using traffic they generate against their own bundled service.

### Concepts first (no lab needed)
- **The "A" in the CIA triad.** Denial of Service attacks availability rather than confidentiality or integrity.
- **Taxonomy, plainly:**
  - *Volumetric* — overwhelm bandwidth (e.g., floods, amplification/reflection).
  - *Protocol / state-exhaustion* — exhaust connection tables (e.g., SYN floods).
  - *Application-layer* — cheap requests that are expensive to serve (e.g., a search endpoint hit repeatedly).
- **Why "distributed."** One source is easy to block; many sources are not. This is the whole reason botnets exist — which motivates the defenses.

### How adversaries do it (mechanism, taught at the level Cloudflare's and NIST's public materials teach it)
- **Amplification/reflection, conceptually:** an attacker sends a small request to a third-party server *with a forged (spoofed) source address* so the much larger reply is aimed at the victim. The leverage is just `amplification factor = response size ÷ request size`. Learners see *why* connectionless protocols with large responses get abused — and therefore why the fixes below work. **The platform does not name or rank the best-amplifying services, nor provide any tool that sends this traffic.**
- **Spoofing is the enabler.** Because the mechanism depends on forged source addresses, the single most important network defense is filtering them — which is the next section.
- **Botnets & economics, as a case study.** Study Mirai (2016, Dyn outage) *as a defensive post-mortem*: it spread via default credentials on Internet-of-Things (IoT) devices. The takeaway is a defensive checklist (change defaults, segment IoT, patch), not how to build one. The Morris worm (already in the brief's history section) is the natural predecessor.

### The labs (all sandboxed, local-only)
| Lab | Attack simulated (localhost only) | Mitigation the learner configures |
|---|---|---|
| 3.1 | Application-layer flood: a bundled load generator hammers a toy Hypertext Transfer Protocol (HTTP) endpoint on `localhost` | Rate limiting, response caching, a work queue; the test confirms the service stays responsive under the same load |
| 3.2 | SYN flood against a toy Transmission Control Protocol (TCP) listener in a network namespace | SYN cookies, connection/backlog limits, timeouts |
| 3.3 | Amplification, as a **visualization + math widget only** — no traffic generated | The learner reasons about ingress filtering (BCP 38 / source-address validation) and why it kills reflection at the source |

The load generator used in 3.1/3.2 is hard-wired to `127.0.0.1` (or a private lab namespace) and has no target field — same rule as every other lab.

### Defenses in depth (the page learners keep)
| Layer | Defense |
|---|---|
| Network | Anycast + Content Delivery Network (CDN) absorption; upstream/provider scrubbing; remotely-triggered blackholing as a last resort; BCP 38 ingress filtering |
| Transport | SYN cookies; connection rate/duration limits; timeouts |
| Application | Rate limiting per client; caching; cheap-to-serve error paths; queueing and load shedding |
| Operational | A runbook, traffic baselines, and an escalation path *before* an incident |

### Detection signals
Traffic volume far above baseline; a spike in half-open connections; a narrow set of request types; geographic/source distribution anomalies. This connects to the brief's detection-and-response track and the MITRE ATT&CK explorer (Impact tactic).

### The hard line for this track (state it in code and docs)
The platform **never** provides: a load/stress tool that accepts an external or configurable target, any list of open resolvers/reflectors/amplifiers, botnet or command-and-control code, or step-by-step instructions to disrupt a system the learner does not own. Simulations are confined to bundled localhost targets and exist to teach mitigation.

---

## Where this plugs into the existing brief

**Content arc.** Track 1 lives under section 4 (Applied security today / OWASP Top 10). Track 2 sits alongside section 2 (core concepts) and section 4 as a language/engineering topic. Track 3 attaches to section 4 (network defense) and section 5 (detection and response).

**Milestones.** Fold into the brief's milestone 3 ("Sandboxed labs (defensive CTF)"): ship Track 1 first (highest value, lowest risk), then Track 2, then Track 3. Track 3's hard-line review belongs in milestone 5 (ethics review of every lab).

**Security requirements for the new sandbox needs.** The existing "no outbound network, resource/time limits, read-only base, dropped capabilities" model covers Tracks 1–2. Track 3 additionally needs: a dedicated **network namespace** per lab (so simulated traffic can't leave), **cgroup** CPU/bandwidth caps (so a flood lab can't wedge the host), and a **seccomp** profile blocking raw sockets outside the lab namespace.

**Add to Template A's reference-repo table** (study the teaching style, honor licenses):

| Repo / source | What to borrow |
|---|---|
| github.com/OWASP/wrongsecrets, github.com/juice-shop/juice-shop (already in brief) | Bundled vulnerable-target design for Track 1 |
| github.com/WebGoat/WebGoat | Lesson-per-vulnerability structure with built-in hints and checks |
| portswigger.net/web-security (Web Security Academy) | Clear write-ups of each web bug class and its fix (reference, not code) |
| pwn.college | Model for teaching memory-safety concepts progressively in a sandbox |
| github.com/google/gvisor, github.com/google/nsjail, firejail | Isolation primitives for the lab runner (Track 3 especially) |
| github.com/google/sanitizers, github.com/google/AFL / AFLplusplus | The find-it-automatically tooling for Track 2 |
| CISA / NIST SP 800-61 & 800-53, Cloudflare Learning Center (DDoS) | Authoritative, defense-first framing for Track 3 |
| Mirai source analyses & the Dyn 2016 post-mortems | Defensive case study only (IoT hardening checklist) |

**Add to docs/ETHICS.md.** A short clause per track restating the hard lines above, plus the responsible-use statement that these labs teach defense by confining every offensive step to a machine the learner owns and started.

---

*One deliberate omission worth noting to reviewers: this track teaches attack mechanisms thoroughly but ships no artifact that works outside its sandbox. That's the whole design — a learner finishes able to defend, detect, and build securely, not able to attack anyone.*
