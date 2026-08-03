import { MeetupCard } from './MeetupCard';
import type { MeetupProposal, ProposalVote, Vote } from '@/types';

interface MeetupBannerProps {
  proposal: MeetupProposal;
  votes: ProposalVote[];
  totalMembers: number;
  myVote: Vote | null;
  onToggleGoing: () => void;
  groupName?: string | null;
}

/** Meetup banner on the group detail screen. Thin wrapper over MeetupCard. */
export function MeetupBanner({
  proposal,
  votes,
  totalMembers,
  myVote,
  onToggleGoing,
  groupName,
}: MeetupBannerProps) {
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
