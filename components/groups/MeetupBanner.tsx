import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import type { MeetupProposal, ProposalVote, Vote } from '@/types';

interface MeetupBannerProps {
  proposal: MeetupProposal;
  votes: ProposalVote[];
  totalMembers: number;
  myVote: Vote | null;
  onRsvp: () => void;
}

/** Blush meetup banner shown in group detail. */
export function MeetupBanner({
  proposal,
  votes,
  totalMembers,
  myVote,
  onRsvp,
}: MeetupBannerProps) {
  const goingCount = votes.filter((v) => v.vote === 'going').length;

  return (
    <View style={styles.banner}>
      <Typography variant="label" color={colors.blushMuted}>
        NEXT MEETUP
      </Typography>
      <Typography variant="displayL" color={colors.blushText} style={{ marginTop: 2 }}>
        {formatDay(proposal.scheduled_at)}
      </Typography>
      <Typography variant="bodyL" color={colors.blushText} style={{ marginTop: 4 }}>
        {formatTime(proposal.scheduled_at)}
        {proposal.location_name ? ` · ${proposal.location_name}` : ''}
      </Typography>

      <Typography variant="bodyM" color={colors.blushMuted} style={{ marginTop: spacing.md }}>
        {goingCount} of {totalMembers} going
      </Typography>

      <View style={{ marginTop: spacing.md }}>
        <Button
          title={myVote === 'going' ? 'going ✓' : 'i’m going'}
          variant="blush"
          onPress={onRsvp}
        />
      </View>
    </View>
  );
}

function formatDay(iso: string): string {
  return new Date(iso)
    .toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .toLowerCase();
}
function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    .toLowerCase();
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.blush,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
});
