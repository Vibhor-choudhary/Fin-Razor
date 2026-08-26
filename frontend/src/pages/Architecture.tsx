import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, Database, BrainCircuit, ShieldCheck, Activity, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import './Architecture.css';

interface NodeData {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  enters: string;
  leaves: string;
  stored: string;
  safety: string;
  links: { label: string; to: string }[];
  boundary?: 'real' | 'simulated';
}

const NODES: NodeData[] = [
  {
    id: 'hyperswitch',
    title: 'Hyperswitch Sandbox',
    subtitle: 'Real test payment creation, confirmation, status and decline data',
    icon: Server,
    boundary: 'real',
    enters: 'API requests to create payments or execute retries.',
    leaves: 'Raw JSON payloads with terminal statuses (succeeded, failed).',
    stored: 'Nothing stored internally here; belongs to external sandbox.',
    safety: 'Operates entirely on test credentials. No live money.',
    links: [],
  },
  {
    id: 'store',
    title: 'Event Store',
    subtitle: 'SQLite sessions and events; raw payment responses retained for audit',
    icon: Database,
    enters: 'Raw webhook-like payloads and poll results.',
    leaves: 'Structured session history for the agent and console.',
    stored: 'Sessions, events, interventions, and raw payloads.',
    safety: 'No card PANs or PII persisted. Secrets isolated.',
    links: [{ label: 'Audit Log', to: '/audit-log' }],
  },
  {
    id: 'agent',
    title: 'Upsonic Agent',
    subtitle: 'Structured proposal: retry, nudge, or none',
    icon: BrainCircuit,
    boundary: 'simulated',
    enters: 'Parsed session state and observed errors.',
    leaves: 'A proposed action (retry/nudge/none) and reasoning string.',
    stored: 'Intervention proposal record.',
    safety: 'Cannot execute actions directly. Cannot invent new action types.',
    links: [],
  },
  {
    id: 'guardrails',
    title: 'Deterministic Guardrails',
    subtitle: 'Code-enforced allowlist, thresholds, cooldown, one-action limit',
    icon: ShieldCheck,
    enters: 'LLM proposal and historical session state.',
    leaves: 'Approval to execute OR a rejection/abstention outcome.',
    stored: 'Final intervention status (succeeded/failed/rejected).',
    safety: 'One safe action maximum. Amount cannot be changed.',
    links: [{ label: 'Policy Studio', to: '/policy' }]
  },
  {
    id: 'intervention',
    title: 'Bounded Intervention',
    subtitle: 'One sandbox retry or one modeled nudge; no amount changes',
    icon: Activity,
    enters: 'Approved action payload.',
    leaves: 'API call to Hyperswitch (retry) OR simulated customer response (nudge).',
    stored: 'Nothing new stored here; updates Event Store.',
    safety: 'Strict timeout and error catching.',
    links: [],
  },
  {
    id: 'console',
    title: 'Merchant Console & Audit',
    subtitle: 'Recovery queue, replay, policy visibility, and audit trail',
    icon: LayoutDashboard,
    enters: 'Aggregated analytics and session logs.',
    leaves: 'Read-only UI views.',
    stored: 'Browser local state only.',
    safety: 'No POST/PUT endpoints. Data is strictly read-only.',
    links: [
      { label: 'Overview', to: '/' },
      { label: 'Recovery Replay', to: '/recovery-queue' }
    ]
  }
];

export function Architecture() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedNode = selectedIndex !== null ? NODES[selectedIndex] : null;

  return (
    <div className="fade-in">
      <PageHeader 
        title="Architecture" 
        description="Explore the strict data flow boundaries between the agent, guardrails, and execution engine."
        eyebrow="SYSTEM DOCUMENTATION"
      />

      <div className="architecture-layout">
        {/* Nodes Grid */}
        <div className="architecture-grid">
          {NODES.map((node, i) => (
            <div 
              key={node.id} 
              className={`arch-node-card panel ${selectedIndex === i ? 'active' : ''}`}
              onClick={() => setSelectedIndex(i === selectedIndex ? null : i)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedIndex(i === selectedIndex ? null : i); }}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                  <node.icon size={20} />
                </div>
                <div>
                  <h3 className="text-label m-0">{node.title}</h3>
                  {node.boundary === 'real' && <div className="mono text-caption text-success mt-1">SANDBOX VERIFIED</div>}
                  {node.boundary === 'simulated' && <div className="mono text-caption text-simulated mt-1">SIMULATED DATA</div>}
                </div>
              </div>
              <p className="text-secondary text-sm mt-3 m-0">{node.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="architecture-detail">
          {selectedNode ? (
            <div className="panel fade-in sticky-detail">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div className="arch-icon-box">
                  <selectedNode.icon size={24} />
                </div>
                <h2 className="title-section m-0">{selectedNode.title}</h2>
              </div>
              
              <div className="arch-detail-list">
                <div className="arch-detail-item">
                  <div className="text-label mb-1">Inputs</div>
                  <div className="text-secondary text-sm">{selectedNode.enters}</div>
                </div>
                <div className="arch-detail-item">
                  <div className="text-label mb-1">Outputs</div>
                  <div className="text-secondary text-sm">{selectedNode.leaves}</div>
                </div>
                <div className="arch-detail-item">
                  <div className="text-label mb-1">Storage</div>
                  <div className="text-secondary text-sm">{selectedNode.stored}</div>
                </div>
                <div className="arch-detail-item">
                  <div className="text-label mb-1">Safety Constraints</div>
                  <div className="text-secondary text-sm" style={{ color: 'var(--warning)' }}>{selectedNode.safety}</div>
                </div>
              </div>

              {selectedNode.links.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--divider)' }}>
                  <div className="text-label mb-3">Related Views</div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {selectedNode.links.map(link => (
                      <Link key={link.to} to={link.to} className="btn btn-secondary">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel empty-detail-panel fade-in">
              <div className="text-muted mono text-center">Select a component to inspect data flow and safety constraints.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
