-- 019_loved_spots.sql
-- Explore map data (Discover · Explore). A "loved spot" is a place or a person
-- that a named, trusted contributor vouches for. The `note` is the payload —
-- the one honest line other moms read first. No ratings, no counts, no reviews:
-- every row is attributed to exactly one human (poster_id).
--
-- Write access is role-gated (018): only contributors/admins can insert, via
-- is_discover_contributor(). Reads are open to any authenticated user.

CREATE TABLE IF NOT EXISTS public.loved_spots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('place', 'person')),
  poster_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  name        text NOT NULL,
  -- Taxonomy scoped to kind (place: cafes | restaurants | parks | playgrounds |
  -- classes | shops · person: pediatricians | gynecologists | midwives_doulas |
  -- lactation | physios). Validated in the app, not the DB, so the taxonomy can
  -- evolve without a migration.
  category    text NOT NULL,
  -- The required "why do you love it" line — the emotional core of the card.
  note        text NOT NULL,

  address     text,
  lat         double precision,
  lng         double precision,
  -- Google place_id → static-map thumbnail + accurate "Open in Maps" deep-link.
  place_id    text,
  city        text,

  -- Person-only extras (null for places).
  phone       text,
  booking_url text,

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Explore filters by kind + category; contributor profile filters by poster.
CREATE INDEX IF NOT EXISTS loved_spots_kind_category_idx ON public.loved_spots (kind, category);
CREATE INDEX IF NOT EXISTS loved_spots_poster_idx        ON public.loved_spots (poster_id);
CREATE INDEX IF NOT EXISTS loved_spots_created_idx       ON public.loved_spots (created_at DESC);

ALTER TABLE public.loved_spots ENABLE ROW LEVEL SECURITY;

-- Read: any signed-in user can browse the map.
CREATE POLICY loved_spots_select ON public.loved_spots
  FOR SELECT TO authenticated
  USING (true);

-- Insert: contributors/admins only, and only as themselves. Server-side
-- enforcement of the permission model — never rely on the hidden FAB alone.
CREATE POLICY loved_spots_insert ON public.loved_spots
  FOR INSERT TO authenticated
  WITH CHECK (
    poster_id = auth.uid()
    AND public.is_discover_contributor(auth.uid())
  );

-- Update / delete: a contributor may edit or remove only their own spots.
-- (Admin moderation is handled out-of-band via the dashboard at MVP.)
CREATE POLICY loved_spots_update ON public.loved_spots
  FOR UPDATE TO authenticated
  USING (poster_id = auth.uid())
  WITH CHECK (poster_id = auth.uid());

CREATE POLICY loved_spots_delete ON public.loved_spots
  FOR DELETE TO authenticated
  USING (poster_id = auth.uid());
