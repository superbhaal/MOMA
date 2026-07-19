import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Message, User } from '@/types';

export interface DmThreadItem {
  thread_id: string;
  group_id: string | null;
  other: Pick<User, 'id' | 'display_name' | 'profile_color' | 'avatar_url'>;
  last_message: Message | null;
}

/** The current user's 1-on-1 DM threads (those with at least one message), newest first. */
export function useDmThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<DmThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: rows } = await supabase
      .from('dm_threads')
      .select('*')
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);
    const list = rows ?? [];
    if (!list.length) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const otherIds = list.map((t) => (t.participant_a === user.id ? t.participant_b : t.participant_a));
    const threadIds = list.map((t) => t.id);

    const [{ data: users }, { data: msgs }] = await Promise.all([
      supabase.from('users').select('id, display_name, profile_color, avatar_url').in('id', otherIds),
      supabase
        .from('messages')
        .select('*')
        .in('dm_thread_id', threadIds)
        .order('created_at', { ascending: false }),
    ]);

    const userById = new Map((users ?? []).map((u: any) => [u.id, u]));
    const lastByThread = new Map<string, Message>();
    for (const m of (msgs ?? []) as Message[]) {
      if (m.dm_thread_id && !lastByThread.has(m.dm_thread_id)) lastByThread.set(m.dm_thread_id, m);
    }

    const items: DmThreadItem[] = list
      .map((t) => {
        const otherId = t.participant_a === user.id ? t.participant_b : t.participant_a;
        return {
          thread_id: t.id,
          group_id: t.group_id,
          other: userById.get(otherId) ?? null,
          last_message: lastByThread.get(t.id) ?? null,
        };
      })
      // Only show conversations that exist AND whose other participant is readable.
      .filter((i): i is DmThreadItem => !!i.other && !!i.last_message)
      .sort(
        (a, b) =>
          +new Date(b.last_message?.created_at ?? 0) - +new Date(a.last_message?.created_at ?? 0),
      );

    setThreads(items);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    if (!user) return;
    // New DM messages anywhere → re-derive the list (last message / ordering).
    const channel = supabase
      .channel(`dm-threads:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if ((payload.new as Message)?.dm_thread_id) refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  return { threads, loading, refresh };
}
