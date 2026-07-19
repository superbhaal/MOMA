-- Realtime postgres_changes applies RLS to decide whether to deliver an event.
-- For UPDATE/DELETE, the RLS check needs the full row — with the default replica
-- identity only the primary key is in the WAL, so vote changes (going→can't),
-- unvotes, and proposal state flips (open→decided/expired) can fail to reach
-- other members live. REPLICA IDENTITY FULL puts the whole row in the WAL so the
-- RLS visibility check has what it needs.
alter table public.meetup_proposals replica identity full;
alter table public.proposal_votes replica identity full;
