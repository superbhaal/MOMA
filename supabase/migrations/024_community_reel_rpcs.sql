-- 024_community_reel_rpcs.sql
-- Same problem 020 solved for the map, now for the Watch feed: a community reel
-- is attributed to the mom who shared it, but `users` RLS forbids reading a
-- stranger's row and the poster is rarely in a shared group with the reader. A
-- plain embed would render every card as posted by nobody.
--
-- Exposes ONLY the whitelisted public columns (name, colour) — never email or
-- preferences. community_reels itself is world-readable to authenticated users
-- (023), so the definer scope covers just the users join.
--
-- The stage filter lives here rather than in the client so an untagged reel
-- (baby_stages = '{}') keeps showing under every filter, the way an editorial
-- reel with no stage does.

CREATE OR REPLACE FUNCTION public.community_reels_feed(p_stage text DEFAULT NULL)
RETURNS TABLE (
  id uuid, poster_id uuid, platform text, external_url text,
  title text, thumbnail_url text, duration_sec int,
  creator_label text, note text, baby_stages text[], thumbnail_hex text,
  created_at timestamptz,
  poster_name text, poster_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.poster_id, r.platform, r.external_url,
         r.title, r.thumbnail_url, r.duration_sec,
         r.creator_label, r.note, r.baby_stages, r.thumbnail_hex,
         r.created_at,
         u.display_name, u.profile_color
  FROM public.community_reels r
  LEFT JOIN public.users u ON u.id = r.poster_id
  WHERE p_stage IS NULL
     OR cardinality(r.baby_stages) = 0
     OR p_stage = ANY (r.baby_stages)
  ORDER BY r.created_at DESC
  LIMIT 50;
$$;

-- SECURITY DEFINER functions are callable by `anon` unless revoked, and this
-- one reads names. Signed-in only.
REVOKE ALL ON FUNCTION public.community_reels_feed(text) FROM public;
REVOKE ALL ON FUNCTION public.community_reels_feed(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.community_reels_feed(text) TO authenticated;
