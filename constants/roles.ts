import type { DiscoverRole } from '@/types';

/**
 * Who wears the Regular badge.
 *
 * Admins wear it too: the client's distinction is between moms who contribute
 * to Explore and moms who read it, and an admin is the former with extra
 * powers. Keeping the rule here rather than repeating `role !== 'reader'` at
 * fourteen call sites means the day she adds a fourth role, there is one line
 * to change.
 */
export function isRegular(role: DiscoverRole | null | undefined): boolean {
  return role === 'contributor' || role === 'admin';
}
