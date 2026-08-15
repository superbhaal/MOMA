-- 034_group_city_table_name.sql
-- Groups are named "<City> - Table n°X", X counting up per city.
-- Amsterdam - Table n°1, Amsterdam - Table n°2, Paris - Table n°1.
--
-- This replaces the initials scheme from 032, and inverts its central property.
-- Initials were a FUNCTION of the membership: they had to be recomputed every
-- time someone joined, left or fixed the spelling of her name, which is why
-- they lived in triggers on group_members and on users.display_name.
--
-- A table number is not. It is minted once, at creation, and then it is the
-- group's name for good — the table doesn't get renumbered because someone new
-- sat down. So both of those triggers go, and one BEFORE INSERT on `groups`
-- takes their place. A quieter design: the name stops moving.
--
-- The number is kept in its own column rather than parsed back out of the
-- display string. Reading "2" out of "Amsterdam - Table n°2" would work right
-- up until the format changes or a city has a dash in it.
--
-- Applied via the `group_city_table_name` migration; this file is the record.

alter table public.groups add column if not exists city_seq int;

drop trigger if exists group_members_c_name on public.group_members;
drop trigger if exists users_refresh_group_names on public.users;
drop function if exists public.refresh_group_name();
drop function if exists public.refresh_group_names_for_user();
drop function if exists public.group_initials(uuid);

create or replace function public.group_city_table_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city text;
begin
  -- A group with no city still needs a name; "Table n°3" alone is better than
  -- " - Table n°3". Both writers (match-users, admin-api) set city in the same
  -- insert, so this is a guard, not the usual path.
  v_city := nullif(btrim(coalesce(new.city, '')), '');

  if new.city_seq is null then
    select coalesce(max(g.city_seq), 0) + 1
      into new.city_seq
      from public.groups g
     where g.city is not distinct from new.city;
  end if;

  new.name := case
    when v_city is null then 'Table n°' || new.city_seq
    else v_city || ' - Table n°' || new.city_seq
  end;

  return new;
end;
$$;

create trigger groups_city_table_name
before insert on public.groups
for each row execute function public.group_city_table_name();

-- Backfill: number the existing groups by age within each city, so the oldest
-- Amsterdam group is Table n°1.
with numbered as (
  select id,
         row_number() over (partition by city order by created_at, id) as seq
  from public.groups
)
update public.groups g
set city_seq = n.seq,
    name = case
      when nullif(btrim(coalesce(g.city, '')), '') is null then 'Table n°' || n.seq
      else btrim(g.city) || ' - Table n°' || n.seq
    end
from numbered n
where n.id = g.id;

-- Turns a concurrent double-insert in the same city into a loud failure rather
-- than two groups quietly sharing a number. At one nightly matcher run this is
-- a formality, but it's the kind of thing that is cheap now and archaeology
-- later.
create unique index if not exists groups_city_seq_unique
  on public.groups (city, city_seq)
  where city_seq is not null;

revoke all on function public.group_city_table_name() from public, anon, authenticated;
