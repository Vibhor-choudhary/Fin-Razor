# Database Schema

**Default DB:** SQLite (local dev). Can be swapped for Vercel Postgres in production by changing the connection string in `.env`.

All timestamps are stored as **ISO 8601 UTC strings** (or `DATETIME` in SQLite).

---

## Table: `sessions`

Represents a single synthetic checkout session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique session identifier (e.g. `sess_abc123`) |
| `user_id` | TEXT | NOT NULL | Synthetic user identifier (e.g. `user_001`) |
| `cart_value` | REAL | NOT NULL, > 0 | Cart total in INR |
| `initial_status` | TEXT | NOT NULL | Status when session was created: `initiated` |
| `final_status` | TEXT | NOT NULL | Final resolution: `succeeded`, `failed`, `abandoned`, `unresolvable` |
| `at_risk` | INTEGER | NOT NULL, DEFAULT 0 | Boolean (0/1); set true when detection flags session |
| `ground_truth_self_convert` | INTEGER | NOT NULL, DEFAULT 0 | Boolean; set by seed script — would session have converted without agent? |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| `updated_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp; updated on status change |
| `scenario_label` | TEXT | NULLABLE | Simulation customer label: `retry_succeeds`, `retry_fails`, `nudge_converts`, `nudge_ignored` |

**Indexes:**
- `idx_sessions_final_status` on `final_status`
- `idx_sessions_at_risk` on `at_risk`

---

## Table: `events`

Individual payment lifecycle events within a session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique event identifier (e.g. `evt_001`) |
| `session_id` | TEXT | NOT NULL, FK → sessions.id | Parent session |
| `type` | TEXT | NOT NULL | Event type: `initiated`, `failed`, `abandoned`, `succeeded` |
| `timestamp` | TEXT | NOT NULL | ISO 8601 UTC timestamp of the event |
| `metadata` | TEXT | NULLABLE | JSON blob; stores error codes, Hyperswitch payment IDs, etc. |
| `raw_payload` | TEXT | NULLABLE | Full raw response JSON from external services for audit trailing |

**Allowed `type` values:** `initiated` · `failed` · `abandoned` · `succeeded`

**Indexes:**
- `idx_events_session_id` on `session_id`
- `idx_events_type` on `type`

**Example `metadata` JSON:**
```json
{
  "error_code": "card_declined",
  "hs_payment_id": "pay_01J...",
  "attempt_number": 2
}
```

---

## Table: `interventions`

Records the agent's decision for each at-risk session. One row per session maximum (enforced by application layer).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique intervention identifier (e.g. `int_001`) |
| `session_id` | TEXT | NOT NULL, UNIQUE, FK → sessions.id | Parent session (1:1 with session) |
| `type` | TEXT | NOT NULL | Agent's chosen action: `retry`, `simplify`, `none` |
| `outcome` | TEXT | NOT NULL, DEFAULT 'pending' | Result: `pending`, `succeeded`, `failed`, `abstained` |
| `confidence_score` | REAL | NOT NULL | Agent's confidence score (0.0 – 1.0) |
| `agent_reasoning` | TEXT | NULLABLE | Free-text reasoning returned by Upsonic agent |
| `sentry_event_id` | TEXT | NULLABLE | Sentry event ID for cross-reference |
| `applied_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp when decision was recorded |

**Allowed `type` values:** `retry` · `simplify` · `none`  
**Allowed `outcome` values:** `pending` · `succeeded` · `failed` · `abstained`

**Indexes:**
- `idx_interventions_session_id` on `session_id`
- `idx_interventions_type` on `type`
- `idx_interventions_outcome` on `outcome`

---

## Table: `metrics_snapshot`

Stores a point-in-time snapshot of batch metrics. A new row is written each time the metrics engine runs.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique snapshot identifier |
| `batch_id` | TEXT | NOT NULL | Batch label (e.g. `batch_20260824`) |
| `control_sessions` | INTEGER | NOT NULL | Total sessions in control group |
| `control_successful` | INTEGER | NOT NULL | Successful sessions in control group |
| `baseline_conversion` | REAL | NOT NULL | baseline_conversion rate (0.0 – 1.0) |
| `treatment_sessions` | INTEGER | NOT NULL | Total sessions in treatment group |
| `treatment_successful` | INTEGER | NOT NULL | Successful sessions in treatment group |
| `agent_conversion` | REAL | NOT NULL | Agent conversion rate (0.0 – 1.0) |
| `interventions_applied` | INTEGER | NOT NULL | Total interventions applied (type ≠ none) |
| `false_positives` | INTEGER | NOT NULL | Interventions on self-converting sessions |
| `false_positive_cost_inr` | REAL | NOT NULL | false_positives × ₹5 cost model |
| `abstentions` | INTEGER | NOT NULL | Sessions where agent chose `none` |
| `unresolvable` | INTEGER | NOT NULL | Sessions marked unresolvable |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp when snapshot was taken |

**Indexes:**
- `idx_metrics_batch_id` on `batch_id`
- `idx_metrics_created_at` on `created_at`

---

## Relationships

```
sessions (1) ──< events (many)        session_id FK
sessions (1) ──< interventions (1)    session_id FK (UNIQUE)
```

---

## Migration Notes

- Schema is applied via a single `migrate.sql` file run at startup.
- For Vercel Postgres, replace SQLite `TEXT` PKs with `UUID DEFAULT gen_random_uuid()` and `DATETIME` with `TIMESTAMPTZ`.
- No ORM assumed — raw SQL preferred for simplicity and buildathon speed.
- `GET /metrics` response omits `recovery_lift` from the DB row; that field is computed on the fly as `agent_conversion - baseline_conversion` and returned by the API layer only.
