import { supabase } from '@/lib/supabase';
import type { PlaceAttachment } from '@/types';

/**
 * Search places matching `query`, biased to `city`. Proxied through the
 * `places-search` Edge Function, which calls Google Places API (New) with a
 * server-side key. Returns up to 8 results as PlaceAttachment, or [] on any
 * error (offline, key missing, rate-limited) so the picker degrades gracefully.
 */
export async function searchPlaces(query: string, city: string | null): Promise<PlaceAttachment[]> {
  try {
    const { data, error } = await supabase.functions.invoke('places-search', {
      body: { query, city },
    });
    if (error || !data?.places) return [];
    return data.places as PlaceAttachment[];
  } catch {
    return [];
  }
}
