-- 003_harden_trigger_functions_search_path.sql
-- Pins search_path on the 4 trigger functions added in 002 to mitigate
-- search_path-injection (a malicious schema in the search_path could shadow
-- built-ins like `count` or `now`). Empty search_path forces fully-qualified
-- references, matching the Supabase database-linter recommendation:
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

CREATE OR REPLACE FUNCTION public.enforce_group_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT count(*) FROM public.group_members WHERE user_id = NEW.user_id) >= 2 THEN
    RAISE EXCEPTION 'User % already belongs to 2 groups (max).', NEW.user_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_last_active_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    UPDATE public.groups SET last_active_at = now() WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_mentor_role_on_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  is_eligible boolean;
  has_mentor  boolean;
BEGIN
  SELECT u.is_mentor_eligible INTO is_eligible
  FROM public.users u WHERE u.id = NEW.user_id;

  IF is_eligible THEN
    SELECT EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = NEW.group_id AND role = 'mentor'
    ) INTO has_mentor;

    IF NOT has_mentor THEN
      NEW.role := 'mentor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
