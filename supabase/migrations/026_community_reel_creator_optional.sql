-- 026_community_reel_creator_optional.sql
-- "Who's it from?" becomes optional in the composer, at the client's call.
--
-- The consequence to know: Instagram gives us no title, no thumbnail and no
-- creator, so a reel shared from there with this field blank has nothing of its
-- own to show. The card falls back to the poster's "why this one", and failing
-- that to the platform name — a reel is still worth having when all we know is
-- that a mom you trust saved it.

ALTER TABLE public.community_reels ALTER COLUMN creator_label DROP NOT NULL;
