// Domain types — kept in lock-step with supabase/migrations/*.sql
// Re-write any time the schema moves.

// ──────────────────────────────────────────────────────────────
// Enums (mirror Postgres CHECK constraints)
// ──────────────────────────────────────────────────────────────

export type LifeStage = 'expecting' | 'newborn' | 'growing' | 'veteran';
export type KidCount = 'none' | 'one' | 'two' | 'many';

/**
 * Recurring availability matrix shown in onboarding Q2.
 * Keys = "<dayType>_<timeBlock>", values = boolean (true if the user is usually free).
 */
export interface RecurringAvailability {
  weekday_morning: boolean;
  weekday_afternoon: boolean;
  weekday_evening: boolean;
  weekend_morning: boolean;
  weekend_afternoon: boolean;
  weekend_evening: boolean;
}
export type BabyAtMeetups = 'always' | 'sometimes_without' | 'either';
export type GroupType = 'neighbourhood' | 'hobby' | 'class' | 'working_moms';
export type GroupStatus = 'active' | 'archived';
export type MemberRole = 'member' | 'mentor';
export type ProposalState = 'open' | 'decided' | 'expired';
export type Vote = 'going' | 'maybe' | 'cant';
export type AvailabilityBlock = 'morning' | 'afternoon' | 'evening';
export type SavedDocType = 'read_article' | 'watch_reel' | 'recommendation';

export type DiscoverRole = 'reader' | 'contributor' | 'admin';

/** The five things a mom can bring to the table (029_brought_items). */
export type BroughtKind = 'recipe' | 'book' | 'find' | 'listen' | 'tip';

export interface RecipeIngredient {
  qty: string;
  name: string;
}

/**
 * One thing on the table. The fields differ per kind, so the shape lives in
 * `payload` — validated in the app the way the Explore taxonomy is, since both
 * are expected to keep moving.
 *
 *   recipe  { title, why, ingredients: RecipeIngredient[], steps: string[] }
 *   book    { title, author, why, quote? }
 *   find    { title, why, where? }
 *   listen  { title, maker, when }
 *   tip     { tip, how, who? }
 */
export interface BroughtItem {
  user_id: string;
  kind: BroughtKind;
  payload: Record<string, unknown>;
  photo_url: string | null;
  updated_at: string;
  /** Present on reads through `brought_for_users` — never on your own row. */
  poster_name?: string | null;
  poster_color?: string | null;
}

/** Explore map: a loved spot is either a place or a practitioner. */
export type LovedKind = 'place' | 'person';
export type PlaceCategory =
  | 'cafes'
  | 'restaurants'
  | 'parks'
  | 'playgrounds'
  | 'classes'
  | 'baby_shops'
  | 'mom_shops'
  | 'wellness'
  | 'stays';
export type PersonCategory =
  | 'pediatricians'
  | 'gynecologists'
  | 'midwives_doulas'
  | 'lactation'
  | 'therapists'
  | 'pelvic_floor'
  | 'dentists'
  | 'daycare'
  | 'nannies';
export type LovedCategory = PlaceCategory | PersonCategory;
export type NotifChatCadence = 'every' | 'daily' | 'weekly' | 'off';
export type DeclineReason =
  | 'wrong_neighbourhood'
  | 'baby_age_mismatch'
  | 'language'
  | 'vibe'
  | 'curious';
export type InactiveResponse = 'still_here' | 'find_new';
export type AttachmentType = 'place' | 'proposal_ref';
export type MatchingStatus = 'waiting' | 'previewing' | 'matched';

// ──────────────────────────────────────────────────────────────
// Tables
// ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string | null;
  display_name: string;
  last_name: string | null;
  age: number | null;
  baby_dob: string;
  city: string | null;
  neighbourhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_color: string | null;

  /** Discover write-access role (018_discover_roles). Default 'reader'. */
  role: DiscoverRole;

  life_stage: LifeStage | null;
  kid_count: KidCount | null;
  recurring_availability: RecurringAvailability | null;
  is_first_baby: boolean | null;
  is_mentor_eligible: boolean;
  primary_language: string | null;
  secondary_languages: string[] | null;

  pref_age_window_weeks: number;
  pref_distance_minutes: number;
  pref_baby_at_meetups: BabyAtMeetups;
  pref_meetup_formats: string[];
  pref_free_blocks: string[];

  bio: string | null;
  interests: string[] | null;
  instagram_handle: string | null;
  avatar_url: string | null;

  notif_meetup_reminders: boolean;
  notif_chat_activity: NotifChatCadence;
  notif_email: boolean;
  notif_in_app: boolean;
  notif_quiet_hours_enabled: boolean;
  notif_quiet_start: string;
  notif_quiet_end: string;

  matched_at: string | null;
  paused_until: string | null;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  city: string | null;
  neighbourhood: string | null;
  type: GroupType;
  status: GroupStatus;
  created_at: string;
  last_active_at: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface MeetupProposal {
  id: string;
  group_id: string;
  proposed_by: string | null; // null = system seeded
  parent_proposal_id: string | null;
  scheduled_at: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  note: string | null;
  state: ProposalState;
  decided_at: string | null;
  created_at: string;
}

export interface ProposalVote {
  id: string;
  proposal_id: string;
  user_id: string;
  vote: Vote;
  voted_at: string;
}

export interface AvailabilitySlot {
  id: string;
  user_id: string;
  date: string;
  block: AvailabilityBlock;
  available: boolean;
}

export interface Message {
  id: string;
  group_id: string | null;
  dm_thread_id: string | null;
  sender_id: string;
  content: string;
  attachment_type: AttachmentType | null;
  attachment_data: PlaceAttachment | ProposalRefAttachment | null;
  created_at: string;
}

