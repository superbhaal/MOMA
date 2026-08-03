import type { MeetupProposal } from '@/types';

/**
 * A meetup whose time has come and gone. `expire-proposals` flips these to
 * `expired` on the hour, so between the meetup and that sweep a proposal is
 * still `open`/`decided` while being firmly in the past — every surface has to
 * judge by the clock, not by the state alone. Without this a past meetup kept
 * counting down as "Today" forever.
 */
export function isPastMeetup(proposal: Pick<MeetupProposal, 'scheduled_at' | 'state'>): boolean {
  if (proposal.state === 'expired') return true;
  return new Date(proposal.scheduled_at).getTime() < Date.now();
}

/**
 * True while the group has a meetup still ahead of it — the only case where
 * blocking out dates has nothing left to change.
 */
export function hasUpcomingMeetup(
  proposal: Pick<MeetupProposal, 'scheduled_at' | 'state'> | null | undefined,
): boolean {
  return !!proposal && !isPastMeetup(proposal);
}
