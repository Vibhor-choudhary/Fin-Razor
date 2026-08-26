import { useState, useRef } from 'react';
import { gsap, useGSAP, DURATION, EASE, MOTION_OK } from '../lib/motion';
import './RecoveryFlowDiagram.css';

interface FlowData {
  totalFailed: number;
  proposals: number;
  guardrailEvaluated: number;
  actionsPermitted: number;
  successfulOutcomes: number;
}

interface RecoveryFlowDiagramProps {
  data: FlowData;
}

export function RecoveryFlowDiagram({ data }: RecoveryFlowDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = [
    { id: 1, title: 'Failed Checkout', value: data.totalFailed, desc: 'Initial payment failures caught by the system.' },
    { id: 2, title: 'Agent Proposal', value: data.proposals, desc: 'Agent analyzed context and proposed recovery.' },
    { id: 3, title: 'Guardrail Check', value: data.guardrailEvaluated, desc: 'Deterministic bounds checked the proposal.' },
    { id: 4, title: 'Action Executed', value: data.actionsPermitted, desc: 'Permitted action was triggered.' },
    { id: 5, title: 'Outcome', value: data.successfulOutcomes, desc: 'Recovered checkout or simulated success.' },
  ];

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const flowNodes = containerRef.current?.querySelectorAll('.flow-node');
      const connectors = containerRef.current?.querySelectorAll('.flow-line');
      if (!flowNodes || !connectors) return;

      // Set initial states
      gsap.set(flowNodes, { opacity: 0, scale: 0.96 });
      gsap.set(connectors, { scaleX: 0 });

      // Show the first node immediately
      gsap.to(flowNodes[0], { opacity: 1, scale: 1, duration: 0.25, ease: EASE.reveal });

      // Then animate each connector → node pair sequentially
      const tl = gsap.timeline({ delay: 0.2 });

      for (let i = 0; i < connectors.length; i++) {
        tl.to(connectors[i], {
          scaleX: 1,
          duration: DURATION.slow,
          ease: EASE.inOut,
        });
        tl.to(flowNodes[i + 1], {
          opacity: 1,
          scale: 1,
          duration: 0.25,
          ease: EASE.reveal,
        }, '-=0.1'); // Slight overlap for flow feel
      }
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return (
    <div className="flow-diagram-container" ref={containerRef}>
      <div className="flow-diagram-nodes">
        {nodes.map((node, i) => (
          <div key={node.id} className="flow-node-wrapper">
            <div 
              className={`flow-node`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              tabIndex={0}
              aria-label={`${node.title}: ${node.value}`}
            >
              <div className="flow-node-title">{node.title}</div>
              <div className="flow-node-value mono tabular-nums">{node.value.toLocaleString()}</div>
            </div>
            
            {i < nodes.length - 1 && (
              <div className="flow-connector">
                <div className={`flow-line ${i === 2 && data.actionsPermitted < data.guardrailEvaluated ? 'dashed' : 'solid'}`}></div>
              </div>
            )}
            
            {hoveredNode === node.id && (
              <div className="flow-tooltip" role="tooltip">
                {node.desc}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
