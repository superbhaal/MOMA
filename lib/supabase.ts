import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING');
console.log('[Supabase] Anon key:', supabaseAnonKey ? 'SET (' + supabaseAnonKey.length + ' chars)' : 'MISSING');

// SecureStore adapter that chunks large values to stay under 2048-byte limit
const CHUNK_SIZE = 1800;

// AFTER_FIRST_UNLOCK lets the Supabase auto-refresh timer read the auth token
// while the device is locked (once it's been unlocked at least once since boot).
// The default (WHEN_UNLOCKED) throws errSecInteractionNotAllowed —
// "User interaction is not allowed." — on background refreshes, which surfaced
// as spurious getItem errors and could drop the session.
const WRITE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

// In-memory mirror of everything we've written/read this JS session. If a
// Keychain read transiently fails (e.g. errSecInteractionNotAllowed while the
// device is briefly locked), we serve the last-known value from here instead of
// returning null — returning null would make Supabase think the session is gone
// and sign the user out (phantom logout).
const memoryCache = new Map<string, string>();
// Keys already re-written with AFTER_FIRST_UNLOCK this session (self-heal guard).
const migrated = new Set<string>();

async function writeChunks(key: string, value: string): Promise<void> {
  const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [value];
  // Clean up old chunks that may exceed the new count.
  const oldCountStr = await SecureStore.getItemAsync(`${key}_count`);
  if (oldCountStr !== null) {
    const oldCount = parseInt(oldCountStr, 10);
    for (let i = chunks.length; i < oldCount; i++) {
      await SecureStore.deleteItemAsync(`${key}_${i}`);
    }
  }
  await SecureStore.setItemAsync(`${key}_count`, chunks.length.toString(), WRITE_OPTS);
  await Promise.all(
    chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk, WRITE_OPTS)),
  );
}

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(key);
      let result: string | null = null;
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr !== null) {
        const count = parseInt(countStr, 10);
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk === null) return memoryCache.get(key) ?? null;
          chunks.push(chunk);
        }
        result = chunks.join('');
      } else {
        // Fallback: single-value (migration from old format).
        result = await SecureStore.getItemAsync(key);
      }

      if (result !== null) {
        memoryCache.set(key, result);
        // Self-heal: the existing item may have been stored with the old
        // WHEN_UNLOCKED accessibility. Now that we've read it (device unlocked),
        // rewrite it once with AFTER_FIRST_UNLOCK so future locked reads succeed.
        if (!migrated.has(key)) {
          migrated.add(key);
          writeChunks(key, result).catch(() => {});
        }
      }
      return result;
    } catch (e) {
      // Handled: fall back to the in-memory value so we don't drop the session.
      // Logged as a warning (not console.error) so it doesn't trip the dev error overlay.
      console.warn('[SecureStore] getItem soft-fail:', key, String((e as Error)?.message ?? e));
      return memoryCache.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryCache.set(key, value);
    migrated.add(key); // freshly written with WRITE_OPTS — no migration needed
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await writeChunks(key, value);
    } catch (e) {
      console.warn('[SecureStore] setItem soft-fail:', key, String((e as Error)?.message ?? e));
    }
  },
  removeItem: async (key: string): Promise<void> => {
    memoryCache.delete(key);
    migrated.delete(key);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr !== null) {
        const count = parseInt(countStr, 10);
        await Promise.all(
          Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
        );
        await SecureStore.deleteItemAsync(`${key}_count`);
      }
      // Also remove single-value key (migration cleanup).
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[SecureStore] removeItem soft-fail:', key, String((e as Error)?.message ?? e));
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE is required for the native OAuth deep-link flow: signInWithGoogle
    // exchanges a `?code=` via exchangeCodeForSession(). Without this, the
    // client defaults to the implicit flow and returns tokens in the URL
    // fragment (#access_token=…) with no code param — which surfaced as
    // "OAuth callback missing code param." on the Google sign-in screen.
    flowType: 'pkce',
  },
});
