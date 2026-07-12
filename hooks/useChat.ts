import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type {
  AttachmentType,
  Message,
  PlaceAttachment,
  ProposalRefAttachment,
} from '@/types';

/** Group chat: messages list + realtime + send helpers. */
export function useChat(groupId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const { data, error: e } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (e) setError(e.message);
    else setMessages((data ?? []) as Message[]);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    refresh();
    if (!groupId) return;

    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
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
  }, [groupId, refresh]);

  const send = useCallback(
    async (content: string) => {
      if (!user || !groupId || !content.trim()) return { error: null };
      const { error: e } = await supabase.from('messages').insert({
        group_id: groupId,
        sender_id: user.id,
        content: content.trim(),
      });
      return { error: e };
    },
    [user?.id, groupId],
  );

  const sendAttachment = useCallback(
    async (
      content: string,
      type: AttachmentType,
      data: PlaceAttachment | ProposalRefAttachment,
    ) => {
      if (!user || !groupId) return { error: null };
      const { error: e } = await supabase.from('messages').insert({
        group_id: groupId,
        sender_id: user.id,
        content,
        attachment_type: type,
        attachment_data: data,
      });
      return { error: e };
    },
    [user?.id, groupId],
  );

  return { messages, loading, error, refresh, send, sendAttachment };
}
