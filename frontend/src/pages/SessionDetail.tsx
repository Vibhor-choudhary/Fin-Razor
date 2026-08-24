import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type SessionDetailResponse } from '../lib/api';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div className="loader">Loading session {id}...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!data) return null;

  const { session, events, intervention } = data;
  
  // Guardrail dummy parsing based on logic (since backend doesn't explicitly return list, we derive it from reasoning if possible, or just show immutable list)
  const isRejected = intervention?.outcome === 'rejected';
  
  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/recovery-queue" className="btn">
          ← Back to Queue
        </Link>
        {intervention && (
          <Link to={`/replay/${session.id}`} className="btn" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
            ▶ View Recovery Replay
          </Link>
        )}
      </div>

      <div className="header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '1.5rem' }}>
            Session <span className="mono">{session.id}</span>
            {session.id.includes('guardrail_test') && <div style={{fontSize: '0.85rem', color: 'var(--warning)', marginTop: 8}}>TEST FIXTURE · FRESHNESS RULE</div>}
          </h1>
          <div className="methodology" style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Sandbox simulation — real Hyperswitch payment rails; simulated customer outcomes.
          </div>
        </div>
        <div className={`chip ${session.final_status === 'succeeded' ? 'success' : 'error'}`}>
          {session.final_status}
        </div>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="metric">
          <div className="metric-label">Cart Value</div>
          <div className="metric-value">₹{session.cart_value}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Initial Status</div>
          <div className="metric-value" style={{ fontSize: '1.5rem', marginTop: '1rem' }}>{session.initial_status}</div>
        </div>
        <div className="metric">
          <div className="metric-label">At Risk</div>
          <div className="metric-value" style={{ fontSize: '1.5rem', marginTop: '1rem', color: session.at_risk ? 'var(--warning)' : 'inherit' }}>
            {session.at_risk ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Timeline */}
        <div>
          <h3>Event Timeline</h3>
          <div className="panel timeline">
            <div className="timeline-item">
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>{new Date(session.created_at).toLocaleString()}</div>
              <div>Checkout Started</div>
            </div>
            
            {events.map(e => (
              <div key={e.id} className="timeline-item">
                <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>{new Date(e.timestamp).toLocaleString()}</div>
                <div>Payment Event: <span className="chip">{e.type}</span></div>
                {e.metadata && e.metadata.error_code && (
                  <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: '0.25rem' }}>Error: {e.metadata.error_code}</div>
                )}
              </div>
            ))}
            
            {intervention && (
              <>
                <div className="timeline-item">
                  <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>{new Date(intervention.applied_at).toLocaleString()}</div>
                  <div>Agent Proposal: <span className="chip">{intervention.type}</span></div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--fg-muted)' }}>
                    Confidence: {intervention.confidence_score.toFixed(2)}
                  </div>
                </div>
                
                <div className="timeline-item" style={{ marginBottom: 0 }}>
                  <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>{new Date(intervention.applied_at).toLocaleString()}</div>
                  <div>Guardrail & Outcome: <span className={`chip ${intervention.outcome === 'succeeded' ? 'success' : intervention.outcome === 'failed' ? 'error' : 'sandbox'}`}>{intervention.outcome}</span></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Decision & Audit */}
        <div>
          {intervention && (
            <>
              <h3>Agent Decision</h3>
              <div className="panel">
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="metric-label">LLM Reasoning</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--fg-muted)', whiteSpace: 'pre-wrap' }}>
                    {intervention.agent_reasoning || 'No reasoning provided.'}
                  </div>
                </div>
                
                <div className="metric-label">Immutable Guardrails</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ color: isRejected && intervention.agent_reasoning?.includes('Confidence') ? 'var(--error)' : 'var(--accent)' }}>●</div>
                    Confidence Floor (≥ 0.6)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ color: isRejected && intervention.agent_reasoning?.includes('Already applied') ? 'var(--error)' : 'var(--accent)' }}>●</div>
                    Max-One Intervention
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ color: isRejected && intervention.agent_reasoning?.includes('60 seconds') ? 'var(--error)' : 'var(--accent)' }}>●</div>
                    Freshness Cooldown (≥ 60s)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ color: isRejected && intervention.agent_reasoning?.includes('Error code') ? 'var(--error)' : 'var(--accent)' }}>●</div>
                    Error Code Allowlist
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--accent)' }}>●</div>
                    Amount Unchanged
                  </div>
                </div>
              </div>
            </>
          )}

          <h3>Audit Proof</h3>
          <div className="panel">
            <div className="metric-label">Connector Data</div>
            <div className="mono" style={{ fontSize: '0.85rem', margin: '0.5rem 0 1rem 0' }}>
              Hyperswitch Sandbox v1
            </div>
            
            <div className="metric-label">Raw Payloads Recorded</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--fg-muted)' }}>
              {events.filter(e => e.has_raw_payload).length > 0 ? (
                <div style={{ color: 'var(--accent)' }}>✓ Securely stored in database (omitted from UI)</div>
              ) : (
                <div>No raw payloads attached to events.</div>
              )}
            </div>
            
            {intervention?.sentry_event_id && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="metric-label">Sentry Audit ID</div>
                <div className="mono" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{intervention.sentry_event_id}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
