-- 016_notify_on_proposal_decided.sql
-- Push a notification when a meetup gets locked in (state -> 'decided'). Fires
-- on the UPDATE regardless of what caused it (quorum auto-decide today, an admin
-- lock-in tomorrow), via pg_net -> notify-proposal-decided edge function. Async,
-- so it never blocks the UPDATE inside the quorum trigger.
--
-- The Bearer token is the project's PUBLIC anon key (already shipped in the app);
-- it only satisfies the function's verify_jwt. All privileged work happens inside
-- the function with the service_role key.

create or replace function public.notify_on_proposal_decided()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.state = 'decided' and coalesce(old.state, '') <> 'decided' then
    perform net.http_post(
      url := 'https://rqesqrlrlxetnvihpoxt.supabase.co/functions/v1/notify-proposal-decided',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZXNxcmxybHhldG52aWhwb3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njg1NzIsImV4cCI6MjA4ODU0NDU3Mn0.SNj2xV1zUZgm0Dtd-THOB3BzeNmxJOq4RHI7ioZYLN0'
      ),
      body := jsonb_build_object('proposal_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_proposal_decided_notify on public.meetup_proposals;
create trigger on_proposal_decided_notify
  after update of state on public.meetup_proposals
  for each row execute function public.notify_on_proposal_decided();
