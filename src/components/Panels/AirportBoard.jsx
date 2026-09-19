import { useState, useCallback } from 'react';
import { fetchAirportFlights } from '../../services/openskyApi.js';

const POPULAR_AIRPORTS = [
  { icao: 'KJFK', name: 'New York JFK' },
  { icao: 'KLAX', name: 'Los Angeles' },
  { icao: 'EGLL', name: 'London Heathrow' },
  { icao: 'EDDF', name: 'Frankfurt' },
  { icao: 'OMDB', name: 'Dubai' },
  { icao: 'VIDP', name: 'Delhi' },
];

export default function AirportBoard() {
  const [icao, setIcao]         = useState('');
  const [tab, setTab]           = useState('arrivals');
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [searched, setSearched] = useState('');

  const search = useCallback(async (code) => {
    const airport = (code || icao).toUpperCase();
    if (!airport || airport.length < 3) return;
    setLoading(true);
    setError(null);
    setSearched(airport);
    try {
      const res = await fetchAirportFlights(airport, tab);
      setData(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [icao, tab]);

  const handleTabChange = async (t) => {
    setTab(t);
    if (searched) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAirportFlights(searched, t);
        setData(Array.isArray(res) ? res : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Quick select */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
        {POPULAR_AIRPORTS.map(a => (
          <button
            key={a.icao}
            onClick={() => { setIcao(a.icao); search(a.icao); }}
            style={{
              padding: '3px 8px', fontSize: 10, borderRadius: 4,
              border: '1px solid var(--border)',
              background: searched === a.icao ? 'rgba(0,212,255,0.1)' : 'var(--bg-card)',
              color: searched === a.icao ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'var(--text-mono)', letterSpacing: 0.5,
              transition: 'all 0.2s ease',
            }}
          >{a.icao}</button>
        ))}
      </div>

      {/* Manual search */}
      <div className="airport-search">
        <input
          id="airport-search"
          className="airport-input"
          value={icao}
          onChange={e => setIcao(e.target.value.toUpperCase())}
          placeholder="ICAO (e.g. KJFK)"
          maxLength={4}
          onKeyDown={e => e.key === 'Enter' && search()}
          aria-label="Airport ICAO code"
        />
        <button className="airport-btn" onClick={() => search()} disabled={loading}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {/* Tabs */}
      <div className="airport-tabs">
        <div className={`airport-tab ${tab === 'arrivals' ? 'active' : ''}`} onClick={() => handleTabChange('arrivals')}>↓ Arrivals</div>
        <div className={`airport-tab ${tab === 'departures' ? 'active' : ''}`} onClick={() => handleTabChange('departures')}>↑ Departures</div>
      </div>

      {/* Results */}
      <div className="panel-body">
        {!searched && (
          <div className="empty-state">
            <div className="empty-state__icon">🛫</div>
            <div className="empty-state__text">Select an airport above<br/>to view live flights</div>
          </div>
        )}
        {error && (
          <div style={{ padding: 16, color: 'var(--accent-amber)', fontSize: 12 }}>⚠ {error}</div>
        )}
        {!loading && !error && searched && data.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📡</div>
            <div className="empty-state__text">No flights found for {searched}</div>
          </div>
        )}
        {data.map((f, i) => {
          const callsign = (f.callsign || f.icao24 || '---').trim();
          const airport = tab === 'arrivals'
            ? (f.estDepartureAirport || '---')
            : (f.estArrivalAirport || '---');
          const time = f.firstSeen
            ? new Date(f.firstSeen * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
            : '--:--';
          return (
            <div key={`${f.icao24}-${i}`} className="flight-row">
              <span className="flight-row__callsign">{callsign}</span>
              <span className="flight-row__airport">{tab === 'arrivals' ? 'From' : 'To'} {airport}</span>
              <span className="flight-row__time">{time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
