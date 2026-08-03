import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { Illustration } from '@/components/ui/Illustration';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { MeCard } from '@/components/me/MeCard';
import { MeRow } from '@/components/me/MeRow';
import { MeSectionLabel } from '@/components/me/MeSectionLabel';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { useGroups } from '@/hooks/useGroups';
import { useProposals } from '@/hooks/useProposals';
import { useSavedTips } from '@/hooks/useSavedTips';
import { usePreferences } from '@/hooks/usePreferences';
import { babyMetaLine } from '@/lib/babyAge';
import { shareMoma } from '@/lib/share';
import { openInstagramProfile } from '@/lib/instagram';
import type { SavedDocType } from '@/types';

const PAUSE_OPTIONS = [
  {
    label: 'For 1 week',
    sub: "Common when life is just heavy. We'll quietly resume.",
    days: 7,
  },
  {
    label: 'For 1 month',
    sub: "A longer breather. We'll send one gentle nudge before turning back on.",
    days: 30,
  },
  {
    label: 'Until I turn it back on',
    sub: "Indefinite pause. Nothing automatic. You're in charge.",
    days: 365 * 5,
  },
];

const SAVED_META: Record<SavedDocType, { label: string; bg: string; fg: string; noun: string }> = {
  read_article: { label: 'Read', bg: '#D8E8C8', fg: '#2a5a1a', noun: 'article' },
  watch_reel: { label: 'Watch', bg: '#e0f8fa', fg: '#007a88', noun: 'reel' },
  recommendation: { label: 'Recco', bg: '#fce8f4', fg: '#b0246e', noun: 'recommendation' },
};

