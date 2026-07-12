import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { AvailabilityBlock, AvailabilitySlot } from '@/types';

/** Availability for the current user across a 14-day window starting today. */
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
      .gte('date', fromDate)
      .lte('date', toDate);
    setSlots((data ?? []) as AvailabilitySlot[]);
    setLoading(false);
  }, [user?.id, fromDate, toDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Toggle (or set) a single (date, block) slot. Optimistic. */
  const toggle = useCallback(
    async (date: string, block: AvailabilityBlock) => {
      if (!user) return;
      const existing = slots.find((s) => s.date === date && s.block === block);
      const nextAvailable = !(existing?.available ?? false);

      // Optimistic
      setSlots((cur) => {
        const others = cur.filter((s) => !(s.date === date && s.block === block));
        if (existing) {
          return [...others, { ...existing, available: nextAvailable }];
        }
        return [
          ...others,
          {
            id: 'tmp-' + Math.random().toString(36).slice(2),
            user_id: user.id,
            date,
            block,
            available: nextAvailable,
          },
        ];
      });

      const { error } = await supabase
        .from('availability_slots')
        .upsert(
          { user_id: user.id, date, block, available: nextAvailable },
          { onConflict: 'user_id,date,block' },
        );
      if (error) refresh(); // roll back via re-fetch
    },
    [user?.id, slots, refresh],
  );

  return { slots, loading, refresh, toggle };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
