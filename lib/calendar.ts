import { Linking } from 'react-native';
import * as Calendar from 'expo-calendar';
import type { MeetupProposal } from '@/types';

const DEFAULT_DURATION_MIN = 90;

type MeetupLike = Pick<MeetupProposal, 'scheduled_at' | 'location_name' | 'note'> &
  Partial<Pick<MeetupProposal, 'id'>>;

/** Format a Date as the compact UTC stamp iCal / Google Calendar expect: YYYYMMDDTHHMMSSZ. */
function toUtcStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function meetupTitle(groupName?: string | null): string {
  return groupName ? `møma · ${groupName}` : 'møma meetup';
}

function eventWindow(proposal: MeetupLike): { start: Date; end: Date } {
  const start = new Date(proposal.scheduled_at);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60_000);
  return { start, end };
}

/**
 * Google Calendar "add event" template URL — used as the fallback if the native
 * calendar editor is unavailable or errors.
 */
export function googleCalendarUrl(proposal: MeetupLike, groupName?: string | null): string {
  const { start, end } = eventWindow(proposal);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meetupTitle(groupName),
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
  });
  if (proposal.location_name) params.set('location', proposal.location_name);
  if (proposal.note) params.set('details', proposal.note);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Add a meetup to the user's calendar. Opens the OS-provided "new event" editor
 * (EKEventEditViewController on iOS / the calendar intent on Android),
 * pre-filled — the user picks which account (iCloud / Google / Outlook…) and
 * saves. This system UI needs no calendar permission. Falls back to the Google
 * Calendar web template if the native editor is unavailable (e.g. before the
 * native module is bundled into the dev build) or errors.
 */
export async function addToCalendar(
  proposal: MeetupLike,
  groupName?: string | null,
): Promise<void> {
  const { start, end } = eventWindow(proposal);
  try {
    await Calendar.createEventInCalendarAsync({
      title: meetupTitle(groupName),
      startDate: start,
      endDate: end,
      location: proposal.location_name ?? undefined,
      notes: proposal.note ?? undefined,
    });
  } catch {
    await Linking.openURL(googleCalendarUrl(proposal, groupName));
  }
}
