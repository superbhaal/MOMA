-- Push a notification on every new message. A DB trigger fires the notify-message
-- edge function via pg_net; the function resolves recipients (group members or the
-- other DM participant) and sends Expo pushes. Async (net.http_post queues and
-- returns), so it never blocks the INSERT.
--
-- The anon key below is the project's PUBLIC client key (already shipped in the
-- app) — it only serves to satisfy the function's verify_jwt; all privileged work
-- happens inside the function with the service_role key.

create extension if not exists pg_net;

create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://rqesqrlrlxetnvihpoxt.supabase.co/functions/v1/notify-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZXNxcmxybHhldG52aWhwb3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njg1NzIsImV4cCI6MjA4ODU0NDU3Mn0.SNj2xV1zUZgm0Dtd-THOB3BzeNmxJOq4RHI7ioZYLN0'
    ),
    body := jsonb_build_object('message_id', NEW.id)
  );
  return NEW;
end;
$$;

drop trigger if exists on_message_insert_notify on public.messages;
create trigger on_message_insert_notify
after insert on public.messages
for each row execute function public.notify_on_message();
