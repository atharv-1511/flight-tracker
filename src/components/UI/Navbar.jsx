import { useState, useEffect } from 'react';

export default function Navbar({ stats, lastUpdated, loading }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__logo">
        <div className="navbar__logo-icon">✈</div>
        <span className="navbar__logo-text">FlightRadar</span>
      </div>

      <div className="navbar__spacer" />

      <div className="navbar__stats">
        <div className="navbar__stat">
          <div className="navbar__stat-value">
            {loading ? '…' : stats.total.toLocaleString()}
          </div>
          <div className="navbar__stat-label">Live Flights</div>
        </div>
        <div className="navbar__divider" />
        <div className="navbar__stat">
          <div className="navbar__stat-value">
            {loading ? '…' : (stats.total - stats.onGround).toLocaleString()}
          </div>
          <div className="navbar__stat-label">Airborne</div>
        </div>
        <div className="navbar__divider" />
        <div className="navbar__stat">
          <div className="navbar__stat-value">
            {loading ? '…' : Object.keys(stats.countries).length}
          </div>
          <div className="navbar__stat-label">Countries</div>
        </div>
        <div className="navbar__divider" />
        <div className="navbar__stat">
          <div className="navbar__stat-value" style={{ fontSize: '13px', color: 'var(--accent-cyan)' }}>
            {timeStr}
          </div>
          <div className="navbar__stat-label">Local Time</div>
        </div>
      </div>

      <div className="navbar__divider" />

      <div className="live-indicator">
        <span className="live-dot" />
        LIVE
      </div>
    </nav>
  );
}
