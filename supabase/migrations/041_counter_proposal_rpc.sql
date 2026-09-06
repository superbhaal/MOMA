-- Make "suggest a time" possible when a proposal is already open.
--
-- A partial unique index allows one 'open' proposal per group, which is the
-- right invariant — but it also means a counter-proposal cannot simply be
-- inserted: the insert violates the index and the member sees a failure with
-- no explanation. The sheet that authors these was never wired into the app,
-- so this had never been exercised.
--
-- The design says the replaced proposal "dims but stays visible", so it is not
-- gone and it is not a past meetup either. It gets its own state.

alter table meetup_proposals drop constraint if exists meetup_proposals_state_check;
alter table meetup_proposals add constraint meetup_proposals_state_check
  check (state in ('open', 'decided', 'expired', 'superseded'));

-- Supersede-then-insert has to be one transaction, or a failed insert leaves
-- the group with no open proposal at all.
create or replace function create_proposal(
  p_group_id uuid,
  p_scheduled_at timestamptz,
  p_note text default null,
  p_location_name text default null,
  p_parent_proposal_id uuid default null
) returns meetup_proposals
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row meetup_proposals;
begin
  if not exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'not a member of this group' using errcode = '42501';
  end if;

  update meetup_proposals
     set state = 'superseded'
   where group_id = p_group_id
     and state = 'open';

  insert into meetup_proposals (
    group_id, proposed_by, scheduled_at, note, location_name, parent_proposal_id
  ) values (
    p_group_id, auth.uid(), p_scheduled_at, p_note, p_location_name, p_parent_proposal_id
  ) returning * into v_row;

  return v_row;
end;
$$;

grant execute on function create_proposal(uuid, timestamptz, text, text, uuid) to authenticated;
