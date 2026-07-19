-- Home (useGroups/useMatching) subscribes to group_members and matching_queue to
-- refresh live after a user joins a group, but neither table was in the realtime
-- publication — so joining never notified Home and the "Finding your group…" card
-- stayed until an app relaunch. Publish both, with REPLICA IDENTITY FULL so the
-- RLS check on UPDATE (queue status) / DELETE (leave group) events has the row.
alter table public.group_members replica identity full;
alter table public.matching_queue replica identity full;

alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.matching_queue;
