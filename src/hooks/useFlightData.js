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

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchStates();
      if (!mountedRef.current) return;

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

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { flights, loading, error, lastUpdated, stats, refetch: fetchData };
}
