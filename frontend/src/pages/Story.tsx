import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api, type Session } from '../lib/api';
import { Play, LayoutDashboard, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Ripple } from '../components/Ripple';
import { KineticText } from '../components/KineticText';
import './Story.css';

gsap.registerPlugin(ScrollTrigger);

const SCENES = [
  {
    step: '01',
    eyebrow: 'Checkout Started',
    title: 'The engine is running.',
    desc: 'A customer enters their details. Revenue flows toward the checkout gateway.',
  },
  {
    step: '02',
    eyebrow: 'Payment Fails',
    title: 'A silent drop-off.',
    desc: 'The gateway declines the transaction. The revenue flow stops abruptly. Without an agent, this customer is lost.',
  },
  {
    step: '03',
    eyebrow: 'Agent Investigates',
    title: 'Gathering context.',
    desc: 'The AI Agent instantly inspects the failure. It looks at the decline reason, customer history, and risk context.',
  },
  {
    step: '04',
    eyebrow: 'Guardrails Decide',
    title: 'Deterministic safety.',
    desc: 'The AI proposes a retry. Hardcoded guardrail rules evaluate the proposal to ensure complete financial safety.',
  },
  {
    step: '05',
    eyebrow: 'Controlled Action',
    title: 'Precision execution.',
    desc: 'If the rules pass, the agent safely executes the single optimal recovery action. No rogue retries.',
  },
  {
    step: '06',
    eyebrow: 'Evidence Recorded',
    title: 'Perfect auditability.',
    desc: 'Every decision, rule evaluation, and recovery outcome is recorded permanently in the sandbox ledger.',
  },
];

export function Story() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeScene, setActiveScene] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const pinContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const seqRef = useRef({ frame: 0 });

  // Load safe demo data
  useEffect(() => {
    api.getAllSessions().then(setSessions).catch(console.error);
  }, []);

  // Find a safe replay ID
  const primaryReplayUrl = useMemo(() => {
    if (!sessions || sessions.length === 0) return '/recovery-queue';
    const successfulRetry = sessions.find(
      s => s.intervention_type === 'retry' && s.intervention_status === 'succeeded'
    );
    if (successfulRetry) return `/replay/${successfulRetry.id}`;
    const anyIntervention = sessions.find(s => Boolean(s.intervention_type));
    if (anyIntervention) return `/replay/${anyIntervention.id}`;
    return '/recovery-queue';
  }, [sessions]);

  // GSAP Canvas Frame Sequence with Pinning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameCount = 300;
    const currentFrame = (index: number) =>
      `/frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

    function render() {
      if (!canvas || !ctx) return;
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(seqRef.current.frame)));
      const img = imagesRef.current[idx];

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.clearRect(0, 0, 1280, 720);
        ctx.drawImage(img, 0, 0, 1280, 720);
      } else {
        // Fallback to nearest loaded frame
        for (let offset = 1; offset < frameCount; offset++) {
          const prev = imagesRef.current[idx - offset];
          if (prev && prev.complete && prev.naturalWidth > 0) {
            ctx.clearRect(0, 0, 1280, 720);
            ctx.drawImage(prev, 0, 0, 1280, 720);
            break;
          }
          const next = imagesRef.current[idx + offset];
          if (next && next.complete && next.naturalWidth > 0) {
            ctx.clearRect(0, 0, 1280, 720);
            ctx.drawImage(next, 0, 0, 1280, 720);
            break;
          }
        }
      }
    }

    // Preload images into persistent ref
    if (imagesRef.current.length === 0) {
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.onload = () => {
          if (i === 1 || i === Math.round(seqRef.current.frame) + 1) {
            render();
          }
        };
        img.src = currentFrame(i);
        imagesRef.current.push(img);
      }
    } else {
      render();
    }

    // Paint initial frame
    requestAnimationFrame(render);
    setTimeout(render, 60);
    setTimeout(render, 200);

    // ScrollTrigger with PINNING
    const st = gsap.to(seqRef.current, {
      frame: frameCount - 1,
      ease: "none",
      scrollTrigger: {
        trigger: pinContainerRef.current,
        pin: true,
        start: "top top",
        end: "+=3600",
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => {
          render();
          const p = self.progress;
          setProgressPercent(Math.round(p * 100));
          const sceneIndex = Math.min(6, Math.max(1, Math.floor(p * 5.99) + 1));
          setActiveScene(sceneIndex);
        },
      },
      onUpdate: render,
    });

    const handleResize = () => {
      ScrollTrigger.refresh();
      render();
    };
    window.addEventListener('resize', handleResize);

    const refreshTimer1 = setTimeout(() => {
      ScrollTrigger.refresh();
      render();
    }, 100);

    const refreshTimer2 = setTimeout(() => {
      ScrollTrigger.refresh();
      render();
    }, 400);

    return () => {
      clearTimeout(refreshTimer1);
      clearTimeout(refreshTimer2);
      window.removeEventListener('resize', handleResize);
      st.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="story-page-wrapper">
      {/* ── SECTION 1: Initial Full-Screen Hero (Only REVORA visible on load) ── */}
      <section className="story-hero-section">
        <Ripple className="story-hero-ripple" mainCircleOpacity={0.4} numCircles={10} mainCircleSize={340} />
        
        <div className="story-hero-container">
          <div className="story-hero-header">
            <KineticText text="REVORA" as="h1" className="story-hero-title" />
            <p className="story-hero-subtitle">Revenue recovery, safely decided.</p>
          </div>

          <div className="story-scroll-prompt">
            <span className="scroll-prompt-text">Scroll to explore</span>
            <ChevronDown size={18} className="scroll-prompt-icon" />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Pinned 300-Frame Scroll Stage (Revealed on scroll) ── */}
      <section className="story-pin-stage" ref={pinContainerRef}>
        <Ripple className="story-stage-ripple" mainCircleOpacity={0.25} numCircles={8} mainCircleSize={280} />

        <div className="story-layout-grid">
          {/* Left Narrative Captions */}
          <div className="story-captions-column">
            <div className="story-progress-indicator">
              <span className="mono-badge">SCENE 0{activeScene} / 06</span>
              <span className="mono-subtle">{progressPercent}%</span>
            </div>

            <div className="story-captions-stack">
              {SCENES.map((scene, idx) => (
                <div
                  key={idx}
                  className={`story-caption-card ${activeScene === idx + 1 ? 'is-active' : ''}`}
                >
                  <div className="scene-eyebrow">{scene.eyebrow}</div>
                  <h2 className="scene-title">{scene.title}</h2>
                  <p className="scene-desc">{scene.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 16:9 Canvas Frame Display */}
          <div className="story-canvas-column">
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} width={1280} height={720} className="sequence-canvas" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Final Section After Scroll Completes ── */}
      <section className="story-footer-section">
        <div className="footer-content">
          <span className="mono-badge">RECOVERY EVIDENCE READY</span>
          <h2 className="footer-title">Checkout recovery without blind retries.</h2>
          <p className="footer-desc">
            The agent proposes. Guardrails decide. Every outcome leaves evidence.
          </p>
          <div className="story-cta-bar">
            <Link to="/overview" className="btn-primary">
              <LayoutDashboard size={16} />
              Explore Console
            </Link>
            <Link to={primaryReplayUrl} className="btn-secondary">
              <Play size={16} />
              Watch Replay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
