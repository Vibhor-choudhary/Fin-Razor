# Checkout Recovery Agent — Razorpay AI Buildathon (Track 03)

## 1. Problem Statement

Merchants lose significant revenue when users abandon checkout at the **payment step** — not due to losing interest in the product, but because of preventable friction: failed payment attempts, confusing error messages, hidden fees appearing late, or a slow/unresponsive checkout UI.

Industry benchmarks suggest **60–80% cart abandonment rates**, with the payment step alone accounting for a large share. Most merchants lack the tooling to detect these at-risk sessions in real time and respond with a safe, measured intervention before the user leaves.

This project builds a lightweight **AI-powered Checkout Recovery Agent** that observes payment events, identifies at-risk sessions, and applies bounded interventions — all within a safe sandbox environment so no real money or customer data is involved.

---

## 2. Track & Scope

| Field | Value |
|---|---|
| **Buildathon Track** | Track 03 — AI Revenue Recovery |
| **Focus area** | Checkout abandonment only |
| **Payment backend** | Hyperswitch hosted sandbox (test flows, no real money) |
| **Agent framework** | Upsonic (tool-based AI agent orchestration) |
| **Session data** | Synthetic — generated locally, no real customer PII |
| **Deployment target** | Vercel (free tier) |

---

## 3. Target Users

**Primary:** Small to mid-size e-commerce merchants using Razorpay-like hosted payment flows.

**Characteristics:**
- Monthly GMV < ₹1 Cr.
- No dedicated data science or ML team.
- Rely on third-party payment gateways; cannot instrument deeply.
- Care about conversion rate but lack actionable tooling beyond basic analytics.

**What they need:** A turnkey dashboard that shows where sessions drop, what the agent did about it, and whether it helped — without requiring engineering effort.

---

## 4. Core Features

### F-01 · Observe Checkout Events
- Connect to Hyperswitch sandbox and ingest payment lifecycle events: `payment.initiated`, `payment.failed`, `payment.succeeded`, `payment.abandoned`.
- Store normalized events per session in local DB.

### F-02 · Detect At-Risk Sessions
- Flag a session as **at-risk** when:
  - ≥ 2 consecutive failed attempts on the same session.
  - Session idle for > 3 minutes after a failure with no success.
  - User revisits payment step > 2× in one cart lifetime.
- Signal confidence score computed per session.

### F-03 · Decide Bounded Intervention
- Agent selects **one** intervention from a fixed safe set:
  - `retry` — prompt user to try the same payment again.
  - `simplify` — surface a simplified/alternate payment option (UPI fallback, wallet).
  - `none` — abstain when signal confidence is below threshold.
- Hard guardrails: agent cannot send real messages, charge cards, or change amounts.

### F-04 · Execute via Upsonic Agent
- Upsonic agent reads session state + rules.
- Calls backend tool to record the intervention decision.
- All decisions routed through guardrail middleware before being written.

### F-05 · Batch Metrics Dashboard
- Shows per-batch summary:
  - Baseline conversion rate (sessions without agent).
  - Agent conversion rate (sessions with agent active).
  - False-positive cost (interventions on sessions that would have converted anyway).
  - Abstain rate (% of at-risk sessions where agent chose "no action").

### F-06 · Audit Trail & Graceful Failure Demo
- Every agent decision (including "no action") is logged to Sentry (or GlitchTip) + local `interventions` table.
- At least **one failure scenario** is included in the demo batch where the agent backs off safely.

---

## 5. User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| US-01 | Merchant | See which user sessions dropped at the payment step | I know exactly where I'm losing revenue |
| US-02 | Merchant | Have an AI agent suggest safe, bounded interventions for failed payments | I can recover more checkouts without annoying users or risking overcharging |
| US-03 | Merchant | See how much extra revenue the agent recovered on a batch of synthetic sessions | I can understand the agent's value before trusting it on live traffic |
| US-04 | Merchant | See the full audit log of every agent action | I can verify that the agent acted safely and within bounds |
| US-05 | Merchant | See at least one case where the agent correctly chose "no action" | I know the agent doesn't blindly intervene on every failure |

---

## 6. Success Metrics

| Metric | Target |
|---|---|
| Improvement in successful checkouts vs baseline | ≥ 15% on synthetic batch |
| Intervention audit coverage | 100% of decisions logged (incl. abstentions) |
| Graceful failure demo | ≥ 1 scenario where agent backs off safely, logged end-to-end |
| False-positive rate | < 20% of interventions on sessions that would have self-converted |
| Abstain rate | 10–30% of at-risk sessions (agent should not be trigger-happy) |

---

## 7. Out of Scope

- Live Razorpay production APIs or any real payment processing.
- Real customer messaging (SMS, email, WhatsApp, push notifications).
- Fraud scoring, chargeback handling, or dispute management.
- Multi-merchant tenancy or authentication/authorization.
- Mobile apps (iOS/Android).
- Full merchant billing, payout management, or reconciliation dashboards.
- Anything that moves, holds, or reports on actual money.

---

## 8. Assumptions & Constraints

- All payment events are sourced from Hyperswitch sandbox using test cards.
- Synthetic sessions are generated by a local script; no real user PII is stored.
- The project must be completable in the buildathon timeframe by a small team (1–3 engineers).
- Deployment must fit within Vercel and Hyperswitch free-tier limits.
