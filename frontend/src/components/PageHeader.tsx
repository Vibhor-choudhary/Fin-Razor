import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, action }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
      <div>
        {eyebrow && <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>{eyebrow}</div>}
        <h1 className="title-page">{title}</h1>
        <p className="text-secondary" style={{ marginTop: 'var(--space-2)', maxWidth: '600px' }}>
          {description}
        </p>
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
}
