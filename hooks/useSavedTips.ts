import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { SavedDocType, SavedTip } from '@/types';

/**
 * What she has liked, across articles, reels, places and regulars.
 *
 * These used to accumulate into a shelf on her profile. That list only grew,
 * and Maria asked for it to go: liking now filters where she is already
 * browsing — a heart beside the search on each Discover tab.
 *
 * The state is one shared store rather than per-hook: Discover and Me each
 * mount their own copy of this hook, and Me stays mounted in the tab navigator
 * forever. With local state, hearting an article in Discover left Me showing
 * the list it had fetched at launch — which read as "saving is broken", and was
 * reported as exactly that.
 */
interface SavedTipsState {
  tips: SavedTip[];
  loading: boolean;
  /** Whose tips are in `tips` — refetch when the account changes. */
  userId: string | null;
  set: (fn: (cur: SavedTip[]) => SavedTip[]) => void;
  load: (userId: string) => Promise<void>;
}

const useStore = create<SavedTipsState>((set, get) => ({
  tips: [],
  loading: true,
  userId: null,
  set: (fn) => set({ tips: fn(get().tips) }),
  load: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('saved_tips')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    set({ tips: (data ?? []) as SavedTip[], loading: false, userId });
  },
}));

export function useSavedTips() {
  const { user } = useAuth();
  const { tips, loading, userId, set, load } = useStore();

  // Fetch once per account. Every other instance reads the same store, so a
  // heart tapped anywhere is visible everywhere without a refetch.
  useEffect(() => {
    if (user && userId !== user.id) load(user.id);
  }, [user?.id, userId, load]);

  const refresh = async () => {
    if (user) await load(user.id);
  };

  const isSaved = (itemId: string) => tips.some((t) => t.item_id === itemId);

  /** `title` is still snapshotted: the shelf is gone, but a saved row that
   *  names nothing is unreadable in the admin and in any export. */
  const toggle = async (itemId: string, docType: SavedDocType, title?: string) => {
    if (!user) return;
    const existing = tips.find((t) => t.item_id === itemId);

    if (existing) {
      set((cur) => cur.filter((t) => t.id !== existing.id));
      const { error } = await supabase.from('saved_tips').delete().eq('id', existing.id);
      if (error) refresh();
    } else {
      const tmpId = 'tmp-' + Math.random().toString(36).slice(2);
      set((cur) => [
        {
          id: tmpId,
          user_id: user.id,
          item_id: itemId,
          doc_type: docType,
          title: title ?? null,
          saved_at: new Date().toISOString(),
        },
        ...cur,
      ]);
      const { data, error } = await supabase
        .from('saved_tips')
        .insert({ user_id: user.id, item_id: itemId, doc_type: docType, title: title ?? null })
        .select('*')
        .maybeSingle();
      if (error || !data) refresh();
      else set((cur) => cur.map((t) => (t.id === tmpId ? (data as SavedTip) : t)));
    }
  };

  return { tips, loading, refresh, isSaved, toggle };
}
