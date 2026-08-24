# REST API Reference

**Base URL (local):** `http://localhost:8000/api`  
**Base URL (production):** `https://<your-vercel-app>.vercel.app/api`  
**Content-Type:** `application/json` on all requests and responses.

> **Schema alignment note:** All field names in responses match the column names in `Schema.md`. The `at_risk` field is stored as `INTEGER` (0/1) in SQLite but serialized as a JSON boolean in all API responses.

---

## GET /sessions

List all synthetic checkout sessions with their current status.

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by status: `initiated`, `failed`, `abandoned`, `succeeded`, `unresolvable` |
| `at_risk` | boolean | No | `true` to return only at-risk sessions |
| `limit` | integer | No | Max records to return (default: 50, max: 200) |
| `offset` | integer | No | Pagination offset (default: 0) |

### Response 200

```json
{
  "total": 100,
  "limit": 50,
  "offset": 0,
  "sessions": [
    {
      "id": "sess_abc123",
      "user_id": "user_001",
      "cart_value": 1499.00,
      "initial_status": "initiated",
      "final_status": "succeeded",
      "at_risk": false,
      "created_at": "2026-08-24T10:00:00Z",
      "updated_at": "2026-08-24T10:05:00Z"
    }
  ]
}
```

### Error Responses

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_FILTER` | Unknown status value in filter |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## GET /sessions/:id

Get full detail for a single session: events timeline and agent decision.

### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Session ID (e.g. `sess_abc123`) |

### Response 200

```json
{
  "session": {
    "id": "sess_abc123",
    "user_id": "user_001",
    "cart_value": 1499.00,
    "initial_status": "initiated",
    "final_status": "succeeded",
    "at_risk": true,
    "created_at": "2026-08-24T10:00:00Z"
  },
  "events": [
    {
      "id": "evt_001",
      "session_id": "sess_abc123",
      "type": "initiated",
      "timestamp": "2026-08-24T10:00:00Z",
      "metadata": {}
    },
    {
      "id": "evt_002",
      "session_id": "sess_abc123",
      "type": "failed",
      "timestamp": "2026-08-24T10:01:12Z",
      "metadata": { "error_code": "card_declined", "hs_payment_id": "pay_xyz" }
    }
  ],
  "intervention": {
    "id": "int_001",
    "session_id": "sess_abc123",
    "type": "simplify",
    "outcome": "succeeded",
    "confidence_score": 0.82,
    "agent_reasoning": "Two consecutive card declines with 4-minute idle gap; simplify option likely to convert.",
    "sentry_event_id": "a1b2c3d4e5f6",
    "applied_at": "2026-08-24T10:04:30Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|---|---|---|
| 404 | `SESSION_NOT_FOUND` | No session with the given ID |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## POST /sessions/:id/intervention

Record that an agent intervention has been applied to a session. Called by the backend agent bridge (not directly by the frontend).

### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Session ID |

### Request Body

```json
{
  "type": "retry",
  "confidence_score": 0.75,
  "agent_reasoning": "Two consecutive failures with short idle time; signal strong enough to retry."
}
```

| Field | Type | Required | Allowed values |
|---|---|---|---|
| `type` | string | Yes | `retry`, `simplify`, `none` |
| `confidence_score` | float | Yes | 0.0 – 1.0 |
| `agent_reasoning` | string | No | Free text explanation from agent |

### Response 201

```json
{
  "intervention": {
    "id": "int_002",
    "session_id": "sess_abc123",
    "type": "retry",
    "outcome": "pending",
    "confidence_score": 0.75,
    "agent_reasoning": "Two consecutive failures with short idle time; signal strong enough to retry.",
    "sentry_event_id": null,
    "applied_at": "2026-08-24T10:05:00Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_TYPE` | Intervention type not in allowed set |
| 400 | `ALREADY_INTERVENED` | Session already has an intervention record |
| 404 | `SESSION_NOT_FOUND` | No session with the given ID |
| 422 | `GUARDRAIL_VIOLATION` | Guardrail middleware rejected the decision |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## GET /metrics

Return baseline vs agent metrics for the most recent batch (or a specified batch).

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `batch_id` | string | No | Specific batch ID; defaults to latest |

### Response 200

```json
{
  "batch_id": "batch_20260824",
  "created_at": "2026-08-24T12:00:00Z",
  "control_sessions": 100,
  "control_successful": 48,
  "baseline_conversion": 0.48,
  "treatment_sessions": 100,
  "treatment_successful": 63,
  "agent_conversion": 0.63,
  "interventions_applied": 38,
  "false_positives": 6,
  "false_positive_cost_inr": 30.00,
  "abstentions": 12,
  "unresolvable": 2
}
```

### Error Responses

| Status | Code | Description |
|---|---|---|
| 404 | `BATCH_NOT_FOUND` | No metrics snapshot for given batch_id |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## GET /logs

Return a summary of all agent interventions and failure events, suitable for the audit trail view.

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `type` | string | No | Filter by intervention type: `retry`, `simplify`, `none` |
| `outcome` | string | No | Filter by outcome: `succeeded`, `failed`, `pending` |
| `limit` | integer | No | Max records (default: 100) |
| `offset` | integer | No | Pagination offset |

### Response 200

```json
{
  "total": 52,
  "logs": [
    {
      "id": "int_001",
      "session_id": "sess_abc123",
      "type": "simplify",
      "confidence_score": 0.82,
      "outcome": "succeeded",
      "agent_reasoning": "Two consecutive card declines; simplify presented.",
      "sentry_event_id": "a1b2c3d4e5f6",
      "applied_at": "2026-08-24T10:04:30Z"
    },
    {
      "id": "int_003",
      "session_id": "sess_def456",
      "type": "none",
      "confidence_score": 0.41,
      "outcome": "abstained",
      "agent_reasoning": "Confidence below threshold (0.60); agent abstained.",
      "sentry_event_id": "b2c3d4e5f6a1",
      "applied_at": "2026-08-24T10:06:00Z"
    }
  ]
}
```

### Error Responses

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_FILTER` | Unknown type or outcome value |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Common Error Shape

All errors follow this envelope:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "No session found with id: sess_xyz",
    "request_id": "req_abc123"
  }
}
```
