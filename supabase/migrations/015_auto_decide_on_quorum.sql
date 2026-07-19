-- 015_auto_decide_on_quorum.sql
-- Auto-confirm a meetup: flip an `open` proposal to `decided` as soon as the
-- number of `going` votes reaches a strict majority of the group's members.
--
--   members 3 -> quorum 2      members 4 -> quorum 3      members 5 -> quorum 3
--
-- The transition is one-directional (open -> decided only). Once a meetup is
-- "locked in" it stays locked even if a going-voter later backs out — matching
-- the "LOCKED IN" copy in the design. The UPDATE fires on `meetup_proposals`,
-- which already has REPLICA IDENTITY FULL (012), so every subscribed client
-- (chat pinned card, group-detail banner, Home card) refreshes in realtime.

-- Quorum rule, isolated so it is easy to tune (e.g. LEAST(3, n) for a fixed
-- floor, or n for unanimity). Strict majority with a minimum of 2 going.
create or replace function public.proposal_going_quorum(member_count int)
returns int
language sql
immutable
as $$
  select greatest(2, (member_count / 2) + 1);
$$;

-- Evaluate a single proposal and decide it if the quorum is met. SECURITY
-- DEFINER because there is intentionally no client-facing UPDATE policy on
-- meetup_proposals — state transitions only happen server-side.
create or replace function public.decide_proposal_if_quorum(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id   uuid;
  v_state      text;
  v_going      int;
  v_members    int;
begin
  select group_id, state
    into v_group_id, v_state
    from meetup_proposals
   where id = p_proposal_id;

  -- Only open proposals can be decided; ignore already decided/expired ones.
  if v_group_id is null or v_state <> 'open' then
    return;
  end if;

  select count(*) into v_going
    from proposal_votes
   where proposal_id = p_proposal_id
     and vote = 'going';

  select count(*) into v_members
    from group_members
   where group_id = v_group_id;

  if v_going >= proposal_going_quorum(v_members) then
    update meetup_proposals
       set state = 'decided',
           decided_at = now()
     where id = p_proposal_id
       and state = 'open';  -- guard against a concurrent transition
  end if;
end;
$$;

-- Trigger: any change to a proposal's votes re-evaluates that proposal.
-- Firing on DELETE/UPDATE too is harmless — decide_proposal_if_quorum is a
-- no-op unless the going count has actually crossed the quorum.
create or replace function public.trg_votes_maybe_decide()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform decide_proposal_if_quorum(coalesce(new.proposal_id, old.proposal_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists proposal_votes_maybe_decide on public.proposal_votes;
create trigger proposal_votes_maybe_decide
  after insert or update or delete on public.proposal_votes
  for each row execute function public.trg_votes_maybe_decide();
