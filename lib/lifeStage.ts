import type { LifeStage } from '@/types';

/**
 * Derive a user's life stage from their baby's date of birth (or due date).
 * Boundaries are inclusive of the older side, mirroring the mockup copy:
 *   - expecting:   dob is in the future (due date)
 *   - newborn:     0 – 6 months
 *   - growing:     6 months – 2 years
 *   - veteran:     2 years +
 *
 * The function is pure so it can be used in onboarding screens, in the matcher,
 * and in a future scheduled refresh job (a baby grows out of "newborn" without
 * the user doing anything).
 */
export function lifeStageFromDob(babyDob: string, now: Date = new Date()): LifeStage {
  const dob = new Date(babyDob);
  if (Number.isNaN(dob.getTime())) return 'newborn'; // safe fallback

  if (dob.getTime() > now.getTime()) return 'expecting';

  const monthsOld = monthsBetween(dob, now);
  if (monthsOld < 6) return 'newborn';
  if (monthsOld < 24) return 'growing';
  return 'veteran';
}

function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const days = to.getDate() - from.getDate();
  // Subtract one if we haven't reached the day-of-month yet in the current month.
  return years * 12 + months - (days < 0 ? 1 : 0);
}
