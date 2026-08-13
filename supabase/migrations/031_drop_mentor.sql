-- 031_drop_mentor.sql
-- The mentor idea is gone: no "one experienced mom per group", no badge, no
-- auto-promotion on join.
--
-- It was three things at once — a matching signal, a role, and a pill — so
-- removing it removes all three. What's left is what the product actually
-- promises: a small group of moms at the same stage, none of them appointed.
--
-- `group_members.role` only ever held 'member' or 'mentor'; with mentor gone it
-- would hold one value, which is no information at all.

DROP TRIGGER IF EXISTS group_members_b_set_mentor ON public.group_members;
DROP FUNCTION IF EXISTS public.set_mentor_role_on_join();
ALTER TABLE public.group_members DROP COLUMN IF EXISTS role;
ALTER TABLE public.users DROP COLUMN IF EXISTS is_mentor_eligible;
