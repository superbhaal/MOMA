import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { Message } from '@/types';

export function useChat(groupId: string) {
  const user = useAppStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    setMessages(data ?? []);
    setLoading(false);
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!user) return;
    await supabase.from('messages').insert({
      group_id: groupId,
      sender_id: user.id,
      content,
    });
  }, [groupId, user]);

  return { messages, loading, sendMessage };
}
