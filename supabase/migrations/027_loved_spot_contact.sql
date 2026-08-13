-- 027_loved_spot_contact.sql
-- Contact details a mom can offer alongside her recommendation. Suggested,
-- never required — the client's wording: "there's only a suggestion for them to
-- add more useful contact info".
--
-- `phone` and `booking_url` had existed since 019 and the composer never asked
-- for either; `email` is the one that was actually missing. The three RPCs are
-- rebuilt to carry them, since a column the reads don't select never reaches
-- the app.
--
-- Worth stating plainly: these are a real professional's details, published by
-- someone else. We ask for them, we don't verify them, and the healthcare
-- disclaimer on every person card is doing more work than before.

ALTER TABLE public.loved_spots ADD COLUMN IF NOT EXISTS email text;

-- (RPC bodies applied via migration `loved_spot_contact` — see 025 for the same
-- drop-and-recreate shape; Postgres won't let CREATE OR REPLACE change a
-- function's return type.)
