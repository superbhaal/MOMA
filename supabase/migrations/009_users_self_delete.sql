-- 009_users_self_delete.sql
-- Lets a user delete their own profile row (Me → Settings → Privacy & data →
-- Delete my account). Owned rows in child tables are removed by the app first;
-- the auth.users identity is cleaned up server-side (the app holds only the anon key).

DROP POLICY IF EXISTS "Users can delete own profile" ON users;
CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (auth.uid() = id);
