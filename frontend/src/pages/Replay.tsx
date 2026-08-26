import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type SessionDetailResponse } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProvenanceChip } from '../components/ProvenanceChip';
import { gsap, useGSAP, EASE, MOTION_OK } from '../lib/motion';
import './Replay.css';

export function Replay() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 0: Risk Observed, 1: Agent Proposal, 2: Guardrail Eval, 3: Action, 4: Outcome
  const [activeStep, setActiveStep] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP crossfade on step change
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleStepChange = useCallback(contextSafe((idx: number) => {
    if (idx === activeStep) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (detailRef.current) {
        gsap.fromTo(detailRef.current,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.2, ease: EASE.reveal }
        );
      }
    });
    setActiveStep(idx);
  }), [activeStep]);

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

  if (loading) return <div className="fade-in mono text-muted py-4">Loading replay...</div>;
  
  if (error || !data) {
    return (
      <div className="fade-in">
        <PageHeader title="Session Replay Unavailable" description={error ? 'Evidence could not be retrieved from the event store.' : 'The requested session record was not found.'} />
        <Link to="/recovery-queue" className="btn btn-primary mt-4">Return to Recovery Queue</Link>
      </div>
    );
  }

  const { session, events, intervention } = data;
  const isDemo = session.id.startsWith('demo_');

  // Extract failure reason
  const failEvent = events.find(e => e.type === 'failed');
  const errorCode = failEvent?.metadata?.error_code || session.latest_error_code || 'Unknown';
  const riskReason = session.initial_status === 'failed' ? `FAILED / ${errorCode}` : session.initial_status;

  // Parse reasoning
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

  // Determine provenance & outcome text
  let badgeType: 'verified' | 'simulated' | 'abstained' | 'enforced' | 'danger' = 'abstained';
  let badgeLabel = 'NO EVIDENCE';
  let outcomeText = 'PENDING';
  let outcomeColor = 'var(--text-muted)';
  
  if (intervention?.outcome === 'rejected' || intervention?.type === 'abstain') {
    badgeType = 'abstained';
    badgeLabel = 'GUARDRAIL ABSTAINED';
    outcomeText = `NO ACTION TAKEN: ${guardrailReason || 'Abstained'}`;
    outcomeColor = 'var(--warning)';
  } else if (intervention?.type === 'nudge') {
    badgeType = 'simulated';
    badgeLabel = 'SIMULATED DEMO DATA';
    outcomeText = `SIMULATED OUTCOME: ${intervention.outcome.toUpperCase()}`;
    outcomeColor = 'var(--simulated)';
  } else if (intervention?.type === 'retry') {
    if (intervention?.outcome === 'succeeded') {
      badgeType = 'verified';
      badgeLabel = 'SANDBOX VERIFIED';
      outcomeText = `RECOVERED: ₹${session.cart_value}`;
      outcomeColor = 'var(--success)';
    } else {
      badgeType = 'danger';
      badgeLabel = 'SANDBOX VERIFIED';
      outcomeText = `RETRY FAILED: ${errorCode}`;
      outcomeColor = 'var(--danger)';
    }
  }

  const steps = [
    {
      title: 'payment.failed',
      desc: 'Risk Observed',
      detail: (
        <div>
          <div className="mono text-danger mb-2">{riskReason}</div>
          <div className="text-secondary mb-4">Cart value: ₹{session.cart_value}</div>
          <details>
            <summary className="text-label" style={{ cursor: 'pointer' }}>View Raw Payload</summary>
            <pre className="mono payload-box mt-2">{JSON.stringify(failEvent?.metadata || {}, null, 2)}</pre>
          </details>
        </div>
      )
    },
    {
      title: 'agent.proposal.created',
      desc: 'Agent Proposal',
      detail: (
        <div>
          <div className="mono mb-2">PROPOSED: {intervention?.type || 'None'}</div>
          <p className="text-secondary">{llmReasoning}</p>
          <div className="mono text-muted mt-4">Confidence: {intervention?.confidence_score?.toFixed(2) || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'guardrail.evaluated',
      desc: 'Deterministic Guardrail Decision',
      detail: (
        <div style={{ borderLeft: '4px solid var(--warning)', paddingLeft: 'var(--space-3)' }}>
          <div className="mono mb-2" style={{ fontWeight: 600 }}>
            {guardrailReason ? 'REJECTED' : 'PERMITTED'}
          </div>
          {guardrailReason && <p className="text-secondary">{guardrailReason}</p>}
          <p className="text-caption mt-2">Guardrails enforce invariants over LLM outputs.</p>
        </div>
      )
    },
    {
      title: intervention?.outcome === 'rejected' || intervention?.type === 'abstain' ? 'action.abstained' : 'action.executed',
      desc: 'Controlled Action',
      detail: (
        <div>
          <div className="mono mb-2">{intervention?.type === 'abstain' || intervention?.outcome === 'rejected' ? 'None (Abstained)' : `Executed: ${intervention?.type}`}</div>
          <p className="text-secondary">Only a single permitted action executes per session.</p>
        </div>
      )
    },
    {
      title: 'outcome.recorded',
      desc: 'Final Outcome',
      detail: (
        <div>
          <div className="mono mb-2" style={{ color: outcomeColor }}>{outcomeText}</div>
          <div className="mt-4">
            <ProvenanceChip type={badgeType} label={badgeLabel} />
            {isDemo && <span style={{ marginLeft: '8px' }}><ProvenanceChip type="simulated" label="SIMULATED DEMO DATA" /></span>}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fade-in" ref={containerRef}>
      <div style={{ marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <Link to="/recovery-queue" className="btn btn-secondary" style={{ padding: '0 var(--space-3)' }}>←</Link>
        <PageHeader 
          title="Session Replay" 
          description={`Trace the evidence lifecycle for ${session.id}`}
        />
      </div>

      <div className="replay-layout">
        {/* Timeline Column */}
        <div className="timeline-column">
          <div className="timeline">
            {steps.map((s, idx) => (
              <div 
                key={idx}
                className={`timeline-item ${activeStep === idx ? 'active' : ''}`}
                onClick={() => handleStepChange(idx)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') handleStepChange(idx); }}
              >
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-title mono">{s.title}</div>
                  <div className="timeline-desc text-secondary">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Column */}
        <div className="detail-column">
          <div className="panel" key={activeStep} ref={detailRef}>
            <h2 className="title-section mb-4">{steps[activeStep].desc}</h2>
            {steps[activeStep].detail}
          </div>
        </div>
      </div>
    </div>
  );
}
