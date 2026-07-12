# møma — CLAUDE.md

## Project Overview

møma is a B2C mobile app that matches new mothers into small, local support groups of 3–5 people based on life stage, location, and rhythm. It is built for Gen Z moms who want genuine human connection — not a social feed. The core loop is: get matched → meet your group → show up. The Learn tab supports the loop with curated, evidence-based content (long-form Read articles, vetted Watch reels from credentialed creators, and trusted Recommendations for places, products, and classes). The MVP is a free-tier prototype for real-user testing, not a production system.

**Tagline:** "everyone says 'it takes a village.' here's yours."

> **Canonical design reference:** `design/moma-enhanced.html` (interactive 17-screen mockup with annotations) and `design/moma-palette.pdf`. Always cross-check the design before implementing a screen.

---

## Tech Stack

| Layer | Tool | Version | Reason | Free tier limits to know |
|---|---|---|---|---|
| Mobile framework | Expo + React Native | SDK 51+ | Cross-platform iOS/Android, fast iteration, OTA updates without store re-submit | Free for development; Expo Go for testing |
| Backend / DB | Supabase | Latest | Auth, Postgres DB, realtime subscriptions, storage — all in one | ⚠️ Projects **pause after 1 week of inactivity** on free tier. Resume is manual. 500MB DB, 1GB storage, 50MB realtime bandwidth/month. Upgrade (~$25/mo) when you have active daily users |
| Auth | Supabase Auth | — | Email/password + Apple Sign-In + Google SSO. All three are first-class. | Included in Supabase free tier |
| CMS (Learn tab) | Sanity.io | v3 | Hosts all Learn content: Read articles, Watch reels, Recommendations. Free tier allows commercial use. Structured content, GROQ queries. | Free: 3 users, 2 datasets, 10GB CDN bandwidth, 1M API calls/month. Sufficient for MVP |
| Push notifications | Expo Push Notifications | — | No third-party service needed. Works with Expo managed workflow | Free, no account required |
| File storage | Supabase Storage | — | Profile photos | 1GB on free tier |
| Matching cron | Supabase Edge Functions | — | Scheduled jobs via pg_cron or Edge Function scheduled trigger | Included on free tier |
| Navigation | Expo Router (file-based) | v3 | File-based routing, native stack, tab navigation | — |
| State management | Zustand | Latest | Lightweight, no boilerplate | — |
| Realtime chat | Supabase Realtime | — | Postgres-backed, channel subscriptions per group | Included |

**Only unavoidable costs:**
- Apple Developer Program: **$99/year** (required to publish to App Store)
- Google Play Developer: **$25 one-time** (required to publish to Play Store)

---

## Project Structure

The app uses **4 tabs**: Home / Chats / Learn / Me. There is no separate Reccos tab — recommendations live inside Learn.

