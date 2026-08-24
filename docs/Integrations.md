# Third-Party Integrations

---

## 1. Hyperswitch Sandbox

| Field | Value |
|---|---|
| **Dashboard URL** | https://app.hyperswitch.io |
| **API base URL** | `https://sandbox.hyperswitch.io` — PLACEHOLDER: confirm against live sandbox |
| **Auth method** | API key in `api-key` header — PLACEHOLDER: confirm header name against live sandbox docs |
| **Scope** | Test payments only — no real money, no real cards |

### Setup Steps

1. Sign up at https://app.hyperswitch.io (free).
2. Select the **sandbox** environment.
3. Copy your **Publishable key** and **Secret key** from the Developers → API Keys page — PLACEHOLDER: confirm exact key names in current dashboard.
4. Set `HYPERSWITCH_API_KEY_TEST=<your_secret_key>` in your `.env`.

### Test Cards

| Card Number | Outcome |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds — PLACEHOLDER: confirm against live sandbox |
| `4000 0000 0000 0002` | Card declined — PLACEHOLDER: confirm against live sandbox |
| `4000 0025 0000 3155` | 3DS authentication required — PLACEHOLDER: confirm against live sandbox |
| `4000 0000 0000 9995` | Insufficient funds — PLACEHOLDER: confirm against live sandbox |

Use expiry `12/34`, CVC `123`, any billing ZIP — PLACEHOLDER: confirm test card expiry/CVC format against live sandbox.

### Key Endpoints Used

| Method | Path | Purpose |
|---|---|---|
| POST | `/payments` | Create a payment intent — PLACEHOLDER: confirm request body shape against live sandbox |
| GET | `/payments/:id` | Retrieve payment status — PLACEHOLDER: confirm response fields against live sandbox |
| POST | `/payments/:id/confirm` | Confirm payment with card details — PLACEHOLDER: confirm request body shape against live sandbox |
| GET | `/payments?limit=20` | List recent payments — PLACEHOLDER: confirm pagination params against live sandbox |

### Gotchas

- Sandbox API keys are prefixed with `snd_` — PLACEHOLDER: confirm prefix against live sandbox.
- Rate limit: ~100 req/min on sandbox — PLACEHOLDER: confirm actual rate limit against live sandbox docs.
- Hyperswitch sandbox resets periodically; do not rely on data persisting across days — PLACEHOLDER: confirm reset frequency.

---

## 2. Upsonic Agent Framework

| Field | Value |
|---|---|
| **GitHub** | https://github.com/Upsonic/Upsonic |
| **Docs** | https://docs.upsonic.ai |
| **License** | MIT |
| **Installation** | `pip install upsonic` |

### How the Agent Integrates

The Upsonic agent runs server-side as part of the backend service. It is given:

1. **Context:** A structured session object (session_id, cart_value, event list, failure count, idle seconds).
2. **Tools:** Two backend-defined tools the agent may call:
   - `get_session_state(session_id)` → returns current session data.
   - `record_intervention(session_id, type, confidence_score, reasoning)` → writes the decision.
3. **Guardrail:** The agent's output is validated by the backend guardrail middleware before any write.

### Agent Decision Flow

```
Backend calls agent.run(session_context)
  → Agent reads session via get_session_state tool
  → Agent computes confidence score
  → Agent selects intervention type
  → Agent calls record_intervention tool
  → Guardrail middleware validates
  → Intervention written to DB + Sentry
```

### Required Environment Variables

| Variable | Description |
|---|---|
| `UPSONIC_API_KEY` | API key for the Upsonic cloud inference endpoint |

> **Note:** If running Upsonic in fully local/open-source mode (self-hosted), `UPSONIC_API_KEY` may not be required. Check the current Upsonic docs for the mode you are using.

### Guardrail Rules (enforced in backend, not by agent)

- `type` must be one of `['retry', 'simplify', 'none']`.
- `confidence_score` must be between 0.0 and 1.0.
- Session must not already have an intervention record.
- Agent cannot initiate any external HTTP call; all I/O goes through defined tools only.

---

## 3. Sentry

| Field | Value |
|---|---|
| **Sign-up URL** | https://sentry.io (free developer plan) |
| **Free tier** | 5,000 errors/month, 10,000 transactions/month |
| **Python SDK** | `sentry-sdk` (backend) |
| **JS SDK** | `@sentry/react` (frontend) |

### Setup

1. Create a new Sentry project → select **Python** (backend) and **React** (frontend).
2. Copy the **DSN** from Project Settings → Client Keys.
3. Set `SENTRY_DSN=<your_sentry_dsn>` in your `.env`.
4. Initialize in the FastAPI backend entry point:

```python
import sentry_sdk
sentry_sdk.init(
    dsn=os.environ["SENTRY_DSN"],
    environment=os.environ.get("APP_ENV", "development"),
    traces_sample_rate=1.0,
)
```

### What We Log to Sentry

| Event | Level | Extra Context |
|---|---|---|
| Agent intervention applied | `info` | session_id, type, confidence_score |
| Agent abstained | `info` | session_id, confidence_score |
| Guardrail violation | `warning` | session_id, rejected decision |
| Hyperswitch API error | `error` | endpoint, status_code, hs_error_code |
| Upsonic agent error | `error` | session_id, error message |
| Unresolvable session | `warning` | session_id, reason |

### Alert Thresholds (if this were live)

| Condition | Threshold | Alert Channel |
|---|---|---|
| Error rate > 5% of sessions | Any 5-minute window | Email/Slack |
| Guardrail violations > 0 | Any occurrence | Immediate email |
| Hyperswitch API error rate > 10% | Any 5-minute window | Email/Slack |
| Agent error rate > 20% | Any 5-minute window | Email/Slack |

> For the buildathon, set up Sentry's **Issue Alerts** for `guardrail.violation` and `hyperswitch.error` at minimum. The free tier supports basic alerting via email.
