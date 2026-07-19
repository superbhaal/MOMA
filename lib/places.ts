import type { PlaceAttachment } from '@/types';

// Free place search via OpenStreetMap's Nominatim. No API key, no billing.
// Usage policy: ≤1 request/second and a valid User-Agent — the PlacePicker
// debounces input, and we set a descriptive UA here.
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'moma-app/1.0 (https://joinmoma.org)';

/**
 * Search places matching `query`, biased to `city`. Returns up to 8 results
 * shaped as PlaceAttachment. Returns [] on any error (offline, rate-limited).
 */
export async function searchPlaces(query: string, city: string | null): Promise<PlaceAttachment[]> {
  const q = city ? `${query}, ${city}` : query;
  const url =
    `${NOMINATIM}?q=${encodeURIComponent(q)}` +
    `&format=jsonv2&limit=8&addressdetails=1&namedetails=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) return [];
    const rows = (await res.json()) as NominatimRow[];
    return rows.map(toPlace).filter((p): p is PlaceAttachment => p !== null);
  } catch {
    return [];
  }
}

interface NominatimRow {
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  category?: string;
  namedetails?: { name?: string } | null;
  address?: Record<string, string> | null;
}

function toPlace(r: NominatimRow): PlaceAttachment | null {
  const name = r.namedetails?.name || r.display_name?.split(',')[0]?.trim();
  if (!name) return null;
  // Compact address: "street, neighbourhood, city" from the first parts.
  const address = r.display_name?.split(',').slice(1, 4).join(',').trim() || null;
  const lat = r.lat ? parseFloat(r.lat) : null;
  const lng = r.lon ? parseFloat(r.lon) : null;
  return { name, address, lat, lng, category: normalizeCategory(r.type) };
}

function normalizeCategory(type: string | undefined): string | null {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t.includes('cafe') || t.includes('coffee')) return 'coffee';
  if (t.includes('park') || t.includes('garden') || t.includes('playground')) return 'park';
  if (t.includes('restaurant') || t.includes('bar') || t.includes('pub')) return 'food';
  if (t.includes('museum') || t.includes('gallery')) return 'culture';
  return null;
}
