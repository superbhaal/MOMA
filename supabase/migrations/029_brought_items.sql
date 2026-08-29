-- 029_brought_items.sql
-- Bring something to the table. One thing per mom, on her profile, visible to
-- everyone at her table.
--
-- Applied via the `brought_items` migration; this file is the record. Adds the
-- table, shares_group_with(), and brought_for_users().
--
-- Five kinds whose fields differ enough that a column per field would be mostly
-- nulls, so the shape lives in `payload` and is validated in the app — the same
-- bet as the Explore taxonomy, and for the same reason: both will keep moving.
--
-- What the DB does guarantee is the part the product rests on: ONE row per mom.
-- Bringing something else REPLACES what's there and the old one is not kept —
-- the client chose that over a history, so the composer warns before it happens.
--
-- Reach: yours, plus the tables you sit at. Deliberately not world-readable. A
-- Discover contributor's page is open to moms who share no group with her, and
-- what you bring to your table shouldn't end up in a shop window.

-- ── Reconstructed 2026-08-29 ────────────────────────────────────────────────
-- This file held only the notes above: the migration was applied through the
-- MCP tool and the file written afterwards as a record, which is invisible
-- until someone replays the folder onto a fresh database — as the pre-prod
-- project does. The statements below are extracted from the live production
-- schema, so they reproduce it rather than approximate it.

create table if not exists public.brought_items (
  user_id    uuid primary key references public.users(id) on delete cascade,
  kind       text not null check (kind in ('recipe', 'book', 'find', 'listen', 'tip')),
  payload    jsonb not null default '{}'::jsonb,
  photo_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brought_items enable row level security;

-- "Do we sit at a table together?" — SECURITY DEFINER because the answer needs
-- to read group_members rows for BOTH people, and RLS only lets you see your
-- own memberships.
create or replace function public.shares_group_with(uid uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members a
    JOIN public.group_members b ON b.group_id = a.group_id
    WHERE a.user_id = auth.uid() AND b.user_id = uid
  );
$function$;

-- Reach: yours, plus the tables you sit at. Deliberately not world-readable.
create policy brought_select on public.brought_items
  for select to authenticated
  using (user_id = auth.uid() or public.shares_group_with(user_id));

create policy brought_insert on public.brought_items
  for insert to authenticated
  with check (user_id = auth.uid());

create policy brought_update on public.brought_items
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy brought_delete on public.brought_items
  for delete to authenticated
  using (user_id = auth.uid());

-- One round trip for a whole group's worth of cards, with the poster's name and
-- colour joined in, and the same reach rule applied inside.
create or replace function public.brought_for_users(p_ids uuid[])
returns table(user_id uuid, kind text, payload jsonb, photo_url text,
              updated_at timestamptz, poster_name text, poster_color text)
language sql
stable security definer
set search_path to 'public'
as $function$
  SELECT b.user_id, b.kind, b.payload, b.photo_url, b.updated_at,
         u.display_name, u.profile_color
  FROM public.brought_items b
  LEFT JOIN public.users u ON u.id = b.user_id
  WHERE b.user_id = ANY (p_ids)
    AND (b.user_id = auth.uid() OR public.shares_group_with(b.user_id));
$function$;
