import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { DmThread, Message } from '@/types';

/**
 * 1-on-1 DM. Threads originate only from group context.
 * Pass the OTHER participant's user_id; this hook will find/create the thread.
 */
export function useDm(otherUserId: string | undefined, fromGroupId?: string) {
  const { user } = useAuth();
  const [thread, setThread] = useState<DmThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ensureThread = useCallback(async (): Promise<DmThread | null> => {
    if (!user || !otherUserId) return null;
    const [a, b] = [user.id, otherUserId].sort();
    const { data: existing } = await supabase
      .from('dm_threads')
      .select('*')
      .eq('participant_a', a)
      .eq('participant_b', b)
      .maybeSingle();
    if (existing) return existing as DmThread;

    const { data: created, error: ce } = await supabase
      .from('dm_threads')
      .insert({ participant_a: a, participant_b: b, group_id: fromGroupId ?? null })
      .select('*')
      .maybeSingle();
    if (ce) {
      setError(ce.message);
      return null;
    }
    return created as DmThread;
  }, [user?.id, otherUserId, fromGroupId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const t = await ensureThread();
    setThread(t);
    if (!t) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const { data, error: e } = await supabase
      .from('messages')
      .select('*')
      .eq('dm_thread_id', t.id)
      .order('created_at', { ascending: true });
    if (e) setError(e.message);
    else setMessages((data ?? []) as Message[]);
    setLoading(false);
  }, [ensureThread]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!thread) return;
    const channel = supabase
      .channel(`dm:${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `dm_thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread?.id]);

  const send = useCallback(
    async (content: string) => {
      if (!user || !content.trim()) return { error: null };
      // Ensure the thread exists even if the user sends before refresh() resolved
      // it (the first message in a brand-new DM). Previously this silently no-op'd.
      const t = thread ?? (await ensureThread());
      if (!t) return { error: { message: 'could not open this conversation' } };
      if (!thread) setThread(t);

      const { data, error: e } = await supabase
        .from('messages')
        .insert({ dm_thread_id: t.id, sender_id: user.id, content: content.trim() })
        .select('*')
        .maybeSingle();
      // Optimistically show our own message immediately (deduped against the
      // realtime INSERT that will also arrive) — don't depend on realtime alone.
      if (!e && data) {
        setMessages((cur) => (cur.some((x) => x.id === (data as Message).id) ? cur : [...cur, data as Message]));
      }
      return { error: e };
    },
    [user?.id, thread?.id, ensureThread],
  );

  return { thread, messages, loading, error, refresh, send };
}
