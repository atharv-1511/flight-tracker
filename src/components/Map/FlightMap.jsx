import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';

// ── Aircraft SVG icon factory ────────────────────────────────────────
function createPlaneIcon(heading = 0, isSelected = false, onGround = false) {
  const color = onGround
    ? '#f59e0b'
    : isSelected
    ? '#00d4ff'
    : '#7dd3fc';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
         style="transform: rotate(${heading}deg); filter: drop-shadow(0 0 ${isSelected ? 6 : 2}px ${color})">
      <path d="M12 2L8 9H3l4 3-1.5 6L12 15l6.5 3L17 12l4-3h-5z"
            fill="${color}" opacity="${onGround ? 0.6 : 0.95}" />
    </svg>`;

  return divIcon({
    html: svg,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    tooltipAnchor: [14, 0],
  });
}

// ── Fly-to selected flight ─────────────────────────────────────────
function FlyToFlight({ flight }) {
  const map = useMap();
  const prev = useRef(null);

  useEffect(() => {
    if (!flight) return;
    const key = flight.icao24;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo([flight.latitude, flight.longitude], Math.max(map.getZoom(), 7), {
      duration: 1.2,
    });
  }, [flight, map]);

  return null;
}

// ── Viewport Tracker ───────────────────────────────────────────────
function BoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds(), map.getZoom()),
    zoomend: () => onBoundsChange(map.getBounds(), map.getZoom()),
  });

  useEffect(() => {
    onBoundsChange(map.getBounds(), map.getZoom());
  }, [map, onBoundsChange]);

  return null;
}

// ── Main Map Component ─────────────────────────────────────────────
export default function FlightMap({ flights, selectedFlight, onFlightSelect }) {
  // Standard Free OSM Map (Dark mode handled via CSS invert filter)
  const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTR    = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(3);

  const handleBoundsChange = useCallback((newBounds, newZoom) => {
    setBounds(newBounds);
    setZoom(newZoom);
  }, []);

  // Filter flights by viewport to prevent lag
  const visibleFlights = useMemo(() => {
    if (!bounds || !flights) return [];
    
    let visible = flights.filter(f => {
      if (!f.latitude || !f.longitude) return false;
      return bounds.contains([f.latitude, f.longitude]);
    });

    // If zoomed far out, limit to 400 markers to maintain 60FPS
    if (visible.length > 400) {
      // Prioritize airborne and faster flights when culling
      visible = visible.sort((a, b) => b.speedKts - a.speedKts).slice(0, 400);
    }
    
    // Always ensure selected flight is visible even if culled
    if (selectedFlight && !visible.some(f => f.icao24 === selectedFlight.icao24)) {
      visible.push(selectedFlight);
    }

    return visible;
  }, [flights, bounds, selectedFlight]);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[20, 0]}
        zoom={3}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
        preferCanvas={true}
      >
        <TileLayer url={TILE_URL} attribution={ATTR} maxZoom={19} />
        <FlyToFlight flight={selectedFlight} />
        <BoundsTracker onBoundsChange={handleBoundsChange} />

        {visibleFlights.map(flight => {
          const isSelected = selectedFlight?.icao24 === flight.icao24;
          return (
            <Marker
              key={flight.icao24}
              position={[flight.latitude, flight.longitude]}
              icon={createPlaneIcon(flight.trueTrack || 0, isSelected, flight.onGround)}
              eventHandlers={{
                click: () => onFlightSelect(flight),
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Tooltip
                className="flight-tooltip"
                direction="right"
                offset={[14, 0]}
              >
                <div style={{ lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--text-mono)' }}>
                    {flight.callsign}
                  </strong>
                  <br />
                  <span style={{ color: 'var(--text-secondary)' }}>{flight.originCountry}</span>
                  <br />
                  <span style={{ fontFamily: 'var(--text-mono)', fontSize: 11 }}>
                    {flight.altitudeFt > 0 ? `${flight.altitudeFt.toLocaleString()} ft` : 'Ground'}
                    {' · '}
                    {flight.speedKts} kts
                  </span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
