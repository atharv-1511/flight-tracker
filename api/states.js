import { getOpenSkyToken } from './_auth.js';

export default async function handler(req, res) {
  try {
    const token = await getOpenSkyToken();
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
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate'); // cache for 10 seconds
    res.status(200).json(data);
  } catch (err) {
    console.error('[API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
