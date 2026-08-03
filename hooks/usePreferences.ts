import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { BabyAtMeetups, NotifChatCadence, User } from '@/types';

export interface PreferencesPatch {
  // Hard filters
  pref_age_window_weeks?: number;
  pref_distance_minutes?: number;
  primary_language?: string;
  // Soft signals
  secondary_languages?: string[];
  pref_free_blocks?: string[];
  pref_baby_at_meetups?: BabyAtMeetups;
  pref_meetup_formats?: string[];
  // Notifications
  notif_meetup_reminders?: boolean;
  notif_email?: boolean;
  notif_in_app?: boolean;
  notif_chat_activity?: NotifChatCadence;
  notif_quiet_hours_enabled?: boolean;
  notif_quiet_start?: string;
  notif_quiet_end?: string;
  // Editable profile fields
  display_name?: string;
  bio?: string | null;
  interests?: string[] | null;
  is_first_baby?: boolean;
  is_mentor_eligible?: boolean;
  baby_dob?: string;
  life_stage?: string;
  profile_color?: string;
  instagram_handle?: string | null;
  address?: string | null;
  city?: string | null;
  neighbourhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  avatar_url?: string | null;
  // State
  paused_until?: string | null;
}

/**
 * Read + write the matching prefs columns on `users`.
 * Changes apply to the next match, never to currently matched groups.
 */
export function usePreferences() {
  const { user, fetchProfile } = useAuth();

  const update = useCallback(
    async (patch: PreferencesPatch) => {
      if (!user) return { error: { message: 'not authenticated' } };
      const { data, error } = await supabase
        .from('users')
        .update(patch)
        .eq('id', user.id)
        .select('*')
        .maybeSingle();
      if (!error && data) {
        // Refresh the user state in the store so screens re-render.
        await fetchProfile(user.id);
      }
      return { error, user: data as User | null };
    },
    [user?.id, fetchProfile],
  );

  /** Convenience: pause matching by N days (or unset with null). */
  const pauseFor = useCallback(
    async (days: number | null) => {
      let pausedUntil: string | null = null;
      if (days !== null) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        pausedUntil = d.toISOString();
      }
      return update({ paused_until: pausedUntil });
    },
    [update],
  );

  return {
    prefs: user
      ? {
          pref_age_window_weeks: user.pref_age_window_weeks,
          pref_distance_minutes: user.pref_distance_minutes,
          pref_baby_at_meetups: user.pref_baby_at_meetups,
          pref_meetup_formats: user.pref_meetup_formats,
          pref_free_blocks: user.pref_free_blocks,
          primary_language: user.primary_language,
          secondary_languages: user.secondary_languages ?? [],
          paused_until: user.paused_until,
          address: user.address,
          city: user.city,
          neighbourhood: user.neighbourhood,
          latitude: user.latitude,
          longitude: user.longitude,
        }
      : null,
    update,
    pauseFor,
  };
}
