import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, type Session } from '../lib/api';
import './Funnel.css';

export function Funnel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  
  useEffect(() => {
    async function load() {
      try {
        const sRes = await api.getAllSessions();
        setSessions(sRes);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const observed = sessions.length;
    let evaluated = 0;
    let permitted = 0;
    let executed = 0;
    let recoveredRetry = 0;
    let recoveredNudge = 0;
    let abstained = 0;

    sessions.forEach(s => {
      if (s.at_risk && s.intervention_type !== undefined && s.intervention_type !== null) {
        evaluated++;
        const isAbstain = s.intervention_type === 'abstain' || s.intervention_type === 'none' || s.intervention_status === 'rejected';
        
        if (isAbstain) {
          abstained++;
        } else {
          permitted++;
          // In this simplified model, permitted implies executed if outcome exists.
          // We assume any permitted intervention executes.
          if (s.intervention_status) {
            executed++;
            if (s.intervention_status === 'succeeded') {
              if (s.intervention_type === 'retry') recoveredRetry++;
              if (s.intervention_type === 'nudge') recoveredNudge++;
            }
          }
        }
      }
    });

    const totalRecovered = recoveredRetry + recoveredNudge;

    return { observed, evaluated, permitted, executed, recoveredRetry, recoveredNudge, totalRecovered, abstained };
  }, [sessions]);

  return (
    <div className="funnel-container panel slide-up">
      <div className="funnel-header">
        <h2>Recovery Funnel</h2>
        <div className="chip sandbox">HISTORICAL SANDBOX ANALYSIS</div>
      </div>

      <div className="funnel-flow">
        {/* Stage 1: Observed */}
        <div className="funnel-stage">
          <Link to="/recovery-queue" className="stage-card neutral">
            <div className="stage-name">1. Observed Sessions</div>
            <div className="stage-val">{stats.observed}</div>
            <div className="stage-sub">100% of total traffic</div>
          </Link>
        </div>
        <div className="funnel-arrow">↓</div>

        {/* Stage 2: At-risk evaluated */}
        <div className="funnel-stage">
          <Link to="/recovery-queue?at_risk=true" className="stage-card neutral">
            <div className="stage-name">2. At-risk Evaluated</div>
            <div className="stage-val">{stats.evaluated}</div>
            <div className="stage-sub">{stats.observed > 0 ? Math.round(stats.evaluated / stats.observed * 100) : 0}% of observed</div>
          </Link>
          {/* Branch: Abstained */}
          <div className="funnel-branch">
            <div className="branch-line"></div>
            <Link to="/audit-log" className="stage-card gold">
              <div className="stage-name">Guardrail Abstained</div>
              <div className="stage-val">{stats.abstained}</div>
              <div className="stage-sub">Policy blocked / no action</div>
            </Link>
          </div>
        </div>
        <div className="funnel-arrow">↓</div>

        {/* Stage 3: Policy permitted */}
        <div className="funnel-stage">
          <div className="stage-card neutral static">
            <div className="stage-name">3. Policy Permitted</div>
            <div className="stage-val">{stats.permitted}</div>
            <div className="stage-sub">{stats.evaluated > 0 ? Math.round(stats.permitted / stats.evaluated * 100) : 0}% of evaluated</div>
            <Link to="/recovery-queue" className="subtle-link">View in Recovery Queue</Link>
          </div>
        </div>
        <div className="funnel-arrow">↓</div>

        {/* Stage 4: Intervention executed */}
        <div className="funnel-stage">
          <div className="stage-card neutral static">
            <div className="stage-name">4. Intervention Executed</div>
            <div className="stage-val">{stats.executed}</div>
            <div className="stage-sub">{stats.permitted > 0 ? Math.round(stats.executed / stats.permitted * 100) : 0}% of permitted</div>
            <Link to="/recovery-queue" className="subtle-link">View in Recovery Queue</Link>
          </div>
        </div>
        <div className="funnel-arrow">↓</div>

        {/* Stage 5: Recovered */}
        <div className="funnel-stage">
          <div className="stage-card split-stage static">
            <div className="stage-name" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              5. Recovered <br/>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{stats.totalRecovered}</span>
            </div>
            
            <div className="split-cards">
              <div className="mini-card success">
                <div className="stage-val">{stats.recoveredRetry}</div>
                <div className="stage-sub">SANDBOX VERIFIED RETRY</div>
              </div>
              <div className="mini-card simulated">
                <div className="stage-val">{stats.recoveredNudge}</div>
                <div className="stage-sub">SIMULATED NUDGE OUTCOME</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {stats.evaluated === 0 && (
        <div className="funnel-warning">Some sessions remain pending or were not evaluated.</div>
      )}
    </div>
  );
}
