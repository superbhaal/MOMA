-- 004_add_address_column.sql
-- Replaces the free-text "neighbourhood" capture in onboarding with a
-- structured address. We keep `neighbourhood` (used by the matcher for
-- walkable-area equality) and add `address` to store the full formatted
-- string (private, only displayed back to the user).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address text;
