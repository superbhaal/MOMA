import { Linking } from 'react-native';
import type { PlaceAttachment } from '@/types';

const FUNCTIONS_BASE = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

/**
 * URL of the static-map thumbnail for a place, served by the `place-map` Edge
 * Function (keeps the Maps key server-side). Returns null when the place has no
 * coordinates (e.g. a free-text "share by name" place).
 */
export function staticMapUri(place: Pick<PlaceAttachment, 'lat' | 'lng'>): string | null {
  if (place.lat == null || place.lng == null) return null;
  return `${FUNCTIONS_BASE}/place-map?lat=${place.lat}&lng=${place.lng}`;
}

/** Open the place in Google Maps (app if installed, else browser). */
export function openInGoogleMaps(place: PlaceAttachment): void {
  let query: string;
  let extra = '';
  if (place.place_id) {
    // Most accurate: resolves to the exact place. query is required as fallback.
    query = place.name;
    extra = `&query_place_id=${place.place_id}`;
  } else if (place.lat != null && place.lng != null) {
    query = `${place.lat},${place.lng}`;
  } else {
    query = [place.name, place.address].filter(Boolean).join(' ');
  }
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${extra}`;
  Linking.openURL(url).catch(() => {});
}