export default function MeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { groups, leaveGroup } = useGroups();
  const { tips, toggle: toggleTip } = useSavedTips();
  const { pauseFor } = usePreferences();

  const [pauseOpen, setPauseOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);

  const isPaused = !!user?.paused_until && new Date(user.paused_until) > new Date();

  // The row's value must describe the *matching*, not the pause switch: a bare
  // "On" next to "Pause matching" reads as "the pause is on" (a tester assumed
  // she had been paused by default). Spell the state out instead, and say when
  // an open-ended pause is actually going to lift.
  const pauseValue = !isPaused
    ? 'Matching on'
    : (() => {
        const until = new Date(user!.paused_until!);
        const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        // "Until I turn it back on" is stored as a far-future date — no point
        // showing it as a calendar day.
        if (until.getTime() - Date.now() > YEAR_MS) return 'Paused';
        return `Paused until ${until.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
      })();

  // Soonest upcoming meetup across the user's groups (each group has ≤ 1 open proposal).
  const nextMeetup = useMemo(() => {
    const candidates = groups
      .filter((g) => g.open_proposal)
      .map((g) => ({ group: g, proposal: g.open_proposal! }))
      .sort(
        (a, b) =>
          +new Date(a.proposal.scheduled_at) - +new Date(b.proposal.scheduled_at),
      );
    return candidates[0] ?? null;
  }, [groups]);

  const { votes_by_proposal, vote, unvote } = useProposals(nextMeetup?.group.id);
  const meetupVotes = nextMeetup ? votes_by_proposal[nextMeetup.proposal.id] ?? [] : [];
  const myVote = meetupVotes.find((v) => v.user_id === user?.id)?.vote ?? null;
  const goingCount = meetupVotes.filter((v) => v.vote === 'going').length;
  // Green "validated" scheme once the meetup is locked in.
  const meetupDecided = nextMeetup?.proposal.state === 'decided';

  async function onRsvp() {
    if (!nextMeetup) return;
    if (myVote === 'going') {
      setUndoOpen(true);
    } else {
      await vote(nextMeetup.proposal.id, 'going');
    }
  }

  const hasAbout = !!user?.bio || (user?.interests?.length ?? 0) > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={[styles.profileTop, { paddingTop: insets.top + spacing.xl }]}>
        {/* A pair of drawings up the left, a single one lower on the right —
            they frame the avatar without touching it. Ref: v11 #screen-me. */}
        <Illustration name="tomato" size="sm" style={[styles.illo, styles.illoTomato]} />
        <Illustration name="stars" size="sm" style={[styles.illo, styles.illoStars]} />
        <Illustration name="microphone" size="sm" style={[styles.illo, styles.illoMic]} />
        <View>
          <Avatar
            name={user?.display_name ?? '?'}
            ringColor={user?.profile_color ?? colors.fuchsia}
            photoUrl={user?.avatar_url ?? undefined}
            size={84}
            ringWidth={2}
          />
          <View
            style={[styles.colorDot, { backgroundColor: user?.profile_color ?? colors.fuchsia }]}
          />
        </View>
        <Typography style={styles.name}>{user?.display_name ?? '—'}</Typography>
        <Typography style={styles.babyInfo}>
          {babyMetaLine(user?.baby_dob, user?.neighbourhood)}
        </Typography>
        <Pressable
          style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
          onPress={() => router.push('/profile/edit')}
        >
          <Typography style={styles.editBtnText}>Edit profile</Typography>
        </Pressable>
      </View>

      {/* About me */}
      {hasAbout ? (
        <>
          <MeSectionLabel label="About me" />
          <MeCard padded>
            {user?.bio ? <Typography style={styles.bio}>{user.bio}</Typography> : null}
            {(user?.interests?.length ?? 0) > 0 ? (
              <>
                <Typography style={styles.interestsLabel}>INTERESTS</Typography>
                <View style={styles.interests}>
                  {user!.interests!.map((tag) => (
                    <View key={tag} style={styles.interestPill}>
                      <Typography style={styles.interestText}>{tag}</Typography>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </MeCard>
        </>
      ) : null}

      {/* Next meetup */}
      {nextMeetup ? (
        <>
          <MeSectionLabel label="Next meetup" />
          <View style={[styles.meetupCard, meetupDecided && { borderColor: colors.cobalt }]}>
            <View style={styles.meetupDateBlock}>
              <Typography style={[styles.meetupDay, meetupDecided && { color: colors.cobalt }]}>
                {new Date(nextMeetup.proposal.scheduled_at).getDate()}
              </Typography>
              <Typography style={[styles.meetupMon, meetupDecided && { color: colors.muted }]}>
                {new Date(nextMeetup.proposal.scheduled_at)
                  .toLocaleDateString('en-US', { month: 'short' })
                  .toUpperCase()}
              </Typography>
            </View>
            <View style={styles.meetupDivider} />
            <View style={styles.meetupInfo}>
              <Typography style={[styles.meetupTitle, meetupDecided && { color: colors.cobalt }]}>
                {nextMeetup.group.name}
              </Typography>
              <Typography style={[styles.meetupSub, meetupDecided && { color: colors.muted }]}>
                {new Date(nextMeetup.proposal.scheduled_at)
                  .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  .toLowerCase()}
                {nextMeetup.proposal.location_name ? ` · ${nextMeetup.proposal.location_name}` : ''}
              </Typography>
              {myVote === 'going' ? (
                <Typography style={[styles.rsvpConfirm, meetupDecided && { color: colors.cobalt }]}>
                  You&rsquo;re in — {goingCount} going.
                </Typography>
              ) : null}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.meetupRsvp,
                meetupDecided && { backgroundColor: colors.cobalt },
                pressed && { opacity: 0.85 },
              ]}
              onPress={onRsvp}
            >
              <Typography style={styles.meetupRsvpText}>
                {myVote === 'going' ? '✓' : 'RSVP'}
              </Typography>
            </Pressable>
          </View>
        </>
      ) : null}

      {/* Saved tips */}
      <MeSectionLabel
        label="Saved tips"
        right={
          tips.length > 0 ? (
            <Typography style={styles.countBadge}>{tips.length}</Typography>
          ) : null
        }
      />
      <MeCard>
        {tips.length === 0 ? (
          <View style={styles.savedEmpty}>
            <Typography style={styles.savedEmptyText}>
              Heart a tip in Learn and it lands here,{' '}
              <Typography style={styles.savedEmptyStrong}>your private shelf</Typography> of places,
              rituals, and things worth remembering.
            </Typography>
          </View>
        ) : (
          tips.map((tip, i) => {
            const meta = SAVED_META[tip.doc_type];
            return (
              <View key={tip.id} style={[styles.savedRow, i === tips.length - 1 && styles.savedRowLast]}>
                <View style={[styles.savedCat, { backgroundColor: meta.bg }]}>
                  <Typography style={[styles.savedCatText, { color: meta.fg }]}>
                    {meta.label}
                  </Typography>
                </View>
                <Typography style={styles.savedText}>Saved {meta.noun}</Typography>
                <Pressable onPress={() => toggleTip(tip.sanity_doc_id, tip.doc_type)} hitSlop={8}>
                  <Ionicons name="heart" size={16} color={colors.fuchsia} />
                </Pressable>
              </View>
            );
          })
        )}
      </MeCard>

      {/* My groups */}
      <MeSectionLabel label="My groups" />
      <MeCard>
        {groups.length === 0 ? (
          <View style={styles.savedEmpty}>
            <Typography style={styles.savedEmptyText}>
              You&rsquo;re not in a group yet. We&rsquo;ll let you know the moment a circle forms
              near you.
            </Typography>
          </View>
        ) : (
          groups.map((g) => (
            <MeRow
              key={g.id}
              icon="people"
              iconTint={colors.fuchsia}
              iconBg="#fce8f4"
              label={g.name}
              value={`${g.members.length} member${g.members.length === 1 ? '' : 's'}`}
              onPress={() => router.push(`/group/${g.id}`)}
            />
          ))
        )}
        <MeRow
          icon="pause"
          iconTint="#a07000"
          iconBg="#fff8e0"
          label={isPaused ? 'Matching paused' : 'Pause matching'}
          value={pauseValue}
          onPress={() => setPauseOpen(true)}
        />
        {groups.length > 0 ? (
          <MeRow
            icon="exit-outline"
            iconTint={colors.cherry}
            iconBg="#fce8ec"
            label="Leave a group"
            danger
            isLast
            onPress={() => setLeaveOpen(true)}
          />
        ) : null}
      </MeCard>

      {/* Preferences */}
      <MeSectionLabel label="Preferences" />
      <MeCard>
        {/* Blocking out dates lives with the group it affects, not in the
            settings shelf — it's asked for when a group forms and again every
            fortnight, so a permanent row here only read as clutter. */}
        <MeRow
          icon="options-outline"
          iconTint={colors.cobalt}
          iconBg="#eef2ff"
          label="Matching preferences"
          isLast
          onPress={() => router.push('/preferences')}
        />
      </MeCard>

      {/* Settings */}
      <MeSectionLabel label="Settings" />
      <MeCard>
        <MeRow
          icon="notifications-outline"
          iconTint={colors.cobalt}
          iconBg="#eef2ff"
          label="Notifications"
          onPress={() => router.push('/settings/notifications')}
        />
        <MeRow
          icon="lock-closed-outline"
          iconTint="#2a7a2a"
          iconBg="#f0faf0"
          label="Privacy & data"
          onPress={() => router.push('/settings/privacy')}
        />
        <MeRow
          icon="help-circle-outline"
          iconTint="#a07000"
          iconBg="#fff8e0"
          label="Help & support"
          onPress={() => router.push('/settings/help')}
        />
        <MeRow
          icon="heart-outline"
          iconTint="#c0306a"
          iconBg="#fce8f0"
          label="Share møma with a friend"
          isLast
          onPress={shareMoma}
        />
      </MeCard>

      {/* Instagram (optional quick link) */}
      {user?.instagram_handle ? (
        <MeCard style={{ marginTop: spacing.sm }}>
          <MeRow
            icon="logo-instagram"
            iconTint="#c0306a"
            iconBg="#fce8f0"
            label={`@${user.instagram_handle.replace(/^@/, '')}`}
            isLast
            showArrow={false}
            onPress={() => openInstagramProfile(user.instagram_handle)}
          />
        </MeCard>
      ) : null}

      <Pressable style={styles.signOut} onPress={signOut} hitSlop={8}>
        <Typography style={styles.signOutText}>Sign out</Typography>
      </Pressable>

      {/* Pause matching sheet */}
      <ActionSheet visible={pauseOpen} onClose={() => setPauseOpen(false)} title="Pause matching">
        <Typography style={styles.sheetSub}>
          No new groups. No nudges. Your current groups stay open. Turn it back on whenever.
        </Typography>
        {PAUSE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.label}
            style={styles.sheetItem}
            onPress={async () => {
              await pauseFor(opt.days);
              setPauseOpen(false);
            }}
          >
            <Typography style={styles.sheetItemTitle}>{opt.label}</Typography>
            <Typography style={styles.sheetItemSub}>{opt.sub}</Typography>
          </Pressable>
        ))}
        {isPaused ? (
          <Pressable
            style={[styles.sheetItem, styles.sheetItemLast]}
            onPress={async () => {
              await pauseFor(null);
              setPauseOpen(false);
            }}
          >
            <Typography style={[styles.sheetItemTitle, { color: colors.cobalt }]}>
              Resume matching now
            </Typography>
          </Pressable>
        ) : null}
      </ActionSheet>

      {/* Leave group sheet */}
      <ActionSheet visible={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave which group?">
        <Typography style={styles.sheetSub}>
          You&rsquo;ll be removed from the chat and meetups. Their group continues without you.
        </Typography>
        {groups.map((g) => (
          <Pressable
            key={g.id}
            style={styles.sheetItem}
            onPress={async () => {
              await leaveGroup(g.id);
              setLeaveOpen(false);
            }}
          >
            <Typography style={[styles.sheetItemTitle, { color: colors.cherry }]}>
              Leave {g.name}
            </Typography>
            <Typography style={styles.sheetItemSub}>
              {g.members.length} member{g.members.length === 1 ? '' : 's'} · frees up 1 of 2 slots.
            </Typography>
          </Pressable>
        ))}
      </ActionSheet>

      {/* RSVP undo sheet */}
      <ActionSheet visible={undoOpen} onClose={() => setUndoOpen(false)} title="Can't make it after all?">
        <Typography style={styles.sheetSub}>
          You&rsquo;re off the list — quietly. The group sees the count drop, no reason needed.
        </Typography>
        <Pressable
          style={styles.sheetItem}
          onPress={async () => {
            if (nextMeetup) await unvote(nextMeetup.proposal.id);
            setUndoOpen(false);
          }}
        >
          <Typography style={styles.sheetItemTitle}>Just remove me</Typography>
        </Pressable>
        <Pressable
          style={[styles.sheetItem, styles.sheetItemLast]}
          onPress={() => {
            setUndoOpen(false);
            if (nextMeetup) router.push(`/group/${nextMeetup.group.id}/chat`);
          }}
        >
          <Typography style={[styles.sheetItemTitle, { color: colors.cobalt }]}>
            Suggest a time instead
          </Typography>
        </Pressable>
      </ActionSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  profileTop: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    position: 'relative',
  },
  illo: { position: 'absolute' },
  illoTomato: { left: spacing.lg, top: 54 },
  illoStars: { left: spacing.xxl, top: 96 },
  illoMic: { right: spacing.lg, top: 118 },
  colorDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: colors.white,
  },
  name: {
    fontFamily: fonts.serifItal,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.3,
    color: colors.cobalt,
    marginTop: 14,
  },
  babyInfo: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  editBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  editBtnPressed: { backgroundColor: colors.cream },
  editBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.text,
  },
  // About me
  bio: {
    fontFamily: fonts.readingItal,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 23,
    color: colors.text,
    marginBottom: spacing.md,
  },
  interestsLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  interestText: {
    fontFamily: fonts.bodyMed,
    fontSize: 12,
    color: colors.text,
  },
  // Next meetup
  meetupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
  },
  meetupDateBlock: {
    alignItems: 'center',
    width: 40,
  },
  meetupDay: {
    fontFamily: fonts.serifReg,
    fontSize: 28,
    lineHeight: 30,
    color: colors.cobalt,
  },
  meetupMon: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.muted,
    marginTop: 2,
  },
  meetupDivider: {
    width: 1,
    height: 38,
    backgroundColor: colors.line,
  },
  meetupInfo: { flex: 1 },
  meetupTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  meetupSub: {
    fontFamily: fonts.bodyMed,
    fontSize: 12,
    color: colors.muted,
  },
  rsvpConfirm: {
    fontFamily: fonts.bodyMed,
    fontSize: 11,
    color: colors.cobalt,
    marginTop: 6,
  },
  meetupRsvp: {
    backgroundColor: colors.cobalt,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minWidth: 52,
    alignItems: 'center',
  },
  meetupRsvpText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.white,
  },
  // Saved tips
  countBadge: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.muted,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  savedRowLast: { borderBottomWidth: 0 },
  savedCat: {
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 1,
  },
  savedCatText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  savedText: {
    flex: 1,
    fontFamily: fonts.readingItal,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  savedEmpty: {
    padding: spacing.lg,
  },
  savedEmptyText: {
    fontFamily: fonts.reading,
    fontSize: 13,
    lineHeight: 21,
    color: colors.muted,
  },
  savedEmptyStrong: {
    fontFamily: fonts.bodySemi,
    color: colors.text,
  },
  // Sign out
  signOut: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signOutText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    padding: spacing.md,
  },
  // Sheets
  sheetSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  sheetItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sheetItemLast: { borderBottomWidth: 0 },
  sheetItemTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  sheetItemSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 3,
  },
});
