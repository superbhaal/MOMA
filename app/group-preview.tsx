import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { GroupPreviewCard } from '@/components/groups/GroupPreviewCard';
import { useBroughtFor } from '@/hooks/useBrought';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';
import { useMatching } from '@/hooks/useMatching';
import type { DeclineReason, GroupMemberWithUser, User } from '@/types';

interface DeclineOption {
  value: DeclineReason;
  title: string;
  sub: string;
}

const DECLINE_OPTIONS: DeclineOption[] = [
  {
    value: 'wrong_neighbourhood',
    title: 'Wrong neighbourhood',
    sub: 'Most are too far for a stroller walk.',
  },
  {
    value: 'baby_age_mismatch',
    title: "Baby ages don't quite match",
    sub: 'A wider window felt better in theory.',
  },
  {
    value: 'language',
    title: 'Language mix not quite right',
    sub: "I'd prefer a group that mainly speaks my primary language.",
  },
  {
    value: 'vibe',
    title: 'Vibe feels off',
    sub: "Something I can't put a finger on. Try a different mix.",
  },
  {
    value: 'curious',
    title: 'Just curious — show me other options',
    sub: 'No fixed objection. Re-run with different people.',
  },
];

export default function GroupPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: me } = useAuth();
  const { previewMembers, accept, declineWithReason, status, loading } = useMatching();
  const [busy, setBusy] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState<DeclineReason | null>(null);

  // Exclude the viewer from the displayed list — they see "the OTHER moms".
  const others = useMemo(
    () => previewMembers.filter((m) => m.user.id !== me?.id),
    [previewMembers, me?.id],
  );

  const { items: broughtItems } = useBroughtFor(others.map((o) => o.user.id));
  const headlineSub = useMemo(() => composeHeadlineSub(others, me), [others, me]);

  function handleAccept() {
    const groupId = previewMembers[0]?.group_id;
    if (!groupId) {
      router.replace('/(tabs)');
      return;
    }
    // Busy windows come BEFORE the join is committed, not after it. The client
    // asked for marking your two weeks to be a condition of joining, and a
    // screen you reach once you're already in the group is not a condition —
    // backing out of it left you in the group anyway. The join now happens on
    // that screen's Done.
    router.push({
      pathname: '/group/[groupId]/busy',
      params: { groupId, accept: '1' },
    });
  }

  async function handleDeclineConfirm() {
    if (!declineReason) return;
    setBusy(true);
    const { error } = await declineWithReason(declineReason);
    setBusy(false);
    if (error) {
      Alert.alert("Couldn't update your match", error.message);
      return;
    }
    setDeclineOpen(false);
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Typography style={styles.eyebrow} color={colors.cobalt}>
              YOUR GROUP IS READY
            </Typography>
          </View>
          <Typography style={styles.title} color={colors.cobalt}>
            We found your{'\n'}
            {wordForCount(others.length + 1)} moms.
          </Typography>
          <Typography style={styles.sub} color={colors.muted}>
            {headlineSub}
          </Typography>
        </View>

        <View style={styles.members}>
          {loading ? (
            <Typography variant="bodyL" color={colors.muted}>
              loading…
            </Typography>
          ) : status !== 'previewing' ? (
            <Typography variant="bodyL" color={colors.muted} style={{ textAlign: 'center' }}>
              No preview right now. We&rsquo;ll ping you when your next group is ready.
            </Typography>
          ) : (
            others.map((m) => (
              <GroupPreviewCard
                key={m.id}
                member={m}
                matchNote={composeMatchNote(m, me)}
                brought={broughtItems[m.user.id]}
              />
            ))
          )}
        </View>
      </ScrollView>

      {status === 'previewing' && others.length > 0 ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) },
          ]}
        >
          <Pressable
            onPress={handleAccept}
            disabled={busy}
            style={[styles.joinBtn, busy && { opacity: 0.5 }]}
          >
            <Typography style={styles.joinBtnText} color={colors.white}>
              JOIN THIS GROUP
            </Typography>
          </Pressable>
          <Pressable
            onPress={() => setDeclineOpen(true)}
            style={styles.findAnother}
          >
            <Typography style={styles.findAnotherText} color={colors.muted}>
              Not quite right?{' '}
              <Typography style={styles.underline} color={colors.muted}>
                Find me another
              </Typography>
            </Typography>
          </Pressable>
        </View>
      ) : null}

      <ActionSheet
        visible={declineOpen}
        onClose={() => {
          setDeclineOpen(false);
          setDeclineReason(null);
        }}
        title="What feels off?"
      >
        <Typography variant="bodyM" color={colors.muted} style={styles.declineSub}>
          No reason is required, but knowing helps us match you better next time.
          We&rsquo;ll re-run within 24 hours.
        </Typography>
        <View style={styles.reasonList}>
          {DECLINE_OPTIONS.map((opt) => {
            const active = declineReason === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setDeclineReason(opt.value)}
                style={[styles.reason, active && styles.reasonActive]}
              >
                <Typography
                  style={styles.reasonTitle}
                  color={active ? colors.cobalt : colors.text}
                >
                  {opt.title}
                </Typography>
                <Typography style={styles.reasonSub} color={colors.muted}>
                  {opt.sub}
                </Typography>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.declineActions}>
          <Pressable
            onPress={() => {
              setDeclineOpen(false);
              setDeclineReason(null);
            }}
            style={styles.declineCancel}
          >
            <Typography variant="bodyM" color={colors.text}>
              Back
            </Typography>
          </Pressable>
          <Pressable
            onPress={handleDeclineConfirm}
            disabled={!declineReason || busy}
            style={[
              styles.declineConfirm,
              (!declineReason || busy) && { opacity: 0.4 },
            ]}
          >
            <Typography variant="bodyM" color={colors.white}>
              Find me another group
            </Typography>
          </Pressable>
        </View>
      </ActionSheet>
    </View>
  );
}

