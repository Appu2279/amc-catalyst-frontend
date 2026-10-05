import { useCallback, useEffect, useState } from 'react';
import { getCurrentLiveExam } from '@/api/liveExamService';

// Shared across every page that asks, so moving around the dashboard does not
// refetch on each navigation. Short-lived: the phase changes on its own as the
// exam opens and closes.
const TTL_MS = 60_000;
let cache = { value: undefined, at: 0, promise: null };

const fetchCurrent = (force) => {
  if (!force && cache.value !== undefined && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.value);
  if (!force && cache.promise) return cache.promise;
  cache.promise = getCurrentLiveExam()
    .then((res) => {
      cache = { value: res.data ?? null, at: Date.now(), promise: null };
      return cache.value;
    })
    .catch(() => {
      cache = { ...cache, promise: null };
      return cache.value ?? null;
    });
  return cache.promise;
};

/** The live exam currently switched on for students, or null when there is none. */
export const useCurrentLiveExam = () => {
  const [exam, setExam] = useState(cache.value);
  const [loading, setLoading] = useState(cache.value === undefined);

  const refresh = useCallback(async (force = true) => {
    const value = await fetchCurrent(force);
    setExam(value);
    setLoading(false);
    return value;
  }, []);

  useEffect(() => { refresh(false); }, [refresh]);

  return { exam, loading, refresh };
};
