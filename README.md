# Flight Tracker

Real-time aircraft tracking dashboard built with Vite + React and a separate OpenSky API proxy.

## Local development

1. Copy `.env.example` to `.env`
2. Set your local API endpoint:
   - `VITE_API_BASE_URL=http://localhost:3001/api`
3. Start the proxy server:
   - `npm run proxy`
4. Start the frontend:
   - `npm run dev`

## Production deployment

When the frontend is hosted separately from the backend, set `VITE_API_BASE_URL` to your hosted API base URL such as:

- `https://your-backend-url/api`

This lets the frontend call the backend without being tied to the Vercel serverless route.

## Backend requirements

The hosted API should expose:

- `GET /api/states`
- `GET /api/airport`
- `GET /api/track`

The backend is responsible for authenticating with OpenSky and forwarding the data to the frontend.
