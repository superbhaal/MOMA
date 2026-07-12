import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Pill } from '@/components/ui/Pill';
import { ProposalVoteRow } from './ProposalVoteRow';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import type { MeetupProposal, ProposalVote, Vote } from '@/types';

interface ProposalCardProps {
  proposal: MeetupProposal;
  votes: ProposalVote[];
  myVote: Vote | null;
  totalMembers: number;
  onVote: (v: Vote) => void;
}

/**
 * Pinned proposal card at the top of group chat.
 * 3 lifecycle states: open / decided / expired.
 */
export function ProposalCard({
  proposal,
  votes,
  myVote,
  totalMembers,
  onVote,
}: ProposalCardProps) {
  const goingCount = votes.filter((v) => v.vote === 'going').length;

  return (
    <View
      style={[
        styles.card,
        proposal.state === 'expired' && styles.cardMuted,
      ]}
    >
      <View style={styles.header}>
        <Typography variant="label" color={colors.blushMuted}>
          {proposal.state === 'open' && 'PROPOSED'}
          {proposal.state === 'decided' && 'LOCKED IN'}
          {proposal.state === 'expired' && 'PAST MEETUP'}
        </Typography>
        {proposal.state === 'decided' ? (
          <Pill label="✓ DECIDED" tone="cobalt" active />
        ) : null}
      </View>

      <Typography
        variant="displayM"
        color={colors.blushText}
        style={{ marginTop: 2 }}
      >
        {formatDay(proposal.scheduled_at)}
      </Typography>
      <Typography variant="bodyL" color={colors.blushText} style={{ marginTop: 2 }}>
        {formatTime(proposal.scheduled_at)}
        {proposal.location_name ? ` · ${proposal.location_name}` : ''}
      </Typography>
      {proposal.note ? (
        <Typography
          variant="bodyM"
          color={colors.blushMuted}
          style={{ marginTop: spacing.sm }}
        >
          {proposal.note}
        </Typography>
      ) : null}

      {proposal.state === 'open' ? (
        <ProposalVoteRow votes={votes} myVote={myVote} onVote={onVote} />
      ) : (
        <Typography
          variant="bodyL"
          color={colors.blushMuted}
          style={{ marginTop: spacing.md }}
        >
          {proposal.state === 'decided'
            ? `${goingCount} of ${totalMembers} going.`
            : `${goingCount} went.`}
        </Typography>
      )}
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
  card: {
    backgroundColor: colors.blush,
    padding: spacing.lg,
    borderRadius: radius.lg,
    margin: spacing.md,
  },
  cardMuted: { opacity: 0.65 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
