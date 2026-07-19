import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Pill } from '@/components/ui/Pill';
import { ProposalVoteRow } from './ProposalVoteRow';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { addToCalendar } from '@/lib/calendar';
import type { MeetupProposal, ProposalVote, Vote } from '@/types';

interface ProposalCardProps {
  proposal: MeetupProposal;
  votes: ProposalVote[];
  myVote: Vote | null;
  totalMembers: number;
  onVote: (v: Vote) => void;
  groupName?: string | null;
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
  groupName,
}: ProposalCardProps) {
  const goingCount = votes.filter((v) => v.vote === 'going').length;

  // A locked-in meetup wears the green "validated" scheme; open/expired stay blush.
  const decided = proposal.state === 'decided';
  const surface = decided ? colors.meadow : colors.blush;
  const strong = decided ? colors.meadowText : colors.blushText;
  const mid = decided ? colors.meadowMuted : colors.blushMuted;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: surface },
        proposal.state === 'expired' && styles.cardMuted,
      ]}
    >
      <View style={styles.header}>
        <Typography variant="label" color={mid}>
          {proposal.state === 'open' && 'PROPOSED'}
          {proposal.state === 'decided' && 'LOCKED IN'}
          {proposal.state === 'expired' && 'PAST MEETUP'}
        </Typography>
        {decided ? <Pill label="✓ DECIDED" tone="meadow" active /> : null}
      </View>

      <Typography
        variant="displayM"
        color={strong}
        style={{ marginTop: 2 }}
      >
        {formatDay(proposal.scheduled_at)}
      </Typography>
      <Typography variant="bodyL" color={strong} style={{ marginTop: 2 }}>
        {formatTime(proposal.scheduled_at)}
        {proposal.location_name ? ` · ${proposal.location_name}` : ''}
      </Typography>
      {proposal.note ? (
        <Typography
          variant="bodyM"
          color={mid}
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
          color={mid}
          style={{ marginTop: spacing.md }}
        >
          {decided
            ? `${goingCount} of ${totalMembers} going.`
            : `${goingCount} went.`}
        </Typography>
      )}

      {decided ? (
        <Pressable
          style={[styles.calendarLink, { borderTopColor: 'rgba(30,70,32,0.15)' }]}
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
  calendarLink: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(106,26,42,0.12)',
  },
});
