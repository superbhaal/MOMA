import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { useGroups } from '@/hooks/useGroups';
import { useDmThreads } from '@/hooks/useDmThreads';
import { formatTime } from '@/lib/time';
import type { GroupWithDetails } from '@/types';
import type { DmThreadItem } from '@/hooks/useDmThreads';

/**
 * Chats — v11 editorial: centred serif-italic cobalt title, ❖ motif, then two
 * "courses": GROUPS and DIRECT MESSAGES, each a centred cobalt small-caps
 * heading over hairline-separated rows (serif-italic names, Lora-italic
 * previews, small-caps timestamps). Ref: design/moma-v11.html · #screen-chats.
 */
export default function ChatsScreen() {
  const { t } = useTranslation();
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

  const sortedGroups = [...groups].sort(
    (a, b) => +new Date(b.last_message?.created_at ?? b.last_active_at ?? 0) -
      +new Date(a.last_message?.created_at ?? a.last_active_at ?? 0),
  );
  const sortedDms = [...threads].sort(
    (a, b) => +new Date(b.last_message?.created_at ?? 0) - +new Date(a.last_message?.created_at ?? 0),
  );
  const empty = !loading && !dmLoading && sortedGroups.length === 0 && sortedDms.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 26 }]}
      refreshControl={
        <RefreshControl refreshing={pulling} onRefresh={onPullRefresh} tintColor={colors.cobalt} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Typography style={styles.title} color={colors.cobalt}>
        Chats
      </Typography>
      <Typography style={styles.motif} color={colors.cobalt}>
        ❖
      </Typography>

      {loading || dmLoading ? (
        <ActivityIndicator color={colors.cobalt} style={{ marginTop: spacing.xxl }} />
      ) : null}

      {empty ? (
        <Typography variant="bodyL" color={colors.muted} style={styles.empty}>
          your group chats land here once you&rsquo;re matched.
        </Typography>
      ) : null}

      {sortedGroups.length > 0 ? (
        <>
          <SectionHeading label={t('chats.groups')} />
          {sortedGroups.map((g) => (
            <GroupRow key={g.id} group={g} onPress={() => router.push(`/group/${g.id}/chat`)} />
          ))}
        </>
      ) : null}

      {sortedDms.length > 0 ? (
        <>
          <SectionHeading label={t('chats.directMessages')} />
          {sortedDms.map((t) => (
            <DmRow key={t.thread_id} dm={t} onPress={() => router.push(`/group/dm/${t.other.id}`)} />
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <View style={styles.sectionWrap}>
      <Typography style={styles.sectionLabel} color={colors.cobalt}>
        {label}
      </Typography>
      <View style={styles.sectionRule} />
    </View>
  );
}

function GroupRow({ group, onPress }: { group: GroupWithDetails; onPress: () => void }) {
  const senderName = group.last_message
    ? group.members.find((m) => m.user_id === group.last_message!.sender_id)?.user.display_name
    : undefined;
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.avatarStack}>
        {group.members.slice(0, 2).map((m, i) => (
          <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 2 - i }}>
            <Avatar
              name={m.user.display_name}
              ringColor={m.user.profile_color ?? colors.fuchsia}
              photoUrl={m.user.avatar_url ?? undefined}
              size={i === 0 ? 34 : 24}
              outlineColor={colors.white}
            />
          </View>
        ))}
      </View>
      <View style={styles.rowBody}>
        <Typography style={styles.rowName} color={colors.mutedStrong} numberOfLines={1}>
          {group.name}
        </Typography>
        <Typography style={styles.rowPreview} color={colors.mutedStrong} numberOfLines={1}>
          {group.last_message ? (
            <>
              {senderName ? (
                <Typography style={styles.rowSender} color={colors.text}>
                  {senderName}:{' '}
                </Typography>
              ) : null}
              {group.last_message.content}
            </>
          ) : (
            'it’s quiet — say hi.'
          )}
        </Typography>
      </View>
      <View style={styles.rowEnd}>
        <Typography style={styles.rowTime} color={colors.muted}>
          {timeLabel(group.last_message?.created_at ?? group.last_active_at)}
        </Typography>
        {group.unread_count > 0 ? <View style={styles.unreadDot} /> : null}
      </View>
    </Pressable>
  );
}

function DmRow({ dm, onPress }: { dm: DmThreadItem; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.avatarStack}>
        <Avatar
          name={dm.other.display_name ?? '?'}
          ringColor={dm.other.profile_color ?? colors.fuchsia}
          photoUrl={dm.other.avatar_url ?? undefined}
          size={34}
        />
      </View>
      <View style={styles.rowBody}>
        <Typography style={styles.rowName} color={colors.mutedStrong} numberOfLines={1}>
          {dm.other.display_name}
        </Typography>
        {dm.last_message ? (
          <Typography style={styles.rowPreview} color={colors.mutedStrong} numberOfLines={1}>
            {dm.last_message.content}
          </Typography>
        ) : null}
      </View>
      <Typography style={styles.rowTime} color={colors.muted}>
        {timeLabel(dm.last_message?.created_at ?? null)}
      </Typography>
    </Pressable>
  );
}

/** Compact v11 timestamp: 8:52 (today) · YESTERDAY · 2D · 3W. */
function timeLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const mins = (Date.now() - d.getTime()) / 60000;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}M`;
  const sameDay = new Date().toDateString() === d.toDateString();
  if (sameDay) {
    return formatTime(d);
  }
  const days = Math.floor(mins / (60 * 24));
  if (days <= 1) return 'YESTERDAY';
  if (days < 7) return `${days}D`;
  return `${Math.floor(days / 7)}W`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 26, paddingBottom: spacing.xxxl },
  title: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(34),
    lineHeight: scaled(40),
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  motif: { fontSize: scaled(13), textAlign: 'center', marginTop: spacing.lg },
  empty: { textAlign: 'center', marginTop: spacing.xxl },

  sectionWrap: { marginTop: spacing.xxl, marginBottom: spacing.xs },
  sectionLabel: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  sectionRule: { height: 1, backgroundColor: colors.line, marginTop: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pressed: { opacity: 0.65 },
  avatarStack: { flexDirection: 'row', alignItems: 'center', minWidth: 40 },
  rowBody: { flex: 1 },
  rowName: {
    // Real italic cut — RN won't synthesise italics for custom fonts.
    fontFamily: fonts.serifItal,
    fontSize: scaled(18),
    lineHeight: scaled(22),
  },
  rowPreview: {
    fontFamily: fonts.readingItal,
    fontSize: scaled(11.5),
    lineHeight: scaled(16),
    marginTop: 2,
  },
  rowSender: { fontFamily: fonts.bodySemi, fontSize: scaled(10.5) },
  rowEnd: { alignItems: 'flex-end', gap: 5 },
  rowTime: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 1.4,
  },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.fuchsia },
});
