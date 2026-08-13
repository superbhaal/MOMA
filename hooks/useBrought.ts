import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { BroughtItem, BroughtKind } from '@/types';

/**
 * What a mom has brought to the table (029_brought_items).
 *
 * One row per mom, enforced by the primary key: bringing something else
 * replaces what's there. The client chose that over keeping a history, so the
 * composer warns before it happens — the old one really is gone.
 */

/** Your own — writable. */
export function useMyBrought() {
  const { user } = useAuth();
  const [item, setItem] = useState<BroughtItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('brought_items')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setItem((data as BroughtItem) ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save(input: {
    kind: BroughtKind;
    payload: Record<string, unknown>;
    photoUrl: string | null;
  }): Promise<{ error: string | null }> {
    if (!user) return { error: 'You need to be signed in.' };
    setSaving(true);
    const { error } = await supabase.from('brought_items').upsert(
      {
        user_id: user.id,
        kind: input.kind,
        payload: input.payload,
        photo_url: input.photoUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    setSaving(false);
    if (error) return { error: 'Couldn’t put it on the table — please try again.' };
    await refresh();
    return { error: null };
  }

  async function clear(): Promise<{ error: string | null }> {
    if (!user) return { error: 'You need to be signed in.' };
    setSaving(true);
    const { error } = await supabase.from('brought_items').delete().eq('user_id', user.id);
    setSaving(false);
    if (error) return { error: 'Couldn’t take it off the table — please try again.' };
    setItem(null);
    return { error: null };
  }

  return { item, loading, saving, save, clear, refresh };
}

/**
 * Someone else's, or several at once — the member profile takes one id, the
 * group preview takes four.
 *
 * Read through `brought_for_users` rather than the table directly: attribution
 * needs the poster's name and colour, and `users` RLS hands back a null for
 * anyone outside your groups.
 */
export function useBroughtFor(userIds: string[]) {
  const [items, setItems] = useState<Record<string, BroughtItem>>({});
  const [loading, setLoading] = useState(true);

  // Sorted + joined so a re-render with the same ids in a new array doesn't
  // refetch — this is called with an inline array from two screens.
  const key = [...userIds].sort().join(',');

  useEffect(() => {
    if (!userIds.length) {
      setItems({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc('brought_for_users', { p_ids: userIds });
      if (cancelled) return;
      const map: Record<string, BroughtItem> = {};
      for (const row of (data as BroughtItem[]) ?? []) map[row.user_id] = row;
      setItems(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { items, loading };
}
