import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type {
  DeclineReason,
  GroupMemberWithUser,
  MatchingQueueRow,
  MatchingStatus,
} from '@/types';

export interface MatchingState {
  status: MatchingStatus | null;
  queueRow: MatchingQueueRow | null;
  /** When status === 'previewing', the candidate group + its members. */
  previewMembers: GroupMemberWithUser[];
}

/** Reads matching_queue for the current user; surfaces preview + accept/decline helpers. */
export function useMatching() {
  const { user } = useAuth();
  const [state, setState] = useState<MatchingState>({
    status: null,
    queueRow: null,
    previewMembers: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: row } = await supabase
      .from('matching_queue')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let previewMembers: GroupMemberWithUser[] = [];
    if (row?.current_preview_group_id) {
      const { data: members } = await supabase
        .from('group_members')
        .select('*, user:users(*)')
        .eq('group_id', row.current_preview_group_id);
      previewMembers = (members ?? []) as GroupMemberWithUser[];
    }

    setState({
      status: (row?.status as MatchingStatus) ?? null,
      queueRow: (row as MatchingQueueRow) ?? null,
      previewMembers,
    });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const channel = supabase
      .channel(`match-queue:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matching_queue', filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  /** Accept the previewed group: insert group_members rows + flip queue to 'matched'. */
  const accept = useCallback(async () => {
    if (!user || !state.queueRow?.current_preview_group_id) {
      return { error: { message: 'no preview to accept' } };
    }
    const groupId = state.queueRow.current_preview_group_id;
    const { error: gmErr } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: user.id });
    if (gmErr) return { error: gmErr };
    const { error: qErr } = await supabase
      .from('matching_queue')
      .update({ status: 'matched', matched_at: new Date().toISOString() })
      .eq('user_id', user.id);
    return { error: qErr };
  }, [user?.id, state.queueRow?.current_preview_group_id]);

  /** Decline + reason → re-queue to 'waiting' for the next nightly run. */
  const declineWithReason = useCallback(
    async (reason: DeclineReason) => {
      if (!user) return { error: { message: 'not authenticated' } };
      const previewGroupId = state.queueRow?.current_preview_group_id ?? null;

      const { error: dErr } = await supabase.from('match_decline_reasons').insert({
        user_id: user.id,
        preview_group_id: previewGroupId,
        reason,
      });
      if (dErr) return { error: dErr };

      const { error: qErr } = await supabase
        .from('matching_queue')
        .update({ status: 'waiting', current_preview_group_id: null })
        .eq('user_id', user.id);
      return { error: qErr };
    },
    [user?.id, state.queueRow?.current_preview_group_id],
  );

  return { ...state, loading, refresh, accept, declineWithReason };
}
