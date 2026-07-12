import { useCallback, useEffect, useState } from 'react';
import { fetchLearnDoc, fetchLearnFeed, type LearnFeedFilters } from '@/lib/sanity';
import type { LearnDoc } from '@/types';

/** Learn feed (Read · Watch · Recco) from Sanity. Optional format/stage filters. */
export function useLearn(filters: LearnFeedFilters = {}) {
  const [docs, setDocs] = useState<LearnDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${filters.format ?? ''}|${filters.babyStage ?? ''}`;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLearnFeed(filters);
      setDocs(result ?? []);
    } catch (e: any) {
      setError(e.message ?? 'failed to load learn feed');
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { docs, loading, error, refresh };
}

/** Single Learn document by Sanity _id. */
export function useLearnDoc(id: string | undefined) {
  const [doc, setDoc] = useState<LearnDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchLearnDoc(id)
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e.message ?? 'failed to load doc');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { doc, loading, error };
}
