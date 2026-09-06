import type { TFunction } from 'i18next';

/**
 * Supabase auth errors, in her language and her words.
 *
 * CLAUDE.md: never show a raw Supabase error. They are English-only, phrased
 * for developers, and leak implementation detail.
 *
 * This lived inside signup.tsx, with that rule quoted above it — and the login
 * screen, which people reach far more often, never got it: three `setError`
 * calls passed `authError.message` straight through. Found when a malformed
 * seed row made sign-in fail and the screen answered "Database error querying
 * schema".
 *
 * The default is deliberately vague. An unmapped error is one we have not
 * thought about, and guessing at it in her language is worse than admitting we
 * do not know.
 */

/** Sign-in: wrong password, unconfirmed address, rate limits. */
export function friendlySignInError(message: string, t: TFunction): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return t('auth.wrongCredentials');
  }
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return t('auth.notConfirmed');
  }
  if (m.includes('rate limit') || m.includes('too many')) return t('auth.tooManyTries');
  if (m.includes('invalid') && m.includes('email')) return t('auth.emailInvalid');
  return t('auth.signInFailed');
}

/** Sign-up: weak password, malformed or already-taken address. */
export function friendlySignUpError(message: string, t: TFunction): string {
  const m = message.toLowerCase();
  if (m.includes('password') && m.includes('characters')) return t('auth.passwordTooShort');
  if (m.includes('rate limit') || m.includes('too many')) return t('auth.tooManyTries');
  if (m.includes('invalid') && m.includes('email')) return t('auth.emailInvalid');
  return t('auth.signupFailed');
}
