// place-map — proxies a Google Static Maps thumbnail for a lat/lng so the Maps
// API key stays server-side. Returns an image/png, loaded directly by <Image>.
//
// Deployed with verify_jwt = false so <Image source={{ uri }}> can fetch it with
// a plain URL (the anon key is public anyway, so gating adds no real protection).
// Requires the "Maps Static API" enabled in GCP + the GOOGLE_MAPS_API_KEY secret.
//
// GET /place-map?lat=52.37&lng=4.89[&zoom=15]

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const STATIC_MAP_URL = 'https://maps.googleapis.com/maps/api/staticmap';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const zoom = clampInt(url.searchParams.get('zoom'), 15, 3, 20);

  if (!isFiniteCoord(lat, 90) || !isFiniteCoord(lng, 180)) {
    return new Response('bad coordinates', { status: 400 });
  }

  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) return new Response('key not set', { status: 500 });

  const center = `${lat},${lng}`;
  const src =
    `${STATIC_MAP_URL}?center=${center}&zoom=${zoom}&size=320x150&scale=2` +
    `&markers=${encodeURIComponent(`color:0xE8389C|${center}`)}&key=${apiKey}`;

  const res = await fetch(src);
  if (!res.ok) {
    return new Response('map unavailable', { status: 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'image/png',
      // Same pin never changes — let clients/CDN cache it hard.
      'cache-control': 'public, max-age=604800, immutable',
    },
  });
});

function isFiniteCoord(n: number, max: number): boolean {
  return Number.isFinite(n) && Math.abs(n) <= max && n !== 0;
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
