// reel-oembed — resolves a pasted reel link into what the Watch card needs:
// the cover image, the creator, and a title.
//
// Called from the app via supabase.functions.invoke('reel-oembed', { body }).
// Deployed with verify_jwt = true. Needs no key and no secret: TikTok's oEmbed
// endpoint is public.
//
// What each platform actually gives us, as of this writing:
//
//   TikTok    — public oEmbed. Title, author_name, author_url, thumbnail_url.
//   Instagram — nothing. The public oEmbed endpoint was withdrawn in 2020; the
//               replacement lives behind a Meta app with the oEmbed Read
//               permission, which needs App Review. So we parse what the URL
//               itself carries (some reel URLs are /{handle}/reel/{id}) and let
//               the poster fill the rest in.
//
// NEITHER platform exposes duration through oEmbed. The composer says so rather
// than promising a number we can't fetch. If a Meta app is ever approved, add
// the call here — the app side already treats every field as optional.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const TIKTOK_OEMBED = 'https://www.tiktok.com/oembed';

interface ReelMeta {
  platform: 'instagram' | 'tiktok' | null;
  /** Canonical URL to store — the input, trimmed of tracking params. */
  url: string | null;
  title: string | null;
  creatorLabel: string | null;
  thumbnailUrl: string | null;
  /** True when we reached the platform and it answered. */
  resolved: boolean;
}

Deno.serve(async (req) => {
  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url || typeof url !== 'string') {
      return json(empty(), 400);
    }

    const clean = canonical(url);
    if (!clean) return json(empty(), 200);

    const platform = detectPlatform(clean);
    if (!platform) return json(empty(), 200);

    if (platform === 'tiktok') {
      return json(await resolveTikTok(clean));
    }
    return json(resolveInstagram(clean));
  } catch (_e) {
    // A link that won't resolve is not an error the poster can act on — they
    // typed a real URL. Fall through to the manual fields.
    return json(empty(), 200);
  }
});

/** Strips query/hash: share links carry tracking params, and two links to the
 *  same reel must collide on the table's UNIQUE(external_url). */
function canonical(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    u.protocol = 'https:';
    u.search = '';
    u.hash = '';
    // Trailing slash is cosmetic and would defeat the unique index.
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function detectPlatform(url: string): 'instagram' | 'tiktok' | null {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
  return null;
}

async function resolveTikTok(url: string): Promise<ReelMeta> {
  const res = await fetch(`${TIKTOK_OEMBED}?url=${encodeURIComponent(url)}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) return { ...empty(), platform: 'tiktok', url };

  const data = await res.json().catch(() => null);
  if (!data) return { ...empty(), platform: 'tiktok', url };

  // author_name is the display name; the handle is the last path segment of
  // author_url. "@drsleepbaby · Dr Sleep Baby" reads better than either alone.
  const handle = data.author_url ? lastSegment(data.author_url) : null;
  const creatorLabel = [handle, data.author_name]
    .filter((v: string | null) => v && String(v).trim())
    .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
    .join(' · ') || null;

  return {
    platform: 'tiktok',
    url,
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : null,
    creatorLabel,
    thumbnailUrl: typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null,
    resolved: true,
  };
}

/** Instagram gives us nothing over the wire, so we read the URL. A reel posted
 *  as /{handle}/reel/{id} carries its author; /reel/{id} does not. */
function resolveInstagram(url: string): ReelMeta {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  const kindAt = segments.findIndex((s) => s === 'reel' || s === 'reels' || s === 'p');
  const handle = kindAt > 0 ? segments[kindAt - 1] : null;

  return {
    platform: 'instagram',
    url,
    title: null,
    creatorLabel: handle ? `@${handle}` : null,
    thumbnailUrl: null,
    resolved: false,
  };
}

function lastSegment(u: string): string | null {
  try {
    const parts = new URL(u).pathname.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  } catch {
    return null;
  }
}

function empty(): ReelMeta {
  return {
    platform: null,
    url: null,
    title: null,
    creatorLabel: null,
    thumbnailUrl: null,
    resolved: false,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
