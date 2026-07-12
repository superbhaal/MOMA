import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { SavedDocType, SavedTip } from '@/types';

/** Bookmarks across Read / Watch / Recco. */
export function useSavedTips() {
  const { user } = useAuth();
  const [tips, setTips] = useState<SavedTip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('saved_tips')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });
    setTips((data ?? []) as SavedTip[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSaved = useCallback(
    (sanityDocId: string) => tips.some((t) => t.sanity_doc_id === sanityDocId),
    [tips],
  );

  const toggle = useCallback(
    async (sanityDocId: string, docType: SavedDocType) => {
      if (!user) return;
      const existing = tips.find((t) => t.sanity_doc_id === sanityDocId);

      if (existing) {
        // Optimistic remove
        setTips((cur) => cur.filter((t) => t.id !== existing.id));
        const { error } = await supabase.from('saved_tips').delete().eq('id', existing.id);
        if (error) refresh();
      } else {
        const tmpId = 'tmp-' + Math.random().toString(36).slice(2);
        const optimistic: SavedTip = {
          id: tmpId,
          user_id: user.id,
          sanity_doc_id: sanityDocId,
          doc_type: docType,
          saved_at: new Date().toISOString(),
        };
        setTips((cur) => [optimistic, ...cur]);
        const { data, error } = await supabase
          .from('saved_tips')
          .insert({ user_id: user.id, sanity_doc_id: sanityDocId, doc_type: docType })
          .select('*')
          .maybeSingle();
        if (error || !data) refresh();
        else setTips((cur) => cur.map((t) => (t.id === tmpId ? (data as SavedTip) : t)));
      }
    },
    [user?.id, tips, refresh],
  );

  return { tips, loading, refresh, isSaved, toggle };
}
