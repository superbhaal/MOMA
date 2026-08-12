/**
 * Clock formatting, in one place.
 *
 * The app had five formatters and three answers for the same instant: "11:00"
 * (en-GB, 24h) on a meetup card, "11:00 AM" on a group card, "11:00 am" on Me,
 * "15:00" in chat. Our tester reads on a 12-hour locale and asked the obvious
 * question of an 11:00 meetup — morning or evening?
 *
 * So: 12-hour with AM/PM everywhere. The locale stays pinned to en-US (see the
 * i18n fix in d530fa5) so a French phone doesn't render the UI in French; that
 * pinning is also why we can't just let the device decide 12 vs 24.
 */

const LOCALE = 'en-US';

/** "11:00 AM" */
export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** "Friday 14 August · 11:00 AM" — the v11 long form. */
export function formatLongWhen(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const wd = d.toLocaleDateString(LOCALE, { weekday: 'long' });
  const mon = d.toLocaleDateString(LOCALE, { month: 'long' });
  return `${wd} ${d.getDate()} ${mon} · ${formatTime(d)}`;
}

/** "Sat 15 Mar, 11:00 AM" — compact, for cards. Year only when it isn't this one. */
export function formatShortWhen(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
