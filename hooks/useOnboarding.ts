import i18n from '@/lib/i18n';
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { LifeStage, User } from '@/types';

/**
 * Auto-save helper for onboarding.
 * Profile + every quiz step calls saveProgress(partial) which UPSERTs the row.
 * The store mirrors what's on the server so the next step can read it back.
 */
export function useOnboarding() {
  const { onboardingData, updateOnboarding, setUser, setOnboarded } = useAppStore();

  const saveProgress = useCallback(
    async (partial: Partial<UserUpsertPatch>) => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const userId = sessionRes.session?.user.id;
      const email = sessionRes.session?.user.email;
      if (!userId) {
        return { error: { message: 'No active session — cannot save onboarding.' } };
      }

      updateOnboarding(toStorePatch(partial));

      const { data, error } = await supabase
        .from('users')
        .upsert({ id: userId, email, ...partial }, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (error) {
        if ((error as any).code === '23503') {
          await supabase.auth.signOut();
          return {
            error: { message: i18n.t('misc.sessionExpired') },
          };
        }
        return { error };
      }
      if (data) {
        setUser(data as User);
        setOnboarded(isComplete(data as User));
      }
      return { error: null, user: data as User };
    },
    [updateOnboarding, setUser, setOnboarded],
  );

  const getResumeRoute = useCallback(
    (u: User | null): ResumeRoute => getQuizProgress(u).nextRoute,
    [],
  );

  return { onboardingData, saveProgress, getResumeRoute, getQuizProgress };
}

/**
 * Inspect the user row and return how many of the 4 quiz questions have been
 * answered, plus the route + label of the next missing one. Drives the resume
 * screen ("you answered N of 4 · next up: …") and the auth gate.
 *
 * Profile (display_name) is a precondition — if missing, route to /profile and
 * `answered` stays at 0. Baby DOB used to be on Profile but is now Q2 of the
 * quiz, so it's counted as a quiz step.
 */
export interface QuizProgress {
  /** 0…4 — how many of the 4 quiz steps have been completed. */
  answered: number;
  nextRoute: ResumeRoute;
  /** Human label for the next missing step, e.g. "pick your colour". */
  nextLabel: string;
}

export const TOTAL_QUIZ_STEPS = 4;

export function getQuizProgress(u: User | null): QuizProgress {
  if (!u || !u.display_name) {
    return {
      answered: 0,
      nextRoute: '/(auth)/onboarding/profile',
      nextLabel: 'Profile basics',
    };
  }
  if (u.is_first_baby === null || u.is_first_baby === undefined) {
    return {
      answered: 0,
      nextRoute: '/(auth)/onboarding/q1',
      nextLabel: 'first baby?',
    };
  }
  if (!u.baby_dob) {
    return {
      answered: 1,
      nextRoute: '/(auth)/onboarding/q2',
      nextLabel: 'baby’s date of birth',
    };
  }
  if (!u.primary_language) {
    return {
      answered: 2,
      nextRoute: '/(auth)/onboarding/q3',
      nextLabel: 'languages',
    };
  }
  if (!u.profile_color) {
    return {
      answered: 3,
      nextRoute: '/(auth)/onboarding/q4',
      nextLabel: 'pick your colour',
    };
  }
  return {
    answered: 4,
    nextRoute: '/(auth)/onboarding/final',
    nextLabel: 'Final',
  };
}

export interface UserUpsertPatch {
  display_name?: string;
  last_name?: string | null;
  age?: number | null;
  baby_dob?: string;
  city?: string | null;
  neighbourhood?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bio?: string | null;
  interests?: string[];
  instagram_handle?: string | null;
  avatar_url?: string | null;

  life_stage?: LifeStage; // derived from baby_dob
  is_first_baby?: boolean;
  primary_language?: string;
  secondary_languages?: string[];
  profile_color?: string;
}

type ResumeRoute =
  | '/(auth)/onboarding/profile'
  | '/(auth)/onboarding/q1'
  | '/(auth)/onboarding/q2'
  | '/(auth)/onboarding/q3'
  | '/(auth)/onboarding/q4'
  | '/(auth)/onboarding/final';

function isComplete(u: User): boolean {
  return !!u.life_stage && !!u.profile_color && !!u.primary_language;
}

export function userToOnboardingPatch(u: User) {
  return {
    displayName: u.display_name ?? '',
    lastName: u.last_name ?? null,
    age: u.age ?? null,
    babyDob: u.baby_dob ?? '',
    city: u.city ?? null,
    neighbourhood: u.neighbourhood ?? null,
    address: u.address ?? null,
    latitude: u.latitude ?? null,
    longitude: u.longitude ?? null,
    bio: u.bio ?? null,
    interests: u.interests ?? [],
    instagramHandle: u.instagram_handle ?? null,
    avatarUrl: u.avatar_url ?? null,
    kidCount: u.kid_count ?? null,
    lifeStage: u.life_stage ?? null,
    recurringAvailability: u.recurring_availability ?? null,
    isFirstBaby: u.is_first_baby ?? null,
    primaryLanguage: u.primary_language ?? null,
    secondaryLanguages: u.secondary_languages ?? [],
    profileColor: u.profile_color ?? null,
  };
}

function toStorePatch(p: Partial<UserUpsertPatch>) {
  return {
    ...(p.display_name !== undefined && { displayName: p.display_name }),
    ...(p.last_name !== undefined && { lastName: p.last_name }),
    ...(p.age !== undefined && { age: p.age }),
    ...(p.baby_dob !== undefined && { babyDob: p.baby_dob }),
    ...(p.city !== undefined && { city: p.city }),
    ...(p.neighbourhood !== undefined && { neighbourhood: p.neighbourhood }),
    ...(p.address !== undefined && { address: p.address }),
    ...(p.latitude !== undefined && { latitude: p.latitude }),
    ...(p.longitude !== undefined && { longitude: p.longitude }),
    ...(p.bio !== undefined && { bio: p.bio }),
    ...(p.interests !== undefined && { interests: p.interests }),
    ...(p.instagram_handle !== undefined && { instagramHandle: p.instagram_handle }),
    ...(p.avatar_url !== undefined && { avatarUrl: p.avatar_url }),
    ...(p.life_stage !== undefined && { lifeStage: p.life_stage }),
    ...(p.is_first_baby !== undefined && { isFirstBaby: p.is_first_baby }),
    ...(p.primary_language !== undefined && { primaryLanguage: p.primary_language }),
    ...(p.secondary_languages !== undefined && { secondaryLanguages: p.secondary_languages }),
    ...(p.profile_color !== undefined && { profileColor: p.profile_color }),
  };
}
