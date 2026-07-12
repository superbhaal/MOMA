-- 008_notification_prefs.sql
-- Notification settings, surfaced on the Me → Settings → Notifications screen.
-- Stored on `users` alongside the other pref_* columns so a single profile fetch
-- carries everything the app needs. Cadence governs group-chat activity pushes;
-- meetup reminders and quiet hours are independent toggles.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notif_meetup_reminders   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_chat_activity      text    NOT NULL DEFAULT 'daily',  -- every | daily | weekly | off
  ADD COLUMN IF NOT EXISTS notif_quiet_hours_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_quiet_start        text    NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS notif_quiet_end          text    NOT NULL DEFAULT '07:00';
