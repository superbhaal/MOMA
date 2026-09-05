-- discover_contributor gains `role` and `avatar_url`.
--
-- `role` so the profile screen can show the Regular badge. It was showing on the
-- Regulars list (which reads discover_regulars, and that one filters on role)
-- but vanished the moment you opened someone — the profile had no way to know.
-- Inferring it from "you can only reach this screen via a contributor" would
-- have worked today and rotted the first time another route reached it.
--
-- `avatar_url` because the hero could never show a photo at all: the function
-- never returned one, so every profile fell back to an initial.
--
-- RETURNS TABLE cannot be widened by CREATE OR REPLACE, hence the DROP. The
-- grants from 033 die with the function and are re-stated below — losing them
-- would open the function to `anon`.

drop function if exists public.discover_contributor(uuid);

create function public.discover_contributor(p_id uuid)
returns table (
  id uuid, display_name text, profile_color text, neighbourhood text,
  city text, bio text, interests text[], spot_count bigint,
  role text, avatar_url text
)
language sql stable security definer set search_path = public
as $$
  select u.id, u.display_name, u.profile_color, u.neighbourhood, u.city, u.bio, u.interests,
         (select count(*) from public.loved_spots s where s.poster_id = u.id),
         u.role, u.avatar_url
  from public.users u
  where u.id = p_id;
$$;

revoke all on function public.discover_contributor(uuid) from public, anon;
grant execute on function public.discover_contributor(uuid) to authenticated;