```
moma/
├── app/                              # Expo Router — all screens
│   ├── (auth)/                       # Auth stack (unauthenticated)
│   │   ├── welcome.tsx               # Splash/landing
│   │   ├── login.tsx                 # Email/password + Apple + Google
│   │   ├── signup.tsx                # Email/password + Apple + Google + profile basics
│   │   └── onboarding/
│   │       ├── q0.tsx                # Life stage gate (expecting / newborn / growing / veteran)
│   │       ├── q1.tsx                # Scene tags — branched on Q0 (multi-select)
│   │       ├── q2.tsx                # Free-window (mornings / weekends / evenings / unpredictable / all)
│   │       ├── q3.tsx                # First baby? (sets is_mentor_eligible)
│   │       ├── q4.tsx                # Languages + profile colour
│   │       ├── final.tsx             # "We're looking at N moms in your area" → Home
│   │       └── resume.tsx            # Resume a partially completed quiz
│   ├── group-preview.tsx             # Pre-accept group preview + decline-and-rematch sheet
│   ├── (tabs)/
│   │   ├── index.tsx                 # Home — My Groups (states: 0/1/2 groups)
│   │   ├── chats.tsx                 # Unified hub: group chats + DMs
│   │   ├── learn/
│   │   │   ├── index.tsx             # Read + Watch + Recommendations feed (format + stage filters)
│   │   │   └── [docId].tsx           # Article / Reel / Recommendation detail
│   │   └── me.tsx                    # Profile, saved tips, my groups, pause matching, settings
│   ├── group/
│   │   ├── [groupId]/
│   │   │   ├── index.tsx             # Group detail (members + meetup banner)
│   │   │   └── chat.tsx              # Group chat with pinned proposal card + place picker
│   │   └── dm/[userId].tsx           # 1-on-1 DM (opened only from group member row)
│   ├── member/[userId].tsx           # Member profile (reached from group detail or DM header)
│   ├── availability.tsx              # Weekly availability picker (14-day grid × 4 blocks)
│   ├── preferences.tsx               # Matching preferences (hard filters + soft signals + notif cadence)
│   └── _layout.tsx                   # Root layout, auth gate
├── components/
│   ├── ui/                           # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx                # Ring-coloured avatar with photo or initial
│   │   ├── Pill.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ActionSheet.tsx           # Bottom sheet primitive used by many flows
│   │   └── Typography.tsx
│   ├── onboarding/
│   │   ├── StageOption.tsx           # Q0 stage card
│   │   ├── SceneOption.tsx           # Q1 scene card
│   │   └── ColorSwatch.tsx           # Profile colour picker
│   ├── groups/
│   │   ├── GroupCard.tsx             # Home card (name, location, meetup, avatars, last-msg, pulse)
│   │   ├── GroupPulse.tsx            # "3 talking now · 12 messages today" / "Quiet today"
│   │   ├── MeetupBanner.tsx          # Blush banner in group detail
│   │   ├── MemberRow.tsx
│   │   ├── GroupPreviewCard.tsx      # Pre-accept member card with match-note
│   │   └── FindAnotherCard.tsx       # "Find me another" CTA + filter chips on Home
│   ├── chat/
│   │   ├── ChatBubble.tsx            # Cream (others) / cobalt (self)
│   │   ├── ChatInput.tsx
│   │   ├── ProposalCard.tsx          # Pinned meetup proposal (open / decided / expired states)
│   │   ├── ProposalVoteRow.tsx       # Going / Maybe / Can't buttons + tally
│   │   ├── CounterProposalSheet.tsx  # "Can't make it" → pick day/time/note
│   │   ├── PlacePicker.tsx           # Search & post place card
│   │   ├── OpenerChips.tsx           # Empty-state opener suggestions
│   │   └── PastMeetupSummary.tsx     # "4 of 4 went" history strip
│   ├── learn/
│   │   ├── ReadCard.tsx              # Long-form article card
│   │   ├── WatchCard.tsx             # IG/TikTok reel card with credentialed creator
│   │   ├── RecommendationCard.tsx    # Place / product / class card
│   │   ├── FormatChip.tsx            # All / Read / Watch / Recco
│   │   └── StageChip.tsx             # T1...T3 / 0–4wks / 1–3mo / ... / 3+ yr
│   └── preferences/
│       └── PrefsPill.tsx             # Pill selector used across the prefs screen
├── lib/
│   ├── supabase.ts                   # Supabase client init
│   ├── sanity.ts                     # Sanity client + GROQ helpers
│   └── notifications.ts              # Expo Push helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useGroups.ts                  # User's groups list
│   ├── useGroupDetail.ts             # Single group: members + active proposal
│   ├── useChat.ts                    # Group chat messages + realtime
│   ├── useDm.ts
│   ├── useProposals.ts               # Active + past proposals, vote, counter-propose
│   ├── useAvailability.ts
│   ├── useLearn.ts                   # Sanity Learn content with format + stage filters
│   ├── useSavedTips.ts
│   ├── useMatching.ts                # Queue status, preview, decline-with-reason
│   └── usePreferences.ts
├── store/
│   └── useAppStore.ts                # Zustand global store (UI state only)
├── supabase/
│   ├── migrations/                   # SQL migration files
│   └── functions/
│       ├── match-users/              # Scheduled matcher
│       ├── inactive-group-check/     # 30-day inactivity prompt
│       └── availability-prompt/      # Weekly Sunday push
├── constants/
│   ├── colors.ts                     # Design tokens
│   ├── typography.ts
│   └── spacing.ts
├── types/
│   └── index.ts                      # Shared TS types (incl. Supabase + Sanity types)
├── assets/
│   ├── fonts/                        # Cormorant Garamond, DM Sans, Lora
│   └── images/
├── design/
│   ├── moma-enhanced.html            # Canonical interactive design (17 screens)
│   └── moma-palette.pdf
├── .env.local                        # Supabase URL, anon key, Sanity project ID
├── app.json
├── package.json
└── CLAUDE.md
```

---

## Architecture & Conventions

### Patterns
- **File-based routing** via Expo Router. All screens live in `app/`. No manual navigator setup.
- **Auth gate** in `app/_layout.tsx` — checks Supabase session, redirects to `(auth)` if none.
- **Server state** via Supabase hooks (`useGroups`, `useChat`, `useProposals`, …). Local/UI state via Zustand.
- **Realtime** via Supabase channel subscriptions. Subscribe on mount, unsubscribe on unmount.
- **CMS content** (Learn tab) fetched from Sanity via GROQ. Cache responses with React Query (or `useSWR`).
- **Auto-save** during onboarding: every quiz answer persists immediately. Closing the app mid-quiz is fine — `resume.tsx` picks up where the user left off.

