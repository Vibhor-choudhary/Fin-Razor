import './GeometricAnimations.css';

export function TriPanelDiagram() {
  return (
    <div className="geometric-container">
      <div className="tripanel-wrapper">
        
        {/* Radiating Dashed Lines Background */}
        <svg className="tripanel-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="300" x2="1000" y2="300" className="dashed-line" />
          <line x1="500" y1="0" x2="500" y2="600" className="dashed-line" />
          
          <line x1="100" y1="100" x2="900" y2="500" className="dashed-line" />
          <line x1="100" y1="500" x2="900" y2="100" className="dashed-line" />
        </svg>

        <div className="tripanel-grid fade-in">
          
          {/* Left Panel: Testimonials */}
          <div className="tripanel-card">
            <div className="tripanel-card-header">Testimonials</div>
            <div className="tripanel-card-content" style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
              <div className="testimonial-marks mb-4">
                " " " "
              </div>
              <div className="text-sm" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                10x ROAS average,
              </div>
              <div className="text-sm text-muted">
                never below 4x weekly
              </div>
            </div>
          </div>

          {/* Center Panel: Performance */}
          <div className="tripanel-card center">
            <div className="tripanel-card-header">Performance</div>
            <div className="tripanel-card-content">
              <div className="bar-chart">
                <div className="bar" style={{ height: '40%' }}>
                  <div className="bar-dot"></div>
                </div>
                <div className="bar" style={{ height: '80%' }}>
                  <div className="bar-dot"></div>
                </div>
                <div className="bar" style={{ height: '60%' }}>
                  <div className="bar-dot"></div>
                </div>
                <div className="bar" style={{ height: '30%' }}>
                  <div className="bar-dot"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Offer */}
          <div className="tripanel-card">
            <div className="tripanel-card-header">Offer</div>
            <div className="tripanel-card-content">
              <div className="offer-amount">$500</div>
              <div className="offer-label">Ad Credit</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
