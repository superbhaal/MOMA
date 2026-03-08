import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

export function useAuth() {
  const { user, isAuthenticated, setUser, setAuthenticated, setOnboarded, reset } = useAppStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthenticated(true);
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser(data as User);
      setOnboarded(true);
    } else if (error?.code === 'PGRST116') {
      // No profile yet — user needs onboarding
      setOnboarded(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    reset();
  }

  return { user, isAuthenticated, signOut };
}
