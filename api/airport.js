import { getOpenSkyToken } from './_auth.js';

export default async function handler(req, res) {
  try {
    const token = await getOpenSkyToken();
    const { type, airport, begin, end } = req.query;

    if (!type || !['departures', 'arrivals'].includes(type)) {
      return res.status(400).json({ error: 'type must be departures or arrivals' });
    }
    if (!airport) return res.status(400).json({ error: 'airport ICAO required' });

    const now = Math.floor(Date.now() / 1000);
    const beginTime = begin || now - 7200;
    const endTime = end || now;

    const apiRes = await fetch(
      `https://opensky-network.org/api/flights/${type}?airport=${airport}&begin=${beginTime}&end=${endTime}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `OpenSky airport lookup failed: ${apiRes.status}` });
    }
    const data = await apiRes.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // cache for 60 seconds
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
