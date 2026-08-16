-- 035_group_name_drop_dash.sql
-- "Amsterdam - Table n°1" → "Amsterdam Table n°1". The dash goes, per the
-- client. Same rule as 034 in every other respect: minted once at insert,
-- numbered per city, never recomputed afterwards.
--
-- Applied via the `group_name_drop_dash` migration; this file is the record.

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
  -- a name that opens with a space. Both writers set city in the same insert,
  -- so this is a guard, not the usual path.
  v_city := nullif(btrim(coalesce(new.city, '')), '');

  if new.city_seq is null then
    select coalesce(max(g.city_seq), 0) + 1
      into new.city_seq
      from public.groups g
     where g.city is not distinct from new.city;
  end if;

  new.name := case
    when v_city is null then 'Table n°' || new.city_seq
    else v_city || ' Table n°' || new.city_seq
  end;

  return new;
end;
$$;

-- Rename in place. city_seq is untouched, so no group changes number.
update public.groups
set name = case
  when nullif(btrim(coalesce(city, '')), '') is null then 'Table n°' || city_seq
  else btrim(city) || ' Table n°' || city_seq
end
where city_seq is not null;

revoke all on function public.group_city_table_name() from public, anon, authenticated;
