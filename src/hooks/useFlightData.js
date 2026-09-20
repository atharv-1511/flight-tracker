import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchStates } from '../services/openskyApi.js';

const POLL_INTERVAL = 12000; // 12 seconds (OpenSky rate limits)

export function useFlightData() {
  const [flights, setFlights]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats]           = useState({ total: 0, onGround: 0, countries: {} });
  
  const intervalRef                 = useRef(null);
  const mountedRef                  = useRef(true);
  const baseFlightsRef              = useRef([]);
  const lastFetchTimeRef            = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchStates();
      if (!mountedRef.current) return;

      baseFlightsRef.current = data;
      lastFetchTimeRef.current = Date.now();
      
      setFlights(data);
      setError(null);
      setLastUpdated(new Date());

      // Compute stats
      const countries = {};
      let onGround = 0;
      data.forEach(f => {
        if (f.onGround) onGround++;
        const c = f.originCountry || 'Unknown';
        countries[c] = (countries[c] || 0) + 1;
      });

      setStats({ total: data.length, onGround, countries });
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Interpolation Engine (Runs at ~10 FPS for buttery smooth real-time movement)
  useEffect(() => {
    let animationFrame;
    let lastRenderTime = 0;

    const renderLoop = (time) => {
      // Throttle to roughly 10 FPS to save CPU while still looking buttery smooth
      if (time - lastRenderTime > 100) {
        lastRenderTime = time;

        if (baseFlightsRef.current.length > 0 && lastFetchTimeRef.current > 0) {
          const deltaSecs = (Date.now() - lastFetchTimeRef.current) / 1000;
          
          const interpolated = baseFlightsRef.current.map(f => {
            if (f.onGround || !f.speedKts || f.trueTrack == null || !f.latitude || !f.longitude) {
              return f;
            }
            
            // Physics math for interpolation
            const speedMs = f.speedKts * 0.514444; // knots to m/s
            const headingRad = f.trueTrack * (Math.PI / 180);
            
            const deltaYMs = speedMs * Math.cos(headingRad) * deltaSecs;
            const deltaXMs = speedMs * Math.sin(headingRad) * deltaSecs;
            
            const latRad = f.latitude * (Math.PI / 180);
            const latDegPerM = 1 / 111320;
            const lonDegPerM = 1 / (111320 * Math.cos(latRad));
            
            return {
              ...f,
              latitude: f.latitude + (deltaYMs * latDegPerM),
              longitude: f.longitude + (deltaXMs * lonDegPerM),
            };
          });
          
          setFlights(interpolated);
        }
      }
      animationFrame = requestAnimationFrame(renderLoop);
    };

    animationFrame = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return { flights, loading, error, lastUpdated, stats, refetch: fetchData };
}
