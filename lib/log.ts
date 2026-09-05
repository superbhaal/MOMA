/**
 * Development-only logging.
 *
 * These lines were written during the July SSO fix and they earned their keep —
 * they are how the Apple flow got debugged on a physical device, where there is
 * no debugger worth the name. Deleting them would cost that.
 *
 * What they must not do is run in a release build. None of them prints a secret
 * (they log booleans and lengths, never the identity token), but they do print
 * the Supabase user id and `credential.user`, Apple's stable per-app identifier
 * — persistent pseudonymous identifiers, landing in the device's system log
 * where anyone holding the phone and Console.app can read them.
 *
 * `__DEV__` is false in a release bundle, so this returns before the arguments
 * are ever formatted.
 */
export function debugLog(...args: unknown[]): void {
  if (__DEV__) console.log(...args);
}
