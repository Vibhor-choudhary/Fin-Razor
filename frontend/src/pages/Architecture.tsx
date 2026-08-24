import { Link } from 'react-router-dom';
import { Server, Database, BrainCircuit, ShieldCheck, Activity, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useGuidedTrace } from '../hooks/useGuidedTrace';
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
  note?: string;
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
    note: 'Hyperswitch payment rail events are sandbox-real.'
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
    note: 'Raw payload retained; not exposed to UI.'
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
    note: 'Agent reasoning and nudge outcomes are deterministic simulations.'
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
  const {
    selectedIndex,
    selectItem: setSelectedIndex,
    containerRef
  } = useGuidedTrace({ totalItems: NODES.length, initialIndex: 0 });
  
  const selectedNode = NODES[selectedIndex];
  const selectedId = selectedNode.id;

  return (
    <div className="arch-container slide-up" ref={containerRef as React.RefObject<HTMLDivElement>}>
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Architecture Explorer</h1>
        <div className="methodology">
          HISTORICAL SANDBOX ANALYSIS — System flow and safety boundaries. Click nodes to inspect connectors and data paths.
        </div>
      </div>

      <div className="arch-layout">
        <div className="arch-flow panel">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const isSelected = selectedId === node.id;
            const isPathActive = selectedIndex === i;
            return (
              <div key={node.id} className="arch-step-wrapper">
                <button 
                  className={`arch-node ${isSelected ? 'selected' : ''} ${node.boundary === 'real' ? 'boundary-real' : node.boundary === 'simulated' ? 'boundary-simulated' : ''}`}
                  onClick={() => setSelectedIndex(i)}
                  aria-pressed={isSelected}
                >
                  <Icon className="node-icon" size={24} />
                  <div className="node-text">
                    <div className="node-title">{node.title}</div>
                    <div className="node-subtitle">{node.subtitle}</div>
                  </div>
                </button>
                
                {i === 3 && ( // Between Guardrails and Intervention
                  <div className="arch-edge-badge">
                    <div className="chip provenance-enforced">One safe action maximum</div>
                  </div>
                )}
                
                {i < NODES.length - 1 && (
                  <ArrowRight
                    className={`arch-arrow ${isPathActive ? 'active-path' : ''}`}
                    size={20}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="arch-drawer panel">
          {selectedNode && (
            <div className="drawer-content slide-up" key={selectedNode.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <selectedNode.icon size={24} style={{ color: 'var(--accent)' }} />
                <h2 style={{ margin: 0 }}>{selectedNode.title}</h2>
              </div>
              
              {selectedNode.boundary === 'real' && <div className="chip sandbox" style={{ marginBottom: '1rem', display: 'inline-block' }}>REAL SANDBOX RAILS</div>}
              {selectedNode.boundary === 'simulated' && <div className="chip provenance-simulated" style={{ marginBottom: '1rem', display: 'inline-block' }}>DETERMINISTIC SIMULATION</div>}
              
              <div className="drawer-section">
                <h4>What Enters</h4>
                <p>{selectedNode.enters}</p>
              </div>
              <div className="drawer-section">
                <h4>What Leaves</h4>
                <p>{selectedNode.leaves}</p>
              </div>
              <div className="drawer-section">
                <h4>What Is Stored</h4>
                <p>{selectedNode.stored}</p>
              </div>
              <div className="drawer-section">
                <h4>Safety Invariant</h4>
                <p>{selectedNode.safety}</p>
              </div>

              {selectedNode.note && (
                <div className="drawer-note">
                  {selectedNode.note}
                </div>
              )}

              {selectedNode.links.length > 0 && (
                <div className="drawer-links">
                  {selectedNode.links.map(l => (
                    <Link key={l.to} to={l.to} className="btn">
                      View {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
