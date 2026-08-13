import { Fragment, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useBusyWindows } from '@/hooks/useBusyWindows';
import { useMatching } from '@/hooks/useMatching';
import type { AvailabilityBlock } from '@/types';

const BLOCKS: { value: AvailabilityBlock; label: string; range: string }[] = [
  { value: 'morning', label: 'MORNING', range: '7–12' },
  { value: 'afternoon', label: 'AFTERNOON', range: '12–5' },
  { value: 'evening', label: 'EVENING', range: '5–9' },
];

const DAYS_AHEAD = 14;

export default function BusyWindowsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // `accept` is set when this screen stands between the preview and the group:
  // the membership is only written once she's marked her two weeks, so backing
  // out here leaves her un-joined rather than quietly in.
  const { groupId, accept: acceptParam } = useLocalSearchParams<{
    groupId: string;
    accept?: string;
  }>();
  const isJoinGate = acceptParam === '1';
  const { count, isBusy, toggle, commitWindow } = useBusyWindows(DAYS_AHEAD, {
    fresh: isJoinGate,
  });
  const { accept } = useMatching();
  const [joining, setJoining] = useState(false);

  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  async function done() {
    if (acceptParam === '1') {
      setJoining(true);
      await commitWindow();
      const { error } = await accept();
      setJoining(false);
      if (error) {
        Alert.alert("Couldn't join this group", error.message);
        return;
      }
      // Out of the modal entirely before opening the chat.
      //
      // This screen is pushed from the group-preview modal, so replacing it with
      // the chat left the chat living INSIDE that modal — a card within a card,
      // with a back gesture that returned to the join screen of a group you had
      // already joined. Dismissing everything first puts the chat where it
      // belongs, one push from Home.
      router.dismissAll();
      if (groupId) router.push(`/group/${groupId}/chat`);
      return;
    }
    if (groupId) router.replace(`/group/${groupId}/chat`);
    else router.replace('/(tabs)');
  }

  let lastWeekKey = '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.eyebrowRow}>
          <View style={styles.dot} />
          <Typography style={styles.eyebrow} color={colors.cobalt}>
            BEFORE THE CHAT OPENS
          </Typography>
        </View>
        <Typography style={styles.title} color={colors.text}>
          When are you busy{'\n'}the next two weeks?
        </Typography>
        <Typography style={styles.sub} color={colors.muted}>
          Tap every window you already know is taken. We&rsquo;ll cross-reference
          everyone&rsquo;s busy times and propose one slot that fits the whole group.
        </Typography>

        <View style={styles.colHeader}>
          <View style={styles.dayCol} />
          {BLOCKS.map((b) => (
            <View key={b.value} style={styles.blockHead}>
              <Typography style={styles.blockLabel} color={colors.text}>
                {b.label}
              </Typography>
              <Typography style={styles.blockRange} color={colors.muted}>
                {b.range}
              </Typography>
            </View>
          ))}
        </View>

        {days.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          const wk = weekKey(d);
          const showWeek = wk !== lastWeekKey;
          lastWeekKey = wk;
          return (
            <Fragment key={iso}>
              {showWeek ? (
                <Typography style={styles.weekLabel} color={colors.muted}>
                  {weekLabel(d)}
                </Typography>
              ) : null}
              <View style={styles.row}>
                <View style={styles.dayCol}>
                  <Typography style={styles.dayName} color={colors.muted}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </Typography>
                  <Typography style={styles.dayNum} color={colors.text}>
                    {d.getDate()}
                  </Typography>
                </View>
                {BLOCKS.map((b) => {
                  const on = isBusy(iso, b.value);
                  return (
                    <Pressable
                      key={b.value}
                      onPress={() => toggle(iso, b.value)}
                      style={[styles.cell, on && styles.cellOn]}
                    >
                      {on ? <Ionicons name="close" size={20} color={colors.white} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </Fragment>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Typography style={styles.footNote} color={colors.muted}>
          <Typography style={styles.footNoteBold} color={colors.text}>
            {count} window{count === 1 ? '' : 's'}
          </Typography>{' '}
          marked busy across the next two weeks.
        </Typography>
        <Pressable onPress={done} disabled={joining} style={styles.cta}>
          {joining ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Typography style={styles.ctaText} color={colors.white}>
              {acceptParam === '1' ? 'Join the group' : 'Done, take me to the chat'}
            </Typography>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function weekKey(d: Date): string {
  const m = new Date(d);
  const day = (m.getDay() + 6) % 7; // Monday = 0
  m.setDate(m.getDate() - day);
  return m.toISOString().slice(0, 10);
}

function weekLabel(d: Date): string {
  const start = new Date(d);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const month = end.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  return `WEEK OF ${start.getDate()}–${end.getDate()} ${month}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cobalt },
  eyebrow: { fontFamily: 'DMSans-SemiBold', fontSize: scaled(11), letterSpacing: 1.6 },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: scaled(34),
    lineHeight: scaled(38),
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  sub: { fontSize: scaled(14), lineHeight: scaled(20), marginBottom: spacing.xl },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dayCol: { width: 64 },
  blockHead: { flex: 1, alignItems: 'center' },
  blockLabel: { fontFamily: 'DMSans-SemiBold', fontSize: scaled(11), letterSpacing: 1 },
  blockRange: { fontSize: scaled(11), marginTop: 1 },
  weekLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(11),
    letterSpacing: 1.4,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  dayName: { fontFamily: 'DMSans-SemiBold', fontSize: scaled(11), letterSpacing: 1 },
  dayNum: { fontFamily: 'CormorantGaramond-Regular', fontSize: scaled(22), lineHeight: scaled(24) },
  cell: {
    flex: 1,
    height: 46,
    marginHorizontal: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellOn: {
    backgroundColor: colors.blushText,
    borderColor: colors.blushText,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  footNote: { fontSize: scaled(14), lineHeight: scaled(20) },
  footNoteBold: { fontFamily: 'DMSans-SemiBold', fontSize: scaled(14) },
  cta: {
    backgroundColor: colors.cobalt,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { fontFamily: 'DMSans-SemiBold', fontSize: scaled(15) },
});
