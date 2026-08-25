
import { Link } from 'react-router-dom';
import type { Log } from '../lib/api';

interface RecentActivityProps {
  logs: Log[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <div className="admin-panel activity-panel">
      <div className="panel-header">
        <h3 className="panel-title">Recent recorded activity</h3>
        <span className="panel-subtitle mono">Sandbox simulation</span>
      </div>

      <div className="activity-list">
        {logs.length === 0 ? (
          <div className="text-muted mono text-sm p-4">Evidence unavailable</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="activity-item">
              <div className="activity-indicator"></div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className="mono font-bold text-sm">{log.type.toUpperCase()}</span>
                  {log.applied_at && (
                    <span className="mono text-xs text-muted">
                      {new Date(log.applied_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="activity-details mono text-xs">
                  <span>ID: {log.session_id}</span>
                  <span className="mx-2">·</span>
                  <span className={log.outcome === 'succeeded' ? 'text-green' : 'text-gold'}>
                    OUTCOME: {log.outcome.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="activity-actions">
                <Link to={`/replay/${log.session_id}`} className="btn-outline text-xs">Replay</Link>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="panel-footer">
        <Link to="/logs" className="btn-ghost text-xs">View full audit log</Link>
      </div>
    </div>
  );
}
