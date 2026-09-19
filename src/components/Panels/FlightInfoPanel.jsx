export default function FlightInfoPanel({ flight, onClose }) {
  if (!flight) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="empty-state__icon">🛩</div>
        <div className="empty-state__text">Click a flight on the map<br/>to view details</div>
      </div>
    );
  }

  const headingDeg = flight.trueTrack || 0;
  const vRate = flight.verticalRate || 0;
  const vRateStr = vRate > 0.5 ? `↑ ${Math.round(vRate * 196.85)} fpm` : vRate < -0.5 ? `↓ ${Math.abs(Math.round(vRate * 196.85))} fpm` : '→ Level';
  const vRateColor = vRate > 0.5 ? 'var(--accent-green)' : vRate < -0.5 ? 'var(--accent-red)' : 'var(--accent-cyan)';

  return (
    <div className="flight-info">
      <div className="flight-info__header">
        <div>
          <div className="flight-info__callsign">{flight.callsign}</div>
          <div className="flight-info__country">🌍 {flight.originCountry}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <span className={`badge ${flight.onGround ? 'badge-amber' : 'badge-green'}`}>
            {flight.onGround ? '🛬 Ground' : '✈ Airborne'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
              aria-label="Close panel"
            >×</button>
          )}
        </div>
      </div>

      {/* Compass */}
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
        <div className="compass">
          <span className="compass__n">N</span>
          <div
            className="compass__needle"
            style={{ transform: `translateX(-50%) translateY(-100%) rotate(${headingDeg}deg)` }}
          />
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          {Math.round(headingDeg)}° HDG
        </div>
      </div>

      {/* Data grid */}
      <div className="flight-info__grid">
        <div className="info-card">
          <div className="info-card__label">Altitude</div>
          <div className="info-card__value">
            {flight.altitudeFt > 0 ? flight.altitudeFt.toLocaleString() : '—'}
            <span className="info-card__unit">ft</span>
          </div>
        </div>
        <div className="info-card">
          <div className="info-card__label">Speed</div>
          <div className="info-card__value">
            {flight.speedKts || '—'}
            <span className="info-card__unit">kts</span>
          </div>
        </div>
        <div className="info-card">
          <div className="info-card__label">Vert. Rate</div>
          <div className="info-card__value" style={{ fontSize: 13, color: vRateColor }}>
            {vRateStr}
          </div>
        </div>
        <div className="info-card">
          <div className="info-card__label">Squawk</div>
          <div className="info-card__value" style={{ fontSize: 16 }}>
            {flight.squawk || '—'}
          </div>
        </div>
      </div>

      {/* ICAO */}
      <div className="info-card" style={{ marginBottom: 8 }}>
        <div className="info-card__label">ICAO24</div>
        <div style={{ fontFamily: 'var(--text-mono)', fontSize: 13, color: 'var(--accent-cyan)', letterSpacing: 2 }}>
          {flight.icao24.toUpperCase()}
        </div>
      </div>

      {/* Position */}
      <div className="info-card">
        <div className="info-card__label">Position</div>
        <div style={{ fontFamily: 'var(--text-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          {flight.latitude?.toFixed(4)}° N<br/>
          {flight.longitude?.toFixed(4)}° E
        </div>
      </div>

      {flight.lastContact && (
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          Last contact: {new Date(flight.lastContact * 1000).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
