import { useState, useMemo } from 'react';

export default function SearchBar({ flights, onSelect }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toUpperCase();
    return flights
      .filter(
        f =>
          f.callsign.toUpperCase().includes(q) ||
          f.icao24.toUpperCase().includes(q) ||
          f.originCountry.toUpperCase().includes(q)
      )
      .slice(0, 6);
  }, [query, flights]);

  return (
    <div className="search-bar" role="search">
      <input
        id="flight-search"
        className="search-bar__input"
        type="text"
        placeholder="Search callsign, ICAO, country…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Search flights"
      />
      <span className="search-bar__icon">🔍</span>
      {results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 16,
            right: 16,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-bright)',
            borderRadius: 'var(--radius-md)',
            zIndex: 2000,
            overflow: 'hidden',
            boxShadow: 'var(--glow-cyan)',
          }}
        >
          {results.map(f => (
            <div
              key={f.icao24}
              className="flight-item"
              onClick={() => {
                onSelect(f);
                setQuery('');
              }}
            >
              <span className="flight-item__icon">✈</span>
              <div className="flight-item__info">
                <div className="flight-item__callsign">{f.callsign}</div>
                <div className="flight-item__country">{f.originCountry}</div>
              </div>
              <div className="flight-item__altitude">
                <div className="flight-item__alt-value">{f.altitudeFt.toLocaleString()}</div>
                <div className="flight-item__alt-label">ft</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
