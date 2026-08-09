import { useCallback, useEffect, useState } from 'react';
import { fetchLearnDoc, fetchLearnFeed, type LearnFeedFilters } from '@/lib/sanity';
import { fetchCommunityReels } from '@/lib/communityReels';
import type { LearnDoc } from '@/types';

/**
 * Learn feed (Read · Watch) — Sanity for the editorial half, Supabase for what
 * contributors share from inside the app. Optional format/stage filters.
 *
 * The two halves are fetched together and merged by date, so a reel a mom
 * posted this morning sits above one we published last month. Only the Watch
 * feed has a community half; Read is editorial by definition.
 */
export function useLearn(filters: LearnFeedFilters = {}) {
  const [docs, setDocs] = useState<LearnDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${filters.format ?? ''}|${filters.babyStage ?? ''}`;
  const wantsReels = filters.format === undefined || filters.format === 'learnReel';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Settled, not all: Sanity being unreachable shouldn't blank the reels a
      // mom posted, and vice versa. A half-feed beats an error screen.
      const [editorial, community] = await Promise.allSettled([
        fetchLearnFeed(filters),
        wantsReels ? fetchCommunityReels(filters.babyStage) : Promise.resolve([]),
      ]);

      const merged: LearnDoc[] = [
        ...(editorial.status === 'fulfilled' ? editorial.value ?? [] : []),
        ...(community.status === 'fulfilled' ? community.value : []),
      ].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

      setDocs(merged);

      if (editorial.status === 'rejected' && community.status === 'rejected') {
        setError('failed to load learn feed');
      }
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
