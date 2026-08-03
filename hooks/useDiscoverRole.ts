import { useAuth } from '@/hooks/useAuth';
import type { DiscoverRole } from '@/types';

export type { DiscoverRole };

/**
 * The current user's Discover write-access role. `canPost` gates the compose FAB
 * (contributor + admin); readers get the explanatory banner instead. Role is
 * granted server-side (manual admin promotion) — never inferred client-side.
 */
export function useDiscoverRole(): { role: DiscoverRole; canPost: boolean; isAdmin: boolean } {
  const { user } = useAuth();
  const role = ((user?.role as DiscoverRole) ?? 'reader');
  return {
    role,
    canPost: role === 'contributor' || role === 'admin',
    isAdmin: role === 'admin',
  };
}
