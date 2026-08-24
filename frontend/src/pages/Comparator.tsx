import { useEffect, useState } from 'react';
import { api, type Session, type SessionDetailResponse } from '../lib/api';
import { Link } from 'react-router-dom';
import './Comparator.css';
import { ArrowLeftRight } from 'lucide-react';

export function Comparator() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedA, setSelectedA] = useState<string>('');
  const [selectedB, setSelectedB] = useState<string>('');
  
  const [detailA, setDetailA] = useState<SessionDetailResponse | null>(null);
  const [detailB, setDetailB] = useState<SessionDetailResponse | null>(null);
  
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    async function loadList() {
      try {
        const sRes = await api.getAllSessions();
        const eligible = sRes.filter(s => s.intervention_type);
        setSessions(eligible);
        
        if (eligible.length > 0) {
          const recovered = eligible.find(s => s.intervention_status === 'succeeded' && s.intervention_type === 'retry');
          const fixture = eligible.find(s => s.id.includes('guardrail_test'));
          
          if (recovered && fixture) {
            setSelectedA(recovered.id);
            setSelectedB(fixture.id);
          } else if (eligible.length >= 2) {
            setSelectedA(eligible[0].id);
            setSelectedB(eligible[1].id);
          } else {
            setSelectedA(eligible[0].id);
            setSelectedB(eligible[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingList(false);
      }
    }
    loadList();
  }, []);

  useEffect(() => {
    async function loadDetail(id: string, setDetail: (d: SessionDetailResponse | null) => void) {
      if (!id) return;
      try {
        const d = await api.getSession(id);
        setDetail(d);
      } catch (e) {
        console.error(e);
      }
    }
    loadDetail(selectedA, setDetailA);
  }, [selectedA]);

  useEffect(() => {
    async function loadDetail(id: string, setDetail: (d: SessionDetailResponse | null) => void) {
      if (!id) return;
      try {
        const d = await api.getSession(id);
        setDetail(d);
      } catch (e) {
        console.error(e);
      }
    }
    loadDetail(selectedB, setDetailB);
  }, [selectedB]);

  const swap = () => {
    const temp = selectedA;
    setSelectedA(selectedB);
    setSelectedB(temp);
  };

  if (loadingList) return <div className="loader">Loading comparator...</div>;
  if (sessions.length < 2) {
    return (
      <div className="panel empty-state-panel">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Insufficient Comparison Sessions</h2>
        <p style={{ color: 'var(--fg-muted)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
          At least two decision-bearing sessions are required to perform a side-by-side policy differential analysis.
        </p>
        <Link to="/recovery-queue" className="btn">
          View Recovery Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="comparator-container slide-up">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Session Comparator</h1>
        <div className="methodology">
          HISTORICAL REPLAY · READ ONLY — Compare bounded action vs abstention boundaries.
        </div>
      </div>

      <div className="compare-controls panel">
        <div className="select-col">
          <label className="mono">SESSION A</label>
          <select className="btn" value={selectedA} onChange={e => setSelectedA(e.target.value)}>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
          </select>
        </div>
        
        <button className="btn swap-btn" onClick={swap} title="Swap Sessions">
          <ArrowLeftRight size={20} />
        </button>

        <div className="select-col">
          <label className="mono">SESSION B</label>
          <select className="btn" value={selectedB} onChange={e => setSelectedB(e.target.value)}>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
          </select>
        </div>
      </div>

      <div className="compare-grid">
        <SessionColumn detail={detailA} label="A" />
        <SessionColumn detail={detailB} label="B" />
      </div>

      <div className="panel why-differ" style={{ marginTop: '2rem' }}>
        <h3>Why they differ</h3>
        <DifferencePanel detailA={detailA} detailB={detailB} />
      </div>
    </div>
  );
}

function SessionColumn({ detail, label }: { detail: SessionDetailResponse | null, label: string }) {
  if (!detail) return <div className="panel comp-col loader">Loading {label}...</div>;
  const { session, intervention } = detail;
  const isFixture = session.id.includes('guardrail_test');

  return (
    <div className="panel comp-col">
      <h3 className="mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        SESSION {label}
        {isFixture && <span className="chip provenance-abstained" style={{ fontSize: '0.6rem' }}>FIXTURE</span>}
      </h3>
      <div className="comp-row">
        <span className="comp-label mono">ID</span>
        <span className="comp-val">{session.id}</span>
      </div>
      <div className="comp-row">
        <span className="comp-label mono">Signal / Error</span>
        <span className="comp-val">{session.latest_error_code || session.initial_status}</span>
      </div>
      <div className="comp-row">
        <span className="comp-label mono">Proposed Action</span>
        <span className="comp-val">{intervention?.type || 'none'}</span>
      </div>
      <div className="comp-row">
        <span className="comp-label mono">Confidence</span>
        <span className="comp-val">{intervention?.confidence_score || '—'}</span>
      </div>
      <div className="comp-row">
        <span className="comp-label mono">Guardrail Result</span>
        <span className="comp-val">
          {intervention?.outcome === 'rejected' || intervention?.type === 'abstain' ? 'REJECTED/ABSTAINED' : 'ALLOWED'}
        </span>
      </div>
      <div className="comp-row">
        <span className="comp-label mono">Outcome</span>
        <span className={`comp-val ${intervention?.outcome === 'succeeded' ? 'success' : intervention?.outcome === 'rejected' ? 'error' : ''}`}>
          {intervention?.outcome.toUpperCase() || '—'}
        </span>
      </div>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <Link to={`/replay/${session.id}`} className="btn" style={{ fontSize: '0.8rem', background: 'var(--bg-hover)' }}>View Replay</Link>
        <Link to={`/sessions/${session.id}`} className="btn" style={{ fontSize: '0.8rem', background: 'var(--bg-hover)' }}>View Details</Link>
      </div>
    </div>
  );
}

function DifferencePanel({ detailA, detailB }: { detailA: SessionDetailResponse | null, detailB: SessionDetailResponse | null }) {
  if (!detailA || !detailB) return <div>Loading...</div>;
  const a = detailA;
  const b = detailB;

  const diffs = [];
  
  const errA = a.session.latest_error_code || a.session.initial_status;
  const errB = b.session.latest_error_code || b.session.initial_status;
  if (errA !== errB) diffs.push(`Different error/signal state: A observed '${errA}', B observed '${errB}'.`);

  const confA = a.intervention?.confidence_score || 0;
  const confB = b.intervention?.confidence_score || 0;
  if (confA !== confB) diffs.push(`Different model confidence: A = ${confA}, B = ${confB}.`);

  const typeA = a.intervention?.type;
  const typeB = b.intervention?.type;
  if (typeA !== typeB) diffs.push(`Different proposed action: A proposed '${typeA}', B proposed '${typeB}'.`);

  const outA = a.intervention?.outcome;
  const outB = b.intervention?.outcome;
  if (outA !== outB) diffs.push(`Different recorded outcome: A recorded '${outA}', B recorded '${outB}'.`);

  if (diffs.length === 0) {
    return <p>Difference requires manual audit; stored evidence is incomplete or sessions are identical.</p>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.5', color: 'var(--fg-muted)' }}>
      {diffs.map((d, i) => <li key={i}>{d}</li>)}
    </ul>
  );
}
