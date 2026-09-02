import { useCallback, useEffect, useState } from 'react';
import { getMyAccess } from '@/api/userService';

/**
 * What the signed-in student may open.
 *
 * Returns `sections` as an object keyed by every section the backend knows
 * about, so a page asks `sections.qbank` without keeping its own copy of the
 * key list. Until the request settles, `loading` is true and every section
 * reads false — pages must render a loading state rather than a locked one, or
 * a paying student sees a paywall flash on every page load.
 *
 * Deliberately not cached across pages: it is one small request, and a student
 * who has just been approved should see the change on their next navigation
 * rather than after a hard refresh.
 */
export const useAccess = () => {
  const [sections, setSections] = useState({});
  const [samples, setSamples] = useState({});
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAccess();
      setSections(res.data?.sections ?? {});
      setSamples(res.data?.samples ?? {});
      setSubscriptions(res.data?.subscriptions ?? []);
    } catch {
      // A failure here must not unlock anything: leaving sections empty means
      // the page shows locked, which is the safe direction. The gated endpoint
      // would refuse anyway.
      setSections({});
      setSamples({});
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sections, samples, subscriptions, loading, reload: load };
};
