import { useMemo } from 'react';

const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'Germany': '🇩🇪', 'United Kingdom': '🇬🇧',
  'France': '🇫🇷', 'China': '🇨🇳', 'Russia': '🇷🇺', 'Canada': '🇨🇦',
  'Australia': '🇦🇺', 'Japan': '🇯🇵', 'Brazil': '🇧🇷', 'India': '🇮🇳',
  'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱', 'Turkey': '🇹🇷',
  'United Arab Emirates': '🇦🇪', 'Saudi Arabia': '🇸🇦', 'South Korea': '🇰🇷',
  'Singapore': '🇸🇬', 'Mexico': '🇲🇽', 'Unknown': '🌐',
};

function getFlag(country) {
  return COUNTRY_FLAGS[country] || '🌐';
}

export default function StatsPanel({ stats, flights }) {
  const airborne = stats.total - stats.onGround;

  const topCountries = useMemo(() => {
    return Object.entries(stats.countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [stats.countries]);

  const maxCount = topCountries[0]?.[1] || 1;

  const topAltitude = useMemo(() => {
    return [...flights]
      .filter(f => !f.onGround && f.altitudeFt > 0)
      .sort((a, b) => b.altitudeFt - a.altitudeFt)
      .slice(0, 3);
  }, [flights]);

  const avgSpeed = useMemo(() => {
    const airFlights = flights.filter(f => !f.onGround && f.speedKts > 0);
    if (!airFlights.length) return 0;
    return Math.round(airFlights.reduce((s, f) => s + f.speedKts, 0) / airFlights.length);
  }, [flights]);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value">{stats.total.toLocaleString()}</div>
          <div className="stat-card__label">Total Tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{airborne.toLocaleString()}</div>
          <div className="stat-card__label">Airborne</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.onGround.toLocaleString()}</div>
          <div className="stat-card__label">On Ground</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{avgSpeed}</div>
          <div className="stat-card__label">Avg Speed (kts)</div>
        </div>
      </div>

      {/* Top altitude */}
      {topAltitude.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 8 }}>Highest Flights</div>
          {topAltitude.map((f, i) => (
            <div key={f.icao24} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(0,180,255,0.05)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 14 }}>#{i+1}</span>
              <span style={{ fontFamily: 'var(--text-mono)', fontSize: 12, color: 'var(--accent-cyan)', flex: 1 }}>{f.callsign}</span>
              <span style={{ fontFamily: 'var(--text-mono)', fontSize: 12, color: 'var(--text-primary)' }}>{f.altitudeFt.toLocaleString()} ft</span>
            </div>
          ))}
        </div>
      )}

      {/* Countries */}
      <div className="country-list">
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 8 }}>Top Countries</div>
        {topCountries.map(([country, count]) => (
          <div key={country} className="country-item">
            <span className="country-item__flag">{getFlag(country)}</span>
            <span className="country-item__name">{country}</span>
            <div className="country-item__bar-wrap">
              <div className="country-item__bar" style={{ width: `${(count / maxCount) * 100}%` }} />
            </div>
            <span className="country-item__count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
