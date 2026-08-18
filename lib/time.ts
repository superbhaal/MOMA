import { currentLocale, type Locale } from '@/lib/i18n';

/**
 * Clock formatting, in one place.
 *
 * The app once had five formatters and three answers for the same instant:
 * "11:00" (24h) on a meetup card, "11:00 AM" on a group card, "11:00 am" on Me,
 * "15:00" in chat. Our tester reads on a 12-hour locale and asked the obvious
 * question of an 11:00 meetup — morning or evening?
 *
 * The fix then was to pin everything to en-US and force 12-hour. Two reasons,
 * and only one of them survives. The ambiguity was real. But the pinning was
 * also protecting the UI from a French phone rendering it in French, and i18n
 * does that job properly now.
 *
 * So the clock follows the reading language, per the client: English keeps
 * 11:00 AM, French and Spanish get 11:00 — which is unambiguous in those
 * locales precisely because 24-hour is what they read.
 *
 * Note this reads the CURRENT language at call time, so a component must
 * re-render to pick up a change. Everything that shows a time also shows
 * translated copy, so useTranslation already re-renders them.
 */

const TAG: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

/**
 * The v11 long form is "Friday 14 August" — weekday, day, month, no comma.
 * French takes the same shape; Spanish needs "de" between the day and the
 * month, and reads wrong without it.
 */
const LONG_DATE: Record<Locale, (wd: string, day: number, mon: string) => string> = {
  en: (wd, day, mon) => `${wd} ${day} ${mon}`,
  fr: (wd, day, mon) => `${wd} ${day} ${mon}`,
  es: (wd, day, mon) => `${wd} ${day} de ${mon}`,
};

function tag(): string {
  return TAG[currentLocale()];
}

/** "11:00 AM" in English, "11:00" in French and Spanish. */
export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  // hour12 is deliberately not passed: the locale decides, which is the point.
  return d.toLocaleTimeString(tag(), { hour: 'numeric', minute: '2-digit' });
}

/** "Friday 14 August · 11:00 AM" / "vendredi 14 août · 11:00". */
export function formatLongWhen(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const loc = currentLocale();
  const wd = d.toLocaleDateString(TAG[loc], { weekday: 'long' });
  const mon = d.toLocaleDateString(TAG[loc], { month: 'long' });
  return `${LONG_DATE[loc](wd, d.getDate(), mon)} · ${formatTime(d)}`;
}

/** "Sat 15 Mar, 11:00 AM" — compact, for cards. Year only when it isn't this one. */
export function formatShortWhen(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString(tag(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
