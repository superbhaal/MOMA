import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { MeetupMap } from '@/components/groups/MeetupMap';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { addToCalendar } from '@/lib/calendar';
import type { MeetupProposal, ProposalVote, Vote } from '@/types';

interface MeetupBannerProps {
  proposal: MeetupProposal;
  votes: ProposalVote[];
  totalMembers: number;
  myVote: Vote | null;
  onRsvp: () => void;
  groupName?: string | null;
}

/** Blush meetup banner shown in group detail. */
export function MeetupBanner({
  proposal,
  votes,
  totalMembers,
  myVote,
  onRsvp,
  groupName,
}: MeetupBannerProps) {
  const goingCount = votes.filter((v) => v.vote === 'going').length;

  // Locked-in meetups wear the green "validated" scheme; open/expired stay blush.
  const decided = proposal.state === 'decided';
  const surface = decided ? colors.meadow : colors.blush;
  const strong = decided ? colors.meadowText : colors.blushText;
  const mid = decided ? colors.meadowMuted : colors.blushMuted;

  return (
    <View style={[styles.banner, { backgroundColor: surface }]}>
      <Typography variant="label" color={mid}>
        {decided ? 'MEETUP LOCKED IN' : 'NEXT MEETUP'}
      </Typography>

      <View style={styles.body}>
        <View style={styles.info}>
          <Typography variant="displayL" color={strong} style={{ marginTop: 2 }}>
            {formatDay(proposal.scheduled_at)}
          </Typography>
          <Typography variant="bodyL" color={strong} style={{ marginTop: 4 }}>
            {formatTime(proposal.scheduled_at)}
            {proposal.location_name ? ` · ${proposal.location_name}` : ''}
          </Typography>
        </View>

        <MeetupMap
          name={proposal.location_name}
          lat={proposal.location_lat}
          lng={proposal.location_lng}
          accentColor={decided ? colors.meadowText : colors.cobalt}
          size={96}
        />
      </View>

      <Typography variant="bodyM" color={mid} style={{ marginTop: spacing.md }}>
        {goingCount} of {totalMembers} going
      </Typography>

      <View style={{ marginTop: spacing.md }}>
        <Button
          title={myVote === 'going' ? 'going ✓' : 'i’m going'}
          variant={decided ? 'meadow' : 'blush'}
          onPress={onRsvp}
        />
      </View>

      {decided ? (
        <Pressable
          style={styles.calendarLink}
          onPress={() => addToCalendar(proposal, groupName)}
          hitSlop={8}
        >
          <Typography variant="labelS" color={colors.meadowText}>
            + ADD TO CALENDAR
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatDay(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .toLowerCase();
}
function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase();
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.blush,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  body: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.xs },
  info: { flex: 1 },
  calendarLink: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,70,32,0.15)',
    alignItems: 'center',
  },
});
