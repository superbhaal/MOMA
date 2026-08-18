import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { GroupPulse } from './GroupPulse';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { isPastMeetup } from '@/lib/meetup';
import { formatShortWhen } from '@/lib/time';
import type { GroupWithDetails } from '@/types';

interface GroupCardProps {
  group: GroupWithDetails;
  onPress: () => void;
}

/**
 * v11 "menu listing" group card — the group set like a dish on a menu:
 * centred, transparent (no card chrome), serif cobalt name over small-caps
 * meta, the meetup as a serif line, the last message in Lora italic.
 * Ref: design/moma-v11.html · #screen-home .group-card.group-plate.
 */
export function GroupCard({ group, onPress }: GroupCardProps) {
  const { t } = useTranslation();
  const meetup = group.open_proposal;
  // A meetup that has been and gone stops counting down and starts asking for
  // the next one — the group's turn to say when they can't.
  const past = !!meetup && isPastMeetup(meetup);
  const decided = meetup?.state === 'decided' && !past;
  const memberCount = group.members.length;
  const meta = [group.neighbourhood, `${memberCount} member${memberCount === 1 ? '' : 's'}`]
    .filter(Boolean)
    .join(' · ');
  // Resolve the last message's sender from the member list (no extra join).
  const senderName = group.last_message
    ? group.members.find((m) => m.user_id === group.last_message!.sender_id)?.user.display_name
    : undefined;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {group.unread_count > 0 ? <View style={styles.unreadPip} /> : null}

      <Typography style={styles.name} color={colors.cobalt}>
        {group.name}
      </Typography>
      <Typography style={styles.meta} color={colors.mutedStrong}>
        {meta.toUpperCase()}
      </Typography>

      {meetup ? (
        <View style={styles.meetup}>
          <View style={styles.rule} />
          <Typography style={styles.meetupLabel} color={colors.mutedStrong}>
            {past ? t('grp.lastMeetup') : decided ? t('grp.lockedIn') : t('grp.nextMeetup')}
          </Typography>
          <Typography style={styles.meetupTime} color={colors.mutedStrong}>
            {formatWhen(meetup.scheduled_at)}
          </Typography>
          {/* The place gets its own pinned, underlined line — it reads as the
              destination rather than as a tail on the date. */}
          {meetup.location_name ? (
            <View style={styles.placeRow}>
              <Ionicons name="location-outline" size={12} color={colors.mutedStrong} />
              <Typography style={styles.placeText} color={colors.mutedStrong} numberOfLines={1}>
                {meetup.location_name}
              </Typography>
            </View>
          ) : null}
          <Typography
            style={[styles.countdown, past && styles.countdownPast]}
            color={past ? colors.mutedStrong : colors.cobalt}
          >
            {past ? t('grp.pickingNext') : countdownLabel(meetup.scheduled_at, t).toUpperCase()}
          </Typography>
        </View>
      ) : null}

      <View style={styles.avatars}>
        {group.members.slice(0, 4).map((m, i) => (
          <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
            <Avatar
              name={m.user.display_name}
              ringColor={m.user.profile_color ?? colors.fuchsia}
              photoUrl={m.user.avatar_url ?? undefined}
              size={scaled(28)}
              outlineColor={colors.white}
            />
          </View>
        ))}
        {memberCount > 4 ? (
          <View style={styles.avCount}>
            <Typography style={styles.avCountText} color={colors.muted}>
              +{memberCount - 4}
            </Typography>
          </View>
        ) : null}
      </View>

      {group.last_message ? (
        <>
          <View style={styles.rule} />
          <Typography style={styles.lastMsg} color={colors.mutedStrong} numberOfLines={2}>
            {senderName ? (
              <Typography style={styles.lastMsgSender} color={colors.text}>
                {senderName}:{' '}
              </Typography>
            ) : null}
            “{group.last_message.content}”
          </Typography>
        </>
      ) : null}

      <View style={styles.pulseRow}>
        <GroupPulse lastMessage={group.last_message} lastActiveAt={group.last_active_at} />
      </View>
    </Pressable>
  );
}

const formatWhen = formatShortWhen;

// Only ever called for a meetup still ahead — `isPastMeetup` handles the rest.
function countdownLabel(iso: string, t: TFunction): string {
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return t('misc.today');
  if (days === 1) return t('misc.tomorrow');
  return t('grp.inDays', { count: days });
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: spacing.xl,
    position: 'relative',
  },
  pressed: { opacity: 0.65 },
  unreadPip: {
    position: 'absolute',
    top: 30,
    right: spacing.xl,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.fuchsia,
  },
  name: {
    fontFamily: fonts.serif, // Cormorant Light 300
    fontSize: scaled(28),
    lineHeight: scaled(32),
    letterSpacing: -0.14,
    textAlign: 'center',
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: scaled(10.5),
    letterSpacing: 2.5,
    textAlign: 'center',
    marginTop: 4,
  },
  rule: {
    alignSelf: 'center',
    width: '58%',
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
  },
  meetup: { alignItems: 'center', alignSelf: 'stretch' },
  meetupLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(10.5),
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  meetupTime: {
    fontFamily: fonts.serif,
    fontSize: scaled(18),
    lineHeight: scaled(24),
    textAlign: 'center',
    marginTop: 3,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'center',
    marginTop: 3,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    borderStyle: 'dotted',
    maxWidth: '85%',
  },
  placeText: {
    fontFamily: fonts.serifReg,
    fontSize: scaled(17),
    lineHeight: scaled(22),
  },
  countdownPast: { alignSelf: 'center' },
  countdown: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(10.5),
    letterSpacing: 0.6,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  avCount: {
    width: scaled(28),
    height: scaled(28),
    borderRadius: scaled(14),
    marginLeft: -8,
    backgroundColor: '#EEECE7',
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avCountText: { fontFamily: fonts.bodySemi, fontSize: scaled(10.5) },
  lastMsg: {
    fontFamily: fonts.readingItal,
    fontSize: scaled(12.5),
    lineHeight: scaled(18),
    textAlign: 'center',
    maxWidth: '86%',
  },
  lastMsgSender: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(11),
  },
  pulseRow: { marginTop: spacing.md, alignItems: 'center' },
});
