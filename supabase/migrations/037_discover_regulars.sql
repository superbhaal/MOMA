-- 037_discover_regulars.sql
-- "Regulars" — the moms who contribute to Explore. The role already existed
-- (018) as 'contributor'; the client's word for it in the interface is Regular,
-- Habitué, Habitual. The DB keeps 'contributor' as the stored value: renaming a
-- value that RLS policies and is_discover_contributor() are built on would be
-- churn for the sake of a label.
--
-- Backs the fourth Discover tab: a searchable list of everyone with write
-- access to the map.
--
-- SECURITY DEFINER for the same reason as the other discover_* functions: a
-- reader must be able to see a contributor she shares no group with, which the
-- users table's own RLS deliberately forbids. Only public-facing columns are
-- returned — no email, no address, no coordinates.
--
-- Applied via the `discover_regulars` migration; this file is the record.

create extension if not exists unaccent with schema extensions;

create or replace function public.discover_regulars(p_query text default null)
returns table (
  id uuid, display_name text, profile_color text, avatar_url text,
  neighbourhood text, city text, bio text, spot_count bigint, reel_count bigint
)
language sql stable security definer set search_path = public, extensions
as $$
  select u.id, u.display_name, u.profile_color, u.avatar_url,
         u.neighbourhood, u.city, u.bio,
         (select count(*) from public.loved_spots s where s.poster_id = u.id),
         (select count(*) from public.community_reels r where r.poster_id = u.id)
  from public.users u
  where u.role in ('contributor', 'admin')
    and u.display_name is not null
    -- Accent- and case-insensitive: "amelie" must find Amélie, and someone
    -- typing her name properly must find her too.
    and (
      p_query is null
      or btrim(p_query) = ''
      or lower(extensions.unaccent(u.display_name))
         like '%' || lower(extensions.unaccent(btrim(p_query))) || '%'
    )
  order by
    (select count(*) from public.loved_spots s where s.poster_id = u.id) desc,
    u.display_name asc;
$$;

revoke all on function public.discover_regulars(text) from public, anon;
grant execute on function public.discover_regulars(text) to authenticated;
