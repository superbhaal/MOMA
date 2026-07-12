import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { GroupWithDetails, MeetupProposal, Message } from '@/types';

/** Current user's groups (max 2 by DB trigger) with light enrichment for the Home cards. */
export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: memberships, error: mErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (mErr) {
      setError(mErr.message);
      setLoading(false);
      return;
    }

    const groupIds = (memberships ?? []).map((m) => m.group_id);
    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const { data, error: gErr } = await supabase
      .from('groups')
      .select(
        `
        *,
        members:group_members(*, user:users(*)),
        proposals:meetup_proposals(*),
        messages(*)
        `,
      )
      .in('id', groupIds);

    if (gErr) {
      setError(gErr.message);
      setLoading(false);
      return;
    }

    const enriched: GroupWithDetails[] = (data ?? []).map((g: any) => {
      const proposals: MeetupProposal[] = g.proposals ?? [];
      const messages: Message[] = g.messages ?? [];
      const lastMessage = messages
        .slice()
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0] ?? null;
      const openProposal = proposals.find((p) => p.state === 'open') ?? null;
      return {
        ...g,
        members: g.members ?? [],
        open_proposal: openProposal,
        last_message: lastMessage,
        unread_count: 0, // TODO: wire real unread tracking when read-receipts land
      };
    });

    setGroups(enriched);
    setLoading(false);
  }, [user?.id]);

  /** Leave a group: removes our membership row. Frees one of the two slots. */
  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return { error: { message: 'not authenticated' } };
      // Optimistic: drop it locally; realtime/refresh reconciles.
      setGroups((cur) => cur.filter((g) => g.id !== groupId));
      const { error: delErr } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      if (delErr) {
        setError(delErr.message);
        refresh();
      }
      return { error: delErr };
    },
    [user?.id, refresh],
  );

  useEffect(() => {
    refresh();

    if (!user) return;

    // Re-fetch when our membership changes (joined/left a group).
    const channel = supabase
      .channel(`user-groups:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  return { groups, loading, error, refresh, leaveGroup };
}
