-- 020_discover_spot_rpcs.sql
-- Explore reads join each loved spot to its contributor for attribution (name +
-- identity ring). But `users` RLS forbids reading stranger rows, and a
-- contributor is usually NOT in a shared group with the reader — so a plain
-- embed would return a null poster. These SECURITY DEFINER functions expose
-- ONLY the whitelisted public contributor columns (name, colour, neighbourhood),
-- never email or preferences. loved_spots itself is world-readable to
-- authenticated users (019), so the definer scope only covers the users join.

CREATE OR REPLACE FUNCTION public.discover_spots(p_kind text, p_category text DEFAULT NULL)
RETURNS TABLE (
  id uuid, kind text, poster_id uuid, name text, category text, note text,
  address text, lat double precision, lng double precision, place_id text,
  city text, phone text, booking_url text, created_at timestamptz,
  poster_name text, poster_color text, poster_neighbourhood text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.kind, s.poster_id, s.name, s.category, s.note,
         s.address, s.lat, s.lng, s.place_id, s.city, s.phone, s.booking_url, s.created_at,
         u.display_name, u.profile_color, u.neighbourhood
  FROM public.loved_spots s
  LEFT JOIN public.users u ON u.id = s.poster_id
  WHERE s.kind = p_kind
    AND (p_category IS NULL OR s.category = p_category)
  ORDER BY s.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.discover_spot(p_id uuid)
RETURNS TABLE (
  id uuid, kind text, poster_id uuid, name text, category text, note text,
  address text, lat double precision, lng double precision, place_id text,
  city text, phone text, booking_url text, created_at timestamptz,
  poster_name text, poster_color text, poster_neighbourhood text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.kind, s.poster_id, s.name, s.category, s.note,
         s.address, s.lat, s.lng, s.place_id, s.city, s.phone, s.booking_url, s.created_at,
         u.display_name, u.profile_color, u.neighbourhood
  FROM public.loved_spots s
  LEFT JOIN public.users u ON u.id = s.poster_id
  WHERE s.id = p_id;
$$;

REVOKE ALL ON FUNCTION public.discover_spots(text, text) FROM public;
REVOKE ALL ON FUNCTION public.discover_spot(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.discover_spots(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discover_spot(uuid) TO authenticated;