### Naming conventions
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts`, always prefixed `use`
- DB tables: `snake_case` (Supabase convention)
- Zustand store slices: suffix `Store` or `Slice`
- Constants: `SCREAMING_SNAKE_CASE` for fixed values, `camelCase` for objects

### Anti-patterns to avoid
- ❌ No inline styles — use `StyleSheet.create` or the design token constants
- ❌ No direct Supabase calls in components — always via hooks in `/hooks`
- ❌ No `any` types — all Supabase responses should be typed via generated types
- ❌ No client-side matching logic — matching runs server-side in Edge Functions only
- ❌ No global stranger search — DMs originate only from group members

---

## Data Models

### `users`
> Reflects the live schema (verified against the database). Most columns are
> **nullable** by design: onboarding auto-saves partial rows, so a row exists
> long before the quiz is complete. `useAuth` only treats a user as onboarded
> once `life_stage`, `profile_color`, and `primary_language` are all set.
```sql
id                       uuid PRIMARY KEY (Supabase auth.users)
email                    text                    -- nullable (Apple "hide my email" relay, etc.)
display_name             text                    -- nullable until Profile step saved
last_name                text
age                      int
baby_dob                 date                    -- nullable; set at Q2, drives life_stage
city                     text
neighbourhood            text
address                  text                    -- formatted address string from the place picker
latitude                 float
longitude                float
profile_color            text                    -- hex from Q4 colour swatch

-- onboarding quiz answers
kid_count                text                    -- Q0 answer (e.g. one | two | three_plus)
life_stage               text                    -- expecting | newborn | growing | veteran (derived from baby_dob)
is_first_baby            boolean
is_mentor_eligible       boolean DEFAULT false   -- derived: NOT is_first_baby
primary_language         text
secondary_languages      text[]
recurring_availability   jsonb                   -- weekly free-window selection captured during onboarding

-- matching preferences (defaults set at onboarding, editable in /preferences)
pref_age_window_weeks    int  DEFAULT 4          -- 2 | 4 | 6 | 8 (~2 mo)
pref_distance_minutes    int  DEFAULT 20         -- 10 | 20 | 30 | -1 (anywhere in city)
pref_baby_at_meetups     text DEFAULT 'always'   -- always | sometimes_without | either
pref_meetup_formats      text[] DEFAULT '{coffee,walk,park}'
pref_free_blocks         text[] DEFAULT '{morning,afternoon}'

-- notification preferences
notif_meetup_reminders   boolean NOT NULL DEFAULT true
notif_chat_activity      text    NOT NULL DEFAULT 'daily'   -- every | daily | weekly | off
notif_quiet_hours_enabled boolean NOT NULL DEFAULT false
notif_quiet_start        text    NOT NULL DEFAULT '21:00'
notif_quiet_end          text    NOT NULL DEFAULT '07:00'

-- profile extras (all optional)
bio                      text
interests                text[]
instagram_handle         text
avatar_url               text

-- state
matched_at               timestamp
paused_until             timestamp               -- null = active matching; future date = paused
expo_push_token          text
created_at               timestamp DEFAULT now()
updated_at               timestamp DEFAULT now()
```
> ⚠️ **Not in the live schema** (documented in earlier drafts, never migrated):
> `scene_tags` and `free_window`. Scene tags were dropped; the free-window
> signal now lives in `recurring_availability` (jsonb). Don't query these columns.

### `groups`
```sql
id              uuid PRIMARY KEY
name            text
city            text
neighbourhood   text
type            text DEFAULT 'neighbourhood'  -- neighbourhood | hobby | class | working_moms
status          text DEFAULT 'active'         -- active | archived
created_at      timestamp DEFAULT now()
last_active_at  timestamp DEFAULT now()
```

### `group_members`
```sql
id              uuid PRIMARY KEY
group_id        uuid REFERENCES groups(id)
user_id         uuid REFERENCES users(id)
role            text DEFAULT 'member'   -- member | mentor
joined_at       timestamp DEFAULT now()
UNIQUE (group_id, user_id)
-- Hard cap: a user may belong to at most 2 groups. Enforced via trigger.
```

### `meetup_proposals`
A proposal is the unit of a meeting. There is no separate `meetups` table — a proposal in state `decided` IS the confirmed meetup; in state `expired` it's a past meetup. Counter-proposals reference the original via `parent_proposal_id`. **At most one proposal per group may be in state `open` at a time** — enforced by a partial unique index: `CREATE UNIQUE INDEX one_open_proposal_per_group ON meetup_proposals(group_id) WHERE state = 'open';`
```sql
id                  uuid PRIMARY KEY
group_id            uuid REFERENCES groups(id)
proposed_by         uuid REFERENCES users(id)            -- null when system-generated
parent_proposal_id  uuid REFERENCES meetup_proposals(id) -- null unless this is a counter-proposal
scheduled_at        timestamp NOT NULL
location_name       text
location_lat        float
location_lng        float
note                text
state               text DEFAULT 'open'   -- open | decided | expired
decided_at          timestamp
created_at          timestamp DEFAULT now()
```

### `proposal_votes`
```sql
id              uuid PRIMARY KEY
proposal_id     uuid REFERENCES meetup_proposals(id)
user_id         uuid REFERENCES users(id)
vote            text NOT NULL   -- going | maybe | cant
voted_at        timestamp DEFAULT now()
UNIQUE (proposal_id, user_id)
```

### `availability_slots`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
date            date NOT NULL
block           text NOT NULL   -- morning | afternoon | evening
available       boolean DEFAULT true
UNIQUE (user_id, date, block)
```

