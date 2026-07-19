// places-search — proxies place lookups to Google Places API (New) Text Search
// so the Maps API key stays server-side (never shipped in the app bundle).
//
// Called from the app via supabase.functions.invoke('places-search', { body }).
// Deployed with verify_jwt = true: only authenticated users can spend the key.
// Set the key once: `supabase secrets set GOOGLE_MAPS_API_KEY=...` (or via the
// dashboard). Returns { places: PlaceAttachment[] } — [] on any error so the
// picker degrades to "share it by name anyway".

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.primaryType',
  'places.types',
].join(',');

interface PlaceAttachment {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  rating: number | null;
  place_id: string | null;
}

Deno.serve(async (req) => {
  try {
    const { query, city } = await req.json().catch(() => ({}));
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return json({ places: [] });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) return json({ places: [], error: 'GOOGLE_MAPS_API_KEY not set' });

    // Biasing by city in the text query keeps results local without needing the
    // group's coordinates.
    const textQuery = city ? `${query} in ${city}` : query;

    const res = await fetch(PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({ textQuery, maxResultCount: 8, languageCode: 'en' }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('[places-search] Google error', res.status, detail);
      return json({ places: [], error: `google ${res.status}` });
    }

    const data = await res.json();
    const places = ((data.places ?? []) as GooglePlace[])
      .map(toPlace)
      .filter((p): p is PlaceAttachment => p !== null);
    return json({ places });
  } catch (e) {
    console.error('[places-search]', e);
    return json({ places: [], error: String((e as Error)?.message ?? e) });
  }
});

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  primaryType?: string;
  types?: string[];
}

function toPlace(p: GooglePlace): PlaceAttachment | null {
  const name = p.displayName?.text?.trim();
  if (!name) return null;
  return {
    name,
    address: p.formattedAddress ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    category: normalizeCategory(p.primaryType, p.types),
    rating: typeof p.rating === 'number' ? p.rating : null,
    place_id: p.id ?? null,
  };
}

function normalizeCategory(primary: string | undefined, types: string[] | undefined): string | null {
  const hay = [primary ?? '', ...(types ?? [])].join(' ').toLowerCase();
  if (hay.includes('cafe') || hay.includes('coffee')) return 'coffee';
  if (hay.includes('park') || hay.includes('garden') || hay.includes('playground')) return 'park';
  if (hay.includes('restaurant') || hay.includes('bar') || hay.includes('pub') || hay.includes('food'))
    return 'food';
  if (hay.includes('museum') || hay.includes('gallery') || hay.includes('art')) return 'culture';
  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
