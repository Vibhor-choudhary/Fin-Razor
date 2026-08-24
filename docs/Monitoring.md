# Monitoring Plan

---

## Logging Tool

**Logging tool:** Sentry (https://sentry.io) — free developer plan.

Python SDK: `sentry-sdk`. Frontend SDK: `@sentry/react`.

---

## What We Log

### 1. Agent Decisions (level: `info`)

Every agent decision — including abstentions — is logged as a structured Sentry breadcrumb/event.

| Field | Example |
|---|---|
| `event` | `agent.decision` |
| `session_id` | `sess_abc123` |
| `intervention_type` | `simplify` |
| `confidence_score` | `0.82` |
| `outcome` | `succeeded` |
| `timestamp` | `2026-08-24T10:04:30Z` |

**Why:** 100% coverage of agent actions is a buildathon requirement. Sentry's structured context makes it easy for judges to browse the audit trail.

### 2. Agent Abstentions (level: `info`)

Logged separately from active interventions to make the abstain rate visible.

| Field | Example |
|---|---|
| `event` | `agent.abstain` |
| `session_id` | `sess_def456` |
| `confidence_score` | `0.41` |
| `reason` | `confidence below threshold (0.60)` |

### 3. Guardrail Violations (level: `warning`)

Logged whenever the guardrail middleware rejects an agent decision.

| Field | Example |
|---|---|
| `event` | `guardrail.violation` |
| `session_id` | `sess_ghi789` |
| `rejected_type` | `charge_card` (not in allowed set) |
| `agent_raw_output` | `{…}` |

**Why:** Any guardrail violation indicates the agent is attempting an out-of-scope action. These must be 100% visible.

### 4. Hyperswitch API Errors (level: `error`)

Logged when the backend receives a non-2xx response from Hyperswitch sandbox.

| Field | Example |
|---|---|
| `event` | `hyperswitch.error` |
| `endpoint` | `POST /payments` |
| `status_code` | `429` |
| `hs_error_code` | `TE_00001` |
| `session_id` | `sess_abc123` (if applicable) |

### 5. Upsonic Agent Errors (level: `error`)

Logged when the Upsonic SDK throws or the agent returns an unexpected response.

| Field | Example |
|---|---|
| `event` | `upsonic.error` |
| `session_id` | `sess_jkl012` |
| `error_message` | `Timeout after 30s` |

### 6. Unresolvable Sessions (level: `warning`)

Logged when a session cannot be recovered due to repeated errors.

| Field | Example |
|---|---|
| `event` | `session.unresolvable` |
| `session_id` | `sess_mno345` |
| `reason` | `Hyperswitch API returned 500 three times` |

---

## Alert Thresholds (if this were live)

| Condition | Threshold | Suggested Alert |
|---|---|---|
| **Error rate** | > 5% of sessions in any 5-min window | Email to on-call engineer |
| **Guardrail violations** | Any single occurrence | Immediate page/email |
| **Hyperswitch API error rate** | > 10% in any 5-min window | Email to on-call engineer |
| **Upsonic agent error rate** | > 20% in any 5-min window | Email to on-call engineer |
| **Abstain rate** | > 60% over a full batch | Slack notification (signal quality degraded) |

**Buildathon note:** For the demo, set up Sentry's **Issue Alerts** for `guardrail.violation` and `hyperswitch.error` at minimum. The free tier supports basic alerting via email.

---

## How to Access Logs

### Sentry Dashboard

1. Go to https://sentry.io → your project.
2. Navigate to **Issues** for exceptions/errors.
3. Navigate to **Performance** or use custom dashboards for `info`-level events.
4. Filter by tag `session_id` to trace a specific session's full audit trail.

### Local Audit Table

All the same data is also written to the `interventions` table in the local DB. Use the `/logs` API endpoint or query SQLite directly:

```sql
SELECT i.*, s.cart_value, s.final_status
FROM interventions i
JOIN sessions s ON i.session_id = s.id
ORDER BY i.applied_at DESC;
```

---

## Log Retention

| Tier | Retention |
|---|---|
| Sentry free plan | 30 days |
| Local DB | Until `dev.db` is deleted |
| Vercel Postgres | Until table is dropped or project deleted |
