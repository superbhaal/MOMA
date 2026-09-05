-- discover_contributor returned ANY user's row for ANY uuid: display name,
-- neighbourhood, city, bio, interests, avatar. No role filter at all.
--
-- CLAUDE.md's own rule for `users` is "read own row + members of shared groups;
-- never read strangers", and this function walked around it — it is SECURITY
-- DEFINER, so RLS never applied, and it is reachable at
-- /rest/v1/rpc/discover_contributor by any signed-in woman. Uuids are not
-- secret either: they come back on every group member and every
-- loved_spots.poster_id.
--
-- Found by the `authenticated_security_definer_function_executable` advisory,
-- not by me — and 038 widened this same function the day before, adding role
-- and avatar_url, without anyone noticing the missing WHERE.
--
-- The fix is to make it do what its name says. Every route that reaches this
-- screen — the Regulars list, and a place's "added by" — is a contributor by
-- construction, so the filter costs nothing and closes the enumeration.
-- Verified after applying: 0 rows for a reader, 1 for a contributor, 22 reader
-- profiles no longer reachable.

create or replace function public.discover_contributor(p_id uuid)
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
  where u.id = p_id
    and u.role in ('contributor', 'admin');
$$;

revoke all on function public.discover_contributor(uuid) from public, anon;
grant execute on function public.discover_contributor(uuid) to authenticated;
