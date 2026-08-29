-- 036_users_locale.sql
-- The app's UI language, stored so the SERVER can speak it too.
--
-- Translating the app does not translate the push notifications: "Your group is
-- ready", "møma picked a time" and the rest are composed in the edge functions,
-- where expo-localization and the phone's settings are both out of reach. This
-- column is how they find out.
--
-- Deliberately separate from users.primary_language. That one is the language
-- she SPEAKS, collected for matching, stored as 'English'/'French'/'Spanish'.
-- This one is the language she READS the app in, as an ISO code. They default
-- to each other and then diverge the moment she changes one — a Spanish speaker
-- in Amsterdam may well want the interface in English.
--
-- Null means "never chosen explicitly": the client falls back down its own
-- chain (OS, then primary_language, then English) and the server falls back to
-- English.
--
-- Applied to production on 2026-08-18 as the `users_locale` migration. This
-- file was missing until 2026-08-29 — caught while preparing the pre-prod
-- project, where replaying the files alone would have produced a database
-- without this column and broken every profile load.

alter table public.users add column if not exists locale text
  check (locale is null or locale in ('en', 'fr', 'es'));

comment on column public.users.locale is
  'UI language as an ISO code (en/fr/es). Null = never explicitly chosen. Distinct from primary_language, which is the spoken language used for matching.';
