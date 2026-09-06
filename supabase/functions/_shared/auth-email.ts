/**
 * Auth email copy and markup, in the reader's language.
 *
 * Supabase's own templates are one language per project, which is why this
 * exists: the app went trilingual and the emails did not, so a French mother
 * received "Reset Your Password". The Send Email Hook is the only way round
 * that — it hands us the send, and we pick the language from users.locale.
 *
 * Same trade as _shared/push-i18n.ts: a plain table rather than i18next,
 * because the runtime is Deno and this is a few dozen strings. It does mean the
 * copy lives here AND in supabase/email-templates/*.html, which stay as the
 * fallback if the hook is ever switched off. Change one, change the other.
 *
 * The link deliberately goes through {site}/auth/confirm rather than straight
 * to <ref>.supabase.co. Our first real reset email landed in Gmail's spam with
 * the red "may be dangerous" banner, and a sender domain that does not match
 * the destination domain is one of the strongest phishing signals there is.
 * Routing through joinmoma.org fixes that AND lets the Universal Link open the
 * app directly — handleAuthCallback's PKCE branch already reads token_hash+type.
 */

import { renderShell } from './email-shell.ts';

export type Locale = 'en' | 'fr' | 'es';

export function asLocale(raw: string | null | undefined): Locale {
  return raw === 'fr' || raw === 'es' ? raw : 'en';
}

/** Onboarding stores a language NAME, not a code — the matcher compares on it. */
export function localeFromLanguageName(name: string | null | undefined): Locale | null {
  const n = (name ?? '').trim().toLowerCase();
  if (n === 'french' || n === 'français' || n === 'francais') return 'fr';
  if (n === 'spanish' || n === 'español' || n === 'espanol') return 'es';
  if (n === 'english' || n === 'anglais' || n === 'inglés') return 'en';
  return null;
}

type Copy = {
  subject: string;
  heading: string;
  body: string;
  cta: string;
  expiry: string;
  footer: string;
};

/** Supabase's email_action_type values we actually send for. */
export type Action = 'signup' | 'recovery' | 'magiclink' | 'email_change';

