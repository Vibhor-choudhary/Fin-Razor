import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';

/**
 * Direct entry wrapper for /replay:
 * Automatically resolves the latest recovery or intervention session
 * and routes to /replay/:id. If no sessions exist, routes to /recovery-queue.
 */
export function ReplayRedirect() {
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    async function resolveSession() {
      try {
        const sessions = await api.getAllSessions();
        if (sessions && sessions.length > 0) {
          // 1. Prioritize a successful recovery replay
          const successful = sessions.find(
            s => s.intervention_type === 'retry' && s.intervention_status === 'succeeded'
          );
          if (successful) {
            setTargetUrl(`/replay/${successful.id}`);
            return;
          }

          // 2. Prioritize any session with an intervention
          const withIntervention = sessions.find(s => Boolean(s.intervention_type));
          if (withIntervention) {
            setTargetUrl(`/replay/${withIntervention.id}`);
            return;
          }

          // 3. Fallback to the first available session
          setTargetUrl(`/replay/${sessions[0].id}`);
          return;
        }
      } catch (err) {
        console.error('Failed to resolve replay session:', err);
      }
      // Fallback if no sessions exist
      setTargetUrl('/recovery-queue');
    }
    resolveSession();
  }, []);

  if (!targetUrl) {
    return (
      <div style={{ padding: '48px 32px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        Loading session replay trace...
      </div>
    );
  }

  return <Navigate to={targetUrl} replace />;
}
