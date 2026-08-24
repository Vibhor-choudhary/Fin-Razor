# Environment Variables Guide

---

## Where Secrets Live

| Environment | Location | Accessible to |
|---|---|---|
| Local development | `.env` file (git-ignored) | Backend process via `os.environ` (Python) |
| Vercel (preview/prod) | Vercel Project → Settings → Environment Variables | Build & runtime serverless functions |
| CI (if added later) | CI secrets store (e.g., GitHub Actions Secrets) | Build pipeline only |

> **Rule:** The `.env` file must **never** be committed to git. Confirm `.env` is listed in `.gitignore` before your first commit.

---

## Variable Reference

| Variable | Required | Description |
|---|---|---|
| `HYPERSWITCH_API_KEY_TEST` | Yes | Hyperswitch sandbox secret key. Get from https://app.hyperswitch.io → Developers → API Keys. |
| `UPSONIC_API_KEY` | Yes (if using Upsonic cloud) | API key for Upsonic inference. Get from https://docs.upsonic.ai. |
| `SENTRY_DSN` | Yes | Sentry DSN. Get from your Sentry project's Client Keys page. |
| `APP_ENV` | Yes | `development` locally, `production` on Vercel. Read by FastAPI via `os.environ`. |
| `VITE_API_URL` | Yes | Backend API base URL. `http://localhost:8000` locally; Vercel URL in prod. |
| `DATABASE_URL` | Yes | SQLite path (`sqlite:///./dev.db`) locally; Postgres connection string on Vercel. |
| `PORT` | No | FastAPI port (default: 8000). Not needed on Vercel (uses its own port). |

---

## Setting Up Locally

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Open .env and fill in each blank value
#    Use your preferred editor
code .env   # VS Code
# or
nano .env

# 3. Verify the file is git-ignored
cat .gitignore | grep .env
# Expected output: .env

# 4. Start the FastAPI backend
uvicorn main:app --reload --port 8000
```

---

## Configuring Vercel Environment Variables

### Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project (first time only)
vercel link

# Add each secret
vercel env add HYPERSWITCH_API_KEY_TEST
vercel env add UPSONIC_API_KEY
vercel env add SENTRY_DSN
vercel env add APP_ENV
vercel env add VITE_API_URL
vercel env add DATABASE_URL
```

Select **Production**, **Preview**, and **Development** scopes as appropriate when prompted.

### Via Vercel Dashboard

1. Go to https://vercel.com/dashboard → select your project.
2. Navigate to **Settings → Environment Variables**.
3. Click **Add New** for each variable.
4. Set the **Environment** to `Production` (and optionally `Preview`).
5. Paste the value and click **Save**.
6. **Redeploy** the project for changes to take effect.

---

## Secrets Rotation

If a key is compromised:

1. Rotate the key in the originating service (Hyperswitch, Sentry, Upsonic).
2. Update the value in Vercel Environment Variables.
3. Trigger a new deployment (`vercel deploy` or push a commit).
4. Update your local `.env` with the new value.

---

## Variable Naming Convention

- Backend-only variables: no prefix (e.g., `HYPERSWITCH_API_KEY_TEST`).
- Frontend-visible variables: must be prefixed with `VITE_` (Vite) or `NEXT_PUBLIC_` (Next.js) so the bundler includes them in the client bundle. Never put secrets in `VITE_` variables.
