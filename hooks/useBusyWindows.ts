import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { AvailabilityBlock } from '@/types';

/**
 * "When are you busy" over the next N days. Inverse of free-availability: a row
 * in `availability_slots` with available=false marks that (date, block) as taken.
 * Absence of a row = free/unknown. The admin cross-references everyone's busy
 * rows to pick a slot that fits the whole group.
 */
export function useBusyWindows(daysAhead = 14, opts: { fresh?: boolean } = {}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fromDate = todayISO();
  const toDate = addDaysISO(daysAhead - 1);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Asked as a condition of joining, the question is "what can't you make in
    // the NEXT two weeks" — so it's asked from a blank grid. Crosses left from a
    // fortnight ago aren't an answer to it, and prefilling them invites a Done
    // that means nothing. Nothing is deleted here: the window is replaced on
    // Done, so backing out leaves what was already recorded alone.
    if (opts.fresh) {
      setBusy(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('availability_slots')
      .select('date, block, available')
      .eq('user_id', user.id)
      .eq('available', false)
      .gte('date', fromDate)
      .lte('date', toDate);
    setBusy(new Set((data ?? []).map((s: any) => key(s.date, s.block))));
    setLoading(false);
  }, [user?.id, fromDate, toDate, opts.fresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isBusy = useCallback(
    (date: string, block: AvailabilityBlock) => busy.has(key(date, block)),
    [busy],
  );

  /** Toggle a (date, block) between busy and free. Optimistic. */
  const toggle = useCallback(
    async (date: string, block: AvailabilityBlock) => {
      if (!user) return;
      const k = key(date, block);
      const nowBusy = !busy.has(k);

      setBusy((cur) => {
        const next = new Set(cur);
        if (nowBusy) next.add(k);
        else next.delete(k);
        return next;
      });

      // Fresh grids don't write as you tap; `commitWindow` replaces the whole
      // window on Done. Backing out then leaves the old answer untouched.
      if (opts.fresh) return;

      if (nowBusy) {
        const { error } = await supabase
          .from('availability_slots')
          .upsert(
            { user_id: user.id, date, block, available: false },
            { onConflict: 'user_id,date,block' },
          );
        if (error) refresh();
      } else {
        const { error } = await supabase
          .from('availability_slots')
          .delete()
          .eq('user_id', user.id)
          .eq('date', date)
          .eq('block', block);
        if (error) refresh();
      }
    },
    [user?.id, busy, refresh, opts.fresh],
  );

  /**
   * Write exactly what's on screen over the whole window, for the fresh-grid
   * path: the toggles have been local only, and Done is the moment the answer
   * becomes the record.
   */
  const commitWindow = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('availability_slots')
      .delete()
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .lte('date', toDate);
    const rows = [...busy].map((k) => {
      const [date, block] = k.split('|');
      return { user_id: user.id, date, block, available: false };
    });
    if (rows.length) await supabase.from('availability_slots').insert(rows);
  }, [user?.id, busy, fromDate, toDate]);

  return { busy, count: busy.size, loading, isBusy, toggle, refresh, commitWindow };
}

function key(date: string, block: string): string {
  return `${date}|${block}`;
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
