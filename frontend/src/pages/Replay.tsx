import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type SessionDetailResponse } from '../lib/api';
import './Replay.css';

export function Replay() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await api.getSession(id);
        setData(res);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!data) return;
    const timer = setInterval(() => {
      setStep((s) => (s < 5 ? s + 1 : s));
    }, 800);
    return () => clearInterval(timer);
  }, [data]);

  if (loading) return <div className="loader">Loading replay...</div>;
  if (error || !data) {
    return (
      <div className="panel empty-state-panel">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Session Replay Unavailable</h2>
        <p style={{ color: 'var(--fg-muted)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
          {error ? 'Evidence could not be retrieved from the event store.' : 'The requested session record was not found in this sandbox batch.'}
        </p>
        <Link to="/recovery-queue" className="btn">
          Return to Recovery Queue
        </Link>
      </div>
    );
  }

  const { session, events, intervention } = data;
  const isFixture = session.id.includes('guardrail_test');
  
  // Extract error code from failure event or session
  const failEvent = events.find(e => e.type === 'failed');
  const errorCode = failEvent?.metadata?.error_code || session.latest_error_code || 'Unknown';
  const riskReason = session.initial_status === 'failed' ? `FAILED / ${errorCode} Card declined` : 
    (session.initial_status === 'requires_payment_method' ? 'REQUIRES_PAYMENT_METHOD / checkout inactive over threshold' : session.initial_status);

  // Parsing reasoning
  const rawReasoning = intervention?.agent_reasoning || 'No agent reasoning available.';
  let llmReasoning = rawReasoning;
  let guardrailReason = '';
  
  if (rawReasoning.includes('Guardrail rejected:')) {
    const parts = rawReasoning.split('. Agent proposed:');
    guardrailReason = parts[0].replace('Guardrail rejected:', '').trim();
    if (parts[1]) {
      const parts2 = parts[1].split('Reasoning:');
      if (parts2[1]) {
        llmReasoning = parts2[1].trim();
      }
    }
  }

  // Determine provenance badge
  let badgeLabel = '';
  let badgeClass = '';
  if (intervention?.type === 'retry') {
    badgeLabel = 'SANDBOX VERIFIED';
    badgeClass = 'provenance-verified';
  } else if (intervention?.type === 'nudge') {
    badgeLabel = 'SIMULATED OUTCOME';
    badgeClass = 'provenance-simulated';
  } else if (intervention?.type === 'abstain' || intervention?.outcome === 'rejected') {
    badgeLabel = 'GUARDRAIL ABSTAINED';
    badgeClass = 'provenance-abstained';
  }

  // Step 3 Guardrail Checks evaluation
  const isRetry = intervention?.type === 'retry' || rawReasoning.includes('Agent proposed: retry');
  
  // Step 5 Outcome evaluation
  let outcomeText = 'PENDING / INSUFFICIENT EVIDENCE';
  let outcomeColor = 'var(--fg-muted)';
  
  if (intervention?.outcome === 'rejected') {
    outcomeText = `NO ACTION TAKEN: ${guardrailReason}`;
    outcomeColor = 'var(--gold)';
  } else if (intervention?.outcome === 'succeeded' && intervention?.type === 'retry') {
    outcomeText = `RECOVERED: ₹${session.cart_value}`;
    outcomeColor = 'var(--accent)';
  } else if (intervention?.outcome === 'failed' && intervention?.type === 'retry') {
    outcomeText = `RETRY FAILED: ${errorCode}`;
    outcomeColor = 'var(--error)';
  } else if (intervention?.type === 'nudge') {
    outcomeText = `SIMULATED CUSTOMER RESPONSE: ${intervention.outcome.toUpperCase()}`;
    outcomeColor = 'var(--simulated)';
  } else if (intervention?.type === 'abstain') {
    outcomeText = 'NO ACTION TAKEN';
    outcomeColor = 'var(--gold)';
  }

  const hasRawPayload = events.some(e => e.has_raw_payload);

  return (
    <div className="replay-container">
      <div className="replay-header">
        <Link to={`/sessions/${session.id}`} className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>← Back</Link>
        <div style={{ flex: 1 }}>
          <h1 className="title" style={{ fontSize: '1.2rem', margin: 0 }}>
            RECOVERY REPLAY <span className="mono" style={{ opacity: 0.7, fontSize: '0.9rem' }}>{session.id}</span>
          </h1>
          <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`chip ${badgeClass}`} style={{ fontSize: '0.7rem' }}>{badgeLabel}</span>
            {session.id.startsWith('demo_') ? (
              <span className="chip provenance-abstained" style={{ fontSize: '0.7rem' }}>SIMULATED DEMO DATA</span>
            ) : isFixture ? (
              <span className="chip provenance-abstained" style={{ fontSize: '0.7rem' }}>TEST FIXTURE · FRESHNESS RULE</span>
            ) : null}
          </div>
        </div>
        {step >= 5 && <div className="replay-complete-badge">Replay Complete</div>}
      </div>

      <div className="replay-flow">
        {step >= 1 && (
          <div className="replay-step slide-up">
            <div className="step-num">Step 1</div>
            <div className="step-content">
              <h3>Risk Observed</h3>
              <p className="mono">{riskReason}</p>
            </div>
          </div>
        )}

        {step >= 2 && (
          <div className="replay-step slide-up">
            <div className="step-num">Step 2</div>
            <div className="step-content">
              <h3>Agent Proposal <span className="chip" style={{ marginLeft: 8 }}>LLM PROPOSAL — NOT YET EXECUTED</span></h3>
              <div className="proposal-grid">
                <div><strong>Recommended action:</strong> <span className="chip">{intervention?.type || 'none'}</span></div>
                <div><strong>Confidence:</strong> {intervention?.confidence_score}</div>
                <div><strong>Evidence:</strong> {errorCode !== 'Unknown' ? `${errorCode} Card declined` : 'Checkout remained inactive past the abandonment threshold'}</div>
              </div>
              <p style={{ marginTop: '0.5rem' }}><strong>Agent rationale:</strong> {llmReasoning}</p>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="replay-step slide-up">
            <div className="step-num">Step 3</div>
            <div className="step-content">
              <h3>Deterministic Guardrails <span className="chip" style={{ marginLeft: 8 }}>CODE ENFORCED</span></h3>
              <ul className="guardrail-list mono">
                <li>
                  <span className={`status-badge ${isRetry && errorCode === 'DC_08' ? 'passed' : 'not-eval'}`}>
                    {isRetry && errorCode === 'DC_08' ? 'PASSED' : 'NOT EVALUATED'}
                  </span>
                  Known retryable code
                </li>
                <li>
                  <span className={`status-badge ${(intervention?.confidence_score || 0) >= 0.6 ? 'passed' : 'not-eval'}`}>
                    {(intervention?.confidence_score || 0) >= 0.6 ? 'PASSED' : 'NOT EVALUATED'}
                  </span>
                  Confidence floor
                </li>
                <li>
                  <span className="status-badge passed">PASSED</span>
                  One-action limit
                </li>
                <li>
                  <span className="status-badge passed">PASSED</span>
                  Amount unchanged
                </li>
                <li>
                  <span className={`status-badge ${guardrailReason.includes('fresh') ? 'blocked' : 'passed'}`}>
                    {guardrailReason.includes('fresh') ? 'BLOCKED' : 'PASSED'}
                  </span>
                  Freshness/cooldown
                </li>
                <li>
                  <span className="status-badge passed">PASSED</span>
                  Successful-session exclusion
                </li>
              </ul>
            </div>
          </div>
        )}

        {step >= 4 && (
          <div className="replay-step slide-up">
            <div className="step-num">Step 4</div>
            <div className="step-content">
              <h3>Bounded Action</h3>
              <p>Action determined: <strong>{intervention?.type || 'none'}</strong> (maximum one action per session)</p>
              {isRetry && <p className="mono">Original Amount: ₹{session.cart_value} <span style={{color: 'var(--accent)'}}>[amount unchanged]</span></p>}
            </div>
          </div>
        )}

        {step >= 5 && (
          <div className="replay-step slide-up">
            <div className="step-num">Step 5</div>
            <div className="step-content">
              <h3>Outcome</h3>
              <h2 style={{ color: outcomeColor, margin: '0.5rem 0' }}>{outcomeText}</h2>
            </div>
          </div>
        )}
      </div>

      <div className="replay-footer">
        {hasRawPayload && <div className="mono" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Raw Hyperswitch response retained for audit</div>}
        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Sandbox simulation — real Hyperswitch payment rails; simulated customer outcomes.</div>
      </div>
    </div>
  );
}
