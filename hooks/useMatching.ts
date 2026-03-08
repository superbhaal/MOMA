import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { MatchingQueue } from '@/types';

export function useMatching() {
  const user = useAppStore((s) => s.user);
  const [status, setStatus] = useState<MatchingQueue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    checkStatus();
  }, [user]);

  async function checkStatus() {
    if (!user) return;
    const { data } = await supabase
      .from('matching_queue')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setStatus(data as MatchingQueue | null);
    setLoading(false);
  }

  async function joinQueue() {
    if (!user) return;
    const { data, error } = await supabase
      .from('matching_queue')
      .upsert({ user_id: user.id, status: 'waiting' })
      .select()
      .single();

    if (!error && data) {
      setStatus(data as MatchingQueue);
    }
    return { data, error };
  }

  return { status, loading, joinQueue, refresh: checkStatus };
}
