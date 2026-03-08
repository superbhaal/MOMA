export interface User {
  id: string;
  display_name: string;
  baby_dob: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_color: string | null;
  quiz_mood: string | null;
  quiz_schedule: string | null;
  quiz_connection: string | null;
  quiz_identity: string | null;
  avatar_url: string | null;
  expo_push_token: string | null;
  matched_at: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  city: string | null;
  status: 'active' | 'archived';
  created_at: string;
  last_active_at: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'member' | 'mentor';
  joined_at: string;
}

export interface Meetup {
  id: string;
  group_id: string;
  title: string;
  scheduled_at: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_by: string;
  created_at: string;
}

export interface MeetupRsvp {
  id: string;
  meetup_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
}

export interface Message {
  id: string;
  group_id: string | null;
  dm_thread_id: string | null;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface DmThread {
  id: string;
  participant_a: string;
  participant_b: string;
  group_id: string;
  created_at: string;
}

export interface ReccoPost {
  id: string;
  contributor_id: string;
  category: 'classes' | 'products' | 'wellness' | 'nutrition';
  title: string;
  body: string;
  link_url: string | null;
  link_label: string | null;
  hero_style: Record<string, string> | null;
  published_at: string | null;
  created_at: string;
}

export interface Contributor {
  id: string;
  display_name: string;
  handle: string;
  verified: boolean;
  avatar_color: string | null;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  saved_at: string;
}

export interface MatchingQueue {
  id: string;
  user_id: string;
  status: 'waiting' | 'matched';
  queued_at: string;
  matched_at: string | null;
}

export interface GroupWithDetails extends Group {
  members: (GroupMember & { user: User })[];
  next_meetup: Meetup | null;
  last_message: Message | null;
  unread_count: number;
}
