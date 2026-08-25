import { useEffect, useState } from 'react';
import { api, type Log } from '../lib/api';

export function AuditLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getLogs({ limit: limit.toString() });
        setLogs(res.logs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [limit]);

  return (
    <div>
      <div className="header">
        <h1 className="title">Audit Log</h1>
        <div className="methodology" style={{ marginBottom: 0, padding: '0.5rem 1rem' }}>
          Sandbox simulation — real Hyperswitch payment rails; simulated customer outcomes.
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="btn">
          <option value={50}>Last 50 events</option>
          <option value={100}>Last 100 events</option>
          <option value={500}>Last 500 events</option>
        </select>
      </div>

      {error && <div className="error-state">Error: {error}</div>}
      
      <div className="panel" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Session ID</th>
                <th>Intervention ID</th>
                <th>Details</th>
                <th>Sentry ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.applied_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="chip">{log.type}</span>
                  </td>
                  <td className="mono">
                    {log.session_id.startsWith('demo_') ? log.session_id : `${log.session_id.slice(0, 13)}...`}
                    {log.session_id.startsWith('demo_') ? (
                      <div style={{fontSize: '0.65rem', color: 'var(--warning)', marginTop: 4}}>SIMULATED DEMO DATA</div>
                    ) : log.session_id.includes('guardrail_test') ? (
                      <div style={{fontSize: '0.65rem', color: 'var(--warning)', marginTop: 4}}>TEST FIXTURE · FRESHNESS RULE</div>
                    ) : null}
                  </td>
                  <td className="mono" style={{ color: 'var(--fg-muted)' }}>{log.id.slice(0, 10)}...</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ marginBottom: 4 }}>
                      {log.type === 'retry' && <span style={{fontSize: '0.65rem', padding: '2px 4px', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--accent)', borderRadius: 2}}>SANDBOX VERIFIED</span>}
                      {log.type === 'nudge' && <span style={{fontSize: '0.65rem', padding: '2px 4px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--fg)', borderRadius: 2}}>SIMULATED OUTCOME</span>}
                      {log.type === 'abstain' && <span style={{fontSize: '0.65rem', padding: '2px 4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 2}}>GUARDRAIL ABSTAINED</span>}
                    </div>
                    {log.details}
                  </td>
                  <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>
                    {log.sentry_event_id || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && !loading && <div style={{ padding: '2rem' }} className="mono">No logs found.</div>}
      </div>
    </div>
  );
}
