import { create } from 'zustand';
import type {
  KidCount,
  LifeStage,
  RecurringAvailability,
  User,
} from '@/types';

// Onboarding accumulator. Mirrors the 5-step quiz fields on `users`.
// Persisted to Supabase on every step (auto-save) — also kept in memory here
// so a step can read what the previous step wrote without an extra round-trip.
export interface OnboardingData {
  // Sign-up basics
  email: string;
  password: string;
  displayName: string;
  lastName: string | null;
  age: number | null;
  babyDob: string; // ISO date
  city: string | null;
  neighbourhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  bio: string | null;
  interests: string[];
  instagramHandle: string | null;
  avatarUrl: string | null;

  // Quiz (q0 → q4)
  kidCount: KidCount | null;
  // life_stage is derived from babyDob at save-time (not user-selected).
  lifeStage: LifeStage | null;
  recurringAvailability: RecurringAvailability | null;
  isFirstBaby: boolean | null;
  primaryLanguage: string | null;
  secondaryLanguages: string[];
  profileColor: string | null; // hex
}

const EMPTY_ONBOARDING: OnboardingData = {
  email: '',
  password: '',
  displayName: '',
  lastName: null,
  age: null,
  babyDob: '',
  city: null,
  neighbourhood: null,
  address: null,
  latitude: null,
  longitude: null,
  bio: null,
  interests: [],
  instagramHandle: null,
  avatarUrl: null,

  kidCount: null,
  lifeStage: null,
  recurringAvailability: null,
  isFirstBaby: null,
  primaryLanguage: null,
  secondaryLanguages: [],
  profileColor: null,
};

// Which of the two Discover feeds is showing. It lives here rather than in the
// screen because Explore is a sibling route: tapping "Watch" from the map has
// to land on the feed already in the stack AND tell it which chip was tapped.
export type DiscoverFeedTab = 'learn' | 'watch';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  authLoading: boolean;

  // Onboarding accumulator
  onboardingData: OnboardingData;

  // Discover
  discoverFeedTab: DiscoverFeedTab;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  setAuthLoading: (value: boolean) => void;
  updateOnboarding: (partial: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;
  setDiscoverFeedTab: (tab: DiscoverFeedTab) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnboarded: false,
  authLoading: true,
  onboardingData: { ...EMPTY_ONBOARDING },
  discoverFeedTab: 'learn',

  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  updateOnboarding: (partial) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, ...partial },
    })),
  resetOnboarding: () => set({ onboardingData: { ...EMPTY_ONBOARDING } }),
  setDiscoverFeedTab: (discoverFeedTab) => set({ discoverFeedTab }),
  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      authLoading: false,
      onboardingData: { ...EMPTY_ONBOARDING },
      discoverFeedTab: 'learn',
    }),
}));
