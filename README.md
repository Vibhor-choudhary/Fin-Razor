# Checkout Recovery Agent
## A guardrailed AI system for recovering checkout revenue safely

This project provides a lightweight, AI-powered Checkout Recovery Agent designed to identify at-risk checkout sessions and intervene safely before the user abandons their cart. Built specifically for the Razorpay AI Buildathon, it bridges the gap between passive analytics and active, guardrailed revenue recovery using the Upsonic agent framework and Hyperswitch.

### Problem
Merchants lose significant revenue when users abandon checkout at the payment step—often due to preventable friction like payment failures, confusing errors, or slow UI. While analytics can show where drop-offs happen, merchants lack the tooling to safely and automatically intervene (e.g., offering a retry or alternate payment method) in real time without risking overcharging or annoying the customer.

### What it does
The Checkout Recovery Agent observes payment lifecycle events, detects when a session is at risk of abandonment, and asks an LLM for a bounded recovery proposal (retry, nudge, or abstain). Crucially, the system applies deterministic guardrails to the AI's decision before execution. It executes at most one permitted intervention per session and maintains a comprehensive audit trail of every decision, including abstentions.

### What is real vs simulated
- **Real:** Hyperswitch sandbox payment creation, success, decline handling (e.g., `DC_08`), status/error data, and preserved raw response payloads.
- **Simulated:** The 100-session evaluation dataset, customer behavior after a nudge, and modeled nudge conversions.
- *Note: We never claim simulated nudge recovery as real money moved.*

### Key evidence
- **Real Success & DC_08 Card-Decline Flows:** Proven sandbox transactions.
- **One Intervention Maximum:** Guardrails strictly limit interventions to one per session.
- **Abstain-by-Default:** Unknown error codes trigger an automatic abstention.
- **Freshness Cooldown:** The agent will not intervene if the last event occurred less than 60 seconds ago.
- **Immutable Amounts:** The original cart amount cannot be modified by the agent.
- **Audit Log & Raw Payloads:** Full traceability with an indicator for raw payload availability.
- **Batch Metrics:** Split recovery provenance clearly separates verified sandbox recovery from simulated recovery.

### Architecture overview
The system consists of a FastAPI backend and a React/Vite frontend. The backend orchestrates the Upsonic agent, checking session state against deterministic guardrails before executing any intervention (such as a Hyperswitch API retry). A local DB stores events, sessions, interventions, and metrics snapshots for the frontend dashboard to display.

### Architecture diagram
To view the architecture diagram locally, you can use any Mermaid viewer (like the Mermaid Live Editor or a VS Code extension) on the `docs/ArchitectureDiagram.mmd` file.
[View ArchitectureDiagram.mmd](docs/ArchitectureDiagram.mmd)

### Tech stack
- **Backend:** FastAPI, Python, SQLAlchemy / SQLite
- **Payments:** Hyperswitch Sandbox
- **AI/Agent:** Upsonic, Gemini / Groq provider
- **Frontend:** React, Vite, TypeScript
- **Observability:** Sentry (optional)

### Local quickstart

1. **Environment Setup:**
   ```bash
   cp .env.example .env
   # Open .env and fill in the required keys without sharing values
   ```

2. **Backend Setup:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Migrate & Seed:**
   ```bash
   python migrate.py
   python seed.py
   ```

4. **Start Backend:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Start Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Recovery Lab (Controlled Sandbox Test Harness)
The **Recovery Lab** (`/lab`) provides a private, controlled operator interface to execute real Hyperswitch sandbox scenarios on demand, inspect live payment failure telemetry, evaluate deterministic guardrail enforcement, and open the resulting Replay/Audit record.

#### Controlled Local Execution vs. Public Read-Only Demo
- **Controlled Local Sandbox Execution (`APP_ENV=development`):** Operators select from an allowlist of server-side test profiles, trigger real payment requests to Hyperswitch Sandbox, observe live rail statuses/error codes, and trigger the agent + guardrail pipeline with exactly one permitted intervention limit.
- **Public Read-Only Evidence Demo (`APP_ENV=demo_readonly`):** All execution endpoints (`POST /api/lab/runs`) return HTTP 403 Forbidden. The web interface acts strictly as a read-only audit and product narrative console.

#### Security & Safety Boundary
1. **Server-Side Secret & Card Ownership:** The frontend never receives, displays, or inputs payment card numbers, client secrets, API keys, or raw payloads.
2. **Server-Controlled Allowlist:** Only predefined scenario IDs (`success`, `card_declined`, `insufficient_funds`, `lost_card`, `stolen_card`, `three_ds_success`) are accepted.
3. **Strict Validation:** Order amount is bounded (₹10 – ₹5,000) and converted to paise exclusively on the server.
4. **Deterministic Invariants:** One safe action maximum per session; amount equality invariant strictly enforced during retries.
5. **In-Process Rate Limiting:** Local sandbox executions are capped at 5 runs per 10 minutes.

#### Local Run Prerequisites
- `APP_ENV=development`
- `HYPERSWITCH_API_KEY_TEST` configured in `.env`
- LLM Provider Key (Google Gemini / Groq) is optional; if absent or quota-limited, the system falls back gracefully to structured deterministic evaluation without failing the payment evidence flow.

### Demo flow
1. Run `python scripts/run_real_payment.py` to create a real sandbox success and decline.
2. Run `python scripts/run_agent_batch.py` to execute the agent batch process.
3. Open the Merchant Console (`http://localhost:5173`) and navigate to **Recovery Lab** (`/lab`) to execute live test profiles.
4. View **Overview**, **Recovery Queue**, **Replay**, and **Audit Log** tabs.

### Metrics definitions
- **Verified Sandbox Retry Recovery:** Revenue recovered via actual successful Hyperswitch sandbox retry payments.
- **Simulated Nudge Recovery:** Revenue recovered via deterministic simulated customer behavior.
- **Total Modeled Recovery:** The combined sum of verified sandbox payments and simulated modeled nudges.
- **Conversion Lift:** Measured in percentage points (pp), the raw difference between the agent conversion rate and the baseline conversion rate.
- **False-Positive Cost:** The monetary cost associated with applying interventions to sessions that would have converted without help.
- **Abstain / Unresolvable Rate:** The proportion of sessions where the agent chose to take no action or encountered an unresolvable error.

### Repository layout
- `/` - Backend code (FastAPI, agent, guardrails, integrations)
- `/frontend` - React/Vite Merchant Console dashboard
- `/docs` - Documentation, schema, and API definitions
- `/scripts` - Utilities for batch processing and real payment testing

### Limitations and next steps
- **Sandbox Only:** Currently integrated strictly with test payment flows.
- **Deterministic Simulation:** Customer outcomes (e.g., responding to nudges) are currently deterministically simulated.
- **No Production Credentials/PII:** The system holds no production keys or real customer data.
- **Production Readiness:** A production deployment would require idempotency, durable storage (Postgres), robust authorization, webhook ingestion, monitoring, and compliance reviews.

### License
MIT
