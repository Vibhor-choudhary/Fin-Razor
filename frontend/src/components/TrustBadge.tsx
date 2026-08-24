import { useEffect, useState } from 'react';
import { api, type Session } from '../lib/api';
import './TrustBadge.css';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TrustBadge() {
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

  if (loading) return null;

  // Evaluate trust checks
  let partial = false;
  let violations = 0;

  sessions.forEach(s => {
    if (!s.intervention_type || s.intervention_type === 'none' || s.intervention_type === 'abstain') {
      return;
    }

    // 1. More than one action on a session? Cannot definitively prove without full event log, but we assume 1 stored intervention = 1 action.
    // If the schema only holds one intervention_type per session, we assume 0 violations here, but mark partial because we can't see the full array.
    partial = true; 

    // 2. Retry on a non-allowlisted error.
    if (s.intervention_type === 'retry' && s.latest_error_code !== 'DC_08') {
      violations++;
    }

    // 3. Retry amount different from original cart amount.
    // We only have cart_value, we don't have intervention amount stored on session.
    partial = true;

    // 4. Action on a succeeded session.
    if (s.initial_status === 'succeeded') {
      violations++;
    }

    // 5. Action inside the freshness cooldown.
    // We don't have explicit timestamps for all events in this summary payload, only created_at.
    partial = true;
  });

  return (
    <Link to="/policy" className={`trust-badge ${violations > 0 ? 'error' : partial ? 'partial' : 'success'}`}>
      {violations > 0 ? (
        <ShieldAlert size={14} />
      ) : (
        <ShieldCheck size={14} />
      )}
      <div className="trust-badge-text">
        <div className="trust-badge-title">
          {violations > 0 ? `POLICY VIOLATIONS · ${violations}` : partial ? 'POLICY CHECKS · PARTIAL' : 'POLICY VIOLATIONS · 0'}
        </div>
        <div className="trust-badge-sub">
          {violations > 0 
            ? 'Violations detected in batch' 
            : partial 
              ? 'Insufficient data to prove all invariants' 
              : 'No recorded policy violations in this sandbox batch.'}
        </div>
      </div>
    </Link>
  );
}
