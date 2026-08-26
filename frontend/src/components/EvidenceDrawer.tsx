import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { ProvenanceChip } from './ProvenanceChip';
import { gsap, useGSAP, EASE, MOTION_OK } from '../lib/motion';
import './EvidenceDrawer.css';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  sessionId?: string;
  provenanceType?: 'verified' | 'simulated' | 'abstained' | 'enforced' | 'danger';
  provenanceLabel?: string;
  outcome?: string;
  children: ReactNode;
}

export function EvidenceDrawer({
  isOpen,
  onClose,
  title = "Evidence Record",
  sessionId,
  provenanceType,
  provenanceLabel,
  outcome,
  children
}: EvidenceDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // GSAP entrance animation
  useGSAP(() => {
    if (!isOpen || !overlayRef.current || !contentRef.current) return;

    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      // Scrim fade
      gsap.fromTo(overlayRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: EASE.reveal }
      );

      // Desktop: slide from right; Mobile: slide from bottom
      const isMobile = window.innerWidth <= 900;
      const prop = isMobile ? 'y' : 'x';
      const from = isMobile ? '100%' : '100%';

      gsap.fromTo(contentRef.current,
        { [prop]: from },
        { [prop]: 0, duration: 0.32, ease: EASE.reveal }
      );
    });

    // If reduced motion, content is already at rest position (CSS defaults)

    return () => mm.revert();
  }, { dependencies: [isOpen] });

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" ref={overlayRef}>
      <div className="drawer-content" onClick={e => e.stopPropagation()} ref={contentRef}>
        <div className="drawer-header">
          <div>
            <h2 className="title-section">{title}</h2>
            {sessionId && <div className="mono text-muted" style={{ marginTop: 'var(--space-1)' }}>{sessionId}</div>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>
        
        {(provenanceType || outcome) && (
          <div className="drawer-meta">
            {provenanceType && provenanceLabel && (
              <ProvenanceChip type={provenanceType} label={provenanceLabel} />
            )}
            {outcome && <span className="drawer-outcome">{outcome}</span>}
          </div>
        )}
        
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </div>
  );
}
