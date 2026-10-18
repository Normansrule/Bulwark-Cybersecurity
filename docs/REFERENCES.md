# References & credits

Bulwark is built from scratch, but its teaching style stands on the shoulders of
excellent open resources. None of their content is copied here; they're credited
as inspiration and as places to go deeper. Honor each project's license if you
borrow from it directly.

## Teaching style we studied

| Project | What it does best | What it shaped here |
|---|---|---|
| [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/) ([repo](https://github.com/syncsynchalt/illustrated-tls13)) | Every byte of a real handshake, labeled | The TLS byte-walkthrough widget |
| [syncsynchalt/animated-curves](https://github.com/syncsynchalt/animated-curves) | Animated elliptic-curve point addition | The elliptic-curve canvas widget |
| [OWASP Top 10](https://owasp.org/Top10/) & [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) | Authoritative, current risk taxonomies | The OWASP and LLM-security lessons |
| [MITRE ATT&CK](https://attack.mitre.org/) | Shared vocabulary of adversary techniques | The ATT&CK explorer widget |
| [OWASP Juice Shop](https://github.com/juice-shop/juice-shop) & [WebGoat](https://github.com/WebGoat/WebGoat) | Bundled, deliberately vulnerable practice apps | The sandboxed-lab design in `docs/LABS.md` |
| [TheAlgorithms](https://github.com/TheAlgorithms) | Readable teaching implementations | The from-scratch cipher/crypto code |
| [Hacksplaining](https://www.hacksplaining.com/) | Short, visual, step-by-step attack-then-fix lessons | The walkthrough widget (CSRF, clickjacking). Original stories and art; nothing copied |
| [Shannon](https://github.com/KeygraphHQ/shannon) (AGPL-3.0) | Source-aware autonomous AI pentesting of web apps and APIs | The API security track's choice of vulnerability classes and the "testing your own app" lesson. Referenced only; no code bundled |
| [OWASP API Security Top 10 (2023)](https://api-security.owasp.org/editions/2023/en/0x11-t10/) | The API risk taxonomy | The API security track |
| [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) | Concrete, current defensive guidance | Password storage parameters, secrets management, CSRF, clickjacking |
| [Cloudflare Learning Center](https://www.cloudflare.com/learning/) | Plain-language defense explainers | The DDoS / availability lesson |

## Where to practice for real (all legal, sandboxed)

These are surfaced in-app on the **Challenges** page, too.

| Platform | Focus |
|---|---|
| [cryptopals](https://cryptopals.com/) | Build and break real cryptography, set by set |
| [CryptoHack](https://cryptohack.org/) | Gamified modern-cryptography challenges |
| [OverTheWire](https://overthewire.org/wargames/) | Linux and exploitation wargames |
| [picoCTF / CyLab Security Academy](https://picoctf.org/) | Beginner-friendly capture-the-flag (Carnegie Mellon) |
| [PortSwigger Web Security Academy](https://portswigger.net/web-security) | Free, thorough web-vulnerability labs |

## Primary sources

Per-claim citations (NIST FIPS, IETF RFCs, OWASP, MITRE, foundational papers)
live on the site's **Sources** page, each with a "last verified" date. See
`js/content.js` for the machine-readable list.

## A note on scope

Everything hands-on in this repo is defensive and self-contained: the practice
targets are a fake in-memory database, a sandboxed `iframe`, math widgets, and
reasoning puzzles. See `docs/ETHICS.md` for the hard lines.
