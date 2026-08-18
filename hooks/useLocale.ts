import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import {
  clearLocaleChoice,
  currentLocale,
  hasExplicitChoice,
  setLocale,
  type Locale,
} from '@/lib/i18n';

/**
 * The language setting, as the UI needs it.
 *
 * Reads through useTranslation rather than holding its own state: i18next is
 * already the source of truth and already re-renders every subscriber on
 * change, so a parallel copy could only ever disagree with it.
 *
 * Writes go to two places. Locally, so the choice survives a restart and is
 * available before any network call; and to users.locale, so the SERVER can
 * compose push notifications in the right language and the choice follows her
 * to a new phone. The local write is awaited, the remote one is not — the
 * interface should not wait on the network to change language.
 */
export function useLocale() {
  const { i18n } = useTranslation();

  const persistRemote = useCallback((userId: string | undefined, value: Locale | null) => {
    if (!userId) return;
    void supabase
      .from('users')
      .update({ locale: value, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .then(({ error }) => {
        // Non-fatal: the app is already in the right language. Only the
        // server-composed notifications would lag until the next change.
        if (error) console.warn('[locale] remote save failed', error.message);
      });
  }, []);

  const choose = useCallback(
    async (locale: Locale, userId?: string) => {
      await setLocale(locale);
      persistRemote(userId, locale);
    },
    [persistRemote],
  );

  /** Drop back to the OS (via her onboarding language, if she gave one). */
  const followSystem = useCallback(
    async (userId?: string, primaryLanguage?: string | null) => {
      await clearLocaleChoice(primaryLanguage);
      persistRemote(userId, null);
    },
    [persistRemote],
  );

  return {
    locale: currentLocale(),
    isExplicit: hasExplicitChoice(),
    choose,
    followSystem,
    // Referenced so the hook re-runs when i18next switches language; without it
    // `locale` above would be read once and never refreshed.
    _lng: i18n.language,
  };
}
