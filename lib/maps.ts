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

/**
 * URL of the multi-pin static-map backdrop for the Explore canvas, served by the
 * `discover-map` Edge Function. Renders every spot with coordinates as a dark
 * pin; `me` (optional) drops the cobalt "you are here" marker. `size` is the
 * canvas size in px. Returns null when there is nothing to plot.
 */
export function discoverMapUri(
  spots: { lat: number | null; lng: number | null }[],
  opts: {
    me?: { lat: number; lng: number } | null;
    width: number;
    height: number;
    /** Fixed zoom; omit to auto-fit the viewport to the pins. */
    zoom?: number;
  },
): string | null {
  const pts = spots
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => `pt=${s.lat},${s.lng}`);
  const me = opts.me ? `&me=${opts.me.lat},${opts.me.lng}` : '';
  if (!pts.length && !me) return null;
  const w = Math.min(640, Math.round(opts.width));
  const h = Math.min(640, Math.round(opts.height));
  const zoom = opts.zoom ? `&zoom=${opts.zoom}` : '';
  return `${FUNCTIONS_BASE}/discover-map?${pts.join('&')}${me}&w=${w}&h=${h}${zoom}`;
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
