-- 028_loved_spot_grouping.sql
-- One place, many moms.
--
-- Until now a row WAS a place: two moms recommending the same café produced two
-- pins, two rows and two detail pages, and nothing told the reader that two
-- people had vouched for it.
--
-- The grouping key, per the client: Google's place_id when we have one, with a
-- fallback she also agreed to — geocoded coordinates rounded to ~11m, because
-- two moms who both add the same café by hand have no place_id and would
-- otherwise stay apart forever (the same address geocodes to the same point).
-- Failing even that, a spot is its own group: the old behaviour, and the safe
-- one.
--
-- Applied via the `loved_spot_grouping` migration; this file is the record.
-- Adds: loved_spot_key(), discover_places(), discover_place().
-- The per-post reads (discover_spots / discover_spot / discover_spots_by_poster)
-- stay — a contributor's profile is a list of HER recommendations, not of
-- places, and grouping them there would be wrong.

-- ── Reconstructed 2026-08-29 ────────────────────────────────────────────────
-- This file held only the notes above. Extracted from the live production
-- schema so a replay reproduces it rather than approximates it.

-- Google's place_id when we have one; else coordinates rounded to ~11 m, so two
-- moms who added the same café by hand still land together; else the row's own
-- id, which is the old one-row-one-place behaviour and the safe fallback.
create or replace function public.loved_spot_key(
  p_place_id text, p_lat double precision, p_lng double precision, p_id uuid)
returns text
language sql
immutable
set search_path to 'public'
as $function$
  SELECT CASE
    WHEN p_place_id IS NOT NULL AND p_place_id <> '' THEN 'g:' || p_place_id
    WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
      THEN 'c:' || round(p_lat::numeric, 4) || ',' || round(p_lng::numeric, 4)
    ELSE 'i:' || p_id::text
  END;
$function$;

create or replace function public.discover_places(p_kind text, p_category text default null)
returns table(key text, id uuid, kind text, name text, category text, address text,
              lat double precision, lng double precision, place_id text, city text,
              phone text, email text, booking_url text, photo_url text,
              created_at timestamptz, rec_count integer, recommendations jsonb)
language sql
stable security definer
set search_path to 'public'
as $function$
  WITH keyed AS (
    SELECT s.*, public.loved_spot_key(s.place_id, s.lat, s.lng, s.id) AS k
    FROM public.loved_spots s
    WHERE s.kind = p_kind
      AND (p_category IS NULL OR s.category = p_category)
  ),
  first_of AS (
    SELECT DISTINCT ON (k) k, id
    FROM keyed ORDER BY k, created_at ASC
  )
  SELECT
    f.k,
    r.id, r.kind, r.name, r.category,
    r.address, r.lat, r.lng, r.place_id,
    r.city,
    -- Contact details from whichever recommendation bothered to give them.
    (array_remove(array_agg(k2.phone ORDER BY k2.created_at), NULL))[1],
    (array_remove(array_agg(k2.email ORDER BY k2.created_at), NULL))[1],
    (array_remove(array_agg(k2.booking_url ORDER BY k2.created_at), NULL))[1],
    (array_remove(array_agg(k2.photo_url ORDER BY k2.created_at DESC), NULL))[1],
    max(k2.created_at),
    count(*)::int,
    jsonb_agg(
      jsonb_build_object(
        'spot_id', k2.id,
        'poster_id', k2.poster_id,
        'poster_name', u.display_name,
        'poster_color', u.profile_color,
        'note', k2.note,
        'photo_url', k2.photo_url,
        'created_at', k2.created_at
      ) ORDER BY k2.created_at DESC
    )
  FROM first_of f
  JOIN keyed r ON r.id = f.id
  JOIN keyed k2 ON k2.k = f.k
  LEFT JOIN public.users u ON u.id = k2.poster_id
  GROUP BY f.k, r.id, r.kind, r.name, r.category, r.address, r.lat, r.lng,
           r.place_id, r.city
  ORDER BY max(k2.created_at) DESC;
$function$;

create or replace function public.discover_place(p_id uuid)
returns table(key text, id uuid, kind text, name text, category text, address text,
              lat double precision, lng double precision, place_id text, city text,
              phone text, email text, booking_url text, photo_url text,
              created_at timestamptz, rec_count integer, recommendations jsonb)
language sql
stable security definer
set search_path to 'public'
as $function$
  SELECT * FROM public.discover_places(
    (SELECT kind FROM public.loved_spots WHERE id = p_id), NULL
  )
  WHERE key = (
    SELECT public.loved_spot_key(place_id, lat, lng, id)
    FROM public.loved_spots WHERE id = p_id
  );
$function$;
