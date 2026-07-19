-- Fix: members could only read their OWN group_members row, so the app never
-- saw co-members. Consequences: Group Preview showed "1 mom" (others.length 0)
-- and Home showed a single avatar even though the group had 3–5 members.
--
-- We widen the SELECT policy so a user can read every membership row for any
-- group they belong to. A naive `group_id IN (SELECT ... FROM group_members ...)`
-- policy would recurse (the subquery re-triggers the same policy), so the
-- membership check lives in a SECURITY DEFINER helper that bypasses RLS.

create or replace function public.is_member_of(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = gid
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_member_of(uuid) from public;
grant execute on function public.is_member_of(uuid) to authenticated;

drop policy if exists "Members can read their group memberships" on public.group_members;

create policy "Members can read co-members in their groups"
on public.group_members
for select
using ( public.is_member_of(group_id) );
