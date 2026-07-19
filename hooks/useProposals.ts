import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { MeetupProposal, ProposalVote, Vote } from '@/types';

export interface ProposalsBundle {
  open: MeetupProposal | null;
  past: MeetupProposal[];
  votes_by_proposal: Record<string, ProposalVote[]>;
}

/** All proposals for a group (open + past) with their votes. Realtime subscribed. */
export function useProposals(groupId: string | undefined) {
  const { user } = useAuth();
  const [bundle, setBundle] = useState<ProposalsBundle>({
    open: null,
    past: [],
    votes_by_proposal: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const { data: proposals, error: pe } = await supabase
      .from('meetup_proposals')
      .select('*')
      .eq('group_id', groupId)
      .order('scheduled_at', { ascending: false });

    if (pe) {
      setError(pe.message);
      setLoading(false);
      return;
    }

    const list = (proposals ?? []) as MeetupProposal[];
    const ids = list.map((p) => p.id);

    let votesByProposal: Record<string, ProposalVote[]> = {};
    if (ids.length > 0) {
      const { data: votes } = await supabase
        .from('proposal_votes')
        .select('*')
        .in('proposal_id', ids);
      for (const v of (votes ?? []) as ProposalVote[]) {
        (votesByProposal[v.proposal_id] ??= []).push(v);
      }
    }

    setBundle({
      // `open` holds the current pinned meetup — open (gathering RSVPs) or
      // decided (locked in). Only expired proposals count as past meetups.
      open:
        list.find((p) => p.state === 'open') ??
        list.find((p) => p.state === 'decided') ??
        null,
      past: list.filter((p) => p.state === 'expired'),
      votes_by_proposal: votesByProposal,
    });
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    refresh();
    if (!groupId) return;
    const channel = supabase
      .channel(`proposals:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetup_proposals', filter: `group_id=eq.${groupId}` },
        () => refresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposal_votes' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, refresh]);

  /** Vote on the open (or any) proposal. Upserts the user's vote. */
  const vote = useCallback(
    async (proposalId: string, choice: Vote) => {
      if (!user) return { error: { message: 'not authenticated' } };
      const { error: e } = await supabase
        .from('proposal_votes')
        .upsert(
          { proposal_id: proposalId, user_id: user.id, vote: choice },
          { onConflict: 'proposal_id,user_id' },
        );
      return { error: e };
    },
    [user?.id],
  );

  /** Remove a vote (the "remove me" path on RSVP undo). */
  const unvote = useCallback(
    async (proposalId: string) => {
      if (!user) return { error: { message: 'not authenticated' } };
      const { error: e } = await supabase
        .from('proposal_votes')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('user_id', user.id);
      return { error: e };
    },
    [user?.id],
  );

  /**
   * Create a counter-proposal (links to parent) OR a fresh member-authored proposal
   * (when no open proposal exists). Caller decides by passing parentId or null.
   * Server enforces "one open per group" via partial unique index — caller should
   * pass parentId when one exists or the insert will conflict.
   */
  const propose = useCallback(
    async (input: {
      scheduled_at: string;
      location_name?: string | null;
      note?: string | null;
      parent_proposal_id?: string | null;
    }) => {
      if (!user || !groupId) return { error: { message: 'missing context' } };
      const { error: e } = await supabase.from('meetup_proposals').insert({
        group_id: groupId,
        proposed_by: user.id,
        scheduled_at: input.scheduled_at,
        location_name: input.location_name ?? null,
        note: input.note ?? null,
        parent_proposal_id: input.parent_proposal_id ?? null,
      });
      return { error: e };
    },
    [user?.id, groupId],
  );

  return { ...bundle, loading, error, refresh, vote, unvote, propose };
}
