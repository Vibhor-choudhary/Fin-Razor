import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Session } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProvenanceChip } from '../components/ProvenanceChip';
import { EvidenceDrawer } from '../components/EvidenceDrawer';
import { useReveal } from '../hooks/useReveal';

export function Queue() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState('');
  const [atRisk, setAtRisk] = useState('');
  const [intType, setIntType] = useState('');

  // Drawer
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        if (atRisk) params.at_risk = atRisk;
        if (intType) params.intervention_type = intType;
        
        const res = await api.getSessions(params);
        const sorted = res.sessions.sort((a, b) => {
          const rankA = a.at_risk && !a.intervention_type ? 1 : a.intervention_type ? 2 : 3;
          const rankB = b.at_risk && !b.intervention_type ? 1 : b.intervention_type ? 2 : 3;
          return rankA - rankB;
        });
        setSessions(sorted);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, atRisk, intType]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const renderProvenance = (s: Session) => {
    if (s.final_status === 'succeeded') {
      return <ProvenanceChip type="verified" label="RECOVERED" />;
    } else if (s.intervention_status === 'abstained' || s.intervention_status === 'rejected') {
      return <ProvenanceChip type="abstained" label="ABSTAINED" />;
    } else {
      return <ProvenanceChip type="danger" label="FAILED" />;
    }
  };

  const revealRef = useReveal({ selector: '.reveal-item' });

  return (
    <div className="fade-in" ref={revealRef}>
      <div className="reveal-item">
        <PageHeader 
          title="Recovery Queue"
          description="Filter and inspect at-risk checkout sessions and their programmatic outcomes."
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <select value={status} onChange={e => setStatus(e.target.value)} className="btn btn-secondary">
          <option value="">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
          <option value="requires_payment_method">Requires Payment Method</option>
        </select>
        
        <select value={atRisk} onChange={e => setAtRisk(e.target.value)} className="btn btn-secondary">
          <option value="">All Risk Levels</option>
          <option value="true">At Risk Only</option>
          <option value="false">Safe Only</option>
        </select>

        <select value={intType} onChange={e => setIntType(e.target.value)} className="btn btn-secondary">
          <option value="">All Interventions</option>
          <option value="retry">Retry</option>
          <option value="nudge">Nudge</option>
          <option value="none">None (Abstained)</option>
        </select>
      </div>

      {error && <div className="text-danger fade-in" style={{ marginBottom: 'var(--space-4)' }}>Error: {error}</div>}
      
      <div className="panel" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table style={{ opacity: loading ? 0.5 : 1, transition: 'opacity var(--transition-fast)' }}>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Cart Value</th>
                <th>Failure Reason</th>
                <th>Agent Proposal</th>
                <th>Outcome</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const rec = s.intervention_type || '-';
                return (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedSessionId(s.id)} 
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') setSelectedSessionId(s.id); }}
                  >
                    <td>
                      <div className="mono" style={{ color: 'var(--text-primary)' }}>
                        {s.id.startsWith('demo_') ? s.id : `${s.id.slice(0, 13)}...`}
                      </div>
                      {s.id.startsWith('demo_') && (
                        <div className="text-caption" style={{ color: 'var(--simulated)', marginTop: '2px' }}>SIMULATED DEMO DATA</div>
                      )}
                    </td>
                    <td className="mono">₹{s.cart_value}</td>
                    <td>
                      <span className="mono text-secondary">
                        {s.latest_error_code || s.initial_status}
                      </span>
                    </td>
                    <td className="mono text-muted">{rec}</td>
                    <td>{renderProvenance(s)}</td>
                    <td className="mono text-caption text-muted">
                      {new Date(s.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && !loading && (
          <div className="text-muted" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            No sessions match the selected criteria.
          </div>
        )}
      </div>

      <EvidenceDrawer 
        isOpen={!!selectedSessionId} 
        onClose={() => setSelectedSessionId(null)}
        title="Session Evidence"
        sessionId={selectedSession?.id}
      >
        {selectedSession && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>Outcome</div>
              {renderProvenance(selectedSession)}
            </div>

            <div>
              <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>Agent Proposal</div>
              <div className="mono">{selectedSession.intervention_type || 'None'}</div>
            </div>

            <div>
              <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>Guardrail Verdict</div>
              <div className="mono text-secondary">{selectedSession.intervention_status || 'None'}</div>
            </div>

            <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--divider)' }}>
              <Link to={`/replay/${selectedSession.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                Open in Replay
              </Link>
            </div>
            
            <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--divider)' }}>
              <div className="text-label" style={{ marginBottom: 'var(--space-3)' }}>Raw Payload (Summary)</div>
              <pre className="mono" style={{ fontSize: '11px', background: 'var(--canvas)', padding: 'var(--space-3)', borderRadius: 'var(--radius-input)', overflowX: 'auto', color: 'var(--text-secondary)' }}>
                {JSON.stringify(selectedSession, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </EvidenceDrawer>
    </div>
  );
}
