import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { RsvpPill } from './RsvpPill';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { addToCalendar } from '@/lib/calendar';
import { openInGoogleMaps } from '@/lib/maps';
import { formatLongWhen } from '@/lib/time';
import type { MeetupProposal } from '@/types';

interface MeetupCardProps {
  proposal: MeetupProposal;
  goingCount: number;
  totalMembers: number;
  isGoing: boolean;
  onToggleGoing: () => void;
  groupName?: string | null;
}

/**
 * v11 centred meetup block — no coloured banner, no map thumbnail: small-caps
 * label, the date as a big serif line, the place as a tappable underlined
 * serif-italic link (opens Google Maps), RSVP pill below.
 * Ref: design/moma-v11.html · #screen-detail meetup section.
 */
export function MeetupCard({
  proposal,
  goingCount,
  totalMembers,
  isGoing,
  onToggleGoing,
  groupName,
}: MeetupCardProps) {
  const { t } = useTranslation();
  const decided = proposal.state === 'decided';
  const expired = proposal.state === 'expired';

  const label = decided ? t('grp.lockedIn') : expired ? t('grp.pastMeetup') : t('grp.nextMeetup');
  const going = expired
    ? t('grp.went', { count: goingCount })
    : t('grp.goingOf', { going: goingCount, total: totalMembers });
  const hasPlace = !!proposal.location_name;

  const openMaps = () =>
    openInGoogleMaps({
      name: proposal.location_name ?? 'Meetup',
      address: null,
      lat: proposal.location_lat,
      lng: proposal.location_lng,
      category: null,
    });

  return (
    <View style={[styles.block, expired && styles.muted]}>
      <Typography style={styles.label} color={decided ? colors.cobalt : colors.mutedStrong}>
        {label}
      </Typography>
      <Typography style={styles.when} color={colors.text}>
        {formatWhen(proposal.scheduled_at)}
      </Typography>

      <View style={styles.placeRow}>
        {hasPlace ? (
          <Pressable onPress={openMaps} hitSlop={8}>
            <Typography style={[styles.place, styles.placeLink]} color={colors.mutedStrong}>
              ◦ {proposal.location_name}
            </Typography>
          </Pressable>
        ) : null}
        <Typography style={styles.place} color={colors.mutedStrong}>
          {hasPlace ? ' · ' : ''}
          {going}
        </Typography>
      </View>

      {!expired ? (
        <View style={styles.rsvp}>
          <RsvpPill going={isGoing} onPress={onToggleGoing} />
        </View>
      ) : null}

      {/* Offered as soon as there is a date to save — waiting for the quorum
          hid it exactly when someone wants to block the slot out. Only a past
          meetup has nothing left to add. */}
      {!expired ? (
        <Pressable onPress={() => addToCalendar(proposal, groupName)} hitSlop={8}>
          <Typography style={styles.calendar} color={colors.cobalt}>
            {t('grp.addToCalendar')}
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}

/** "Saturday 15 March · 10:30 AM" — the v11 long-form date. */
const formatWhen = formatLongWhen;

const styles = StyleSheet.create({
  block: { alignItems: 'center' },
  muted: { opacity: 0.6 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(10.5),
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  when: {
    fontFamily: fonts.serifReg,
    fontSize: scaled(24),
    lineHeight: scaled(30),
    textAlign: 'center',
    marginTop: 4,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  place: {
    fontFamily: fonts.readingItal,
    fontSize: scaled(13),
    lineHeight: scaled(19),
  },
  placeLink: { textDecorationLine: 'underline' },
  rsvp: { marginTop: spacing.lg },
  calendar: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(11),
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
