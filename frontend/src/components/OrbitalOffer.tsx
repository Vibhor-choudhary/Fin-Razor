import './GeometricAnimations.css';

interface OrbitalOfferProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  caption?: string;
}

export function OrbitalOffer({
  title = "Recovery",
  subtitle = "Lift",
  buttonText = "Execute Strategy",
  caption = "When you process payments. Terms apply."
}: OrbitalOfferProps) {
  return (
    <div className="geometric-container">
      <div className="orbital-wrapper">
        
        <svg className="orbital-svg" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          {/* Horizontal Axis */}
          <line x1="50" y1="400" x2="750" y2="400" className="dashed-line" />
          <rect x="42" y="396" width="8" height="8" className="orbit-handle" />
          <rect x="750" y="396" width="8" height="8" className="orbit-handle" />

          {/* Group that spins slowly clockwise */}
          <g className="spin-slow" style={{ transformOrigin: '400px 400px' }}>
            <ellipse cx="400" cy="400" rx="200" ry="300" className="solid-line" transform="rotate(45 400 400)" />
          </g>

          {/* Group that spins slowly counter-clockwise */}
          <g className="spin-slow-reverse" style={{ transformOrigin: '400px 400px' }}>
            <ellipse cx="400" cy="400" rx="300" ry="200" className="dashed-line" transform="rotate(-30 400 400)" />
            {/* Markers on the dashed orbit */}
            <circle cx="165" cy="235" r="5" className="orbit-handle" />
            <circle cx="635" cy="565" r="5" className="orbit-handle" />
          </g>
        </svg>

        <div className="orbital-center-content fade-in">
          <div className="orbital-title">{title}</div>
          <div className="orbital-subtitle">{subtitle}</div>
          
          <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '32px' }}>
            {buttonText}
          </button>
          
          <div className="orbital-caption">
            {caption}
          </div>
        </div>

      </div>
    </div>
  );
}
