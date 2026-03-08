-- møma initial schema
-- Run this in Supabase SQL editor or via supabase db push

-- Users (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text NOT NULL,
  baby_dob        date NOT NULL,
  city            text,
  latitude        float,
  longitude       float,
  profile_color   text,
  quiz_mood       text,
  quiz_schedule   text,
  quiz_connection text,
  quiz_identity   text,
  avatar_url      text,
  expo_push_token text,
  matched_at      timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read group members profiles"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  city            text,
  status          text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at      timestamptz DEFAULT now(),
  last_active_at  timestamptz
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  role            text DEFAULT 'member' CHECK (role IN ('member', 'mentor')),
  joined_at       timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their group memberships"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Meetups
CREATE TABLE IF NOT EXISTS meetups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid REFERENCES groups(id) ON DELETE CASCADE,
  title           text,
  scheduled_at    timestamptz,
  location_name   text,
  location_lat    float,
  location_lng    float,
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read meetups"
  ON meetups FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create meetups"
  ON meetups FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Meetup RSVPs
CREATE TABLE IF NOT EXISTS meetup_rsvps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id       uuid REFERENCES meetups(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  status          text DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  UNIQUE (meetup_id, user_id)
);

ALTER TABLE meetup_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own RSVPs"
  ON meetup_rsvps FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Group members can read RSVPs"
  ON meetup_rsvps FOR SELECT
  USING (
    meetup_id IN (
      SELECT m.id FROM meetups m
      JOIN group_members gm ON gm.group_id = m.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- DM Threads
CREATE TABLE IF NOT EXISTS dm_threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a   uuid REFERENCES users(id) ON DELETE CASCADE,
  participant_b   uuid REFERENCES users(id) ON DELETE CASCADE,
  group_id        uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (participant_a, participant_b)
);

ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read their DM threads"
  ON dm_threads FOR SELECT
  USING (auth.uid() IN (participant_a, participant_b));

CREATE POLICY "Users can create DM threads"
  ON dm_threads FOR INSERT
  WITH CHECK (auth.uid() IN (participant_a, participant_b));

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid REFERENCES groups(id) ON DELETE CASCADE,
  dm_thread_id    uuid REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  content         text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read group messages"
  ON messages FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
    OR dm_thread_id IN (
      SELECT id FROM dm_threads WHERE auth.uid() IN (participant_a, participant_b)
    )
  );

CREATE POLICY "Users can send messages to their groups"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
      OR dm_thread_id IN (
        SELECT id FROM dm_threads WHERE auth.uid() IN (participant_a, participant_b)
      )
    )
  );

-- Contributors (Trusted Recommendations)
CREATE TABLE IF NOT EXISTS contributors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name    text NOT NULL,
  handle          text UNIQUE,
  verified        boolean DEFAULT false,
  avatar_color    text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read contributors"
  ON contributors FOR SELECT
  USING (true);

-- Recco Posts (Trusted Recommendations)
CREATE TABLE IF NOT EXISTS recco_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id  uuid REFERENCES contributors(id) ON DELETE CASCADE,
  category        text CHECK (category IN ('classes', 'products', 'wellness', 'nutrition')),
  title           text NOT NULL,
  body            text NOT NULL,
  link_url        text,
  link_label      text,
  hero_style      jsonb,
  published_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE recco_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read recco posts"
  ON recco_posts FOR SELECT
  USING (true);

-- Saved Posts
CREATE TABLE IF NOT EXISTS saved_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  post_id         uuid REFERENCES recco_posts(id) ON DELETE CASCADE,
  saved_at        timestamptz DEFAULT now(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved posts"
  ON saved_posts FOR ALL
  USING (auth.uid() = user_id);

-- Matching Queue
CREATE TABLE IF NOT EXISTS matching_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status          text DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched')),
  queued_at       timestamptz DEFAULT now(),
  matched_at      timestamptz
);

ALTER TABLE matching_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own matching queue entry"
  ON matching_queue FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
