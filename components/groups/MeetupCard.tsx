import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { RsvpPill } from './RsvpPill';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { addToCalendar } from '@/lib/calendar';
import { openInGoogleMaps } from '@/lib/maps';
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
  const decided = proposal.state === 'decided';
  const expired = proposal.state === 'expired';

  const label = decided ? 'MEETUP LOCKED IN' : expired ? 'PAST MEETUP' : 'NEXT MEETUP';
  const going = expired ? `${goingCount} went` : `${goingCount} of ${totalMembers} going`;
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
            + Add to calendar
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}

/** "Saturday 15 March · 10:30" — the v11 long-form date, 24h clock. */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  const wd = d.toLocaleDateString('en-US', { weekday: 'long' });
  const mon = d.toLocaleDateString('en-US', { month: 'long' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${wd} ${d.getDate()} ${mon} · ${time}`;
}

const styles = StyleSheet.create({
  block: { alignItems: 'center' },
  muted: { opacity: 0.6 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 8.5,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  when: {
    fontFamily: fonts.serifReg,
    fontSize: 24,
    lineHeight: 30,
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
    fontSize: 13,
    lineHeight: 19,
  },
  placeLink: { textDecorationLine: 'underline' },
  rsvp: { marginTop: spacing.lg },
  calendar: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
