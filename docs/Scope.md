# Scope & Non-Goals

## In Scope

| Area | Detail |
|---|---|
| **Hyperswitch sandbox** | All payment flows use Hyperswitch hosted sandbox. Test cards, test webhooks, no real money. |
| **Upsonic agent** | Agent logic for detecting at-risk checkouts and applying recovery interventions only. |
| **Synthetic session data** | Sessions and events are generated locally by a seed script. Zero real customer PII. |
| **Merchant console UI** | A simple single-page dashboard showing sessions, agent decisions, and batch metrics. |
| **Audit trail** | Every agent action (including abstentions) logged to Sentry/GlitchTip + local DB. |
| **Batch metrics** | Baseline vs agent conversion, false-positive cost, abstain rate — computed on synthetic batch. |
| **Vercel deployment** | Frontend + serverless backend deployed on Vercel free tier. |

---

## Out of Scope

| Area | Reason |
|---|---|
| **Live Razorpay / production APIs** | Buildathon track explicitly uses sandbox only. |
| **Real customer messaging** | No SMS, email, WhatsApp, or push notifications — synthetic interventions only. |
| **Multi-processor live routing** | No real-time processor selection; Hyperswitch sandbox only. |
| **Full merchant dashboard** | No billing, payout management, reconciliation, or tax features. |
| **Mobile apps** | Web-only (React). No iOS/Android native apps. |
| **Multi-tenant auth** | Single merchant context; no login/auth system for the buildathon scope. |
| **Fraud scoring / chargebacks** | Out of scope; different product domain. |
| **Real money movement** | Absolutely nothing touches live payment rails. |

---

## Boundary Conditions

- If a Hyperswitch sandbox API call fails, the agent must log the failure and back off. It must **never** retry a live payment.
- Agent interventions are **advisory only** — they are surfaced in the UI but do not autonomously trigger payment retries against real infrastructure.
- The synthetic data generator is the **only** source of session records. No scraping, no real user sessions.
