import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Session } from '../lib/api';

export function Queue() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState('');
  const [atRisk, setAtRisk] = useState('');
  const [intType, setIntType] = useState('');

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

  return (
    <div>
      <div className="header">
        <h1 className="title">Recovery Queue</h1>
        <div className="methodology" style={{ marginBottom: 0, padding: '0.5rem 1rem' }}>
          Sandbox simulation — real Hyperswitch payment rails; simulated customer outcomes.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <select value={status} onChange={e => setStatus(e.target.value)} className="btn">
          <option value="">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
          <option value="requires_payment_method">Requires Payment Method</option>
        </select>
        
        <select value={atRisk} onChange={e => setAtRisk(e.target.value)} className="btn">
          <option value="">All Risk Levels</option>
          <option value="true">At Risk Only</option>
          <option value="false">Safe Only</option>
        </select>

        <select value={intType} onChange={e => setIntType(e.target.value)} className="btn">
          <option value="">All Interventions</option>
          <option value="retry">Retry</option>
          <option value="nudge">Nudge</option>
          <option value="none">None (Abstained)</option>
        </select>
      </div>

      {error && <div className="error-state">Error: {error}</div>}
      
      <div className="panel" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Cart Value</th>
                <th>Latest Error / Status</th>
                <th>Agent Recommendation</th>
                <th>Guardrail Outcome</th>
                <th>Final Result</th>
                <th>Confidence</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                let rec = s.intervention_type || '-';
                let outcome = s.intervention_status || '-';
                
                // Distinguish state visually
                let outcomeColor = 'var(--fg)';
                if (outcome === 'abstained' || outcome === 'rejected') outcomeColor = 'var(--warning)';
                if (outcome === 'failed') outcomeColor = 'var(--error)';
                if (outcome === 'succeeded') outcomeColor = 'var(--accent)';

                let finalResultText = s.final_status;
                if (rec === 'retry') {
                  if (s.final_status === 'succeeded') finalResultText = 'RECOVERED';
                  else if (s.final_status === 'failed') finalResultText = 'RETRY FAILED';
                }

                return (
                  <tr key={s.id}>
                    <td className="mono">
                      {s.id.slice(0, 13)}...
                      {s.id.includes('guardrail_test') && <div style={{fontSize: '0.65rem', color: 'var(--warning)', marginTop: 4}}>TEST FIXTURE · FRESHNESS RULE</div>}
                    </td>
                    <td>₹{s.cart_value}</td>
                    <td>
                      <span className="mono" style={{ fontSize: '0.75rem' }}>
                        {s.latest_error_code || s.initial_status}
                      </span>
                    </td>
                    <td><span className="chip">{rec}</span></td>
                    <td style={{ color: outcomeColor }}>{outcome}</td>
                    <td>
                      <span className={`chip ${s.final_status === 'succeeded' ? 'success' : s.final_status === 'failed' ? 'error' : ''}`}>
                        {finalResultText}
                      </span>
                    </td>
                    <td className="mono">
                      {s.confidence !== null && s.confidence !== undefined ? s.confidence.toFixed(2) : '-'}
                    </td>
                    <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>
                      {new Date(s.created_at).toLocaleTimeString()}
                    </td>
                    <td>
                      <Link to={`/sessions/${s.id}`} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && !loading && <div style={{ padding: '2rem' }} className="mono">No sessions found.</div>}
      </div>
    </div>
  );
}
