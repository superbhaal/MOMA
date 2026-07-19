-- group_members had only a SELECT policy, so every client-side write was denied
-- by RLS. That made "Join this group" (accept), "Find me another" (decline) and
-- "Leave group" silently no-op — the matcher only worked because it writes with
-- the service_role key, which bypasses RLS.
--
-- Allow a user to add/remove their OWN membership row. The 2-group cap stays
-- enforced by the enforce_group_cap BEFORE INSERT trigger, not by RLS.

create policy "Users can join a group themselves"
on public.group_members
for insert
with check ( user_id = auth.uid() );

create policy "Users can leave their own membership"
on public.group_members
for delete
using ( user_id = auth.uid() );
