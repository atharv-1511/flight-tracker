// In-memory cache for the serverless function execution environment
let cachedToken = null;
let tokenExpiry = 0;

export async function getOpenSkyToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 30000) {
    return cachedToken;
  }

  const CLIENT_ID = process.env.OPENSKY_CLIENT_ID;
  const CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('OpenSky credentials not configured in environment variables.');
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
  
  return cachedToken;
}
