-- 002_align_to_design.sql
-- Aligns the schema with the design imported on 2026-04-26 (design/moma-enhanced.html).
--
-- Summary of changes:
--   * Drops the recco/contributor model (replaced by Sanity Learn content)
--   * Drops meetups + meetup_rsvps (merged into meetup_proposals + proposal_votes)
--   * Replaces the 4 quiz_* fields on users with stage-aware quiz columns + prefs
--   * Adds: meetup_proposals, proposal_votes, availability_slots, saved_tips,
--           match_decline_reasons, inactive_group_prompts
--   * Adds 4 triggers: 2-group cap, last_active bump, mentor auto-promote, users.updated_at
--   * Enforces "one open proposal per group" via partial unique index
--   * RLS policies for all new tables
--   * Adds proposals + votes to realtime publication

BEGIN;

-- ============================================================
-- 1. DROP REMOVED TABLES
-- ============================================================

DROP TABLE IF EXISTS meetup_rsvps CASCADE;
DROP TABLE IF EXISTS meetups      CASCADE;
DROP TABLE IF EXISTS saved_posts  CASCADE;
DROP TABLE IF EXISTS recco_posts  CASCADE;
DROP TABLE IF EXISTS contributors CASCADE;

-- ============================================================
-- 2. ALTER `users`
-- ============================================================

-- 2a. Drop legacy quiz fields (replaced by stage-aware quiz)
ALTER TABLE users
  DROP COLUMN IF EXISTS quiz_mood,
  DROP COLUMN IF EXISTS quiz_schedule,
  DROP COLUMN IF EXISTS quiz_connection,
  DROP COLUMN IF EXISTS quiz_identity;

-- 2b. Identity / contact (email mirrored from auth.users for ergonomic joins)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email          text,
  ADD COLUMN IF NOT EXISTS last_name      text,
  ADD COLUMN IF NOT EXISTS age            int,
  ADD COLUMN IF NOT EXISTS neighbourhood  text;

-- Backfill email from auth.users for any pre-existing rows
UPDATE users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id AND u.email IS NULL;

-- 2c. Quiz answers
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS life_stage          text
    CHECK (life_stage IN ('expecting','newborn','growing','veteran')),
  ADD COLUMN IF NOT EXISTS scene_tags          text[],
  ADD COLUMN IF NOT EXISTS free_window         text
    CHECK (free_window IN ('mornings','weekends','evenings','unpredictable','all')),
  ADD COLUMN IF NOT EXISTS is_first_baby       boolean,
  ADD COLUMN IF NOT EXISTS is_mentor_eligible  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_language    text,
  ADD COLUMN IF NOT EXISTS secondary_languages text[];

-- 2d. Matching preferences (defaults set at onboarding, editable in /preferences)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pref_age_window_weeks int    DEFAULT 4,
  ADD COLUMN IF NOT EXISTS pref_distance_minutes int    DEFAULT 20,
  ADD COLUMN IF NOT EXISTS pref_baby_at_meetups  text   DEFAULT 'always'
    CHECK (pref_baby_at_meetups IN ('always','sometimes_without','either')),
  ADD COLUMN IF NOT EXISTS pref_meetup_formats   text[] DEFAULT ARRAY['coffee','walk','park'],
  ADD COLUMN IF NOT EXISTS pref_free_blocks      text[] DEFAULT ARRAY['morning','afternoon'];

-- 2e. Profile extras (all optional)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS interests        text[],
  ADD COLUMN IF NOT EXISTS instagram_handle text;

-- 2f. State
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS paused_until timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();

-- ============================================================
-- 3. ALTER `groups`
-- ============================================================

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS neighbourhood text,
  ADD COLUMN IF NOT EXISTS type          text DEFAULT 'neighbourhood'
    CHECK (type IN ('neighbourhood','hobby','class','working_moms'));

-- ============================================================
-- 4. ALTER `messages` — attachments (place cards, proposal refs)
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_type text
    CHECK (attachment_type IN ('place','proposal_ref')),
  ADD COLUMN IF NOT EXISTS attachment_data jsonb;

-- ============================================================
-- 5. ALTER `matching_queue` — add `previewing` state + preview group
-- ============================================================

