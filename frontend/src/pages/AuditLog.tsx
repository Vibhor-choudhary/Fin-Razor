import { useEffect, useState } from 'react';
import { api, type Log } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProvenanceChip } from '../components/ProvenanceChip';
import { Link } from 'react-router-dom';

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
    <div className="fade-in">
      <PageHeader 
        title="Decisions" 
        description="Immutable cryptographic-style log of all agent interventions and their corresponding guardrail verdicts."
      />

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="btn btn-secondary">
          <option value={50}>Last 50 events</option>
          <option value={100}>Last 100 events</option>
          <option value={500}>Last 500 events</option>
        </select>
      </div>

      {error && <div className="text-danger mb-4 fade-in">Error: {error}</div>}
      
      <div className="panel" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table style={{ opacity: loading ? 0.5 : 1, transition: 'opacity var(--transition-fast)' }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Intervention</th>
                <th>Session ID</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isDemo = log.session_id.startsWith('demo_');
                return (
                  <tr key={log.id}>
                    <td className="mono text-caption text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.applied_at).toLocaleString()}
                    </td>
                    <td>
                      <div className="mono mb-1">{log.type}</div>
                      {log.type === 'retry' && <ProvenanceChip type="verified" label="SANDBOX VERIFIED" />}
                      {log.type === 'nudge' && <ProvenanceChip type="simulated" label="SIMULATED OUTCOME" />}
                      {log.type === 'abstain' && <ProvenanceChip type="abstained" label="GUARDRAIL ABSTAINED" />}
                    </td>
                    <td>
                      <div className="mono">{isDemo ? log.session_id : `${log.session_id.slice(0, 13)}...`}</div>
                      {isDemo && <div className="text-caption" style={{ color: 'var(--simulated)', marginTop: '2px' }}>SIMULATED DEMO DATA</div>}
                    </td>
                    <td>
                      <div className="text-secondary" style={{ fontSize: '13px', maxWidth: '400px' }}>
                        {log.details}
                      </div>
                    </td>
                    <td>
                      <Link to={`/replay/${log.session_id}`} className="btn btn-ghost" style={{ padding: '0 var(--space-2)' }}>
                        Inspect
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && !loading && (
          <div className="text-muted text-center py-4 fade-in">No logs found.</div>
        )}
      </div>
    </div>
  );
}
