import { useState, useEffect } from 'react';
import { getEateriesData, getNearestEateriesWithFallback } from '../utils/nearbyEateries';
import type { EateryResult } from '../utils/nearbyEateries';

interface UseNearbyEateriesResult {
  eateries: EateryResult | null;
  loading: boolean;
  error: Error | null;
}

export function useNearbyEateries(lat: number | undefined, lon: number | undefined, limit = 5): UseNearbyEateriesResult {
  const [eateries, setEateries] = useState<EateryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (lat === undefined || lon === undefined) {
      setEateries(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getEateriesData()
      .then(() => {
        if (isMounted) {
          const result = getNearestEateriesWithFallback(lat, lon, limit);
          setEateries(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error fetching eateries:", err);
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [lat, lon, limit]);

  return { eateries, loading, error };
}
