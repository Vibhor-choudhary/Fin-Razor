# Definition of Done

A feature or the project as a whole is considered **done** only when every item in this checklist is satisfied.

---

## Core Implementation

- [ ] **Backend logic implemented**
  - [ ] `hyperswitchClient` module connects to sandbox and handles errors.
  - [ ] `sessionStore` CRUD operations work for sessions, events, interventions.
  - [ ] `agentBridge` invokes Upsonic agent and receives a structured decision.
  - [ ] `guardrails` middleware rejects out-of-scope decisions before any write.
  - [ ] `metricsEngine` correctly computes baseline vs agent conversion.
  - [ ] Synthetic data generator (`npm run seed`) populates DB without errors.

- [ ] **All REST API endpoints implemented and return correct shapes**
  - [ ] `GET /sessions` with filtering and pagination.
  - [ ] `GET /sessions/:id` with events and intervention.
  - [ ] `POST /sessions/:id/intervention` with guardrail enforcement.
  - [ ] `GET /metrics` returns a complete metrics snapshot.
  - [ ] `GET /logs` returns paginated intervention audit log.

- [ ] **Upsonic agent integrated**
  - [ ] Agent receives session context and returns a valid decision.
  - [ ] Agent has access to exactly the two defined tools and no others.
  - [ ] Abstention path (`none`) works and is logged.

- [ ] **Hyperswitch sandbox integrated**
  - [ ] Test card payments are created and status polled successfully.
  - [ ] At least one success flow and one failure flow exercised.

---

## Quality Gates

- [ ] **Tests run locally with no failures**
  - [ ] At least one unit test per backend module (sessionStore, metricsEngine, guardrails).
  - [ ] At least one integration test for each API endpoint.
  - [ ] `npm run test` exits with code 0.

- [ ] **Lint passes**
  - [ ] `npm run lint` exits with zero errors (warnings allowed but logged).
  - [ ] TypeScript type check (`npm run typecheck`) exits with code 0.

- [ ] **Build succeeds**
  - [ ] `npm run build` produces a valid production bundle with no errors.

---

## Observability

- [ ] **All agent decisions logged to Sentry/GlitchTip**
  - [ ] Active interventions (`retry`, `simplify`) logged at `info` level.
  - [ ] Abstentions logged at `info` level.
  - [ ] Guardrail violations logged at `warning` level.
  - [ ] Hyperswitch API errors logged at `error` level.
  - [ ] Upsonic agent errors logged at `error` level.

- [ ] **Graceful failure demo present**
  - [ ] At least one session in the demo batch ends as `unresolvable`.
  - [ ] Failure is logged end-to-end (DB + Sentry).
  - [ ] UI shows the unresolvable session correctly (not a blank/error state).

---

## UI

- [ ] **Frontend wired to all APIs**
  - [ ] Sessions list page loads real data from `GET /sessions`.
  - [ ] Session detail page shows event timeline and agent decision card.
  - [ ] Metrics page shows baseline vs agent comparison table.
  - [ ] Logs page shows the full intervention audit trail.

- [ ] **No hardcoded mock data in the frontend** (all data served by backend).

---

## Deployment

- [ ] **`.env.example` committed** with all required variable names (no values).
- [ ] **`.env` is git-ignored** and not committed.
- [ ] **Vercel deployment is live** and reachable at a public URL.
- [ ] All required environment variables are set in Vercel project settings.
- [ ] Post-deploy verification checklist (see `Deploy.md`) completed.

---

## Demo Readiness

- [ ] Synthetic batch of ≥ 100 sessions seeded and processed.
- [ ] Metrics snapshot shows a positive recovery lift (≥ 15% target).
- [ ] At least one false-positive intervention visible in the logs.
- [ ] At least one abstention visible in the logs.
- [ ] At least one unresolvable session visible.
- [ ] Video demo updated to show all of the above (if required by buildathon submission).

---

> **All checkboxes must be ticked before the project is submitted to the buildathon.**