### `messages`
```sql
id               uuid PRIMARY KEY
group_id         uuid REFERENCES groups(id)      -- null if DM
dm_thread_id     uuid REFERENCES dm_threads(id)  -- null if group
sender_id        uuid REFERENCES users(id)
content          text NOT NULL
attachment_type  text                            -- null | place | proposal_ref
attachment_data  jsonb                           -- place card payload, proposal id, etc.
created_at       timestamp DEFAULT now()
```

### `dm_threads`
```sql
id              uuid PRIMARY KEY
participant_a   uuid REFERENCES users(id)
participant_b   uuid REFERENCES users(id)
group_id        uuid REFERENCES groups(id)  -- which group spawned this DM
created_at      timestamp DEFAULT now()
UNIQUE (participant_a, participant_b)
```

### `saved_tips` (bookmarks from Learn tab)
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
sanity_doc_id   text NOT NULL   -- references a Sanity Learn document
doc_type        text NOT NULL   -- read_article | watch_reel | recommendation
saved_at        timestamp DEFAULT now()
UNIQUE (user_id, sanity_doc_id)
```

### `matching_queue`
```sql
id                        uuid PRIMARY KEY
user_id                   uuid REFERENCES users(id) UNIQUE
status                    text DEFAULT 'waiting'   -- waiting | previewing | matched
current_preview_group_id  uuid                     -- not-null while user is in preview
queued_at                 timestamp DEFAULT now()
matched_at                timestamp
```

### `match_decline_reasons`
```sql
id                uuid PRIMARY KEY
user_id           uuid REFERENCES users(id)
preview_group_id  uuid                        -- the rejected preview
reason            text NOT NULL               -- wrong_neighbourhood | baby_age_mismatch | language | vibe | curious
declined_at       timestamp DEFAULT now()
```

### `inactive_group_prompts`
```sql
id              uuid PRIMARY KEY
group_id        uuid REFERENCES groups(id)
user_id         uuid REFERENCES users(id)
prompted_at     timestamp DEFAULT now()
user_response   text                        -- null | still_here | find_new
responded_at    timestamp
```

> **Learn content** (Read articles, Watch reels, Recommendations) lives entirely in **Sanity.io** — not in Supabase. Schemas defined in API & Integrations.

---

## Key Features to Implement

### Priority 1 — Must Have (MVP gate)

**1. Auth (email/password + SSO)**
- Email + password (Supabase Auth native). Apple Sign-In + Google SSO via Supabase Auth providers.
- Deep link callback: `moma://auth/callback`.
- Acceptance: all three paths land on the same post-auth state.

**2. Onboarding (stage-aware, auto-saved)**
- Sign-up profile (name, age, neighbourhood, optional photo / Instagram / bio / interests).
- 5-step quiz: **Q0** life stage → **Q1** scene tags (options branched on Q0) → **Q2** free-window → **Q3** first baby? (sets `is_mentor_eligible`) → **Q4** languages + profile colour.
- Every answer auto-saves; closing the app mid-quiz lands the user on `resume.tsx` (which names the next question, e.g. "Next up: Languages").
- After 14 days of inactivity, saved state clears.
- On completion: write/update `users` row + insert `matching_queue` row.
- Acceptance: all 5 steps work for each life_stage path; resume restores answers; quiz can be skipped per-question and still produce a row.

**3. Match-Ready notification + Group Preview**
- When the matcher creates a candidate group, set `matching_queue.status = 'previewing'` and send push.
- Group Preview screen shows 4 first names, avatars (no last names), baby age, neighbourhood, mentor tag, and a per-member match-note ("Same neighbourhood, same week").
- Two actions: **Join this group** → creates `group_members` rows; **Find me another** → opens a one-question reason sheet, writes to `match_decline_reasons`, returns to queue.
- Acceptance: declining triggers a re-run within 24h; joining puts the user on Home with the new group visible.

**4. Home — My Groups (with hard 2-group cap)**
- States: 0 groups (waiting card), 1 group (group card + "Find me another" CTA with stage/type/vibe filters), 2 groups (at-cap note, no Discover).
- Group card shows: name, location, member count, next meetup (blush block, place link, countdown), avatar stack, last message preview, group pulse ("3 talking now · 12 messages today" or "Quiet today"), unread pip (fuchsia).
- A user may belong to at most **2 groups**. Enforced by DB trigger.
- Acceptance: realtime updates on unread + pulse; cap is enforced server-side, not just hidden in UI.

**5. Group Detail**
- Members list (avatar with profile-colour ring, name, baby age, neighbourhood, Mentor tag in soleil) + per-member Message button.
- Blush meetup banner — pulls from the active `meetup_proposal` for the group. Shows date, place, "3 of 4 going". RSVP button toggles vote between `going`/`(unset)`. Tapping "Going" twice opens the undo sheet (Just remove me / Suggest a time).
- Action sheet (•••): Mute notifications / Report an issue / Leave group.
- Acceptance: vote writes to `proposal_votes`; Message opens DM thread scoped to this group.

