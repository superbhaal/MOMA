import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { GroupWithDetails } from '@/types';

export function useGroups() {
  const user = useAppStore((s) => s.user);
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadGroups();
  }, [user]);

  async function loadGroups() {
    if (!user) return;
    setLoading(true);

    const { data: memberRows, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (memberError || !memberRows?.length) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberRows.map((r) => r.group_id);

    const { data: groupsData } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .eq('status', 'active');

    // TODO: enrich with members, next_meetup, last_message, unread_count
    setGroups((groupsData ?? []).map((g) => ({
      ...g,
      members: [],
      next_meetup: null,
      last_message: null,
      unread_count: 0,
    })));
    setLoading(false);
  }

  return { groups, loading, refresh: loadGroups };
}
