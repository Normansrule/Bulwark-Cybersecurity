# Responsible use and the hard lines

Bulwark is a **defensive** cybersecurity education tool. Its purpose is to make people better at protecting systems — their own, their employers', and the ones society depends on. Understanding how an attack works is a prerequisite for defending against it, so Bulwark explains attacks. It does so within firm limits.

## The three non-negotiables

1. **Every offensive step is confined to a target the learner owns and started.** In the web app, that "target" is a fake in-memory database, a sandboxed `iframe`, or a math widget — nothing that can reach another machine. In the future containerized labs, it is a bundled practice app in an isolated container with no outbound network. There is no field anywhere to point an attack at an external host, by design and enforced in code.

2. **The graded outcome is always the fix or the detection — never a reusable weapon.** A learner demonstrates mastery by patching the flaw, configuring the control, or writing the detection rule. Bulwark does not ask anyone to produce "an exploit that works," and it does not ship one.

3. **Where a topic could cause real harm, we teach the mechanism and the defense, not a runnable tool.**

## Per-track lines (from `docs/LABS.md`)

**Injection & untrusted input (Track 1).** Taught fully, because the fixes (parameterized queries, output encoding, allowlists) are the entire point and the practice targets are bundled and sandboxed.

**Memory safety & the off-by-one family (Track 2).** Learners *observe* memory being corrupted in a toy program under a sanitizer, then fix it or design it out. Bulwark never ships shellcode, Return-Oriented Programming (ROP) chains, or portable exploit-development tutorials against real software.

**Availability & Distributed Denial of Service / DDoS (Track 3).** Learners study *how* these attacks work — amplification, reflection, spoofing, botnets — at the level public references like Cloudflare's Learning Center and NIST guidance teach it, and they *configure the mitigations* against a bundled localhost service. Bulwark never provides: a load or stress tool that accepts an external or configurable target; any list of open resolvers, reflectors, or amplifiers; botnet or command-and-control code; or step-by-step instructions to disrupt a system the learner does not own. The DDoS material in the MVP is a **concept visualization only** — it generates no traffic of any kind.

## Why we can teach attacks and still be defensive

Attacking a computer you do not own is a crime in most jurisdictions (in the United States, the Computer Fraud and Abuse Act). Bulwark makes that not merely discouraged but structurally impossible within the tool: the simulations have no external reach, and the labs refuse any target the learner did not start locally. A learner finishes Bulwark able to defend, detect, and build securely — not able to attack anyone.

## For contributors

Contributions that add runnable offensive tooling — working exploits, credential harvesters, traffic generators that accept a target, malware, or "just for testing" attack scripts against third parties — are **out of scope by policy.** They will be declined regardless of intent. If you're unsure whether something crosses the line, open an issue describing the *defensive* learning goal and we'll help find a safe design.

Report security issues in Bulwark itself via [`SECURITY.md`](SECURITY.md).
