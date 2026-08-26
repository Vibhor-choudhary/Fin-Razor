import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type LabScenario, type LabRunResponse } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProvenanceChip } from '../components/ProvenanceChip';
import { useReveal } from '../hooks/useReveal';
import './Lab.css';

export function Lab() {
  const [scenarios, setScenarios] = useState<LabScenario[]>([]);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('card_declined');
  const [amountInr, setAmountInr] = useState<number>(150);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState<boolean>(true);
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<LabRunResponse | null>(null);
  const [recentLabRuns, setRecentLabRuns] = useState<any[]>([]);

  const fetchRecentRuns = async () => {
    try {
      const data = await api.getSessions({ limit: '50' });
      const labSessions = data.sessions.filter(s => s.id.startsWith('lab_')).slice(0, 5);
      setRecentLabRuns(labSessions);
    } catch (err) {
      console.error('Failed to load recent lab runs:', err);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    api.getLabScenarios()
      .then((data) => {
        setScenarios(data.scenarios || []);
        setIsReadOnly(Boolean(data.read_only));
        setIsLoadingScenarios(false);
      })
      .catch((err) => {
        console.error('Failed to load lab scenarios:', err);
        setErrorMsg('Failed to load sandbox scenarios from backend.');
        setIsLoadingScenarios(false);
      });
      
    fetchRecentRuns();
  }, []);

  const handleRun = async () => {
    if (!selectedScenarioId || isRunning || isReadOnly) return;
    if (amountInr < 10 || amountInr > 5000 || isNaN(amountInr)) {
      setErrorMsg('Amount must be between ₹10 and ₹5,000.');
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);
    setRunResult(null);

    try {
      const res = await api.runLabScenario({
        scenario_id: selectedScenarioId,
        amount_inr: Number(amountInr)
      });
      setRunResult(res);
      fetchRecentRuns();
    } catch (err: any) {
      console.error('Lab execution error:', err);
      setErrorMsg(err.message || 'Controlled scenario execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);
  const isValidAmount = !isNaN(amountInr) && amountInr >= 10 && amountInr <= 5000;

  const revealRef = useReveal({ selector: '.reveal-item' });

  return (
    <div className="fade-in" ref={revealRef}>
      <PageHeader 
        title="Recovery Lab" 
        description="Run an approved Hyperswitch test scenario. The backend owns payment secrets, scenario mapping, and policy execution."
        eyebrow="CONTROLLED SANDBOX EXECUTION"
      />

      {isReadOnly && (
        <div className="panel mb-4" style={{ backgroundColor: 'var(--warning-muted)', borderColor: 'rgba(154, 106, 10, 0.3)' }}>
          <div className="text-label" style={{ color: 'var(--warning)', marginBottom: 'var(--space-1)' }}>Read-Only Safety Lock Active</div>
          <p className="text-secondary text-sm">
            Recovery Lab execution is disabled in public demonstration mode (<code className="mono">APP_ENV=demo_readonly</code>). Run locally to execute real sandbox payments.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="panel mb-4 text-danger fade-in" style={{ backgroundColor: 'var(--danger-muted)', borderColor: 'rgba(166, 58, 46, 0.3)' }}>
          {errorMsg}
        </div>
      )}

      <div className="lab-grid">
        {/* Configuration Panel */}
        <div className="panel">
          <h2 className="title-section mb-4">Configuration</h2>
          
          <div className="mb-4">
            <label className="text-label" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Select Approved Scenario</label>
            {isLoadingScenarios ? (
              <div className="mono text-muted py-4 fade-in">Loading approved sandbox scenarios…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {scenarios.map((s) => {
                  const isSelected = selectedScenarioId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScenarioId(s.id)}
                      className={`scenario-btn ${isSelected ? 'active' : ''}`}
                      disabled={isReadOnly || isRunning}
                    >
                      <div className="mono" style={{ fontWeight: 600 }}>{s.label}</div>
                      <div className="text-caption mt-1">{s.description}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="text-label" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Transaction Amount (₹)</label>
            <input
              type="number"
              min="10"
              max="5000"
              className="lab-input mono"
              value={amountInr}
              onChange={(e) => setAmountInr(Number(e.target.value))}
              disabled={isReadOnly || isRunning}
            />
          </div>

          <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--divider)' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={handleRun}
              disabled={isReadOnly || isRunning || !selectedScenario || !isValidAmount}
            >
              {isRunning ? 'Executing Scenario...' : isReadOnly ? 'Execution Locked' : 'Execute Sandbox Run'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="panel">
          <h2 className="title-section mb-4">Execution Evidence</h2>
          {runResult ? (
            <div className="fade-in">
              <div className="mb-4">
                <div className="text-label mb-2">Outcome</div>
                {runResult.bounded_action?.type === 'abstain' || runResult.guardrail?.result === 'blocked' ? (
                  <ProvenanceChip type="abstained" label="GUARDRAIL ABSTAINED" />
                ) : (
                  <ProvenanceChip type="verified" label="SANDBOX VERIFIED" />
                )}
              </div>
              <div className="mb-4">
                <div className="text-label mb-2">Agent Proposal</div>
                <div className="mono">{runResult.bounded_action?.type || 'None'}</div>
              </div>
              <div className="mb-4">
                <div className="text-label mb-2">Session Identifier</div>
                <div className="mono">{runResult.session_id}</div>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--divider)' }}>
                <Link to={`/replay/${runResult.session_id}`} className="btn btn-secondary">
                  Open full replay trace
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-muted text-center py-4 fade-in">
              Execute a scenario to generate evidence.
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-7)' }}>
        <h2 className="title-section mb-4">Recent Lab Executions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Cart Value</th>
                <th>Failure</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {recentLabRuns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted text-center py-4">No recent lab runs found.</td>
                </tr>
              ) : (
                recentLabRuns.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="mono">{s.id}</div>
                    </td>
                    <td className="mono">₹{s.cart_value}</td>
                    <td className="mono text-muted">{s.initial_status}</td>
                    <td>
                      <Link to={`/replay/${s.id}`} className="btn btn-ghost" style={{ padding: '0 var(--space-2)' }}>Inspect</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
