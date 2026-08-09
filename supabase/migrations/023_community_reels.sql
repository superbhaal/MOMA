-- 023_community_reels.sql
-- Discover · Watch, community half. The editorial reels stay in Sanity, where
-- they're curated; what a contributor shares from inside the app lands here.
--
-- Two reasons it isn't Sanity: writing there needs a token, and a token in a
-- mobile binary is a token in everyone's hands — whereas RLS already gives us
-- exactly the gate we want (018's is_discover_contributor). And the Watch feed
-- already labels this half "FROM THE COMMUNITY", so the split is the product's,
-- not just the plumbing's.

CREATE TABLE IF NOT EXISTS public.community_reels (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  platform      text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  external_url  text NOT NULL,

  -- Pulled from oEmbed where the platform allows it (TikTok does; Instagram no
  -- longer does without an approved Meta app), so all three are nullable and
  -- the card falls back to the poster's own words.
  title         text,
  thumbnail_url text,
  -- Nothing populates this yet: neither platform exposes duration through
  -- oEmbed. Kept because the card already has a slot for it, and because a
  -- scraper or an approved Meta app would fill it without a migration.
  duration_sec  int,

  -- "Who's it from?" — one free-text line, because the honest answer is
  -- sometimes a handle, sometimes a name and a credential, and forcing it into
  -- three fields would only produce three empty ones.
  creator_label text NOT NULL,
  -- "Why this one?" — optional, and the only part written for other moms
  -- rather than about the video.
  note          text,

  -- Who it's for. Plural, unlike Sanity's single babyStage: a reel on wake
  -- windows serves 0–4 wks and 1–3 mo alike, and making the poster pick one
  -- would just lose the other.
  baby_stages   text[] NOT NULL DEFAULT '{}',

  -- Gradient anchor for the card when there's no thumbnail to show.
  thumbnail_hex text,

  created_at    timestamptz NOT NULL DEFAULT now(),

  -- The same reel shared twice is noise, not two recommendations. The composer
  -- turns this violation into "someone already shared this one".
  CONSTRAINT community_reels_url_unique UNIQUE (external_url)
);

CREATE INDEX IF NOT EXISTS community_reels_created_idx ON public.community_reels (created_at DESC);
CREATE INDEX IF NOT EXISTS community_reels_poster_idx  ON public.community_reels (poster_id);
-- The feed filters on stage overlap; GIN is what makes && an index scan.
CREATE INDEX IF NOT EXISTS community_reels_stages_idx  ON public.community_reels USING GIN (baby_stages);

ALTER TABLE public.community_reels ENABLE ROW LEVEL SECURITY;

-- Read: any signed-in user browses the Watch feed.
CREATE POLICY community_reels_select ON public.community_reels
  FOR SELECT TO authenticated
  USING (true);

-- Insert: contributors/admins only, and only as themselves. The hidden FAB is
-- a courtesy; this is the actual rule.
CREATE POLICY community_reels_insert ON public.community_reels
  FOR INSERT TO authenticated
  WITH CHECK (
    poster_id = auth.uid()
    AND public.is_discover_contributor(auth.uid())
  );

-- Update / delete: your own only. Admin moderation runs off the dashboard.
CREATE POLICY community_reels_update ON public.community_reels
  FOR UPDATE TO authenticated
  USING (poster_id = auth.uid())
  WITH CHECK (poster_id = auth.uid());

CREATE POLICY community_reels_delete ON public.community_reels
  FOR DELETE TO authenticated
  USING (poster_id = auth.uid());
