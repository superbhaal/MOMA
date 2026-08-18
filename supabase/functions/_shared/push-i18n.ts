/**
 * Notification copy, in the reader's language.
 *
 * Translating the app does not translate these: they are composed here, on the
 * server, where expo-localization and the phone's settings are both out of
 * reach. The only signal available is users.locale — the column exists for
 * exactly this — and it is null until she picks a language, which is why every
 * lookup falls back to English rather than failing.
 *
 * Deliberately a plain table rather than i18next: the runtime is Deno, the
 * strings are a dozen, and pulling a library in to resolve them would cost more
 * than it saves. It does mean the copy lives in two places — here and in
 * locales/*.json — so a change to a push message has to be made twice. That is
 * a real cost, accepted because merging them would mean shipping the app's
 * whole string catalogue to the edge runtime.
 */

export type PushLocale = 'en' | 'fr' | 'es';

export function asLocale(raw: string | null | undefined): PushLocale {
  return raw === 'fr' || raw === 'es' ? raw : 'en';
}

type Dict = Record<string, string>;

const STRINGS: Record<PushLocale, Dict> = {
  en: {
    matchTitle: 'Your group is ready',
    matchBody: 'We matched you with {who} in {hood}. Tap to meet them.',
    matchBodyWeeks: 'We matched you with {who} in {hood}, all at {weeks}. Tap to meet them.',
    momOne: '1 mom',
    momMany: '{n} moms',
    weekOne: 'week {lo}',
    weekRange: 'week {lo}–{hi}',

    lockedTitle: "It's locked in · {group}",
    lockedBody: '{when}{place}. See you there.',

    freeTitle: 'when are you free?',
    freeBody: 'tap to mark your week so we can plan good meetups.',

    quietTitle: 'still your village?',
    quietBody: '{group} has been quiet for a month. want to keep it or find a new one?',
    yourGroup: 'your group',

    sharedPlace: '📍 shared a place',
    suggestedMeetup: 'suggested a meetup',
    sentMessage: 'sent a message',
  },
  fr: {
    matchTitle: 'Votre groupe est prêt',
    matchBody: 'Nous vous avons réunie avec {who} à {hood}. Touchez pour les rencontrer.',
    matchBodyWeeks: 'Nous vous avons réunie avec {who} à {hood}, toutes en {weeks}. Touchez pour les rencontrer.',
    momOne: '1 maman',
    momMany: '{n} mamans',
    weekOne: 'semaine {lo}',
    weekRange: 'semaine {lo}–{hi}',

    lockedTitle: 'C’est confirmé · {group}',
    lockedBody: '{when}{place}. À bientôt.',

    freeTitle: 'quand êtes-vous libre ?',
    freeBody: 'touchez pour marquer votre semaine, qu’on organise de bonnes rencontres.',

    quietTitle: 'toujours votre village ?',
    quietBody: '{group} est calme depuis un mois. vous le gardez, ou vous en cherchez un autre ?',
    yourGroup: 'votre groupe',

    sharedPlace: '📍 a partagé un lieu',
    suggestedMeetup: 'a proposé une rencontre',
    sentMessage: 'a envoyé un message',
  },
  es: {
    matchTitle: 'Tu grupo está listo',
    matchBody: 'Te juntamos con {who} en {hood}. Toca para conocerlas.',
    matchBodyWeeks: 'Te juntamos con {who} en {hood}, todas en {weeks}. Toca para conocerlas.',
    momOne: '1 madre',
    momMany: '{n} madres',
    weekOne: 'semana {lo}',
    weekRange: 'semana {lo}–{hi}',

    lockedTitle: 'Confirmado · {group}',
    lockedBody: '{when}{place}. Nos vemos.',

    freeTitle: '¿cuándo tienes hueco?',
    freeBody: 'toca para marcar tu semana y organizamos buenos encuentros.',

    quietTitle: '¿sigue siendo tu gente?',
    quietBody: '{group} lleva un mes en silencio. ¿lo mantienes o buscas otro?',
    yourGroup: 'tu grupo',

    sharedPlace: '📍 compartió un sitio',
    suggestedMeetup: 'propuso un encuentro',
    sentMessage: 'envió un mensaje',
  },
};

/** Look up a key in `locale`, falling back to English, and fill {placeholders}. */
export function pt(
  locale: PushLocale,
  key: string,
  params: Record<string, string | number> = {},
): string {
  const raw = STRINGS[locale][key] ?? STRINGS.en[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_m, k) => String(params[k] ?? ''));
}

/** Dates in a push follow the reader's language too — 24h in fr/es, as in the app. */
export const BCP47: Record<PushLocale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};
