import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { GroupPulse } from '@/components/groups/GroupPulse';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useGroups } from '@/hooks/useGroups';
import { useDmThreads } from '@/hooks/useDmThreads';
import type { GroupWithDetails } from '@/types';
import type { DmThreadItem } from '@/hooks/useDmThreads';

type Row =
  | { key: string; kind: 'group'; ts: string | null; group: GroupWithDetails }
  | { key: string; kind: 'dm'; ts: string | null; dm: DmThreadItem };

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groups, loading, refresh } = useGroups();
  const { threads, loading: dmLoading, refresh: refreshDms } = useDmThreads();

  // Pull-to-refresh spinner reflects ONLY an explicit user pull — never the
  // silent focus/realtime refreshes (those would otherwise leave the spinner
  // stuck when returning to the tab with the back button).
  const [pulling, setPulling] = useState(false);
  const onPullRefresh = useCallback(async () => {
    setPulling(true);
    try {
      await Promise.all([refresh(), refreshDms()]);
    } finally {
      setPulling(false);
    }
  }, [refresh, refreshDms]);

  // Tab stays mounted — refresh both lists whenever it regains focus. Silent.
  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshDms();
    }, [refresh, refreshDms]),
  );

  const rows: Row[] = [
    ...groups.map((g) => ({
      key: `g:${g.id}`,
      kind: 'group' as const,
      ts: g.last_message?.created_at ?? g.last_active_at ?? null,
      group: g,
    })),
    ...threads.map((t) => ({
      key: `d:${t.thread_id}`,
      kind: 'dm' as const,
      ts: t.last_message?.created_at ?? null,
      dm: t,
    })),
  ].sort((a, b) => +new Date(b.ts ?? 0) - +new Date(a.ts ?? 0));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Typography variant="displayL" color={colors.cobalt} style={styles.header}>
        chats
      </Typography>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={onPullRefresh}
            tintColor={colors.cobalt}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) =>
          item.kind === 'group' ? (
            <GroupRow group={item.group} onPress={() => router.push(`/group/${item.group.id}/chat`)} />
          ) : (
            <DmRow dm={item.dm} onPress={() => router.push(`/group/dm/${item.dm.other.id}`)} />
          )
        }
        ListEmptyComponent={
          loading || dmLoading ? (
            <ActivityIndicator color={colors.cobalt} style={{ marginTop: spacing.xxl }} />
          ) : (
            <Typography
              variant="bodyL"
              color={colors.muted}
              style={{ paddingHorizontal: spacing.xl, textAlign: 'center' }}
            >
              your group chats land here once you&rsquo;re matched.
            </Typography>
          )
        }
      />
    </View>
  );
}

function GroupRow({ group, onPress }: { group: GroupWithDetails; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.avatarStack}>
        {group.members.slice(0, 3).map((m, i) => (
          <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: group.members.length - i }}>
            <Avatar
              name={m.user.display_name}
              ringColor={m.user.profile_color ?? colors.fuchsia}
              photoUrl={m.user.avatar_url ?? undefined}
              size={36}
              outlineColor={colors.white}
            />
          </View>
        ))}
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Typography variant="displayS" color={colors.text}>
          {group.name}
        </Typography>
        <Typography variant="bodyM" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {group.last_message?.content ?? 'it’s quiet — say hi.'}
        </Typography>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <GroupPulse lastMessage={group.last_message} lastActiveAt={group.last_active_at} />
        {group.unread_count > 0 ? (
          <View style={styles.unreadPip}>
            <Typography variant="labelS" color={colors.white}>
              {group.unread_count}
            </Typography>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function DmRow({ dm, onPress }: { dm: DmThreadItem; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar
        name={dm.other.display_name ?? '?'}
        ringColor={dm.other.profile_color ?? colors.fuchsia}
        photoUrl={dm.other.avatar_url ?? undefined}
        size={44}
      />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.dmTitleRow}>
          <Typography variant="displayS" color={colors.text}>
            {dm.other.display_name}
          </Typography>
          <View style={styles.dmTag}>
            <Typography variant="labelS" color={colors.muted}>
              DIRECT
            </Typography>
          </View>
        </View>
        <Typography variant="bodyM" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {dm.last_message?.content ?? ''}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatarStack: { flexDirection: 'row' },
  dmTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dmTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: colors.cream,
  },
  unreadPip: {
    backgroundColor: colors.fuchsia,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
