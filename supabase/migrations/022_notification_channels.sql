-- 022_notification_channels.sql
-- The v11 Matching-preferences screen offers three notification channels —
-- Push, Email, In-app — where the schema only had push-shaped columns
-- (notif_meetup_reminders / notif_chat_activity). Add the two missing
-- channels so each switch has somewhere to live.
--
-- Both default to true: every existing account was already receiving the
-- match emails and in-app badges these govern, so defaulting to false would
-- silently opt everyone out.

alter table public.users
  add column if not exists notif_email  boolean not null default true,
  add column if not exists notif_in_app boolean not null default true;

comment on column public.users.notif_email is
  'Match confirmation + weekly group summary. Nothing else.';
comment on column public.users.notif_in_app is
  'Badges and the unread dot on group cards.';
