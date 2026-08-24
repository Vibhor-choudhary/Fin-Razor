import { useEffect, useState, useMemo } from 'react';
import { api, type Session } from '../lib/api';
import { Link } from 'react-router-dom';
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
  const [dataMode, setDataMode] = useState('sandbox_simulation');

  useEffect(() => {
    async function load() {
      try {
        const [sRes, mRes] = await Promise.all([
          api.getAllSessions(),
          api.getMetrics()
        ]);
        setSessions(sRes);
        setDataMode(mRes.data_mode);
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
    
    // Sort chronologically if created_at exists, else assume list is roughly chronological or just map as is.
    // The endpoint returns newest first, so we reverse to build running totals accurately.
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
          provenance: s.intervention_type === 'abstain' ? 'GUARDRAIL ABSTAINED' : 'UNRECOVERED'
        });
      }
    });

    return { moneyEntries: money, noRecoveryEntries: noMoney };
  }, [sessions]);

  if (loading) return <div className="loader">Loading ledger...</div>;

  return (
    <div className="ledger-container slide-up">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Recovery Ledger</h1>
        <div className="methodology" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>HISTORICAL REPLAY · READ ONLY</div>
          <div className="chip sandbox">Data Mode: {dataMode}</div>
        </div>
      </div>

      <div className="ledger-totals panel" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: '0.25rem' }}>VERIFIED SANDBOX RETRY RECOVERY</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
            ₹{moneyEntries.length > 0 ? moneyEntries[0].runningVerified.toFixed(2) : '0.00'}
          </div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: '0.25rem' }}>SIMULATED NUDGE RECOVERY</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--simulated)' }}>
            ₹{moneyEntries.length > 0 ? moneyEntries[0].runningSimulated.toFixed(2) : '0.00'}
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: '0.25rem' }}>TOTAL MODELED RECOVERY</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            ₹{moneyEntries.length > 0 ? moneyEntries[0].runningTotal.toFixed(2) : '0.00'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginTop: '0.25rem' }}>NOT SETTLED/LIVE MONEY</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Modeled Revenue Entries</h2>
      <div className="panel" style={{ padding: 0, marginBottom: '3rem', overflowX: 'auto' }}>
        {moneyEntries.length === 0 ? (
          <div style={{ padding: '2rem' }}>No recovery recorded yet.</div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Session ID</th>
                <th>Action</th>
                <th>Provenance</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Running Total</th>
              </tr>
            </thead>
            <tbody>
              {moneyEntries.map((e, i) => (
                <tr key={`${e.id}-${i}`}>
                  <td className="mono" style={{ color: 'var(--fg-muted)' }}>{e.timestamp}</td>
                  <td className="mono">
                    <Link to={`/replay/${e.id}`} style={{ color: 'var(--fg)', textDecoration: 'underline' }}>{e.id}</Link>
                  </td>
                  <td>{e.action}</td>
                  <td>
                    <span className={`chip ${e.type === 'verified' ? 'provenance-verified' : 'provenance-simulated'}`}>
                      {e.provenance}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: e.type === 'verified' ? 'var(--accent)' : 'var(--simulated)' }}>
                    +₹{e.amount.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    ₹{e.runningTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--fg-muted)' }}>No Recovery Recorded</h2>
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {noRecoveryEntries.length === 0 ? (
          <div style={{ padding: '2rem' }}>No failed or abstained actions.</div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Session ID</th>
                <th>Action</th>
                <th>Outcome</th>
                <th style={{ textAlign: 'right' }}>Cart Value</th>
              </tr>
            </thead>
            <tbody>
              {noRecoveryEntries.map((e, i) => (
                <tr key={`${e.id}-${i}`} style={{ opacity: 0.7 }}>
                  <td className="mono" style={{ color: 'var(--fg-muted)' }}>{e.timestamp}</td>
                  <td className="mono">
                    <Link to={`/replay/${e.id}`} style={{ color: 'var(--fg)', textDecoration: 'underline' }}>{e.id}</Link>
                  </td>
                  <td>{e.action}</td>
                  <td>
                    <span className="chip provenance-abstained">{e.provenance}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{e.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
