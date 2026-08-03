-- 021_discover_contributor_rpcs.sql
-- Contributor profile reads: the public trust anchor for a named human on the
-- Explore map. `users` RLS hides stranger rows, so these SECURITY DEFINER
-- functions expose ONLY public profile columns (name, colour, neighbourhood,
-- city, bio, interests) — never email/preferences — plus that contributor's
-- loved spots. Mirrors discover_spots (020).

CREATE OR REPLACE FUNCTION public.discover_contributor(p_id uuid)
RETURNS TABLE (
  id uuid, display_name text, profile_color text, neighbourhood text,
  city text, bio text, interests text[], spot_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, u.display_name, u.profile_color, u.neighbourhood, u.city, u.bio, u.interests,
         (SELECT count(*) FROM public.loved_spots s WHERE s.poster_id = u.id)
  FROM public.users u
  WHERE u.id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.discover_spots_by_poster(p_id uuid)
RETURNS TABLE (
  id uuid, kind text, poster_id uuid, name text, category text, note text,
  address text, lat double precision, lng double precision, place_id text,
  city text, phone text, booking_url text, created_at timestamptz,
  poster_name text, poster_color text, poster_neighbourhood text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.kind, s.poster_id, s.name, s.category, s.note,
         s.address, s.lat, s.lng, s.place_id, s.city, s.phone, s.booking_url, s.created_at,
         u.display_name, u.profile_color, u.neighbourhood
  FROM public.loved_spots s
  LEFT JOIN public.users u ON u.id = s.poster_id
  WHERE s.poster_id = p_id
  ORDER BY s.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.discover_contributor(uuid) FROM public;
REVOKE ALL ON FUNCTION public.discover_spots_by_poster(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.discover_contributor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discover_spots_by_poster(uuid) TO authenticated;
