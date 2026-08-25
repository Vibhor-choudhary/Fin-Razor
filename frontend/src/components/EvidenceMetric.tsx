import type { ReactNode } from 'react';

interface EvidenceMetricProps {
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
  highlight?: boolean;
  alert?: boolean;
  children?: ReactNode;
}

export function EvidenceMetric({ label, value, subtitle, highlight, alert, children }: EvidenceMetricProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-label mono">{label}</div>
      <div className={`metric-card-value ${highlight ? 'text-green' : ''} ${alert ? 'text-gold' : ''}`}>
        {value}
      </div>
      {subtitle && <div className="metric-card-sub text-muted">{subtitle}</div>}
      {children && <div className="metric-card-extra">{children}</div>}
    </div>
  );
}
