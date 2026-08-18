import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  // The reading language is part of the query, not a caller's concern: every
  // screen that lists Learn content wants it in the language she reads.
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] ?? 'en';
  const [docs, setDocs] = useState<LearnDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `lang` joins the key so switching language refetches instead of showing
  // the previous language's cached feed.
  const key = `${filters.format ?? ''}|${filters.babyStage ?? ''}|${lang}`;
  const wantsReels = filters.format === undefined || filters.format === 'learnReel';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Settled, not all: Sanity being unreachable shouldn't blank the reels a
      // mom posted, and vice versa. A half-feed beats an error screen.
      const [editorial, community] = await Promise.allSettled([
        fetchLearnFeed({ ...filters, lang }),
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
