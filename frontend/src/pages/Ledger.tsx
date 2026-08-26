import { useEffect, useState, useMemo } from 'react';
import { api, type Session } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProvenanceChip } from '../components/ProvenanceChip';
import { useReveal } from '../hooks/useReveal';
import './Ledger.css';

interface LedgerEntry {
  id: string;
  timestamp: string;
  action: string;
  amount: number;
  outcome: string;
  provenance: string;
  type: 'verified' | 'simulated' | 'none';
  runningVerified: number;
  runningSimulated: number;
  runningTotal: number;
}

export function Ledger() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sRes = await api.getAllSessions();
        setSessions(sRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { moneyEntries, noRecoveryEntries } = useMemo(() => {
    const money: LedgerEntry[] = [];
    const noMoney: any[] = [];
    
    let runningVerified = 0;
    let runningSimulated = 0;
    
    const sorted = [...sessions].reverse();

    sorted.forEach(s => {
      if (!s.intervention_type) return;

      const timestamp = s.created_at ? new Date(s.created_at).toLocaleString() : 'Timestamp unavailable';
      const isSuccess = s.intervention_status === 'succeeded';
      
      if (isSuccess && (s.intervention_type === 'retry' || s.intervention_type === 'nudge')) {
        let type: 'verified' | 'simulated' = 'simulated';
        let provenance = 'SIMULATED NUDGE OUTCOME';
        
        if (s.intervention_type === 'retry') {
          type = 'verified';
          provenance = 'SANDBOX VERIFIED RETRY';
          runningVerified += s.cart_value;
        } else {
          runningSimulated += s.cart_value;
        }
        
        money.unshift({
          id: s.id,
          timestamp,
          action: s.intervention_type.toUpperCase(),
          amount: s.cart_value,
          outcome: s.intervention_status?.toUpperCase() || 'UNKNOWN',
          provenance,
          type,
          runningVerified,
          runningSimulated,
          runningTotal: runningVerified + runningSimulated
        });
      } else {
        noMoney.unshift({
          id: s.id,
          timestamp,
          action: s.intervention_type.toUpperCase(),
          amount: s.cart_value,
          outcome: s.intervention_status ? s.intervention_status.toUpperCase() : 'UNKNOWN',
          provenance: s.intervention_type === 'abstain' || s.intervention_status === 'rejected' ? 'GUARDRAIL ABSTAINED' : 'UNRECOVERED'
        });
      }
    });

    return { moneyEntries: money, noRecoveryEntries: noMoney };
  }, [sessions]);

  const revealRef = useReveal({ selector: '.reveal-item' });

  if (loading) return <div className="mono text-muted py-4 fade-in">Loading ledger...</div>;

  return (
    <div className="fade-in" ref={revealRef}>
      <PageHeader 
        title="Outcomes" 
        description="A financial ledger separating deterministically verified recovery from statistically simulated recovery."
        eyebrow="RECOVERY LEDGER"
      />

      <div style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="title-section mb-4">Successful Recoveries</h2>
        <div className="panel" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Session ID</th>
                  <th>Action</th>
                  <th>Outcome Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Running Total</th>
                </tr>
              </thead>
              <tbody>
                {moneyEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-muted text-center py-4 mono">No successful recoveries found.</td>
                  </tr>
                ) : (
                  moneyEntries.map(entry => {
                    const isDemo = entry.id.startsWith('demo_');
                    return (
                      <tr key={entry.id}>
                        <td className="mono text-caption text-muted">{entry.timestamp}</td>
                        <td>
                          <div className="mono">{isDemo ? entry.id : `${entry.id.slice(0,13)}...`}</div>
                          {isDemo && <div className="text-caption" style={{ color: 'var(--simulated)', marginTop: '2px' }}>SIMULATED DEMO DATA</div>}
                        </td>
                        <td className="mono">{entry.action}</td>
                        <td>
                          {entry.type === 'verified' ? (
                            <ProvenanceChip type="verified" label={entry.provenance} />
                          ) : (
                            <ProvenanceChip type="simulated" label={entry.provenance} />
                          )}
                        </td>
                        <td className="mono text-success" style={{ textAlign: 'right' }}>+ ₹{entry.amount.toLocaleString()}</td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>₹{entry.runningTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-7)' }}>
        <h2 className="title-section mb-4">Unrecovered & Abstained</h2>
        <div className="panel" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Session ID</th>
                  <th>Action</th>
                  <th>Outcome Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {noRecoveryEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted text-center py-4 mono">No unrecovered sessions found.</td>
                  </tr>
                ) : (
                  noRecoveryEntries.slice(0, 50).map((entry, idx) => {
                    const isDemo = entry.id.startsWith('demo_');
                    return (
                      <tr key={`${entry.id}-${idx}`}>
                        <td className="mono text-caption text-muted">{entry.timestamp}</td>
                        <td>
                          <div className="mono">{isDemo ? entry.id : `${entry.id.slice(0,13)}...`}</div>
                          {isDemo && <div className="text-caption" style={{ color: 'var(--simulated)', marginTop: '2px' }}>SIMULATED DEMO DATA</div>}
                        </td>
                        <td className="mono text-muted">{entry.action}</td>
                        <td>
                          {entry.provenance === 'GUARDRAIL ABSTAINED' ? (
                            <ProvenanceChip type="abstained" label={entry.provenance} />
                          ) : (
                            <ProvenanceChip type="danger" label={entry.provenance} />
                          )}
                        </td>
                        <td className="mono text-muted" style={{ textAlign: 'right' }}>₹{entry.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
