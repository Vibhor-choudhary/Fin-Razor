# Contributing Guide

---

## Getting Started

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd razorpay-checkout-recovery
pip install -r requirements.txt
npm install
cp .env.example .env  # then fill in values
```

2. Create a branch for your work (see naming conventions below).
3. Make focused, small changes.
4. Open a pull request against `main`.

---

## Branch Naming

Use the pattern: `<type>/<short-description>`

| Type | When to use | Example |
|---|---|---|
| `feature/` | New functionality | `feature/hyperswitch-checkout` |
| `feature/` | Agent logic | `feature/agent-detection` |
| `feature/` | UI work | `feature/metrics-dashboard` |
| `fix/` | Bug fix | `fix/guardrail-validation` |
| `chore/` | Tooling, deps, config | `chore/update-sentry-sdk` |
| `docs/` | Documentation only | `docs/api-reference` |

No long branch names. Keep the slug under 40 characters.

---

## PR Guidelines

### Size
- **Small and focused.** One PR = one feature or one fix.
- If a change touches more than 300 lines of diff, consider splitting it.
- PRs that mix features, refactors, and bug fixes will be asked to split.

### Description
Every PR must include:

```markdown
## What
<one-sentence summary>

## Why
<problem this solves or feature this adds>

## How to test
<steps to verify the change locally>

## Checklist
- [ ] Lint passes (`npm run lint` for frontend; `ruff check .` for backend)
- [ ] Tests pass (`pytest` for backend; `npm run test` for frontend)
- [ ] `.env.example` updated if new env vars added
- [ ] Docs updated if API contract changed
```

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add agent confidence scoring
fix: handle Hyperswitch 429 rate limit gracefully
chore: bump sentry-sdk to 2.x
docs: update API.md with /logs endpoint
```

---

## Code Review

### Required Reviewers

- **You** (the primary author) self-reviews the diff before requesting review.
- **Code-review MCP tool** — run `mcp review` on the PR to get an automated structural review.
- At least **one human reviewer** approves before merge.

### Review Checklist (for reviewers)

- [ ] Logic is correct and matches the spec in `PRD.md`.
- [ ] Guardrails are not weakened.
- [ ] No hardcoded secrets or real API keys.
- [ ] New env vars are added to `.env.example`.
- [ ] Tests cover the happy path and at least one error path.
- [ ] Logging calls are present for any new agent decision or error path.

---

## Merge Strategy

**Squash merge only.**

- All commits in a PR are squashed into one commit on `main`.
- The squash commit message must follow Conventional Commits format.
- Delete the branch after merge.

---

## What Not to Do

- Do **not** push directly to `main`.
- Do **not** commit `.env` or any file containing real secrets.
- Do **not** add live Razorpay production API calls — sandbox only.
- Do **not** add external messaging (SMS, email) integrations.
- Do **not** include real customer data or PII in any seed script or test fixture.

---

## Questions?

If something in the spec is unclear, open a GitHub Discussion or add a comment to the relevant doc in `docs/`. Don't make assumptions that could change the architecture — ask first.
