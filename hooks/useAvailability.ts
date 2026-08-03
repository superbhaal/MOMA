import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { AvailabilityBlock, AvailabilitySlot } from '@/types';

/**
 * The slots a member has blocked out, over a 14-day window from today.
 *
 * The table records absences, not presence: no row means free, a row with
 * `available = false` means "don't put a meetup here". That is the shape the
 * admin meetup grid reads (it counts busy members per slot), and it keeps the
 * ask small — nobody has to tick fourteen days of availability for the
 * scheduler to have something to work with.
 */
export function useAvailability(daysAhead = 14) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fromDate = todayISO();
  const toDate = addDaysISO(daysAhead - 1);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('user_id', user.id)
      .eq('available', false)
      .gte('date', fromDate)
      .lte('date', toDate);
    setSlots((data ?? []) as AvailabilitySlot[]);
    setLoading(false);
  }, [user?.id, fromDate, toDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isBusy = useCallback(
    (date: string, block: AvailabilityBlock) =>
      slots.some((s) => s.date === date && s.block === block),
    [slots],
  );

  /** Block a slot out, or hand it back. Optimistic. */
  const toggleBusy = useCallback(
    async (date: string, block: AvailabilityBlock) => {
      if (!user) return;
      const wasBusy = slots.some((s) => s.date === date && s.block === block);

      setSlots((cur) =>
        wasBusy
          ? cur.filter((s) => !(s.date === date && s.block === block))
          : [
              ...cur,
              {
                id: 'tmp-' + Math.random().toString(36).slice(2),
                user_id: user.id,
                date,
                block,
                available: false,
              },
            ],
      );

      // Freeing a slot deletes the row rather than flipping it back to true:
      // "no row" is what means free everywhere else, so leaving `true` rows
      // behind would only be noise.
      const { error } = wasBusy
        ? await supabase
            .from('availability_slots')
            .delete()
            .eq('user_id', user.id)
            .eq('date', date)
            .eq('block', block)
        : await supabase
            .from('availability_slots')
            .upsert(
              { user_id: user.id, date, block, available: false },
              { onConflict: 'user_id,date,block' },
            );
      if (error) refresh(); // roll back via re-fetch
    },
    [user?.id, slots, refresh],
  );

  return { slots, loading, refresh, isBusy, toggleBusy };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
