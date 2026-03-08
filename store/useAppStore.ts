import { create } from 'zustand';
import type { User } from '@/types';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnboarded: false,
  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  reset: () => set({ user: null, isAuthenticated: false, isOnboarded: false }),
}));
