# Demo Evidence

## 1. Real Sandbox Transactions
The following placeholders represent actual Hyperswitch sandbox transaction data recorded by the agent. These IDs and payloads are not simulated—they are the result of actual API calls to the Hyperswitch test environment.

*(Note: The `pay_...` IDs and raw responses are public test data for local demo evidence only. They do not contain any production credentials, API keys, client secrets, or PII.)*

### Success Evidence
- **Payment ID:** `pay_N6iUAz9OZOABvXLcyvzK` (example format)
- **Status:** `succeeded`
- **Error Code:** `None`

### Decline Evidence
- **Payment ID:** `pay_q9vX130fg8ichlidYl8P` (example format)
- **Status:** `failed`
- **Error Code:** `DC_08`

## 2. Data Provenance
The application enforces strict data provenance to ensure transparency in its metrics:
- **Verified Sandbox Recovery:** Money counted here is backed strictly by a confirmed `succeeded` response from the real Hyperswitch sandbox API (resulting from an active `retry` intervention).
- **Simulated Outcome:** Money counted as "Simulated Nudge Recovery" is generated deterministically based on simulated customer behavior following a `nudge`. This is never falsely presented as real sandbox recovery.
- **Guardrail Abstained:** The agent is blocked deterministically by code, such as the 60-second freshness rule or low-confidence thresholds.

## 3. Video Proof Checklist (5-Minute Demo)
When recording the demo, ensure the following steps are visible:
- [ ] **Overview:** Show the split metrics (Verified Sandbox vs. Simulated).
- [ ] **Real Payment Evidence:** Run the real payment script and show the success/decline in the terminal.
- [ ] **Guardrail:** Run the agent batch and show it executing on the dataset.
- [ ] **Abstention:** Highlight the `TEST FIXTURE · FRESHNESS RULE` session being explicitly rejected.
- [ ] **Recovery Queue:** Demonstrate sorting and the clear `RECOVERED` vs `RETRY FAILED` outcome labels.
- [ ] **Audit Log:** Show the provenance labels (`SANDBOX VERIFIED`, `SIMULATED OUTCOME`, `GUARDRAIL ABSTAINED`).
- [ ] **Architecture Diagram:** Briefly show the `.mmd` diagram.
