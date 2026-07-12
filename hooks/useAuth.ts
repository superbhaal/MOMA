import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { clearPushTokenInDb } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';
import { userToOnboardingPatch } from './useOnboarding';
import type { User } from '@/types';

// Required so the browser modal closes properly after Google auth on iOS.
WebBrowser.maybeCompleteAuthSession();

// Module-level singleton so `useAuth()` can be called from many components
// without spawning duplicate Supabase subscriptions / Linking listeners.
// (Each duplicate listener was firing fetchProfile and getSession in cascade,
// causing rapid spinner flicker + dozens of SecureStore reads per second.)
let _initialized = false;

// Set true while a "login-only" OAuth flow is verifying account existence.
// signInWithIdToken / exchangeCodeForSession are upserts — they always create
// the session. The listener would then flip isAuthenticated=true and the auth
// gate would route to onboarding before we get to check + signOut. The flag
// makes the listener ignore those transient SIGNED_IN/SIGNED_OUT events.
let _suppressAuthStateChange = false;

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isOnboarded,
    authLoading,
    setUser,
    setAuthenticated,
    setOnboarded,
    setAuthLoading,
    updateOnboarding,
    reset,
  } = useAppStore();

  useEffect(() => {
    if (_initialized) return;
    _initialized = true;

    let mounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        console.log('[init] getSession', { hasSession: !!session?.user, userId: session?.user?.id });

        if (session?.user) {
          setAuthenticated(true);
          // Stale-session check: if the local JWT survives a server-side
          // delete (dev DB purge), fetchProfile finds no row → signOut.
          await fetchProfile(session.user.id, { signOutIfMissing: true });
        } else {
          setAuthenticated(false);
          setOnboarded(false);
        }
      } catch (e) {
        if (!mounted) return;
        setAuthenticated(false);
        setOnboarded(false);
      }
      setAuthLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('[onAuthStateChange]', { event, hasSession: !!session?.user });
        if (_suppressAuthStateChange) return;
        // Startup is owned by init() above. init() awaits getSession(), which
        // refreshes the cached token before returning — so its result is never
        // stale. INITIAL_SESSION, by contrast, delivers the raw pre-refresh
        // session. Handling both raced two fetchProfile() calls at boot, and
        // the INITIAL_SESSION one could query with an about-to-expire token →
        // 401 → user stranded as authenticated-but-not-onboarded. Ignore it;
        // init() covers the cached session.
        if (event === 'INITIAL_SESSION') return;
        if (session?.user) {
          // Hold authLoading high so the auth gate doesn't kick the user to
          // /resume while isOnboarded is still false (it's not been read yet).
          setAuthLoading(true);
          setAuthenticated(true);
          // TOKEN_REFRESHED fires periodically; the row should already exist —
          // if it doesn't, we have an orphan JWT → signOut. SIGNED_IN fires for
          // a fresh login/signup where the public.users row may not exist YET
          // (profile.tsx will create it).
          const signOutIfMissing = event === 'TOKEN_REFRESHED';
          // Defer the PostgREST call OUT of this callback. supabase-js holds an
          // internal auth lock for the whole duration of onAuthStateChange;
          // calling supabase.from(...) here would re-acquire that lock (to attach
          // the token) and deadlock until fetchProfile's 8s timeout fires.
          // setTimeout(…, 0) runs it after the callback returns and the lock is
          // released. See supabase-js docs: never call Supabase inside the
          // auth-state callback.
          setTimeout(async () => {
            if (!mounted) return;
            await fetchProfile(session.user.id, { signOutIfMissing });
            if (mounted) setAuthLoading(false);
          }, 0);
        } else {
          reset();
        }
      },
    );

    function processUrl(url: string | null) {
      if (!url || !mounted) return;
      handleAuthCallback(url).catch(() => {});
    }

    Linking.getInitialURL().then(processUrl);
    const linkingSub = Linking.addEventListener('url', ({ url }) => processUrl(url));

    return () => {
      mounted = false;
      _initialized = false;
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  async function fetchProfile(
    userId: string,
    options?: { signOutIfMissing?: boolean },
  ) {
    try {
      const result = await Promise.race([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        new Promise<{ data: null; error: { message: string } | null }>((resolve) =>
          setTimeout(
            () => resolve({ data: null, error: { message: 'fetchProfile timeout (8s)' } }),
            8000,
          ),
        ),
      ]);

      const { data, error } = result;
      console.log('[fetchProfile]', {
        userId,
        signOutIfMissing: !!options?.signOutIfMissing,
        hasData: !!data,
        error: error?.message ?? null,
      });
      if (data) {
        const u = data as User;
        setUser(u);
        // Hydrate onboardingData from the row so profile + quiz forms pre-fill
        // with previously saved values instead of showing blank inputs.
        updateOnboarding(userToOnboardingPatch(u));
        // Onboarded once the quiz is completed end-to-end.
        // Pre-completion rows exist (auto-save) but are NOT considered onboarded.
        setOnboarded(!!u.life_stage && !!u.profile_color && !!u.primary_language);
      } else if (options?.signOutIfMissing) {
        // We're loading a RESTORED session (cold boot / TOKEN_REFRESHED), so a
        // profile row should already exist. It doesn't load — either because:
        //   • the query succeeded but found no row (auth.users gone server-side,
        //     e.g. a dev DB purge), or
        //   • the query ERRORED (stale/expired-revoked token after sign-out,
        //     paused project, network/timeout).
        // Both mean the session is unusable. Sign out so the auth gate returns
        // to /welcome — do NOT leave the user authenticated-but-not-onboarded,
        // which would strand them on the onboarding/profile screen on every
        // launch.
        setUser(null);
        setOnboarded(false);
        await supabase.auth.signOut();
      } else {
        // No signOutIfMissing → this is a fresh signup: the row isn't created
        // yet (profile.tsx will create it). Route through onboarding/resume →
        // profile so the row gets created. If the auth.users row is actually
        // gone, the upsert in profile.tsx fails with a FK-violation and
        // useOnboarding.saveProgress signs us out cleanly.
        setUser(null);
        setOnboarded(false);
      }
    } catch {
      setUser(null);
      setOnboarded(false);
    }
  }

  async function signUp(email: string, password: string) {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthLoading(false);
      return { error };
    }
    // When email confirmation is ON in Supabase project settings, signUp
    // returns no session (data.session === null) and the user must click an
    // email link before they can sign in. Surface that to the caller so the
    // signup screen can show "check your email".
    const needsEmailConfirmation = !!data.user && !data.session;
    if (data.user && data.session) {
      setAuthenticated(true);
      setOnboarded(false);
    }
    setAuthLoading(false);
    return { error: null, needsEmailConfirmation };
  }

  async function signIn(email: string, password: string) {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthLoading(false);
      return { error };
    }
    if (data.user) {
      setAuthenticated(true);
      await fetchProfile(data.user.id);
    }
    setAuthLoading(false);
    return { error: null };
  }

  async function signInWithApple(options?: { requireExistingAccount?: boolean }) {
    console.log('[Apple] signInWithApple called', options);
    if (Platform.OS !== 'ios') {
      console.log('[Apple] not iOS — abort');
      return { error: { message: 'Apple Sign-In is only available on iOS' } };
    }

    try {
      console.log('[Apple] requesting Apple credential…');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('[Apple] credential received', {
        hasIdentityToken: !!credential.identityToken,
        hasEmail: !!credential.email,
        hasFullName: !!credential.fullName,
        userIdentifier: credential.user,
      });

      if (!credential.identityToken) {
        console.log('[Apple] no identityToken — abort');
        return { error: { message: 'No identity token returned from Apple' } };
      }

      setAuthLoading(true);
      // Suppress the auth-state-change listener so it can't flip isAuthenticated
      // before we've verified the account exists (would cause auth gate to route
      // into onboarding).
      if (options?.requireExistingAccount) _suppressAuthStateChange = true;

      console.log('[Apple] calling supabase.auth.signInWithIdToken…');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      console.log('[Apple] signInWithIdToken result', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userId: data?.user?.id,
        error: error ? { message: error.message, status: (error as any).status } : null,
      });

      if (error) {
        _suppressAuthStateChange = false;
        setAuthLoading(false);
        return { error };
      }

      // Login mode: reject if this is a brand-new auth account (no public.users row).
      // signInWithIdToken is upsert: it creates auth.users if none exists. To honor
      // "login means existing account only", check public.users right after.
      if (data.user && options?.requireExistingAccount) {
        const existing = await checkExistingAccount(data.user.id);
        if (!existing) {
          await supabase.auth.signOut();
          _suppressAuthStateChange = false;
          setAuthLoading(false);
          return { error: { message: 'no account found. tap "no account? sign up" below to create one.' } };
        }
        _suppressAuthStateChange = false;
      }

      if (data.user) {
        setAuthenticated(true);
        await fetchProfile(data.user.id);
      }
      setAuthLoading(false);

      return { error: null, fullName: credential.fullName };
    } catch (e: any) {
      console.log('[Apple] caught error', {
        code: e?.code,
        message: e?.message,
        name: e?.name,
      });
      _suppressAuthStateChange = false;
      setAuthLoading(false);
      if (e.code === 'ERR_REQUEST_CANCELED') {
        return { error: null };
      }
      return { error: { message: e.message } };
    }
  }

  // Returns true if the user has a row in public.users (i.e., this isn't a brand-new
  // auth.users record just created by an OAuth upsert).
  async function checkExistingAccount(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    return !!data;
  }

  async function signInWithGoogle(options?: { requireExistingAccount?: boolean }) {
    setAuthLoading(true);
    try {
      // Build the redirect URL: in dev (Expo Go) it's an exp:// proxy, in standalone it's moma://auth/callback.
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'moma',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) {
        setAuthLoading(false);
        return { error };
      }
      if (!data?.url) {
        setAuthLoading(false);
        return { error: { message: 'No OAuth URL returned by Supabase.' } };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        // User dismissed or cancelled — not an error.
        setAuthLoading(false);
        return { error: null };
      }

      // Supabase returns the auth code as a query param on the redirect.
      const url = new URL(result.url);
      // Surface a real OAuth error if the provider/Supabase bounced back with
      // one — it can arrive in either the query string or the URL fragment.
      // (Otherwise a failed login looks like a bland "missing code param".)
      const frag = result.url.includes('#')
        ? new URLSearchParams(result.url.slice(result.url.indexOf('#') + 1))
        : new URLSearchParams();
      const oauthError =
        url.searchParams.get('error_description') ||
        url.searchParams.get('error') ||
        frag.get('error_description') ||
        frag.get('error');
      if (oauthError) {
        setAuthLoading(false);
        return { error: { message: oauthError } };
      }
      const code = url.searchParams.get('code');
      if (!code) {
        setAuthLoading(false);
        return { error: { message: 'OAuth callback missing code param.' } };
      }

      // Same suppression rationale as signInWithApple: prevent the auth state
      // change listener from routing into onboarding before we've verified.
      if (options?.requireExistingAccount) _suppressAuthStateChange = true;

      const { data: exchanged, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) {
        _suppressAuthStateChange = false;
        setAuthLoading(false);
        return { error: exErr };
      }

      // Login mode: reject if no public.users row exists for this auth user.
      if (exchanged?.user && options?.requireExistingAccount) {
        const existing = await checkExistingAccount(exchanged.user.id);
        if (!existing) {
          await supabase.auth.signOut();
          _suppressAuthStateChange = false;
          setAuthLoading(false);
          return { error: { message: 'no account found. tap "no account? sign up" below to create one.' } };
        }
        _suppressAuthStateChange = false;
      }

      if (exchanged?.user) {
        setAuthenticated(true);
        await fetchProfile(exchanged.user.id);
      }
      setAuthLoading(false);
      return { error: null };
    } catch (e: any) {
      _suppressAuthStateChange = false;
      setAuthLoading(false);
      return { error: { message: e?.message ?? 'Google sign-in failed.' } };
    }
  }

  async function signOut() {
    // Clear the push token while still authenticated (RLS allows updating own
    // row) so this device stops receiving pushes after sign-out.
    const uid = useAppStore.getState().user?.id;
    if (uid) await clearPushTokenInDb(uid);
    await supabase.auth.signOut();
    reset();
  }

  /**
   * Delete the user's account: best-effort removal of all owned rows, then the
   * profile row, then sign out (clears the local session). The auth.users record
   * is left for a server-side cleanup job — the app only holds the anon key, so it
   * cannot remove auth identities directly.
   */
  async function deleteAccount() {
    const { data: sessionData } = await supabase.auth.getUser();
    const uid = sessionData.user?.id;
    if (!uid) {
      await signOut();
      return { error: null };
    }
    await supabase.from('saved_tips').delete().eq('user_id', uid);
    await supabase.from('matching_queue').delete().eq('user_id', uid);
    await supabase.from('availability_slots').delete().eq('user_id', uid);
    await supabase.from('match_decline_reasons').delete().eq('user_id', uid);
    await supabase.from('group_members').delete().eq('user_id', uid);
    const { error } = await supabase.from('users').delete().eq('id', uid);
    await signOut();
    return { error };
  }

  /**
   * Parse an inbound deep link / Universal Link URL and turn it into a session.
   * Accepts both schemes:
   *  - moma://...                       (custom-scheme deep link)
   *  - https://joinmoma.org/auth/...    (Universal Link, registered via AASA)
   * Handles two Supabase confirmation-email flows:
   *  - Implicit (default magic link): URL fragment carries access_token + refresh_token
   *  - PKCE (custom template using {{ .TokenHash }}): query string carries token_hash + type
   * Returns true if a session was established, false otherwise.
   */
  async function handleAuthCallback(url: string): Promise<boolean> {
    const isAuthUrl =
      url.startsWith('moma://') ||
      url.startsWith('https://joinmoma.org/auth/');
    if (!isAuthUrl) return false;

    // 1) Implicit flow — hash fragment.
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const params = new URLSearchParams(url.slice(hashIndex + 1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        setAuthLoading(true);
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (!error && data.user) {
          setAuthenticated(true);
          await fetchProfile(data.user.id);
        }
        setAuthLoading(false);
        return !error;
      }
    }

    // 2) PKCE flow — token_hash + type in the query string.
    const queryStart = url.indexOf('?');
    const queryEnd = hashIndex === -1 ? undefined : hashIndex;
    if (queryStart !== -1) {
      const query = url.slice(queryStart + 1, queryEnd);
      const params = new URLSearchParams(query);
      const token_hash = params.get('token_hash');
      const type = params.get('type');
      if (token_hash && type) {
        setAuthLoading(true);
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });
        if (!error && data?.user) {
          setAuthenticated(true);
          await fetchProfile(data.user.id);
        }
        setAuthLoading(false);
        return !error;
      }
    }

    return false;
  }

  /** Re-send the signup confirmation email (in case the first one was lost). */
  async function resendConfirmationEmail(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error };
  }

  return {
    user,
    isAuthenticated,
    isOnboarded,
    authLoading,
    signUp,
    signIn,
    signInWithApple,
    signInWithGoogle,
    handleAuthCallback,
    resendConfirmationEmail,
    signOut,
    deleteAccount,
    fetchProfile,
  };
}
