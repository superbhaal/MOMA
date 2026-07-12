import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Group,
  GroupMemberWithUser,
  MeetupProposal,
  ProposalVote,
} from '@/types';

export interface GroupDetail {
  group: Group | null;
  members: GroupMemberWithUser[];
  open_proposal: MeetupProposal | null;
  open_votes: ProposalVote[];
}

/** Single group: meta + members + active proposal + votes on it. Realtime subscribed. */
export function useGroupDetail(groupId: string | undefined) {
  const [detail, setDetail] = useState<GroupDetail>({
    group: null,
    members: [],
    open_proposal: null,
    open_votes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);

    const [groupRes, membersRes, proposalRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).maybeSingle(),
      supabase
        .from('group_members')
        .select('*, user:users(*)')
        .eq('group_id', groupId),
      supabase
        .from('meetup_proposals')
        .select('*')
        .eq('group_id', groupId)
        .eq('state', 'open')
        .maybeSingle(),
    ]);

    if (groupRes.error) {
      setError(groupRes.error.message);
      setLoading(false);
      return;
    }

    let openVotes: ProposalVote[] = [];
    if (proposalRes.data) {
      const { data: votes } = await supabase
        .from('proposal_votes')
        .select('*')
        .eq('proposal_id', proposalRes.data.id);
      openVotes = votes ?? [];
    }

    setDetail({
      group: groupRes.data ?? null,
      members: (membersRes.data ?? []) as GroupMemberWithUser[],
      open_proposal: proposalRes.data ?? null,
      open_votes: openVotes,
    });
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    refresh();
    if (!groupId) return;

    const channel = supabase
      .channel(`group-detail:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetup_proposals', filter: `group_id=eq.${groupId}` },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proposal_votes' },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, refresh]);

  return { ...detail, loading, error, refresh };
}
