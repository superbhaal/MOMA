import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';

/**
 * Language resolution.
 *
 * The client listed the three sources in the order they become available — OS,
 * then the onboarding answer, then a settings toggle. The RESOLUTION order is
 * the reverse of that, and getting it backwards is the classic bug in this
 * feature: an explicit choice has to win, or the app quietly overwrites her
 * setting on every launch.
 *
 *   1. explicit choice in Settings   (stored locally, wins outright)
 *   2. users.primary_language        (from onboarding, only a default)
 *   3. the OS language
 *   4. English
 *
 * Anything outside en/fr/es falls to English at whichever step produced it.
 *
 * Note on (2): primary_language is not a UI preference. It is the language she
 * SPEAKS, collected for matching, and stored as 'English'/'French'/'Spanish'
 * rather than as a code. A Spanish speaker in Amsterdam may well want the app
 * in English. So it seeds the default and never overrides a real choice.
 */

export const SUPPORTED = ['en', 'fr', 'es'] as const;
export type Locale = (typeof SUPPORTED)[number];

const STORAGE_KEY = 'moma.locale';

/** Narrow anything — OS tag, DB value, stale storage — to a locale we ship. */
export function coerceLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const head = raw.trim().toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED as readonly string[]).includes(head) ? (head as Locale) : null;
}

/** 'French' → 'fr'. The onboarding answer is a display name, not a code. */
const FROM_LANGUAGE_NAME: Record<string, Locale> = {
  english: 'en',
  french: 'fr',
  français: 'fr',
  francais: 'fr',
  spanish: 'es',
  español: 'es',
  espanol: 'es',
};

export function localeFromLanguageName(name: string | null | undefined): Locale | null {
  if (!name) return null;
  return FROM_LANGUAGE_NAME[name.trim().toLowerCase()] ?? null;
}

export function osLocale(): Locale {
  return coerceLocale(getLocales()[0]?.languageCode) ?? 'en';
}

let explicitChoice: Locale | null = null;

/** True once she has picked a language herself — the DB must not override it. */
export function hasExplicitChoice(): boolean {
  return explicitChoice !== null;
}

/**
 * Boot with what we can know synchronously-ish: her stored choice, else the OS.
 * The profile isn't loaded yet at this point, so step 2 is applied later by
 * `applyProfileLanguage`.
 */
export async function initI18n(): Promise<Locale> {
  const stored = coerceLocale(await AsyncStorage.getItem(STORAGE_KEY).catch(() => null));
  explicitChoice = stored;
  const initial = stored ?? osLocale();

  await i18n.use(initReactI18next).init({
    resources: { en: { t: en }, fr: { t: fr }, es: { t: es } },
    lng: initial,
    fallbackLng: 'en',
    defaultNS: 't',
    ns: ['t'],
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return initial;
}

/**
 * Step 2, run once the profile is available. A no-op when she has already
 * chosen on THIS device — that's the whole point of the ordering.
 *
 * `users.locale` is itself an explicit choice, just one she made on another
 * device, so it outranks primary_language and is adopted locally: her setting
 * follows her to a new phone instead of being silently re-derived.
 */
export async function applyProfileLanguage(profile: {
  locale?: string | null;
  primary_language?: string | null;
} | null | undefined) {
  if (explicitChoice) return;

  const chosenElsewhere = coerceLocale(profile?.locale);
  if (chosenElsewhere) {
    await setLocale(chosenElsewhere);
    return;
  }

  const fromProfile = localeFromLanguageName(profile?.primary_language);
  if (fromProfile && fromProfile !== i18n.language) {
    await i18n.changeLanguage(fromProfile);
  }
}

/** Step 1. Persists, and takes precedence from here on. */
export async function setLocale(locale: Locale) {
  explicitChoice = locale;
  await AsyncStorage.setItem(STORAGE_KEY, locale).catch(() => {});
  await i18n.changeLanguage(locale);
}

/** Clears the explicit choice and falls back down the chain again. */
export async function clearLocaleChoice(primaryLanguage?: string | null) {
  explicitChoice = null;
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  await i18n.changeLanguage(localeFromLanguageName(primaryLanguage) ?? osLocale());
}

export function currentLocale(): Locale {
  return coerceLocale(i18n.language) ?? 'en';
}

export default i18n;
