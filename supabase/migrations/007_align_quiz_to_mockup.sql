-- 007_align_quiz_to_mockup.sql
-- Align the onboarding quiz to the mockup design (design/moma-enhanced.html):
--   - drop scene_tags (no longer asked anywhere)
--   - drop free_window (replaced by a 2×3 availability matrix)
--   - add kid_count (none|one|two|many) — new Q0
--   - add recurring_availability (jsonb) — Q2 matrix
-- life_stage is kept on the row, but it's now DERIVED from baby_dob at save-time
-- by the app (see lib/lifeStage.ts), not user-selected.
-- (Applied via MCP on 2026-05-17.)

alter table public.users drop column if exists scene_tags;
alter table public.users drop column if exists free_window;

alter table public.users add column if not exists kid_count text;
alter table public.users add column if not exists recurring_availability jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_kid_count_check'
  ) then
    alter table public.users
      add constraint users_kid_count_check
      check (kid_count is null or kid_count in ('none','one','two','many'));
  end if;
end $$;
