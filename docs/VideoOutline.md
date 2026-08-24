# Video Outline (5-Minute Demo)

### 0:00 – 0:30: Problem and Thesis
- **Visual:** Title slide or Merchant Dashboard Overview.
- **Talking Points:** Introduce the problem of checkout abandonment due to unhandled payment failures. State the thesis: analytics show you the drop-off, but the *Checkout Recovery Agent* actively recovers it by using AI to analyze the context, but bounded by deterministic guardrails to ensure safety and precision.

### 0:30 – 1:20: System Architecture / Real vs. Simulated Evidence
- **Visual:** `docs/ArchitectureDiagram.mmd` (rendered).
- **Talking Points:** Briefly walk through the architecture: Frontend (React), Backend (FastAPI), Agent (Upsonic), and Integrations (Hyperswitch). Clarify our transparency rule: the system uses real test cards on the Hyperswitch sandbox for retry interventions, but deterministic customer simulations for evaluation. No real customer data is at risk.

### 1:20 – 2:15: Live Real Success and DC_08 Failure Evidence
- **Visual:** Terminal running `python scripts/run_real_payment.py`.
- **Talking Points:** Execute the script live. Show the successful `pay_` transaction, then the declined transaction returning the `DC_08` error code. Prove that the agent is hooked into the real Hyperswitch sandbox API.

### 2:15 – 3:10: LLM Proposal + Deterministic Guardrails + Stopping Rule
- **Visual:** Terminal running `python scripts/run_agent_batch.py`.
- **Talking Points:** Kick off the batch agent. Explain how the agent receives context and proposes an action (e.g., retry or nudge). Highlight the Guardrails layer intercepting a decision—specifically point out the 60-second freshness rule rejecting an action on the `TEST FIXTURE` session. Emphasize the stopping rule: at most *one* intervention is ever attempted per session.

### 3:10 – 4:15: Console, Recovery Provenance, Metrics, and Audit Trail
- **Visual:** Merchant Console (Overview -> Queue -> Session Detail -> Audit Log).
- **Talking Points:** Navigate to the Overview tab to show the strict split between **Verified Sandbox Recovery** and **Simulated Nudge Recovery**. Then, show the Recovery Queue with its clear `RECOVERED` vs. `RETRY FAILED` outcome labels. Finally, open the Audit Log to highlight the provenance labels (`SANDBOX VERIFIED`, `GUARDRAIL ABSTAINED`), demonstrating complete transparency.

### 4:15 – 5:00: Limitations, Safety, and Why it fits AI Revenue Recovery
- **Visual:** Summary slide or the main GitHub repo README.
- **Talking Points:** Conclude with the system's limitations (sandbox-only, no production PII, deterministically simulated behaviors). Reiterate why this fits the Razorpay AI Buildathon theme: it’s a high-impact, revenue-driving application that prioritizes safety and merchant trust above all else.
