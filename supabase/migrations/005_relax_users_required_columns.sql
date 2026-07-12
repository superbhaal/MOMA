-- 005_relax_users_required_columns.sql
-- display_name and baby_dob were NOT NULL on the original schema. With our
-- progressive auto-save flow (q0 sends ONLY life_stage, q1 sends ONLY scene_tags,
-- etc.), Postgres validates the would-be INSERT row before falling back to the
-- ON CONFLICT DO UPDATE branch — which fails because we never re-send the
-- display_name. Result: every quiz answer was silently rejected.
--
-- The app validates "display_name + baby_dob required" at form-submit time
-- (profile.tsx). Letting the DB stay strictly nullable keeps the upsert flow
-- simple and matches the actual user lifecycle (a row exists from the moment
-- profile.tsx submits, but quiz patches don't carry those fields).

ALTER TABLE users
  ALTER COLUMN display_name DROP NOT NULL,
  ALTER COLUMN baby_dob     DROP NOT NULL;