**6. Group Chat (with pinned proposal card)**
- Realtime Supabase channel `group:{groupId}`.
- Pinned **proposal card** at top with three lifecycle states:
  - `open`: shows date/place/note, vote buttons (Going / Maybe / Can't), live tally.
  - `decided`: badge "Locked in", line "4 of 5 going. See you Saturday."
  - `expired`: badge "Past meetup", "4 went · Saturday 8 March".
- Cream bubbles (others, left-aligned) / cobalt bubbles (self, right-aligned). Avatar uses sender's `profile_color` ring.
- Empty state ("It's quiet in here") shows three opener chips that send as the user's first message.
- Past meetup summary strips appear inline in chat history with quick actions (Save the place / Share a tip).
- "Suggest a time" + "Share a place" buttons above the composer:
  - **Place picker** sheet: search list of cafés/parks/classes → posts a place-card message.
  - **Suggest-a-time** sheet: pick day, time, optional note. Behaviour depends on current group state:
    - If an `open` proposal exists → creates a counter-proposal (`parent_proposal_id` set); original card dims/strikethrough but stays visible.
    - If no `open` proposal exists (between meetups, or before the first one) → creates a fresh proposal authored by the user (`proposed_by = user.id`, `parent_proposal_id = null`).
- **Invariant**: at most one proposal per group is in state `open` at any time. Enforced by a partial unique index.
- Acceptance: messages persist; realtime delivery; no duplicates on reconnect; counter-proposal correctly chains; member-authored fresh proposal works when no `open` proposal exists.

**7. 1-on-1 DM**
- Opened only from a group-member context (Group Detail member row, or a group member's profile). No global stranger search.
- DM header is tappable → member profile.
- Acceptance: thread created on first message; not discoverable outside group context.

**8. Inactive Group Prompt**
- If `groups.last_active_at` > 30 days: weekly Edge Function pushes a prompt + writes `inactive_group_prompts` row.
- Two responses: "We're still here" (resets `last_active_at`) or "Find a new group" (re-queues the user).
- Acceptance: prompt fires once per 30-day window per user/group; re-queue works.

**9. Matching (Edge Function)**
- Scheduled nightly via pg_cron or Edge Function trigger. Skips users with non-null `paused_until` in the future.
- Hard filters: `pref_age_window_weeks`, `pref_distance_minutes`, `life_stage` compatibility.
- Soft weighting (configurable): birth-week delta + distance + language overlap + scene-tag overlap + free-window overlap. Sum must clear a threshold.
- Forms candidate groups of 3–5; assigns `is_mentor_eligible` users one-per-group when available; sets `matching_queue.status = 'previewing'`; sends push.
- Acceptance: deterministic on a fixed seed; respects all hard filters; never produces > 5 or < 3 member groups.

### Priority 2 — Should Have

**10. Availability picker (`/availability`)**
- 2-week grid × 7 days × 3 blocks (morning / afternoon / evening). Tap to toggle.
- Weekly Sunday push prompts the user to fill in. Skipping carries last week's selection forward (never blocks meetups).
- Selected slots feed proposal generation: the matcher / proposal generator looks for windows where ≥ 3 of the group are free.
- Acceptance: writes `availability_slots`; selected count visible at the bottom; Save persists.

**11. Matching Preferences (`/preferences`)**
- Two clearly-labelled categories:
  - **Hard filters**: baby age window (±2 / ±4 / ±6 / ±2 mo), distance (10/20/30 min walk / anywhere), primary language (single-select).
  - **Soft signals**: secondary languages (multi-select, max 2), free blocks, baby-at-meetups, preferred formats.
- Notification cadence: meetup reminders, group-chat activity (every / daily / weekly / off), quiet hours.
- Footer note: "Changes apply to your next match." No personality / income / ethnicity / religion.
- Acceptance: all changes persist to `users`; current matched groups unaffected.

**12. Learn tab (`/learn`)**
- Single feed merging three formats from Sanity: **Read** (long-form articles), **Watch** (vetted IG/TikTok reels), **Recommendation** (places/products/classes).
- Format chips: All / Read / Watch / Recco. Stage chips: T1 / T2 / T3 / 0–4wks / 1–3mo / 3–6mo / 6–12mo / 1–2yr / 2–3yr / 3+yr.
- Read card: format badge, title, meta, source pill ("Pediatrics, 2023"), bookmark heart.
- Watch card: media thumbnail, platform badge (IG / TikTok), play glyph, duration, creator with credential pill (MD / IBCLC / etc.). Tapping opens the platform deep link.
- Recommendation card: gradient hero, contributor avatar with verified dot, category pill.
- Bookmark writes to `saved_tips` (any of the three doc_types).
- Soleil-tinted header.

**13. Article reader (`/learn/[docId]`)**
- Substack-style: Cormorant headline, Lora italic deck + lead, pullquote with soleil accent, key-points cream box.
- Reading-progress bar in header + "N min left".
- Auto-saves scroll position to localStorage; on revisit shows "Pick up where you left off?" toast (only if 12% < progress < 95%).
- Save / Share footer.

**14. Saved tips on Me**
- A private shelf of items bookmarked from Learn (across all three formats).
- Each row shows category pill, text/title, unsave heart.
- Empty state: "Heart anything in Learn and it lands here, your private shelf of places, rituals, and things worth remembering."

**15. Pause matching**
- On Me → Pause matching opens a sheet with three options: 1 week / 1 month / Until I turn it back on.
- Sets `users.paused_until`. The matcher skips paused users. Existing groups unaffected.

### Priority 3 — Nice to Have (post-MVP)

- Profile editing UI (currently the values written at signup persist as-is).
- City selector for multi-city expansion.
- Saved tips dedicated screen (currently inline on Me).
- Mood check-in / baby milestones tracker on Me.
- Mute Lisa / Block Lisa per-member granularity (currently group-level mute only).
- Dark mode.

---

## Design System

> The HTML mockup at `design/moma-enhanced.html` is the source of truth for visual decisions. Update tokens here only when the mockup changes.

### Colors
```typescript
// constants/colors.ts
export const colors = {
  // Base
  white:    '#FFFFFF',
  cream:    '#FAF6F1',
  butter:   '#F5EDB8',          // app brand — soft accent surface
  pistachio:'#D8E8C8',          // app brand — soft accent surface
  cobalt:   '#1A4BCC',
  cobaltDeep: '#0F3AA8',
  text:     '#111118',
  muted:    '#6F6F88',          // WCAG AA on cream
  mutedStrong: '#4A4A5E',
  line:     'rgba(17,17,24,0.07)',

  // Blush system (meetups)
  blush:      '#F4D1D1',
  blushText:  '#6A1A2A',
  blushMuted: '#8C2238',

  // Bold accents (user colours + signal roles)
  fuchsia:  '#E8389C',
  orange:   '#FF7A00',
  soleil:   '#FFC800',
  cherry:   '#E82030',
  lavender: '#9878C8',
  pool:     '#00B8C8',
  klein:    '#0038FF',
  lime:     '#B8D830',

  // Soft accents (user colours)
  peche:    '#FADCB8',
  citron:   '#F9F0A0',
  menthe:   '#C8E8D8',
  ciel:     '#C8DCF0',
  lavSoft:  '#D8C8E8',
  rose:     '#F0C8D8',
  sable:    '#E8DCD0',
}
```

### Typography
```typescript
// constants/typography.ts
// Fonts loaded via expo-font
export const fonts = {
  serif:      'CormorantGaramond-Light',       // 300 — display
  serifReg:   'CormorantGaramond-Regular',     // 400 — article headlines
  serifBold:  'CormorantGaramond-SemiBold',    // 600 — article title
  serifItal:  'CormorantGaramond-LightItalic', // 300i — decorative
  body:       'DMSans-Regular',                // 400
  bodyMed:    'DMSans-Medium',                 // 500
  bodySemi:   'DMSans-SemiBold',               // 600 — buttons, tags
  reading:    'Lora-Regular',                  // 400 — article body, bios
  readingItal:'Lora-Italic',                   // 400i — deck, pullquote, bios
}
```

### Spacing & radius
```typescript
// constants/spacing.ts
export const spacing = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:28, xxxl:40 }
export const radius  = { sm:10, md:14, lg:18, xl:24, pill:100, full:9999 }
```

### Core component rules
- **Screens:** white background by default. Me uses cream as the full background (the only exception).
- **Cards:** cream background, radius `lg` or `xl`.
- **Cobalt:** structural — nav active dot, RSVP "Going", auth screens, primary CTAs, source pills. Onboarding quiz uses a full cobalt background.
- **Blush:** meetup blocks only (group cards, group detail banner, Me next-meetup card). Tinted with the user's profile colour.
- **Soleil:** Learn tab header + mentor tag.
- **Fuchsia:** week/baby-age pills, unread pip, primary identity accent.
- **Lime / Pool / Lavender / Orange:** filter / category signals (lime = active stage chip, pool = active filter).
- **Profile colours:** chosen at Q4. Used as the avatar **ring** (1.5–2 px) and as a tint on the user's Me background accents.
- **Avatar system:** every avatar carries a coloured ring. Photo inside the ring, or a colour-fill with initial. Same ring grammar everywhere.
- **No dark mode at MVP.**

### Interaction patterns
- Cards are tappable — full hit area, no separate arrow button.
- Buttons disabled until required input is present.
- Chat bubbles: cream + left (others), cobalt + right (self).
- Format & filter chips: inactive = cream + muted; active = pool (filters) or lime (stage).
- Bottom sheets used heavily (decline-reason, counter-proposal, place picker, group/profile actions, RSVP undo, pause-matching).
- No emoji in system titles. Copy does the work.

---

## API & Integrations

### Supabase
```
EXPO_PUBLIC_SUPABASE_URL=https://[project].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon key]
```

**Row Level Security (RLS) — critical:**
- `users`: read own row + members of shared groups; never read strangers.
- `group_members`: read rows for groups the user belongs to.
- `meetup_proposals` / `proposal_votes`: read/write only for groups the user belongs to.
- `availability_slots`: read/write own only.
- `messages`: read messages from groups the user belongs to or DM threads they participate in.
- `dm_threads`: only participants can read/write.
- `saved_tips` / `match_decline_reasons` / `matching_queue` / `inactive_group_prompts`: read/write own only.

**Triggers:**
- `enforce_group_cap`: BEFORE INSERT on `group_members`, raise if the user already has 2 active group memberships.
- `update_last_active_on_message`: AFTER INSERT on `messages` where `group_id IS NOT NULL`, set `groups.last_active_at = now()`.
- `set_mentor_role_on_join`: AFTER INSERT on `group_members`, if `users.is_mentor_eligible` and group has no mentor yet, set `role = 'mentor'`.

**Realtime channels:**
- `group:{groupId}` — group messages + proposal/vote changes.
- `dm:{threadId}` — DM messages.

**Edge Functions:**
- `match-users` — scheduled nightly. Scores `waiting` users, forms candidate groups, sets `previewing`, sends push.
- `inactive-group-check` — scheduled weekly. Pushes the 30-day inactivity prompt.
- `availability-prompt` — scheduled Sunday evenings. Pushes "When are you free-ish?".
- `expire-proposals` — scheduled hourly. Marks past `meetup_proposals` as `expired` (compares `scheduled_at` to `now()`).
- `seed-next-proposal` — scheduled hourly. For every active group with **no `open` proposal** AND whose most recent proposal closed (`decided` or `expired`) ≥ N days ago (default: 5), seeds a fresh system proposal (`proposed_by = null`) using availability overlap. Skipped if a member already created one in the meantime.

### Sanity.io (Learn CMS)
```
EXPO_PUBLIC_SANITY_PROJECT_ID=[project id]
EXPO_PUBLIC_SANITY_DATASET=production
```

Three Sanity schemas live under one Learn feed. Queried with a GROQ union and discriminated by `_type` in the app.

**`learnArticle`** (Read · long-form):
```javascript
{
  name: 'learnArticle',
  fields: [
    { name: 'title',       type: 'string' },
    { name: 'deck',        type: 'string' },                  // italic subtitle
    { name: 'category',    type: 'string' },                  // Sleep | Nutrition | Recovery | Mind | etc.
    { name: 'babyStage',   type: 'string' },                  // T1 | T2 | T3 | 0-4wks | 1-3mo | 3-6mo | 6-12mo | 1-2yr | 2-3yr | 3+yr
    { name: 'author',      type: 'string' },
    { name: 'authorTitle', type: 'string' },                  // "MSc Biomedical Engineering" / "Pediatrics, 2023"
    { name: 'readMinutes', type: 'number' },
    { name: 'lead',        type: 'text' },
    { name: 'body',        type: 'array', of: [{ type: 'block' }] },
    { name: 'keyPoints',   type: 'array', of: [{ type: 'string' }] },
    { name: 'source',      type: 'string' },                  // "Pediatrics, 2023"
    { name: 'publishedAt', type: 'datetime' },
  ]
}
```

**`learnReel`** (Watch · curated IG/TikTok):
```javascript
{
  name: 'learnReel',
  fields: [
    { name: 'title',         type: 'string' },
    { name: 'platform',      type: 'string' },               // instagram | tiktok
    { name: 'externalUrl',   type: 'url' },                  // deep link
    { name: 'thumbnailHex',  type: 'string' },               // gradient anchor for the card
    { name: 'durationSec',   type: 'number' },
    { name: 'creatorName',   type: 'string' },
    { name: 'creatorHandle', type: 'string' },
    { name: 'credential',    type: 'string' },               // MD · Perinatal | IBCLC · Sleep | PhD · Pelvic Floor
    { name: 'babyStage',     type: 'string' },
    { name: 'category',      type: 'string' },
    { name: 'publishedAt',   type: 'datetime' },
  ]
}
```

**`learnRecommendation`** (Recco · places/products/classes):
```javascript
{
  name: 'learnRecommendation',
  fields: [
    { name: 'title',          type: 'string' },
    { name: 'category',       type: 'string' },              // classes | products | wellness | nutrition | places
    { name: 'body',           type: 'text' },
    { name: 'linkUrl',        type: 'url' },
    { name: 'linkLabel',      type: 'string' },
    { name: 'heroGradient',   type: 'object' },              // { from, via, to } hex
    { name: 'contributorName', type: 'string' },
    { name: 'contributorHandle', type: 'string' },
    { name: 'verified',       type: 'boolean' },
    { name: 'city',           type: 'string' },              // optional locality scope
    { name: 'babyStage',      type: 'string' },
    { name: 'publishedAt',    type: 'datetime' },
  ]
}
```

### Expo Push Notifications
- Register device token on first launch, store on `users.expo_push_token`.
- Trigger from Edge Functions (server-side via Expo Push API).
- Notification types: `group_matched_preview`, `group_matched_joined`, `new_message`, `proposal_decided`, `meetup_reminder`, `availability_prompt`, `inactive_group_prompt`.

### Auth providers
- Email/password: Supabase Auth native.
- Apple Sign-In: `expo-apple-authentication` → `supabase.auth.signInWithIdToken`.
- Google: `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Deep link callback: `moma://auth/callback`.

---

## Development Guidelines

### Environment setup
```bash
npm install -g eas-cli
npx create-expo-app moma
cd moma
npx expo install expo-router @supabase/supabase-js zustand expo-font \
  expo-notifications expo-apple-authentication expo-secure-store
```

### Testing strategy (MVP)
- Manual testing on Expo Go (iOS + Android physical devices).
- No unit test suite required at MVP — write tests when preparing for store launch.
- Test matching with seed data in `supabase/seed.sql` (or `supabase/seed_reccos.sql`-style helpers).

### Commit conventions
```
feat: add proposal counter-proposal flow
fix: meetup vote not persisting on Android
design: tighten blush banner radius to lg
db: replace meetups + meetup_rsvps with meetup_proposals + proposal_votes
```

### Error handling
- All Supabase calls: destructure `{ data, error }`, log error, show user-friendly toast.
- Never expose raw Supabase errors to users.
- Offline state: subtle "Reconnecting…" banner; do not silently queue messages.

### Security rules
- RLS on every table — no exceptions.
- `service_role` key never in the mobile app — only `anon`.
- Admin operations (publish Learn content, mark contributors verified) via Sanity Studio + Supabase dashboard, not the app.

---

## Current Status

### Decided ✅
- Full product scope and MVP feature set (15 features above).
- 17-screen design system in `design/moma-enhanced.html`.
- Color tokens, typography, spacing, interaction patterns.
- Data model (proposal-centric meetups, 2-group cap, paused_until, life_stage gates).
- Tech stack (free-tier constrained).
- Matching algorithm: hard filters + soft weighting; threshold-based group formation.
- Group lifecycle: 30-day inactivity prompt → re-queue option; pause matching available anytime.
- Learn content: founder-authored long-form (MSc Biomedical Engineering) + journal-licensed + curated vetted-creator reels + verified contributor recos. All in Sanity.
- Auth: email/password + Apple SSO + Google SSO.
- Notifications: Expo Push.
- Geography: any city, Amsterdam-first beta.
- Monetisation: free at MVP.
- Hard cap: max 2 groups per user.
- Proposal authoring: **system + members can author** (system seeds, members can override via "Suggest a time"). **One open proposal per group at a time** — any new proposal while one is `open` becomes a counter-proposal (`parent_proposal_id` set). After a proposal becomes `decided` or `expired`, auto-regeneration is **hybrid**: a scheduled job seeds the next system proposal after a quiet stretch, but members can short-circuit it earlier by tapping "Suggest a time".

### Still open ⚠️
- Admin dashboard: Supabase + Sanity dashboards are sufficient at MVP — no custom admin UI.
- Watch reels embedding: deep-link out vs. in-app webview. Default to deep-link out (cleaner copyright story).
- App name trademark / domain check.

---

## Immediate Next Steps for Claude Code

1. **Migrate the schema (002_align_to_design.sql).** ✅ *Done — the live schema matches the Data Models above.*
   Dropped `meetups`, `meetup_rsvps`, `recco_posts`, `contributors`, `saved_posts`. Added `meetup_proposals`, `proposal_votes`, `availability_slots`, `saved_tips`, `match_decline_reasons`, `inactive_group_prompts`. Extended `users` with `email`, `last_name`, `age`, `neighbourhood`, `address`, `life_stage`, `kid_count`, `is_first_baby`, `is_mentor_eligible`, `primary_language`, `secondary_languages`, `recurring_availability`, the `pref_*` columns, the `notif_*` columns, `paused_until`, `expo_push_token`, `updated_at`. (Note: `scene_tags` / `free_window` were never migrated — see the Data Models note.) Triggers + RLS policies in place.

2. **Rewire onboarding.**
   Replace the 6-step flow under `app/(auth)/onboarding/` with the 5-step stage-aware quiz (q0…q4 + final + resume). Auto-save on every answer. Branch Q1 scene options on Q0 life_stage. Wire SSO + email/password.

3. **Rebuild the tab navigator.**
   Drop the Reccos and Science tabs. Stand up 4 tabs (Home / Chats / Learn / Me). Move existing Science screens under Learn and add Read/Watch/Recco filtering.

4. **Group chat with proposal card.**
   This remains the core retention surface. Implement the pinned `ProposalCard` with three states (open/decided/expired), the counter-proposal sheet, the place picker, and opener chips. Wire Supabase Realtime.

5. **Edge functions.**
   `match-users` (scheduled nightly), `expire-proposals` (hourly), `seed-next-proposal` (hourly), `availability-prompt` (Sunday evenings), `inactive-group-check` (weekly). Test on seed data before deploying.
