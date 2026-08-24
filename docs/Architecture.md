# System Architecture

## Component Overview

```
┌───────────────────────────────────────────────────────────┐
│                   Vercel (Deployment)                     │
│  ┌─────────────────────┐   ┌───────────────────────────┐  │
│  │  Frontend           │   │  Backend Service          │  │
│  │  React + TypeScript │◄──►  Python/FastAPI            │  │
│  │  Merchant Console   │   │  REST API + Agent Bridge  │  │
│  └─────────────────────┘   └──────────┬────────────────┘  │
└─────────────────────────────────────────────────────────── │
                                        │
              ┌─────────────────────────┼──────────────────┐
              │                         │                  │
              ▼                         ▼                  ▼
   ┌──────────────────┐    ┌────────────────────┐  ┌─────────────┐
   │ Hyperswitch      │    │ Upsonic Agent      │  │ Sentry      │
   │ Sandbox API      │    │ (Detection +       │  │ (Logging)   │
   │                  │    │  Intervention)     │  │             │
   └──────────────────┘    └────────────────────┘  └─────────────┘
              ▲
              │
   ┌──────────────────┐
   │ Synthetic Data   │
   │ Generator        │
   │ (Seed Script)    │
   └──────────────────┘
```

---

## Components

### 1. Frontend — Merchant Console (React + TypeScript)

**Responsibilities:**
- Display list of checkout sessions and their statuses.
- Show per-session event timeline and agent decision.
- Display batch metrics: baseline vs agent conversion rate, false-positive cost, abstain rate.
- Show audit log of all interventions.

**Technology:** React 18, TypeScript, Vite, minimal CSS (no heavy UI library required).

**Key pages:**
- `/` — Sessions list with status chips.
- `/sessions/:id` — Session detail with event timeline + agent decision card.
- `/metrics` — Batch metrics comparison view.
- `/logs` — Intervention audit log.

---

### 2. Backend Service (Python/FastAPI)

**Responsibilities:**
- Expose REST API consumed by the frontend (see `API.md`).
- Call Hyperswitch sandbox to create/retrieve payment intents.
- Run or invoke the Upsonic agent when a session is flagged at-risk.
- Apply guardrail middleware before writing any intervention.
- Persist sessions, events, interventions, and metrics snapshots to SQLite (local) or PostgreSQL (Vercel Postgres).
- Emit structured logs and errors to Sentry.

**Key modules:**
- `hyperswitchClient` — Thin wrapper around Hyperswitch REST API (sandbox).
- `sessionStore` — CRUD for sessions, events, interventions.
- `agentBridge` — Invokes Upsonic agent with session context; receives decision.
- `guardrails` — Validates agent decision against allowed intervention types before writing.
- `metricsEngine` — Aggregates conversion data per batch.
- `logger` — Sentry SDK (`sentry-sdk`), wraps all agent decisions and errors.

---

### 3. Upsonic Agent

**Responsibilities:**
- Receive session context (events, cart value, failure count, idle time).
- Apply detection logic to compute a confidence score.
- Select one intervention (`retry`, `simplify`, `none`) based on score and rules.
- Return structured decision object to backend.

**Integration pattern:**
- Backend calls Upsonic agent as a tool-enabled LLM chain.
- Agent has access to exactly two backend tools: `get_session_state` and `record_intervention`.
- Agent cannot call Hyperswitch directly — all external calls go through the backend.

**Guardrails enforced before any write:**
1. Intervention type must be in `['retry', 'simplify', 'none']`.
2. Cart value must be unchanged.
3. No external HTTP calls initiated by the agent.
4. Max 1 intervention per session.

---

### 4. Hyperswitch Sandbox

**Responsibilities:**
- Accept test payment intents (POST /payments).
- Return success/failure based on test card numbers.
- Emit payment status updates (polled by backend; webhooks optional).

**Test cards used:**
- `4242 4242 4242 4242` → success.
- `4000 0000 0000 0002` → card declined.
- `4000 0025 0000 3155` → 3DS required (simulates friction).

---

### 5. Synthetic Data Generator

**Responsibilities:**
- Generate N synthetic sessions with randomised parameters:
  - `cart_value` (₹100–₹10,000).
  - Failure patterns (0–4 failed attempts).
  - Idle time between attempts.
  - Ground-truth label (would self-convert: yes/no).
- Seed the local DB with these sessions + events.
- Mark a subset as "ground truth self-converters" for false-positive tracking.

**Runs as:** A one-off CLI script (`python seed.py`).

---

### 6. Logger (Sentry)

**Responsibilities:**
- Capture every agent decision as a structured log event with: `session_id`, `intervention_type`, `confidence_score`, `timestamp`.
- Capture all errors: Hyperswitch API failures, Upsonic errors, guardrail violations.
- Free tier: 5,000 errors/month, 10,000 transactions/month.

---

## Data Flow

```
1. Seed script populates DB with synthetic sessions + events.
2. Backend reads pending sessions → calls Hyperswitch sandbox to simulate payment.
3. Hyperswitch returns status → backend writes event to DB.
4. If session becomes at-risk (≥2 failures / idle >3 min / repeated revisit):
   a. Backend invokes Upsonic agent with session context.
   b. Agent computes confidence score → selects intervention.
   c. Guardrail middleware validates decision.
   d. Backend writes intervention to DB + emits log to Sentry.
   e. Session final_status updated.
5. Frontend polls /sessions, /metrics, /logs to display results.
```

---

## Key Design Decisions

### Why Hyperswitch sandbox instead of mocking payments locally?

Using the actual Hyperswitch hosted sandbox (real HTTPS API, real test card responses) is more credible for a buildathon demo than a hand-written mock. It proves the integration works against a real payment system, even if sandboxed. It also exercises real error handling (rate limits, network failures) that a mock would paper over.

### Why Upsonic instead of hand-rolled agent orchestration?

Upsonic provides tool-calling, memory, and structured decision output out of the box. Writing equivalent orchestration from scratch would take days and introduce untested edge cases. Upsonic's guardrail primitives also make it easier to enforce the bounded intervention constraint at the framework level, not just in application code.

### Why Sentry instead of `print()` / ad-hoc logging?

`print()` output disappears after a process restart and cannot be searched or alerted on. Sentry gives us:
- Persistent, searchable event history.
- Structured context (session_id, intervention type) attached to every event.
- A clear audit trail the judges can inspect.
- Free-tier is more than sufficient for a demo batch of 100 sessions.
