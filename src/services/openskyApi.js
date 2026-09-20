const API_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/**
 * Fetch all live state vectors from the OpenSky proxy.
 * @param {Object} bbox - Optional bounding box { lamin, lomin, lamax, lomax }
 */
async function readApiError(res) {
  try {
    const errBody = await res.json();
    if (errBody?.error) return errBody.error;
  } catch (_) {
    // Ignore JSON parsing failures and fall back to the status code.
  }

  return `Request failed with status ${res.status}`;
}

export async function fetchStates(bbox = null) {
  let url = `${API_URL}/states`;
  if (bbox) {
    const params = new URLSearchParams({
      lamin: bbox.lamin,
      lomin: bbox.lomin,
      lamax: bbox.lamax,
      lomax: bbox.lomax,
    });
    url += `?${params.toString()}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const errMsg = await readApiError(res);
    throw new Error(errMsg);
  }
  const data = await res.json();
  return parseStates(data);
}

/**
 * Parse raw OpenSky state vector array into a clean object.
 * Fields: [icao24, callsign, origin_country, time_position, last_contact,
 *          longitude, latitude, baro_altitude, on_ground, velocity,
 *          true_track, vertical_rate, sensors, geo_altitude, squawk,
 *          spi, position_source]
 */
function parseStates(raw) {
  if (!raw || !raw.states) return [];
  return raw.states
    .filter(s => s[5] !== null && s[6] !== null) // must have position
    .map(s => ({
      icao24:        s[0],
      callsign:      (s[1] || '').trim() || s[0].toUpperCase(),
      originCountry: s[2],
      timePosition:  s[3],
      lastContact:   s[4],
      longitude:     s[5],
      latitude:      s[6],
      baroAltitude:  s[7],        // meters
      onGround:      s[8],
      velocity:      s[9],        // m/s
      trueTrack:     s[10],       // degrees clockwise from north
      verticalRate:  s[11],       // m/s
      geoAltitude:   s[13],       // meters
      squawk:        s[14],
      // Derived
      altitudeFt:    s[7] ? Math.round(s[7] * 3.28084) : 0,
      speedKts:      s[9] ? Math.round(s[9] * 1.94384) : 0,
    }));
}

/**
 * Fetch flights for a specific airport (arrivals or departures).
 */
export async function fetchAirportFlights(icao, type = 'arrivals') {
  const res = await fetch(`${API_URL}/airport?type=${type}&airport=${icao.toUpperCase()}`);
  if (!res.ok) throw new Error(`Airport fetch error: ${res.status}`);
  return res.json();
}
