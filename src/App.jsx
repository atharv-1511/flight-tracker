import { useState, useMemo } from 'react';
import Navbar from './components/UI/Navbar.jsx';
import SearchBar from './components/UI/SearchBar.jsx';
import FlightMap from './components/Map/FlightMap.jsx';
import FlightInfoPanel from './components/Panels/FlightInfoPanel.jsx';
import StatsPanel from './components/Panels/StatsPanel.jsx';
import AirportBoard from './components/Panels/AirportBoard.jsx';
import ATCPlayer from './components/ATC/ATCPlayer.jsx';
import { useFlightData } from './hooks/useFlightData.js';

export default function App() {
  const { flights, loading, error, lastUpdated, stats } = useFlightData();
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [leftTab, setLeftTab]               = useState('flights'); // 'flights' | 'stats'
  const [rightTab, setRightTab]             = useState('info');    // 'info' | 'airport'

  // Filtered flight list for sidebar
  const filteredFlights = useMemo(() => {
    if (!searchQuery.trim()) return flights;
    const q = searchQuery.toUpperCase();
    return flights.filter(
      f =>
        f.callsign.toUpperCase().includes(q) ||
        f.icao24.toUpperCase().includes(q) ||
        f.originCountry.toUpperCase().includes(q)
    );
  }, [flights, searchQuery]);

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
    setRightTab('info');
  };

  return (
    <>
      {/* Navbar */}
      <Navbar stats={stats} lastUpdated={lastUpdated} loading={loading} />

      {/* Main 3-column layout */}
      <div className="app-layout">

        {/* ── Left Sidebar ───────────────────────────────── */}
        <aside className="sidebar-left" aria-label="Flight list">
          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {[
              { id: 'flights', label: '✈ Flights' },
              { id: 'stats',   label: '📊 Stats' },
            ].map(t => (
              <div
                key={t.id}
                className={`airport-tab ${leftTab === t.id ? 'active' : ''}`}
                onClick={() => setLeftTab(t.id)}
                style={{ flex: 1 }}
              >
                {t.label}
              </div>
            ))}
          </div>

          {leftTab === 'flights' ? (
            <>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <SearchBar
                  flights={flights}
                  onSelect={handleFlightSelect}
                />
              </div>

              {/* Flight list header */}
              <div className="panel-header">
                <span className="panel-header__icon">📡</span>
                <span className="panel-header__title">Live Aircraft</span>
                <span className="panel-header__count">{filteredFlights.length}</span>
              </div>

              {/* Flight list */}
              <div className="panel-body">
                {loading && (
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="loading-skeleton" style={{ height: 40, borderRadius: 6 }} />
                    ))}
                  </div>
                )}

                {error && (
                  <div style={{ padding: 16 }}>
                    <div style={{
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 8, padding: 12, color: 'var(--accent-red)', fontSize: 12, lineHeight: 1.5,
                    }}>
                      <strong>⚠ API Error</strong><br />
                      {error}<br />
                      <span style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Ensure your Railway backend is deployed and VITE_API_BASE_URL is set in Vercel (then redeploy), OR set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET on Vercel and redeploy.
                      </span>
                    </div>
                  </div>
                )}

                {!loading && !error && filteredFlights.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state__icon">📡</div>
                    <div className="empty-state__text">No flights found</div>
                  </div>
                )}

                {filteredFlights.slice(0, 200).map(flight => (
                  <div
                    key={flight.icao24}
                    id={`flight-item-${flight.icao24}`}
                    className={`flight-item ${selectedFlight?.icao24 === flight.icao24 ? 'active' : ''}`}
                    onClick={() => handleFlightSelect(flight)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Flight ${flight.callsign}`}
                    onKeyDown={e => e.key === 'Enter' && handleFlightSelect(flight)}
                  >
                    <span
                      className="flight-item__icon"
                      style={{ transform: `rotate(${(flight.trueTrack || 0) - 45}deg)` }}
                    >
                      ✈
                    </span>
                    <div className="flight-item__info">
                      <div className="flight-item__callsign">{flight.callsign}</div>
                      <div className="flight-item__country">{flight.originCountry}</div>
                    </div>
                    <div className="flight-item__altitude">
                      <div className="flight-item__alt-value">
                        {flight.onGround ? '—' : flight.altitudeFt.toLocaleString()}
                      </div>
                      <div className="flight-item__alt-label">
                        {flight.onGround ? 'GND' : 'ft'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="panel-header">
                <span className="panel-header__icon">📊</span>
                <span className="panel-header__title">Live Statistics</span>
              </div>
              <div className="panel-body">
                <StatsPanel stats={stats} flights={flights} />
              </div>
            </>
          )}
        </aside>

        {/* ── Map ───────────────────────────────────────── */}
        <main className="map-container" aria-label="Flight map">
          {/* Map controls overlay */}
          <div className="map-controls">
            <div
              className="map-control-btn"
              title="Zoom In"
              onClick={() => {}}
              style={{ cursor: 'default' }}
            >🔍</div>
          </div>

          {/* Status bar */}
          {lastUpdated && (
            <div style={{
              position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-glass)', backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)', borderRadius: 100,
              padding: '4px 16px', fontSize: 11, color: 'var(--text-muted)',
              zIndex: 1000, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              {flights.length.toLocaleString()} aircraft · Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          <FlightMap
            flights={flights}
            selectedFlight={selectedFlight}
            onFlightSelect={handleFlightSelect}
          />
        </main>

        {/* ── Right Sidebar ──────────────────────────────── */}
        <aside className="sidebar-right" aria-label="Flight details">
          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {[
              { id: 'info',    label: '🛩 Details' },
              { id: 'airport', label: '🛫 Airport' },
            ].map(t => (
              <div
                key={t.id}
                className={`airport-tab ${rightTab === t.id ? 'active' : ''}`}
                onClick={() => setRightTab(t.id)}
                style={{ flex: 1 }}
              >
                {t.label}
              </div>
            ))}
          </div>

          {rightTab === 'info' ? (
            <>
              <div className="panel-header">
                <span className="panel-header__icon">🛩</span>
                <span className="panel-header__title">
                  {selectedFlight ? selectedFlight.callsign : 'Flight Details'}
                </span>
              </div>
              <div className="panel-body">
                <FlightInfoPanel
                  flight={selectedFlight}
                  onClose={() => setSelectedFlight(null)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="panel-header">
                <span className="panel-header__icon">🛫</span>
                <span className="panel-header__title">Airport Board</span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                <AirportBoard />
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ATC Audio Player — floating */}
      <ATCPlayer />
    </>
  );
}