export interface PlaceAttachment {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  rating?: number | null;
  place_id?: string | null;
}

export interface ProposalRefAttachment {
  proposal_id: string;
}

/**
 * A place or practitioner vouched for by one named contributor (Explore map,
 * 019_loved_spots). The `note` is the payload. Joined with the poster for
 * attribution (name + identity ring).
 */
export interface LovedSpot {
  id: string;
  kind: LovedKind;
  poster_id: string;
  name: string;
  category: LovedCategory;
  note: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  booking_url: string | null;
  /** Optional — the composer offers "Skip for now", and most spots take it. */
  photo_url: string | null;
  created_at: string;
}

/** Public contributor profile for the Explore trust anchor (021 RPC). */
export interface Contributor {
  id: string;
  display_name: string;
  profile_color: string | null;
  neighbourhood: string | null;
  city: string | null;
  bio: string | null;
  interests: string[] | null;
  spot_count: number;
}

/** One mom's recommendation of a place, inside that place's group. */
export interface SpotRecommendation {
  spot_id: string;
  poster_id: string;
  poster_name: string | null;
  poster_color: string | null;
  note: string;
  photo_url: string | null;
  created_at: string;
}

/**
 * A place, as opposed to a post about a place (028_loved_spot_grouping).
 *
 * Until now a row WAS a place: two moms recommending the same café made two
 * pins and two detail pages, and nothing told the reader that two people had
 * vouched for it. Rows sharing a Google place_id — or, for hand-added places,
 * the same geocoded coordinates — now arrive as one of these, carrying every
 * recommendation made about it.
 *
 * The identity fields come from the earliest recommendation; the contact
 * details from whichever one bothered to give them; the photo from the most
 * recent one that has any.
 */
export interface LovedPlace {
  key: string;
  /** The earliest recommendation's id — what the detail route opens on. */
  id: string;
  kind: LovedKind;
  name: string;
  category: LovedCategory;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  booking_url: string | null;
  photo_url: string | null;
  /** The newest recommendation's timestamp — what the list sorts on. */
  created_at: string;
  rec_count: number;
  /** Newest first. Never empty. */
  recommendations: SpotRecommendation[];
}

/** A loved spot joined with its contributor, for the sheet row + detail. */
export interface LovedSpotWithPoster extends LovedSpot {
  poster: {
    id: string;
    display_name: string;
    profile_color: string | null;
    neighbourhood: string | null;
  } | null;
}

export interface DmThread {
  id: string;
  participant_a: string;
  participant_b: string;
  group_id: string | null;
  created_at: string;
}

export interface SavedTip {
  id: string;
  user_id: string;
  sanity_doc_id: string;
  doc_type: SavedDocType;
  saved_at: string;
}

export interface MatchingQueueRow {
  id: string;
  user_id: string;
  status: MatchingStatus;
  current_preview_group_id: string | null;
  queued_at: string;
  matched_at: string | null;
}

export interface MatchDeclineReason {
  id: string;
  user_id: string;
  preview_group_id: string | null;
  reason: DeclineReason;
  declined_at: string;
}

export interface InactiveGroupPrompt {
  id: string;
  group_id: string;
  user_id: string;
  prompted_at: string;
  user_response: InactiveResponse | null;
  responded_at: string | null;
}

// ──────────────────────────────────────────────────────────────
// Enriched / view-model types (what hooks return to screens)
// ──────────────────────────────────────────────────────────────

export interface GroupMemberWithUser extends GroupMember {
  user: User;
}

export interface GroupWithDetails extends Group {
  members: GroupMemberWithUser[];
  open_proposal: MeetupProposal | null;
  last_message: Message | null;
  unread_count: number;
}

export interface ProposalWithVotes extends MeetupProposal {
  votes: ProposalVote[];
  proposer: Pick<User, 'id' | 'display_name' | 'profile_color'> | null;
}

// ──────────────────────────────────────────────────────────────
// Sanity Learn content (Read · Watch · Recco)
// ──────────────────────────────────────────────────────────────

export type LearnDoc = LearnArticle | LearnReel | LearnRecommendation;

export interface SanityBlock {
  _type: string;
  _key: string;
  style?: string;
  children?: { _type: string; text: string; marks?: string[] }[];
  markDefs?: { _type: string; _key: string }[];
}

export interface LearnArticle {
  _id: string;
  _type: 'learnArticle';
  title: string;
  deck: string;
  category: string;
  babyStage: string;
  author: string;
  authorTitle: string;
  readMinutes: number;
  lead: string;
  body: SanityBlock[];
  keyPoints: string[];
  source: string;
  publishedAt: string;
}

export interface LearnReel {
  _id: string;
  _type: 'learnReel';
  title: string;
  platform: 'instagram' | 'tiktok';
  externalUrl: string;
  thumbnailHex: string;
  durationSec: number;
  creatorName: string;
  creatorHandle: string;
  credential: string;
  babyStage: string;
  category: string;
  publishedAt: string;
  /** A real cover image when the platform gave us one; the hex gradient otherwise. */
  thumbnailUrl?: string | null;
  /** Set on reels shared from inside the app — they carry a poster, not an editor. */
  community?: { id: string; posterId: string; posterName: string | null; note: string | null };
}

export interface LearnRecommendation {
  _id: string;
  _type: 'learnRecommendation';
  title: string;
  category: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
  heroGradient: { from: string; via?: string; to: string };
  contributorName: string;
  contributorHandle: string;
  verified: boolean;
  city: string | null;
  babyStage: string;
  publishedAt: string;
}