function wordForCount(n: number): string {
  switch (n) {
    case 3:
      return 'three';
    case 4:
      return 'four';
    case 5:
      return 'five';
    default:
      return String(n);
  }
}

/** Rough heuristic copy for the heading sub. */
function composeHeadlineSub(others: GroupMemberWithUser[], me: User | null): string {
  if (others.length === 0) return '';
  const dobs = [me?.baby_dob, ...others.map((m) => m.user.baby_dob)].filter(
    Boolean,
  ) as string[];
  const weeks = dobs.map((d) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
    return Math.abs(days) / 7;
  });
  if (weeks.length === 0) return '';
  const minW = Math.floor(Math.min(...weeks));
  const maxW = Math.ceil(Math.max(...weeks));
  const range = minW === maxW ? `week ${minW}` : `weeks ${minW}–${maxW}`;
  return `All a 10-minute walk away. All at ${range} with you.`;
}

/** Per-member match-note. Cobalt italic line under each member. */
function composeMatchNote(m: GroupMemberWithUser, me: User | null): string | undefined {
  if (!me) return undefined;
  const them = m.user;

  // Same neighbourhood + same baby-age window
  const sameNeighbourhood =
    !!me.neighbourhood && me.neighbourhood === them.neighbourhood;
  const meDob = me.baby_dob ? new Date(me.baby_dob).getTime() : null;
  const themDob = them.baby_dob ? new Date(them.baby_dob).getTime() : null;
  const sameWeek =
    meDob && themDob && Math.abs(meDob - themDob) / (1000 * 60 * 60 * 24 * 7) <= 1;

  if (sameNeighbourhood && sameWeek) return 'Same neighbourhood, same week.';
  if (sameNeighbourhood) return 'Same neighbourhood.';
  if (sameWeek) return 'Same baby-age window.';

  // Language overlap
  const langs = new Set([
    me.primary_language,
    ...(me.secondary_languages ?? []),
  ].filter(Boolean));
  const theirLangs = [
    them.primary_language,
    ...(them.secondary_languages ?? []),
  ].filter(Boolean) as string[];
  const overlap = theirLangs.find((l) => langs.has(l));
  if (overlap) return `Both speak ${overlap}.`;

  return undefined;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingBottom: spacing.lg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cobalt,
  },
  eyebrow: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(10.5),
    letterSpacing: 1.6,
  },
  title: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: scaled(34),
    lineHeight: scaled(36),
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sub: {
    fontSize: scaled(13),
    lineHeight: scaled(19),
    textAlign: 'center',
    maxWidth: 280,
  },
  members: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  joinBtn: {
    backgroundColor: colors.cobalt,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  joinBtnText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(12),
    letterSpacing: 1,
  },
  findAnother: { alignItems: 'center', paddingVertical: spacing.xs },
  findAnotherText: {
    fontSize: scaled(13),
    fontFamily: 'DMSans-Medium',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  declineSub: {
    fontSize: scaled(12),
    lineHeight: scaled(17),
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  reasonList: { gap: 6 },
  reason: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reasonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.cobalt,
  },
  reasonTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(13),
  },
  reasonSub: {
    fontSize: scaled(11),
    marginTop: 2,
  },
  declineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  declineCancel: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  declineConfirm: {
    flex: 1,
    backgroundColor: colors.cobalt,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
});