ALTER TABLE matching_queue
  DROP CONSTRAINT IF EXISTS matching_queue_status_check;

ALTER TABLE matching_queue
  ADD CONSTRAINT matching_queue_status_check
    CHECK (status IN ('waiting','previewing','matched'));

ALTER TABLE matching_queue
  ADD COLUMN IF NOT EXISTS current_preview_group_id uuid
    REFERENCES groups(id) ON DELETE SET NULL;

-- ============================================================
-- 6. NEW TABLE: meetup_proposals
-- ============================================================

CREATE TABLE IF NOT EXISTS meetup_proposals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  proposed_by        uuid REFERENCES users(id) ON DELETE SET NULL,            -- null = system seeded
  parent_proposal_id uuid REFERENCES meetup_proposals(id) ON DELETE SET NULL, -- counter-proposal link
  scheduled_at       timestamptz NOT NULL,
  location_name      text,
  location_lat       float,
  location_lng       float,
  note               text,
  state              text NOT NULL DEFAULT 'open'
    CHECK (state IN ('open','decided','expired')),
  decided_at         timestamptz,
  created_at         timestamptz DEFAULT now()
);

-- One-open-proposal-per-group invariant (B1)
CREATE UNIQUE INDEX IF NOT EXISTS one_open_proposal_per_group
  ON meetup_proposals(group_id) WHERE state = 'open';

CREATE INDEX IF NOT EXISTS meetup_proposals_group_state_idx
  ON meetup_proposals(group_id, state);

-- ============================================================
-- 7. NEW TABLE: proposal_votes
-- ============================================================

CREATE TABLE IF NOT EXISTS proposal_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES meetup_proposals(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id)            ON DELETE CASCADE,
  vote        text NOT NULL CHECK (vote IN ('going','maybe','cant')),
  voted_at    timestamptz DEFAULT now(),
  UNIQUE (proposal_id, user_id)
);

-- ============================================================
-- 8. NEW TABLE: availability_slots
-- ============================================================

CREATE TABLE IF NOT EXISTS availability_slots (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date      date NOT NULL,
  block     text NOT NULL CHECK (block IN ('morning','afternoon','evening')),
  available boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, date, block)
);

CREATE INDEX IF NOT EXISTS availability_slots_user_date_idx
  ON availability_slots(user_id, date);

-- ============================================================
-- 9. NEW TABLE: saved_tips (Sanity-backed bookmarks from Learn tab)
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_tips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sanity_doc_id text NOT NULL,
  doc_type      text NOT NULL CHECK (doc_type IN ('read_article','watch_reel','recommendation')),
  saved_at      timestamptz DEFAULT now(),
  UNIQUE (user_id, sanity_doc_id)
);

-- ============================================================
-- 10. NEW TABLE: match_decline_reasons
-- ============================================================

CREATE TABLE IF NOT EXISTS match_decline_reasons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preview_group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  reason           text NOT NULL
    CHECK (reason IN ('wrong_neighbourhood','baby_age_mismatch','language','vibe','curious')),
  declined_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 11. NEW TABLE: inactive_group_prompts
-- ============================================================

CREATE TABLE IF NOT EXISTS inactive_group_prompts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  prompted_at   timestamptz DEFAULT now(),
  user_response text CHECK (user_response IN ('still_here','find_new')),
  responded_at  timestamptz
);

CREATE INDEX IF NOT EXISTS inactive_group_prompts_group_user_idx
  ON inactive_group_prompts(group_id, user_id);

-- ============================================================
-- 12. TRIGGERS
-- ============================================================

-- (a) Enforce 2-group cap. Triggers alphabetically before mentor-promote.
CREATE OR REPLACE FUNCTION enforce_group_cap()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM group_members WHERE user_id = NEW.user_id) >= 2 THEN
    RAISE EXCEPTION 'User % already belongs to 2 groups (max).', NEW.user_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS group_members_a_enforce_cap ON group_members;
CREATE TRIGGER group_members_a_enforce_cap
  BEFORE INSERT ON group_members
  FOR EACH ROW EXECUTE FUNCTION enforce_group_cap();

