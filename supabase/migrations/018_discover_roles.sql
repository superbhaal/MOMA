-- 018_discover_roles.sql
-- Discover write-access role model (Learn / Watch / Explore).
--   reader (default) — reads only; sees the explanatory banner, no compose FAB.
--   contributor      — can post loved places/people to the Explore map.
--   admin            — contributor + moderation (staff).
-- Contributor is granted by MANUAL admin promotion (admin-api `update_user`);
-- there is no eligibility engine at MVP.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'reader';

-- Constraint added separately so re-runs don't error on an existing column.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_check CHECK (role IN ('reader','contributor','admin'));
  END IF;
END $$;

-- SECURITY DEFINER so RLS policies on loved_spots can check a caller's role
-- without granting broad read access to users. Mirrors is_member_of() (010).
CREATE OR REPLACE FUNCTION public.is_discover_contributor(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = uid AND role IN ('contributor','admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_discover_contributor(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_discover_contributor(uuid) TO authenticated;
