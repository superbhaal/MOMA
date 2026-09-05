/**
 * Baby-age formatting helpers for the Me profile header.
 *
 * These were pinned to English — 'Baby born Aug 22 · Week 1' rendered exactly
 * like that on a Spanish phone, which is what our tester reported. Home already
 * had a translated twin of this logic inline; this is the version Me uses, and
 * both now read from the same keys where they overlap.
 */
import type { TFunction } from 'i18next';
import { localeTag } from '@/lib/time';

/** "Feb 28" / "28 févr." / "28 feb" — short month + day, in the reading language. */
export function babyBornLabel(dob: string | null | undefined): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(localeTag(), { month: 'short', day: 'numeric' });
}

/** "Week 3" / "3 months" / "1 year" — concise age chip. Null before the birth,
 *  where the due date in the line before already says everything. */
export function babyAgeShort(dob: string | null | undefined, t: TFunction): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days < 7 * 12) return t('me.weekN', { count: Math.max(1, Math.floor(days / 7)) });
  if (days < 365 * 2) return t('home.monthsIn', { count: Math.floor(days / 30) });
  return t('home.yearsIn', { count: Math.floor(days / 365) });
}

/**
 * Full meta line for the Me header:
 * "Baby born 28 Feb · Week 3 · Jordaan" (parts omitted gracefully when missing).
 */
export function babyMetaLine(
  dob: string | null | undefined,
  neighbourhood: string | null | undefined,
  t: TFunction,
): string {
  const born = babyBornLabel(dob);
  const future = dob ? new Date(dob).getTime() > Date.now() : false;
  const age = future ? null : babyAgeShort(dob, t);
  const parts: string[] = [];
  if (born) parts.push(t(future ? 'me.dueOn' : 'me.bornOn', { date: born }));
  if (age) parts.push(age);
  if (neighbourhood) parts.push(neighbourhood);
  return parts.join(' · ');
}

/**
 * The compact form for a row: "Baby: 3w", "Due in 2w".
 *
 * GroupPreviewCard and MemberRow each carried their own private copy of this,
 * both hardcoded in English and subtly different from each other — one said
 * "Baby: 5d", the other "5 days" behind a separate "Baby:" label, so the
 * expecting case read "Baby: expecting · 3w left". One function, one wording,
 * and the plural where French and Spanish need one.
 */
export function babyAgeCompact(
  dob: string | null | undefined,
  stage: string | null | undefined,
  t: TFunction,
): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (stage === 'expecting' || days < 0) {
    return t('grp.dueInW', { count: Math.max(1, Math.ceil(Math.abs(days) / 7)) });
  }
  if (days < 14) return t('grp.babyDays', { count: days });
  if (days < 90) return t('grp.babyWeeks', { count: Math.floor(days / 7) });
  if (days < 365 * 2) return t('grp.babyMonths', { count: Math.floor(days / 30) });
  return t('grp.babyYears', { count: Math.floor(days / 365) });
}
