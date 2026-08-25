

interface CohortComparisonProps {
  controlConversion: number;
  agentConversion: number;
  lift: number;
}

export function CohortComparison({ controlConversion, agentConversion, lift }: CohortComparisonProps) {
  const controlPct = (controlConversion * 100).toFixed(1);
  const agentPct = (agentConversion * 100).toFixed(1);
  const diffSign = lift > 0 ? '+' : '';
  const diffDisplay = `${diffSign}${(lift * 100).toFixed(1)} pp`;

  // Determine scaling so max bar is 100% of container width, minimum 5% for visibility if 0
  const maxVal = Math.max(controlConversion, agentConversion, 0.01);
  const controlWidth = `${Math.max((controlConversion / maxVal) * 100, 2)}%`;
  const agentWidth = `${Math.max((agentConversion / maxVal) * 100, 2)}%`;

  return (
    <div className="admin-panel cohort-panel">
      <div className="panel-header">
        <h3 className="panel-title">Recorded cohort comparison</h3>
        <span className="panel-subtitle mono">Sandbox evaluation batch</span>
      </div>

      <div className="cohort-chart" role="region" aria-label="Control vs Agent conversion comparison">
        <div className="chart-row">
          <div className="chart-label mono">
            <span>Control Group</span>
            <span className="chart-value">{controlPct}%</span>
          </div>
          <div className="chart-bar-container">
            <div className="chart-bar bar-control" style={{ width: controlWidth }} aria-label={`Control conversion: ${controlPct}%`} />
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-label mono">
            <span>Agent Treatment</span>
            <span className="chart-value text-green">{agentPct}%</span>
          </div>
          <div className="chart-bar-container">
            <div className="chart-bar bar-agent" style={{ width: agentWidth }} aria-label={`Agent conversion: ${agentPct}%`} />
          </div>
        </div>
      </div>

      <div className="cohort-footer">
        <div className="lift-badge mono">Difference: <strong className="text-green">{diffDisplay}</strong></div>
        <p className="cohort-note text-muted">This is an evaluation-batch comparison, not a production forecast.</p>
      </div>
    </div>
  );
}
