# Deployment Runbook

---

## Prerequisites

- Python ≥ 3.11 installed locally.
- Node.js ≥ 18 installed locally (for the Vite frontend only).
- `pip install uv` (recommended) or plain `pip` for Python dependency management.
- Vercel CLI installed: `npm i -g vercel`.
- `.env` file configured (see `Env.md`).
- Vercel project linked: `vercel link` (first time only).

---

## Local Development

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 1b. Install frontend dependencies
npm install

# 2. Run DB migrations (creates tables if they don't exist)
python migrate.py

# 3. Seed synthetic session data
python seed.py

# 4a. Start the FastAPI backend (with hot reload)
uvicorn main:app --reload --port 8000

# 4b. In a separate terminal, start the Vite frontend
npm run dev
```

- Frontend dev server: `http://localhost:5173` (Vite default).
- Backend API server: `http://localhost:8000`.
- Changes to frontend files hot-reload instantly.
- Changes to backend `.py` files hot-reload via `uvicorn --reload`.

---

## Running the Agent Against Seeded Data

```bash
# Trigger the agent batch run against all pending at-risk sessions
python agent_run.py

# View the results
open http://localhost:5173/metrics
```

---

## Pre-Production Checklist

Run this before every production deploy:

```bash
# 1. Lint frontend (must pass with zero errors)
npm run lint

# 2. Type check frontend TypeScript
npm run typecheck

# 3. Lint + type check backend Python
ruff check .
mypy .

# 4. Run all tests
pytest

# 5. Production build (validates frontend bundle compiles)
npm run build
```

All commands must exit with code `0` before deploying.

---

## Deploying to Vercel

### Option A: Git Push (Recommended)

1. Push to your `main` branch:

```bash
git add .
git commit -m "feat: <description>"
git push origin main
```

2. Vercel auto-builds and deploys from the `main` branch.
3. Preview deployments are created automatically for every pull request branch.

### Option B: Vercel CLI

```bash
# Deploy to production
vercel deploy --prod

# Deploy a preview (for testing before merging)
vercel deploy
```

---

## Post-Deploy Verification

After every production deploy:

1. Open the Vercel deployment URL.
2. Navigate to `/metrics` — verify the batch metrics table loads.
3. Navigate to `/logs` — verify the audit log is populated.
4. Check Sentry for any new errors from the deploy.
5. Run one agent batch manually via the UI's **"Run Agent"** button (if implemented) and confirm a new metrics snapshot appears.

---

## Rollback

### Via Vercel Dashboard

1. Go to https://vercel.com/dashboard → your project → **Deployments**.
2. Find the last known-good deployment.
3. Click the three-dot menu → **Promote to Production**.
4. The previous version is instantly live.

### Via Vercel CLI

```bash
# List recent deployments
vercel ls

# Promote a specific deployment URL to production
vercel promote <deployment-url>
```

### Via Git

```bash
# Revert the bad commit and push
git revert HEAD
git push origin main
```

Vercel will auto-deploy the reverted commit.

---

## Environment-Specific Behaviour

| Setting | Local | Vercel Preview | Vercel Production |
|---|---|---|---|
| `APP_ENV` | `development` | `preview` | `production` |
| Database | SQLite (`sqlite:///./dev.db`) | Vercel Postgres (preview branch) | Vercel Postgres (prod) |
| Sentry | Optional | Enabled | Enabled |
| Agent batch size | Any | 20 sessions | 100 sessions |

---

## Secrets Never Go in Git

Confirm before pushing:

```bash
git status | grep .env
# Should show nothing (file is git-ignored)
```
