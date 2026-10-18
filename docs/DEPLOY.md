# Publishing Bulwark Cybersecurity from a blank Ubuntu terminal

Every command below is copy-paste-able. They assume the GitHub account
**Normansrule** and the repository **Bulwark-Cybersecurity** (GitHub turns the
name "Bulwark Cybersecurity" into that slug). The project zip already contains
its git history on `main`, so there's no `git init` step.

- Repository: https://github.com/Normansrule/Bulwark-Cybersecurity
- Live site:  https://normansrule.github.io/Bulwark-Cybersecurity/

---

## 0. One-time setup on a fresh machine

```bash
sudo apt update
sudo apt install -y git unzip gh nodejs npm
# If `gh` isn't found: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

git config --global user.name  "Aleksander Norman"
git config --global user.email "aleksanderjnorman@gmail.com"
gh auth login            # GitHub.com → HTTPS → log in with a web browser
```

## 1. Unzip and check it works

```bash
cd ~
unzip bulwark.zip        # produces ~/bulwark (with its .git history)
cd ~/bulwark
git log --oneline        # you should see the existing commits on main
node --test              # worked-example tests: expect "fail 0"
python3 -m http.server 8000   # open http://localhost:8000, then Ctrl-C
```

## 2. Create the repo and push

```bash
cd ~/bulwark
gh repo create Bulwark-Cybersecurity --public --source=. --remote=origin --push \
  --description "Open-source, defensive cybersecurity learning platform: ciphers to post-quantum, interactive and safe by construction."
```

## 3. Turn on GitHub Pages (serve `main`, repo root)

```bash
gh api -X POST repos/Normansrule/Bulwark-Cybersecurity/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

The site appears at https://normansrule.github.io/Bulwark-Cybersecurity/ within
a minute or two. (Web UI alternative: **Settings → Pages → Deploy from a branch →
`main` / `(root)` → Save**.)

## 4. Turn on the security features the CI expects

```bash
# Secret scanning + push protection (free on public repos)
gh api -X PATCH repos/Normansrule/Bulwark-Cybersecurity \
  -f "security_and_analysis[secret_scanning][status]=enabled" \
  -f "security_and_analysis[secret_scanning_push_protection][status]=enabled"

# Dependabot alerts (Dependabot version updates are already configured in .github/dependabot.yml)
gh api -X PUT repos/Normansrule/Bulwark-Cybersecurity/vulnerability-alerts
```

## 5. Watch the first CI run

```bash
gh run list --limit 5
gh run watch             # pick the "ci" run; expect green
```

## 6. Tick the launch steps in the README tracker

Open `docs/readme/generate.mjs`, set the four **Public launch** steps to `true`,
then:

```bash
node docs/readme/generate.mjs
git add -A && git commit -m "Mark public launch done in the README tracker" && git push
```

---

## Every change after that

```bash
cd ~/bulwark
node --test && node docs/readme/generate.mjs   # keep tests green and README numbers current
git add -A
git commit -m "Describe what changed"
git push
```

GitHub Pages redeploys automatically on every push to `main`.

## Notes

- The site is static: no build step, no server, no secrets.
- The Web Crypto widgets need a secure context; `github.io` is HTTPS,
  so they work there. Locally use `http://localhost`, not `file://`.
- GitHub Pages can't set response headers, so `frame-ancestors` can't be
  enforced there; see `docs/SECURITY.md`.
