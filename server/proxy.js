import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ID = process.env.OPENSKY_CLIENT_ID;
const CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET;

app.use(cors());
app.use(express.json());

// ── OAuth2 Token Cache ──────────────────────────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 30000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(
    'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    throw new Error(`OAuth2 failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  console.log('[Proxy] New OpenSky token acquired, expires in', data.expires_in, 's');
  return cachedToken;
}

// ── GET /api/states ─────────────────────────────────────────────────
app.get('/api/states', async (req, res) => {
  try {
    const token = await getAccessToken();
    const params = new URLSearchParams();

    // Optional bounding box to reduce payload
    if (req.query.lamin) params.set('lamin', req.query.lamin);
    if (req.query.lomin) params.set('lomin', req.query.lomin);
    if (req.query.lamax) params.set('lamax', req.query.lamax);
    if (req.query.lomax) params.set('lomax', req.query.lomax);

    const url = `https://opensky-network.org/api/states/all${params.toString() ? '?' + params.toString() : ''}`;
    const apiRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `OpenSky error: ${apiRes.status}` });
    }

    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    console.error('[Proxy] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/track ──────────────────────────────────────────────────
app.get('/api/track', async (req, res) => {
  try {
    const token = await getAccessToken();
    const { icao24, time } = req.query;
    if (!icao24) return res.status(400).json({ error: 'icao24 required' });

    const params = new URLSearchParams({ icao24 });
    if (time) params.set('time', time);

    const apiRes = await fetch(
      `https://opensky-network.org/api/tracks/all?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/airport ─────────────────────────────────────────────────
// Proxy to OpenSky airport departures/arrivals
app.get('/api/airport/:type', async (req, res) => {
  try {
    const token = await getAccessToken();
    const { type } = req.params; // 'departures' or 'arrivals'
    const { airport, begin, end } = req.query;

    if (!airport) return res.status(400).json({ error: 'airport ICAO required' });

    const now = Math.floor(Date.now() / 1000);
    const beginTime = begin || now - 7200;
    const endTime = end || now;

    const apiRes = await fetch(
      `https://opensky-network.org/api/flights/${type}?airport=${airport}&begin=${beginTime}&end=${endTime}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🛰️  Flight Radar Proxy running at http://localhost:${PORT}`);
  console.log(`   OpenSky client: ${CLIENT_ID}\n`);
});
