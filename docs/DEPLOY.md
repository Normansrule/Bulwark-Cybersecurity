# Deploying Bulwark from a blank Ubuntu terminal

Every command below is copy-paste-able. Replace `YOUR-USERNAME` with your GitHub
username and, if you renamed the project, `bulwark` with your repo name. These
steps assume you unzipped the project so that `~/bulwark/index.html` exists.

---

## 0. One-time setup on a fresh machine

```bash
sudo apt update
sudo apt install -y git unzip
# The GitHub CLI (gh) makes the rest one-liners. Install it:
sudo apt install -y gh   # if that package isn't found, see https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Tell git who you are (used for commit authorship):
git config --global user.name  "Aleksander Norman"
git config --global user.email "aleksanderjnorman@gmail.com"
```

If you have the zip rather than a folder:

```bash
cd ~
unzip bulwark.zip        # produces ~/bulwark
cd ~/bulwark
```

---

## 1. Check it works locally first

```bash
cd ~/bulwark
node --test              # run the worked-example tests (expects: pass, 0 fail)
python3 -m http.server 8000
# open http://localhost:8000 in a browser, then Ctrl-C to stop
```

---

## 2. Create the repo and push — the easy path (GitHub CLI)

```bash
cd ~/bulwark
gh auth login            # follow the browser prompt once

git init
git branch -M main
git add -A
git commit -m "Initial commit: Bulwark defensive security curriculum (MVP + public-key, TLS, OWASP, auth, post-quantum)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# Create the GitHub repo and push in one step:
gh repo create bulwark --public --source=. --remote=origin --push

# Turn on GitHub Pages (serve the site from the repo root of main):
gh api --method POST "repos/YOUR-USERNAME/bulwark/pages" \
  -f "source[branch]=main" -f "source[path]=/" || \
  echo "If that failed, enable Pages in the web UI (step 4)."
```

Your site will be live in a minute or two at:
`https://YOUR-USERNAME.github.io/bulwark/`

---

## 3. Create the repo and push — the manual path (no gh)

First create an **empty** repo named `bulwark` on github.com (no README,
no .gitignore, no license — the project already has them). Then:

```bash
cd ~/bulwark
git init
git branch -M main
git add -A
git commit -m "Initial commit: Bulwark defensive security curriculum

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git remote add origin https://github.com/YOUR-USERNAME/bulwark.git
git push -u origin main
```

---

## 4. Enable Pages in the web UI (if step 2's API call didn't)

On github.com: **your repo → Settings → Pages → Build and deployment →
Source: Deploy from a branch → Branch: `main` / `/ (root)` → Save.**
Wait a minute, then visit `https://YOUR-USERNAME.github.io/bulwark/`.

---

## 5. Appending changes later (every time you add or edit anything)

From inside `~/bulwark`:

```bash
git add -A
git commit -m "Add TLS byte-walkthrough lesson"   # describe what changed
git push
```

That's the whole loop — `add`, `commit`, `push`. GitHub Pages redeploys
automatically on every push to `main`, usually within a minute.

### Handy variations

```bash
git status               # see what changed before committing
git add js/widgets/newthing.js docs/NEWLESSON.md   # stage specific files instead of -A
git log --oneline        # review your commit history
```

---

## Notes

- The site is a **static** GitHub Pages app — no build step, no server, no secrets.
- The one requirement is a secure context for the hash widget; `github.io` is
  HTTPS, so it works there. Locally, use `http://localhost` (step 1), not a
  `file://` path.
- Tests run in CI automatically on every push (see `.github/workflows/ci.yml`),
  and the same `node --test` runs locally.
