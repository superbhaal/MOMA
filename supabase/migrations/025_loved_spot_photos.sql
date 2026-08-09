-- 025_loved_spot_photos.sql
-- The v11 composer has a photo step: "One picture that captures it best."
-- Optional by design — a spot with a good note and no photo is worth more than
-- one with a photo and nothing to say, and the step offers "Skip for now".
--
-- Photos live in the `spot-photos` Storage bucket, namespaced per poster the
-- way avatars are, so the object policy can key on the folder name.

ALTER TABLE public.loved_spots ADD COLUMN IF NOT EXISTS photo_url text;

-- The Explore reads go through SECURITY DEFINER functions (020/021), so the new
-- column has to be threaded through their signatures or it never reaches the
-- app. Dropping first: Postgres won't let CREATE OR REPLACE change a function's
-- return type.
DROP FUNCTION IF EXISTS public.discover_spots(text, text);
DROP FUNCTION IF EXISTS public.discover_spot(uuid);
DROP FUNCTION IF EXISTS public.discover_spots_by_poster(uuid);

CREATE FUNCTION public.discover_spots(p_kind text, p_category text DEFAULT NULL)
RETURNS TABLE (
  id uuid, kind text, poster_id uuid, name text, category text, note text,
  address text, lat double precision, lng double precision, place_id text,
  city text, phone text, booking_url text, photo_url text, created_at timestamptz,
  poster_name text, poster_color text, poster_neighbourhood text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.kind, s.poster_id, s.name, s.category, s.note,
         s.address, s.lat, s.lng, s.place_id, s.city, s.phone, s.booking_url,
         s.photo_url, s.created_at,
         u.display_name, u.profile_color, u.neighbourhood
  FROM public.loved_spots s
  LEFT JOIN public.users u ON u.id = s.poster_id
  WHERE s.kind = p_kind
    AND (p_category IS NULL OR s.category = p_category)
  ORDER BY s.created_at DESC;
$$;

CREATE FUNCTION public.discover_spot(p_id uuid)
RETURNS TABLE (
  id uuid, kind text, poster_id uuid, name text, category text, note text,
  address text, lat double precision, lng double precision, place_id text,
  city text, phone text, booking_url text, photo_url text, created_at timestamptz,
  poster_name text, poster_color text, poster_neighbourhood text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.kind, s.poster_id, s.name, s.category, s.note,
         s.address, s.lat, s.lng, s.place_id, s.city, s.phone, s.booking_url,
         s.photo_url, s.created_at,
         u.display_name, u.profile_color, u.neighbourhood
  FROM public.loved_spots s
  LEFT JOIN public.users u ON u.id = s.poster_id
  WHERE s.id = p_id;
$$;

CREATE FUNCTION public.discover_spots_by_poster(p_id uuid)
RETURNS TABLE (
  id uuid, kind text, poster_id uuid, name text, category text, note text,
  address text, lat double precision, lng double precision, place_id text,
  city text, phone text, booking_url text, photo_url text, created_at timestamptz,
  poster_name text, poster_color text, poster_neighbourhood text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.kind, s.poster_id, s.name, s.category, s.note,
         s.address, s.lat, s.lng, s.place_id, s.city, s.phone, s.booking_url,
         s.photo_url, s.created_at,
         u.display_name, u.profile_color, u.neighbourhood
  FROM public.loved_spots s
  LEFT JOIN public.users u ON u.id = s.poster_id
  WHERE s.poster_id = p_id
  ORDER BY s.created_at DESC;
$$;

-- DROP took the grants with it. These read names, so: signed-in only.
REVOKE ALL ON FUNCTION public.discover_spots(text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.discover_spot(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.discover_spots_by_poster(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.discover_spots(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discover_spot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discover_spots_by_poster(uuid) TO authenticated;

-- ── Storage ────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-photos', 'spot-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Read is public: the bucket backs an image URL rendered on a map card, and a
-- signed URL would expire under the reader's feet.
CREATE POLICY spot_photos_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'spot-photos');

-- Write: contributors only, and only into their own folder. Same rule as the
-- row the photo belongs to, enforced in the same place — not in the composer.
CREATE POLICY spot_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'spot-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_discover_contributor(auth.uid())
  );

CREATE POLICY spot_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'spot-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
