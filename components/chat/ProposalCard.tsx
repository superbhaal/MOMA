import { MeetupCard } from '@/components/groups/MeetupCard';
import type { MeetupProposal, ProposalVote, Vote } from '@/types';

interface ProposalCardProps {
  proposal: MeetupProposal;
  votes: ProposalVote[];
  myVote: Vote | null;
  totalMembers: number;
  onToggleGoing: () => void;
  groupName?: string | null;
}

/** Pinned meetup card at the top of group chat (green when locked in, red while
 *  still a proposal). Thin wrapper over the shared MeetupCard. */
export function ProposalCard({
  proposal,
  votes,
  myVote,
  totalMembers,
  onToggleGoing,
  groupName,
}: ProposalCardProps) {
  return (
    <MeetupCard
      proposal={proposal}
      goingCount={votes.filter((v) => v.vote === 'going').length}
      totalMembers={totalMembers}
      isGoing={myVote === 'going'}
      onToggleGoing={onToggleGoing}
      groupName={groupName}
    />
  );
}
