-- 006_avatars_storage.sql
-- Create the `avatars` bucket used for profile photos, with RLS policies that
-- allow public read and authenticated write inside the user's own folder.
-- (Applied via MCP on 2026-05-17.)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: anyone can read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "avatars: users can upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars: users can update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars: users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
