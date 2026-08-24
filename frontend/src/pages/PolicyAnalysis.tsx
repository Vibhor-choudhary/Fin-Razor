import { useEffect, useState, useMemo } from 'react';
import { api, type Session } from '../lib/api';
import './PolicyAnalysis.css';

export function PolicyAnalysis() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local analytical state
  const [confThreshold, setConfThreshold] = useState<number>(0.60);
  const [cooldown, setCooldown] = useState<number>(60);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAllSessions();
        setSessions(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { coverageStats, calibrationBins } = useMemo(() => {
    let recordedProposals = 0;
    let meetingCoverage = 0;
    let excludedCoverage = 0;
    let historicalRetained = 0;
    
    // Feature 8: Confidence Calibration Bins
    const bins = {
      '0.60-0.69': { total: 0, succeeded: 0, failed: 0, rejected: 0, abstain: 0, verified: 0, simulated: 0 },
      '0.70-0.79': { total: 0, succeeded: 0, failed: 0, rejected: 0, abstain: 0, verified: 0, simulated: 0 },
      '0.80-0.89': { total: 0, succeeded: 0, failed: 0, rejected: 0, abstain: 0, verified: 0, simulated: 0 },
      '0.90-1.00': { total: 0, succeeded: 0, failed: 0, rejected: 0, abstain: 0, verified: 0, simulated: 0 },
    };

    sessions.forEach(s => {
      const conf = s.confidence ?? 0;
      
      if (s.intervention_type && s.intervention_type !== 'none') {
        recordedProposals++;
        
        const meetsConf = conf >= confThreshold;
        const meetsCooldown = true; 
        
        if (meetsConf && meetsCooldown) {
          meetingCoverage++;
          if (s.intervention_status === 'succeeded') historicalRetained++;
        } else {
          excludedCoverage++;
        }
        
        // Calibration
        if (conf > 0 && s.intervention_type !== 'abstain') {
          let bucket = '';
          if (conf >= 0.60 && conf < 0.70) bucket = '0.60-0.69';
          else if (conf >= 0.70 && conf < 0.80) bucket = '0.70-0.79';
          else if (conf >= 0.80 && conf < 0.90) bucket = '0.80-0.89';
          else if (conf >= 0.90) bucket = '0.90-1.00';
          
          if (bucket) {
            const b = bins[bucket as keyof typeof bins];
            b.total++;
            if (s.intervention_status === 'succeeded') {
              b.succeeded++;
              if (s.intervention_type === 'retry') b.verified++;
              if (s.intervention_type === 'nudge') b.simulated++;
            }
            if (s.intervention_status === 'failed') b.failed++;
            if (s.intervention_status === 'rejected') b.rejected++;
          }
        }
      }
    });

    return {
      coverageStats: { recordedProposals, meetingCoverage, excludedCoverage, historicalRetained },
      calibrationBins: Object.entries(bins).map(([label, data]) => ({ label, ...data }))
    };
  }, [sessions, confThreshold, cooldown]);

  if (loading) return <div className="loader">Loading analysis...</div>;

  return (
    <div className="policy-analysis-container slide-up">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Policy Coverage Explorer</h1>
        <div className="methodology">
          POLICY COVERAGE ANALYSIS · NOT A REVENUE FORECAST
        </div>
      </div>

      <div className="pa-layout">
        <div className="pa-controls panel">
          <div className="chip sandbox" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>DOES NOT CHANGE LIVE POLICY</div>
          
          <div className="control-group">
            <label>Confidence Threshold: {confThreshold.toFixed(2)}</label>
            <input 
              type="range" 
              min="0.50" 
              max="0.95" 
              step="0.05" 
              value={confThreshold}
              onChange={e => setConfThreshold(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="control-group">
            <label>Freshness Cooldown</label>
            <select 
              className="btn" 
              style={{ width: '100%' }}
              value={cooldown}
              onChange={e => setCooldown(parseInt(e.target.value))}
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds (Default)</option>
              <option value={120}>120 seconds</option>
              <option value={300}>300 seconds</option>
            </select>
          </div>

          <div className="locked-rules">
            <h4 className="mono">LOCKED CONSTANTS</h4>
            <ul>
              <li>Retry allowlist</li>
              <li>One-action limit</li>
              <li>Amount immutability</li>
              <li>Completed-payment exclusion</li>
            </ul>
          </div>
        </div>

        <div className="pa-results">
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <div className="pa-stats-grid">
              <div className="stat-box">
                <div className="stat-label mono">RECORDED PROPOSALS</div>
                <div className="stat-val">{coverageStats.recordedProposals}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label mono">MEETING COVERAGE</div>
                <div className="stat-val" style={{ color: 'var(--accent)' }}>{coverageStats.meetingCoverage}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label mono">EXCLUDED BY COVERAGE</div>
                <div className="stat-val" style={{ color: 'var(--warning)' }}>{coverageStats.excludedCoverage}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label mono">HISTORICAL ACTIONS RETAINED</div>
                <div className="stat-val">{coverageStats.historicalRetained}</div>
              </div>
            </div>

            <div className="coverage-bar-container">
              <div 
                className="coverage-bar-fill" 
                style={{ width: `${coverageStats.recordedProposals > 0 ? (coverageStats.meetingCoverage / coverageStats.recordedProposals) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="comparison-table" style={{ marginTop: '2rem' }}>
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Current Default</th>
                    <th>Analytical Setting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Confidence</td>
                    <td>0.60</td>
                    <td>{confThreshold.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Cooldown</td>
                    <td>60s</td>
                    <td>{cooldown}s (Sensitivity unavailable)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="methodology" style={{ marginTop: '1.5rem', background: 'transparent', padding: 0 }}>
              This replays eligibility over recorded evidence. It does not predict what customers would have done under a different policy.
            </p>
          </div>

          {/* Feature 8: Confidence Calibration */}
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Confidence Calibration</h2>
              <div className="chip sandbox">EXPLORATORY SANDBOX BATCH · NOT A PRODUCTION CALIBRATION CLAIM</div>
            </div>

            <table className="calibration-table">
              <thead>
                <tr>
                  <th>Confidence Bin</th>
                  <th>Total Interventions</th>
                  <th>Successful Outcomes</th>
                  <th>Unrecovered (Fail/Reject)</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {calibrationBins.map(bin => {
                  const unrecovered = bin.failed + bin.rejected;
                  const rate = bin.total > 0 ? ((bin.succeeded / bin.total) * 100).toFixed(1) + '%' : '—';
                  
                  return (
                    <tr key={bin.label}>
                      <td className="mono" style={{ fontWeight: 'bold' }}>{bin.label}</td>
                      <td>{bin.total === 0 ? '—' : bin.total}</td>
                      <td>
                        {bin.succeeded === 0 ? '—' : (
                          <div>
                            <div>{bin.succeeded}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                              {bin.verified > 0 && <span style={{ color: 'var(--accent)' }}>{bin.verified} verified</span>}
                              {bin.simulated > 0 && <span style={{ color: 'var(--simulated)' }}>{bin.simulated} simulated</span>}
                            </div>
                          </div>
                        )}
                      </td>
                      <td>{unrecovered === 0 && bin.total === 0 ? '—' : unrecovered}</td>
                      <td style={{ fontWeight: 'bold' }}>{rate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