-- (b) Bump groups.last_active_at on every group message
CREATE OR REPLACE FUNCTION update_last_active_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    UPDATE groups SET last_active_at = now() WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_update_last_active ON messages;
CREATE TRIGGER messages_update_last_active
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_last_active_on_message();

-- (c) Auto-promote a mentor-eligible user to mentor role iff the group has no mentor yet.
--     Note: under concurrent inserts of two eligible users into the same group, both can win
--     the race. Acceptable for MVP — fixable later via a unique partial index per group.
CREATE OR REPLACE FUNCTION set_mentor_role_on_join()
RETURNS TRIGGER AS $$
DECLARE
  is_eligible boolean;
  has_mentor  boolean;
BEGIN
  SELECT u.is_mentor_eligible INTO is_eligible
  FROM users u WHERE u.id = NEW.user_id;

  IF is_eligible THEN
    SELECT EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = NEW.group_id AND role = 'mentor'
    ) INTO has_mentor;

    IF NOT has_mentor THEN
      NEW.role := 'mentor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS group_members_b_set_mentor ON group_members;
CREATE TRIGGER group_members_b_set_mentor
  BEFORE INSERT ON group_members
  FOR EACH ROW EXECUTE FUNCTION set_mentor_role_on_join();

-- (d) Bump users.updated_at on every UPDATE
CREATE OR REPLACE FUNCTION bump_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_bump_updated_at ON users;
CREATE TRIGGER users_bump_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION bump_updated_at();

-- ============================================================
-- 13. ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE meetup_proposals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_tips             ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_decline_reasons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inactive_group_prompts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. RLS POLICIES (new tables)
-- ============================================================

-- meetup_proposals: members of the group read; members can insert (system seeded via service_role)
DROP POLICY IF EXISTS "Group members read proposals" ON meetup_proposals;
CREATE POLICY "Group members read proposals"
  ON meetup_proposals FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Group members create proposals" ON meetup_proposals;
CREATE POLICY "Group members create proposals"
  ON meetup_proposals FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    AND (proposed_by = auth.uid() OR proposed_by IS NULL)
  );

-- (No UPDATE policy: state transitions to decided/expired happen server-side via Edge Functions
--  using the service_role key, which bypasses RLS.)

-- proposal_votes: users manage own votes for proposals in groups they belong to.
--                 group members can read all votes (for the live tally on the proposal card).
DROP POLICY IF EXISTS "Users manage own votes" ON proposal_votes;
CREATE POLICY "Users manage own votes"
  ON proposal_votes FOR ALL
  USING (
    auth.uid() = user_id
    AND proposal_id IN (
      SELECT mp.id FROM meetup_proposals mp
      JOIN group_members gm ON gm.group_id = mp.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND proposal_id IN (
      SELECT mp.id FROM meetup_proposals mp
      JOIN group_members gm ON gm.group_id = mp.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members read all votes" ON proposal_votes;
CREATE POLICY "Group members read all votes"
  ON proposal_votes FOR SELECT
  USING (
    proposal_id IN (
      SELECT mp.id FROM meetup_proposals mp
      JOIN group_members gm ON gm.group_id = mp.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- availability_slots: own only
DROP POLICY IF EXISTS "Users manage own availability" ON availability_slots;
CREATE POLICY "Users manage own availability"
  ON availability_slots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- saved_tips: own only
DROP POLICY IF EXISTS "Users manage own saved tips" ON saved_tips;
CREATE POLICY "Users manage own saved tips"
  ON saved_tips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- match_decline_reasons: own only
DROP POLICY IF EXISTS "Users manage own decline reasons" ON match_decline_reasons;
CREATE POLICY "Users manage own decline reasons"
  ON match_decline_reasons FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- inactive_group_prompts: read + update own only (rows are inserted by Edge Function)
DROP POLICY IF EXISTS "Users read own inactive prompts" ON inactive_group_prompts;
CREATE POLICY "Users read own inactive prompts"
  ON inactive_group_prompts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own inactive prompts" ON inactive_group_prompts;
CREATE POLICY "Users update own inactive prompts"
  ON inactive_group_prompts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 15. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE meetup_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_votes;

COMMIT;
