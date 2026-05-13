# Team Workflow — ICT Cloud Solutions

Welcome to the team. This guide gets you from zero to a running local build, your own branch, and a clean merge back into `main`. Follow each step in order.

---

## Step 1 — Install the tools (first time only)

| Tool | Min version | Download |
|------|------------|---------|
| Git | any recent | https://git-scm.com/downloads |
| Node.js | 18 + | https://nodejs.org (choose the LTS version) |

Verify your installs:

```bash
git --version
node --version
npm --version
```

---

## Step 2 — Clone the repository

```bash
git clone https://github.com/sufideen/ict-cloud-solutions.git
cd ict-cloud-solutions
```

You now have the full project on your laptop.

---

## Step 3 — Create your own branch

Name your branch after the feature or fix you are working on.

```bash
git checkout -b feature/your-name-or-feature
```

Examples:
```bash
git checkout -b feature/sarah-dashboard-redesign
git checkout -b fix/login-form-validation
git checkout -b feature/rag-upload-improvements
```

You are now on your own branch — your changes will not affect `main` until you merge.

---

## Step 4 — Set up your environment

```bash
# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env
```

Open `.env` in your editor and add your Supabase project URL and anon key. Ask the project lead for the shared development credentials if you do not have them yet.

---

## Step 5 — Run the app locally

```bash
npm run dev
```

Open your browser at **http://localhost:3000**

The app hot-reloads on every file save, so you can code and see changes instantly.

---

## Step 6 — Make your changes and commit

Work on your feature. When you reach a logical checkpoint, save your work:

```bash
# See what has changed
git status

# Stage the files you changed
git add src/components/MyComponent.jsx
# or stage everything at once:
git add .

# Commit with a clear message
git commit -m "feat: add file upload progress bar to RAG panel"
```

Write commit messages in plain English describing **what** and **why**.

---

## Step 7 — Push your branch to GitHub

```bash
git push -u origin feature/your-name-or-feature
```

The `-u` flag links your local branch to the remote so future pushes are just `git push`.

---

## Step 8 — Open a Pull Request

1. Go to the repository on GitHub
2. Click **"Compare & pull request"** (GitHub shows this banner automatically)
3. Write a short title and description of what you changed
4. Click **"Create pull request"**

A team member will review your code, leave any feedback, and then merge it into `main`.

---

## Day-to-day: keeping your branch up to date

While you work, `main` may receive new commits from other team members. Stay in sync:

```bash
# Fetch the latest from the remote
git fetch origin

# Merge main into your branch (resolve any conflicts if prompted)
git merge origin/main
```

Do this regularly — small merges are far easier than one large conflict at the end.

---

## Quick reference card

```
Clone once       →  git clone <url>
Create branch    →  git checkout -b feature/my-feature
Install          →  npm install
Configure env    →  cp .env.example .env  (then fill in values)
Run locally      →  npm run dev
Stage changes    →  git add .
Commit           →  git commit -m "your message"
Push branch      →  git push -u origin feature/my-feature
Open PR          →  via GitHub UI
Stay up to date  →  git fetch origin && git merge origin/main
```

---

## Rules

- **Never commit directly to `main`.**  Always work on a branch and open a PR.
- **Never commit your `.env` file.**  It contains secrets. It is already listed in `.gitignore`.
- Keep PRs focused — one feature or fix per PR makes reviews fast.
- Ask in the team chat if you are stuck. No silent blockers.
