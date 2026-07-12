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

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    console.log('[SecureStore] getItem:', key);
    try {
      if (Platform.OS === 'web') return localStorage.getItem(key);
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr !== null) {
        const count = parseInt(countStr, 10);
        console.log('[SecureStore] Reading', count, 'chunks for', key);
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk === null) {
            console.warn('[SecureStore] Missing chunk', i, 'for', key);
            return null;
          }
          chunks.push(chunk);
        }
        const result = chunks.join('');
        console.log('[SecureStore] getItem OK:', key, '(' + result.length + ' bytes)');
        return result;
      }
      // Fallback: try reading as a single value (migration from old format)
      const val = await SecureStore.getItemAsync(key);
      console.log('[SecureStore] getItem fallback:', key, val ? '(' + val.length + ' bytes)' : 'null');
      return val;
    } catch (e) {
      console.error('[SecureStore] getItem ERROR:', key, e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    console.log('[SecureStore] setItem:', key, '(' + value.length + ' bytes)');
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [value];
      console.log('[SecureStore] Writing', chunks.length, 'chunks for', key);
      // Clean up old chunks that may exceed new count
      const oldCountStr = await SecureStore.getItemAsync(`${key}_count`);
      if (oldCountStr !== null) {
        const oldCount = parseInt(oldCountStr, 10);
        for (let i = chunks.length; i < oldCount; i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`);
        }
      }
      await SecureStore.setItemAsync(`${key}_count`, chunks.length.toString());
      await Promise.all(
        chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk))
      );
      console.log('[SecureStore] setItem OK:', key);
    } catch (e) {
      console.error('[SecureStore] setItem ERROR:', key, e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    console.log('[SecureStore] removeItem:', key);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr !== null) {
        const count = parseInt(countStr, 10);
        await Promise.all(
          Array.from({ length: count }, (_, i) =>
            SecureStore.deleteItemAsync(`${key}_${i}`)
          )
        );
        await SecureStore.deleteItemAsync(`${key}_count`);
      }
      // Also remove single-value key (migration cleanup)
      await SecureStore.deleteItemAsync(key);
      console.log('[SecureStore] removeItem OK:', key);
    } catch (e) {
      console.error('[SecureStore] removeItem ERROR:', key, e);
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
