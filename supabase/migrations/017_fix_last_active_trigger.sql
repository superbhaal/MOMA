-- 017_fix_last_active_trigger.sql
-- The last_active_at trigger ran as SECURITY INVOKER, so its UPDATE on `groups`
-- was silently filtered by RLS (groups exposes only a SELECT policy) and never
-- landed → groups.last_active_at stayed null → GroupPulse always read "quiet
-- today" even in active groups. Make the function SECURITY DEFINER so it bypasses
-- RLS for this one controlled write, and backfill existing groups.

create or replace function public.update_last_active_on_message()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.group_id is not null then
    update public.groups set last_active_at = now() where id = new.group_id;
  end if;
  return new;
end;
$function$;

update public.groups g
set last_active_at = sub.max_created
from (
  select group_id, max(created_at) as max_created
  from public.messages
  where group_id is not null
  group by group_id
) sub
where g.id = sub.group_id
  and (g.last_active_at is null or g.last_active_at < sub.max_created);
