// discover-map — proxies a Google Static Maps thumbnail showing ALL of a mode's
// loved-spot pins as a calm backdrop for Explore. Keeps the Maps key
// server-side. Returns an image/png, loaded directly by <Image>.
//
// Deployed with verify_jwt = false so <Image source={{ uri }}> can fetch it with
// a plain URL. Requires the "Maps Static API" enabled in GCP + GOOGLE_MAPS_API_KEY.
//
// GET /discover-map?pt=52.37,4.89&pt=52.38,4.90[&me=52.37,4.89][&w=400&h=420][&zoom=14]
//   pt   — repeatable spot coordinate; each becomes a fuchsia teardrop pin.
//   me   — optional "you are here" coordinate (cobalt pin).
//   w/h  — canvas size in px (clamped 100–640); scale=2 for retina.
//   zoom — optional; omitted → Google auto-fits the viewport to the pins.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const STATIC_MAP_URL = 'https://maps.googleapis.com/maps/api/staticmap';

// A muted, low-saturation basemap: no POI/transit clutter, softened colours —
// the map is a backdrop, not the hero.
const MUTED_STYLE = [
  'feature:poi|visibility:off',
  'feature:transit|visibility:off',
  'feature:road|element:labels|visibility:off',
  'saturation:-45|lightness:8',
].map((s) => `style=${encodeURIComponent(s)}`).join('&');

Deno.serve(async (req) => {
  const url = new URL(req.url);

  const pts = url.searchParams
    .getAll('pt')
    .map((p) => p.split(',').map(Number))
    .filter(([lat, lng]) => isCoord(lat, 90) && isCoord(lng, 180))
    .map(([lat, lng]) => `${lat},${lng}`);

  const me = parseCoord(url.searchParams.get('me'));
  const w = clampInt(url.searchParams.get('w'), 400, 100, 640);
  const h = clampInt(url.searchParams.get('h'), 400, 100, 640);
  const zoom = url.searchParams.get('zoom');

  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) return new Response('key not set', { status: 500 });

  const params: string[] = [`size=${w}x${h}`, `scale=2`, MUTED_STYLE];

  // One teardrop per spot, all visually identical — no ranking. Fuchsia, the
  // app's identity accent: the near-black pin read as a system default dropped
  // on the map rather than as one of ours.
  if (pts.length) {
    params.push(`markers=${encodeURIComponent(`color:0xE8389C|${pts.join('|')}`)}`);
  }
  // "You are here" as a distinct cobalt pin.
  if (me) {
    params.push(`markers=${encodeURIComponent(`color:0x1A4BCC|size:small|${me}`)}`);
  }
  // With no pins we must give an explicit center, else the API 400s.
  if (!pts.length && !me) {
    const center = parseCoord(url.searchParams.get('center')) ?? '52.3676,4.9041'; // Amsterdam
    params.push(`center=${center}`, `zoom=${zoom ?? 12}`);
  } else if (zoom) {
    params.push(`zoom=${clampInt(zoom, 13, 3, 20)}`);
    if (me) params.push(`center=${me}`);
  }

  const src = `${STATIC_MAP_URL}?${params.join('&')}&key=${apiKey}`;
  const res = await fetch(src);
  if (!res.ok) {
    console.error('[discover-map] Google error', res.status, await res.text());
    return new Response('map unavailable', { status: 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'image/png',
      // The pin set for a given URL is fixed; cache a day (new spots → new URL).
      'cache-control': 'public, max-age=86400',
    },
  });
});

function isCoord(n: number, max: number): boolean {
  return Number.isFinite(n) && Math.abs(n) <= max && n !== 0;
}

function parseCoord(raw: string | null): string | null {
  if (!raw) return null;
  const [lat, lng] = raw.split(',').map(Number);
  return isCoord(lat, 90) && isCoord(lng, 180) ? `${lat},${lng}` : null;
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