const COPY: Record<Locale, Record<Action, Copy>> = {
  en: {
    signup: {
      subject: 'Confirm your email address',
      heading: 'one last thing',
      body: 'You&rsquo;re nearly at the table. Confirm this address and we&rsquo;ll start looking for moms near you, at the same stage.',
      cta: 'CONFIRM MY EMAIL',
      expiry: 'This link works once, and expires in 24 hours.',
      footer: 'If you didn&rsquo;t sign up for m&oslash;ma, you can ignore this &mdash; no account is created until the link is used.',
    },
    recovery: {
      subject: 'Reset your password',
      heading: 'a new password',
      body: 'Someone &mdash; we hope you &mdash; asked to reset the password for this address. Choose a new one and you&rsquo;re back in.',
      cta: 'CHOOSE A NEW PASSWORD',
      expiry: 'This link works once, and expires in one hour.',
      footer: 'If this wasn&rsquo;t you, ignore this email. Your password stays as it is, and nobody can get in with this link alone.',
    },
    magiclink: {
      subject: 'Your sign-in link',
      heading: 'your way in',
      body: 'Tap below and you&rsquo;re signed in. No password needed.',
      cta: 'SIGN ME IN',
      expiry: 'This link works once, and expires in one hour.',
      footer: 'If you didn&rsquo;t ask to sign in, ignore this email.',
    },
    email_change: {
      subject: 'Confirm your new email address',
      heading: 'your new address',
      body: 'Confirm this address and it becomes the one you sign in with.',
      cta: 'CONFIRM THIS ADDRESS',
      expiry: 'This link works once, and expires in 24 hours.',
      footer: 'If you didn&rsquo;t ask to change your email, ignore this &mdash; nothing changes until the link is used.',
    },
  },
  fr: {
    signup: {
      subject: 'Confirmez votre adresse email',
      heading: 'une dernière chose',
      body: 'Vous y êtes presque. Confirmez cette adresse et nous commençons à chercher des mamans près de chez vous, au même stade que vous.',
      cta: 'CONFIRMER MON EMAIL',
      expiry: 'Ce lien ne fonctionne qu&rsquo;une fois, et expire dans 24 heures.',
      footer: 'Si vous ne vous êtes pas inscrite sur m&oslash;ma, ignorez cet email &mdash; aucun compte n&rsquo;est créé tant que le lien n&rsquo;est pas utilisé.',
    },
    recovery: {
      subject: 'Réinitialisez votre mot de passe',
      heading: 'un nouveau mot de passe',
      body: 'Quelqu&rsquo;un &mdash; nous espérons que c&rsquo;est vous &mdash; a demandé à réinitialiser le mot de passe de cette adresse. Choisissez-en un nouveau et vous êtes de retour.',
      cta: 'CHOISIR UN NOUVEAU MOT DE PASSE',
      expiry: 'Ce lien ne fonctionne qu&rsquo;une fois, et expire dans une heure.',
      footer: 'Si ce n&rsquo;était pas vous, ignorez cet email. Votre mot de passe reste inchangé, et ce lien seul ne permet à personne d&rsquo;entrer.',
    },
    magiclink: {
      subject: 'Votre lien de connexion',
      heading: 'votre entrée',
      body: 'Touchez ci-dessous et vous êtes connectée. Sans mot de passe.',
      cta: 'ME CONNECTER',
      expiry: 'Ce lien ne fonctionne qu&rsquo;une fois, et expire dans une heure.',
      footer: 'Si vous n&rsquo;avez pas demandé à vous connecter, ignorez cet email.',
    },
    email_change: {
      subject: 'Confirmez votre nouvelle adresse',
      heading: 'votre nouvelle adresse',
      body: 'Confirmez cette adresse et elle deviendra celle avec laquelle vous vous connectez.',
      cta: 'CONFIRMER CETTE ADRESSE',
      expiry: 'Ce lien ne fonctionne qu&rsquo;une fois, et expire dans 24 heures.',
      footer: 'Si vous n&rsquo;avez pas demandé ce changement, ignorez cet email &mdash; rien ne change tant que le lien n&rsquo;est pas utilisé.',
    },
  },
  es: {
    signup: {
      subject: 'Confirma tu correo',
      heading: 'una última cosa',
      body: 'Ya casi estás en la mesa. Confirma este correo y empezamos a buscar madres cerca de ti, en la misma etapa.',
      cta: 'CONFIRMAR MI CORREO',
      expiry: 'Este enlace funciona una sola vez y caduca en 24 horas.',
      footer: 'Si no te registraste en m&oslash;ma, puedes ignorar este mensaje &mdash; no se crea ninguna cuenta hasta que se use el enlace.',
    },
    recovery: {
      subject: 'Restablece tu contraseña',
      heading: 'una contraseña nueva',
      body: 'Alguien &mdash; esperamos que tú &mdash; pidió restablecer la contraseña de este correo. Elige una nueva y vuelves a entrar.',
      cta: 'ELEGIR UNA CONTRASEÑA NUEVA',
      expiry: 'Este enlace funciona una sola vez y caduca en una hora.',
      footer: 'Si no fuiste tú, ignora este mensaje. Tu contraseña sigue igual, y nadie puede entrar solo con este enlace.',
    },
    magiclink: {
      subject: 'Tu enlace de acceso',
      heading: 'tu entrada',
      body: 'Toca abajo y entras. Sin contraseña.',
      cta: 'ENTRAR',
      expiry: 'Este enlace funciona una sola vez y caduca en una hora.',
      footer: 'Si no pediste entrar, ignora este mensaje.',
    },
    email_change: {
      subject: 'Confirma tu correo nuevo',
      heading: 'tu correo nuevo',
      body: 'Confirma este correo y pasará a ser con el que inicias sesión.',
      cta: 'CONFIRMAR ESTE CORREO',
      expiry: 'Este enlace funciona una sola vez y caduca en 24 horas.',
      footer: 'Si no pediste este cambio, ignóralo &mdash; nada cambia hasta que se use el enlace.',
    },
  },
};

/** Falls back to signup copy for any action we have not written, rather than
 *  sending an empty email — a stray action type must never mean a blank page. */
function copyFor(locale: Locale, action: string): Copy {
  const table = COPY[locale];
  return table[action as Action] ?? table.signup;
}

export function subjectFor(locale: Locale, action: string): string {
  return copyFor(locale, action).subject;
}

/** Auth emails, through the shared shell in email-shell.ts. */
export function renderEmail(
  locale: Locale,
  action: string,
  url: string,
): string {
  const c = copyFor(locale, action);
  return renderShell(locale, {
    heading: c.heading,
    body: c.body,
    cta: c.cta,
    url,
    note: c.expiry,
    footer: c.footer,
  });
}
