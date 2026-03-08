# møma — CLAUDE.md

## Project Overview

møma is a B2C mobile app that matches new mothers into small, local support groups of 3–5 people based on birth week, location, and personality. It is built for Gen Z moms who want genuine human connection — not a social feed. The core loop is: get matched → meet your group → show up. Supporting features include a curated recommendations feed from verified contributors and evidence-based science articles authored or licensed by the founder (MSc Biomedical Engineering) and journals. The MVP is a free-tier prototype for real-user testing, not a production system.

**Tagline:** "everyone says 'it takes a village.' here's yours."

---

## Tech Stack

| Layer | Tool | Version | Reason | Free tier limits to know |
|---|---|---|---|---|
| Mobile framework | Expo + React Native | SDK 51+ | Cross-platform iOS/Android, fast iteration, OTA updates without store re-submit | Free for development; Expo Go for testing |
| Backend / DB | Supabase | Latest | Auth, Postgres DB, realtime subscriptions, storage — all in one | ⚠️ Projects **pause after 1 week of inactivity** on free tier. Resume is manual. 500MB DB, 1GB storage, 50MB realtime bandwidth/month. Upgrade (~$25/mo) when you have active daily users |
| Auth | Supabase Auth | — | Apple Sign-In + Google SSO built-in, no password flow | Included in Supabase free tier |
| CMS (Science articles) | Sanity.io | v3 | Free tier allows commercial use. Structured content, GROQ queries, hosted. | Free: 3 users, 2 datasets, 10GB CDN bandwidth, 1M API calls/month. Sufficient for MVP |
| Push notifications | Expo Push Notifications | — | No third-party service needed. Works with Expo managed workflow | Free, no account required |
| File storage | Supabase Storage | — | Profile photos, post images | 1GB on free tier |
| Matching cron | Supabase Edge Functions | — | Nightly cron job via pg_cron or Edge Function scheduled trigger | Included on free tier |
| Navigation | Expo Router (file-based) | v3 | File-based routing, native stack, tab navigation | — |
| State management | Zustand | Latest | Lightweight, no boilerplate | — |
| Realtime chat | Supabase Realtime | — | Postgres-backed, channel subscriptions per group | Included |

**Only unavoidable costs:**
- Apple Developer Program: **$99/year** (required to publish to App Store)
- Google Play Developer: **$25 one-time** (required to publish to Play Store)

---

## Project Structure

```
moma/
├── app/                          # Expo Router — all screens
│   ├── (auth)/                   # Auth stack (unauthenticated)
│   │   ├── welcome.tsx           # Splash/landing
│   │   └── onboarding/
│   │       ├── step1.tsx         # Name + baby DOB
│   │       ├── step2.tsx         # Location permission
│   │       ├── step3.tsx         # Quiz: mood
│   │       ├── step4.tsx         # Quiz: schedule
│   │       ├── step5.tsx         # Quiz: connection style
│   │       ├── step6.tsx         # Quiz: identity + color picker
│   │       └── waiting.tsx       # Post-onboarding: "group on its way"
│   ├── (tabs)/                   # Main app tab navigator
│   │   ├── index.tsx             # Home — My Groups list
│   │   ├── reccos/
│   │   │   ├── index.tsx         # Trusted Recommendations feed
│   │   │   └── [postId].tsx      # Post detail
│   │   ├── science/
│   │   │   ├── index.tsx         # Science & Wellness feed
│   │   │   └── [articleId].tsx   # Article (Substack-style)
│   │   └── me.tsx                # Profile screen
│   ├── group/
│   │   ├── [groupId]/
│   │   │   ├── index.tsx         # Group detail (members + meetup banner)
│   │   │   └── chat.tsx          # Group chat
│   │   └── dm/[userId].tsx       # 1-on-1 DM (opened from group member)
│   └── _layout.tsx               # Root layout, auth gate
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── Pill.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Typography.tsx
│   ├── groups/
│   │   ├── GroupCard.tsx         # Card on home screen
│   │   ├── MeetupBanner.tsx      # Blush banner in group detail
│   │   ├── MeetupStrip.tsx       # Compact strip in chat header
│   │   └── MemberRow.tsx
│   ├── chat/
│   │   ├── ChatBubble.tsx
│   │   └── ChatInput.tsx
│   ├── reccos/
│   │   ├── ReccoCard.tsx         # Recommendation post card
│   │   └── CategoryFilter.tsx
│   └── science/
│       ├── ArticleCard.tsx
│       └── StageFilter.tsx
├── lib/
│   ├── supabase.ts               # Supabase client init
│   ├── sanity.ts                 # Sanity client + GROQ helpers
│   └── notifications.ts          # Expo Push helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useGroups.ts
│   ├── useChat.ts
│   └── useMatching.ts
├── store/
│   └── useAppStore.ts            # Zustand global store
├── supabase/
│   ├── migrations/               # SQL migration files
│   └── functions/
│       └── match-users/          # Nightly matching Edge Function
├── constants/
│   ├── colors.ts                 # Design tokens
│   ├── typography.ts
│   └── spacing.ts
├── types/
│   └── index.ts                  # Shared TypeScript types
├── assets/
│   ├── fonts/                    # Cormorant Garamond, DM Sans, Lora
│   └── images/
├── .env.local                    # Supabase URL, anon key, Sanity project ID
├── app.json                      # Expo config
├── package.json
└── CLAUDE.md                     # This file
```

---

## Architecture & Conventions

### Patterns
- **File-based routing** via Expo Router. All screens live in `app/`. No manual navigator setup.
- **Auth gate** in `app/_layout.tsx` — checks Supabase session, redirects to `(auth)` if none.
- **Server state** via Supabase hooks (`useGroups`, `useChat`). Local/UI state via Zustand.
- **Realtime** via Supabase channel subscriptions. Subscribe on mount, unsubscribe on unmount.
- **CMS content** (Science articles) fetched from Sanity via GROQ. Cache responses with `useSWR` or React Query.

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
- ❌ No password auth — Apple and Google SSO only
- ❌ No client-side matching logic — matching runs server-side in Edge Functions only

---

## Data Models

### `users`
```sql
id              uuid PRIMARY KEY (Supabase auth.users)
display_name    text NOT NULL
baby_dob        date NOT NULL
city            text
latitude        float
longitude       float
profile_color   text                    -- hex from color picker
quiz_mood       text                    -- onboarding answer
quiz_schedule   text
quiz_connection text
quiz_identity   text
avatar_url      text
matched_at      timestamp
created_at      timestamp DEFAULT now()
```

### `groups`
```sql
id              uuid PRIMARY KEY
name            text
city            text
status          text DEFAULT 'active'   -- active | archived
created_at      timestamp DEFAULT now()
last_active_at  timestamp
```

### `group_members`
```sql
id              uuid PRIMARY KEY
group_id        uuid REFERENCES groups(id)
user_id         uuid REFERENCES users(id)
role            text DEFAULT 'member'   -- member | mentor
joined_at       timestamp DEFAULT now()
UNIQUE (group_id, user_id)
```

### `meetups`
```sql
id              uuid PRIMARY KEY
group_id        uuid REFERENCES groups(id)
title           text
scheduled_at    timestamp
location_name   text
location_lat    float
location_lng    float
created_by      uuid REFERENCES users(id)
created_at      timestamp DEFAULT now()
```

### `meetup_rsvps`
```sql
id              uuid PRIMARY KEY
meetup_id       uuid REFERENCES meetups(id)
user_id         uuid REFERENCES users(id)
status          text DEFAULT 'going'    -- going | maybe | not_going
UNIQUE (meetup_id, user_id)
```

### `messages`
```sql
id              uuid PRIMARY KEY
group_id        uuid REFERENCES groups(id)  -- null if DM
dm_thread_id    uuid REFERENCES dm_threads(id)  -- null if group
sender_id       uuid REFERENCES users(id)
content         text NOT NULL
created_at      timestamp DEFAULT now()
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

### `recco_posts` (Trusted Recommendations)
```sql
id              uuid PRIMARY KEY
contributor_id  uuid REFERENCES contributors(id)
category        text                    -- classes | products | wellness | nutrition
title           text NOT NULL
body            text NOT NULL
link_url        text
link_label      text
hero_style      jsonb                   -- CSS gradient config for card hero
published_at    timestamp
created_at      timestamp DEFAULT now()
```

### `contributors`
```sql
id              uuid PRIMARY KEY
display_name    text NOT NULL
handle          text UNIQUE
verified        boolean DEFAULT false   -- manually set by admin
avatar_color    text
created_at      timestamp DEFAULT now()
```

### `saved_posts`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
post_id         uuid REFERENCES recco_posts(id)
saved_at        timestamp DEFAULT now()
UNIQUE (user_id, post_id)
```

### `matching_queue`
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id) UNIQUE
status          text DEFAULT 'waiting'  -- waiting | matched
queued_at       timestamp DEFAULT now()
matched_at      timestamp
```

> **Science & Wellness articles** live entirely in **Sanity.io** — not in Supabase. Sanity schema defined separately (see API & Integrations section).

---

## Key Features to Implement

### Priority 1 — Must Have (MVP gate)

**1. Onboarding + Matching Queue**
- 6-step flow: SSO → name/baby DOB → location → quiz (4 questions) → color picker → waiting screen
- On completion: write `users` row + `matching_queue` row
- Acceptance: user lands on waiting screen; row exists in DB; no crash on any step

**2. Nightly Matching (Edge Function)**
- Runs via Supabase scheduled function (pg_cron or cron Edge Function)
- Weighted score: birth week delta (40%) + distance (35%) + quiz similarity (25%)
- Groups of 3–5; trigger push notification when group is formed
- Acceptance: users within scoring threshold are assigned to a group; `group_members` rows created; push sent

**3. My Groups — Home Screen**
- List of user's active groups
- Each card shows: group name, location, next meetup (blush block), member avatars, last message preview, unread pip (fuchsia)
- Acceptance: real data from Supabase; realtime unread count updates

**4. Group Detail**
- Members list with Message button per member
- Blush meetup banner (next upcoming meetup, RSVP button in cobalt)
- Mentor tag (soleil) on mentors
- Acceptance: RSVP writes to `meetup_rsvps`; Message opens DM thread

**5. Group Chat**
- Realtime via Supabase Realtime channel per group
- Pinned meetup strip at top with date + RSVP
- Cream bubbles (others) / cobalt bubbles (self)
- Member avatar colors from `profile_color`
- Acceptance: messages persist; realtime delivery; no duplicate messages on reconnect

**6. 1-on-1 DM**
- Opened only from Group Detail → member row → Message
- Thread scoped to the group context (stored with `group_id` reference)
- Acceptance: thread created on first message; not discoverable outside group context

**7. Inactive Group Prompt**
- If `last_active_at` > 30 days: push notification + in-app prompt
- Options: "We're still here" (resets timer) or "Find a new group" (re-queues user in `matching_queue`)
- Acceptance: prompt fires once per 30-day window; re-queue works correctly

### Priority 2 — Should Have

**8. Trusted Recommendations Feed**
- Feed of `recco_posts` filtered by category pills
- Photo-style CSS gradient hero per card (no emoji)
- Verified contributor badge (cobalt dot)
- Bookmark saves to `saved_posts`
- Read-only — no comments, no likes

**9. Post Detail**
- Full post body + link card
- Save / Share / Open link actions

**10. Science & Wellness Feed**
- Fetched from Sanity via GROQ
- Stage filter chips (Pregnancy / 0–4wks / 1–3mo / 3–6mo / 6–12mo)
- Soleil header

**11. Science Article**
- Substack-style: Cormorant headline, Lora italic deck + lead, pullquote with soleil accent, key points cream box
- Author byline (Dr. / MSc / Journal source pill)
- Save + Share actions

### Priority 3 — Nice to Have (post-MVP)

- Meetup creation UI (currently admin/manual)
- Contributor application form (currently admin-only)
- Saved posts screen
- Profile editing
- City selector for multi-city expansion
- Dark mode

---

## Design System

### Colors
```typescript
// constants/colors.ts
export const colors = {
  // Base
  white:   '#FFFFFF',
  cream:   '#FAF6F1',
  cobalt:  '#1A4BCC',
  text:    '#111118',
  muted:   '#9090A8',
  line:    'rgba(17,17,24,0.07)',

  // Accent — Blush system
  blush:      '#F4D1D1',
  blushText:  '#6A1A2A',
  blushMuted: '#B05A6A',

  // Bold accents
  fuchsia:  '#E8389C',
  orange:   '#FF7A00',
  soleil:   '#FFC800',
  cherry:   '#E82030',
  lavender: '#9878C8',
  pool:     '#00B8C8',
  klein:    '#0038FF',
  lime:     '#B8D830',

  // Soft accents
  peche:    '#FADCB8',
  citron:   '#F9F0A0',
  menthe:   '#C8E8D8',
  ciel:     '#C8DCF0',
  rose:     '#F0C8D8',
  sable:    '#E8DCD0',
  lavSoft:  '#D8C8E8',
}
```

### Typography
```typescript
// constants/typography.ts
// Fonts loaded via expo-font
export const fonts = {
  serif:      'CormorantGaramond-Light',       // 300 — headings, display
  serifReg:   'CormorantGaramond-Regular',     // 400 — article headlines
  serifBold:  'CormorantGaramond-SemiBold',    // 600 — article title
  serifItal:  'CormorantGaramond-LightItalic', // 300i — decorative
  body:       'DMSans-Regular',                // 400 — body
  bodyMed:    'DMSans-Medium',                 // 500 — labels
  bodySemi:   'DMSans-SemiBold',              // 600 — buttons, tags
  reading:    'Lora-Regular',                  // 400 — article body
  readingItal:'Lora-Italic',                   // 400i — deck, pullquote
}

export const textStyles = {
  displayXL:  { fontFamily: fonts.serif,     fontSize: 32, lineHeight: 36 },
  displayL:   { fontFamily: fonts.serif,     fontSize: 26, lineHeight: 30 },
  displayM:   { fontFamily: fonts.serif,     fontSize: 20, lineHeight: 24 },
  displayS:   { fontFamily: fonts.serif,     fontSize: 16, lineHeight: 20 },
  bodyL:      { fontFamily: fonts.body,      fontSize: 14, lineHeight: 22 },
  bodyM:      { fontFamily: fonts.body,      fontSize: 12, lineHeight: 18 },
  bodyS:      { fontFamily: fonts.body,      fontSize: 11, lineHeight: 16 },
  label:      { fontFamily: fonts.bodySemi,  fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  labelS:     { fontFamily: fonts.bodySemi,  fontSize: 9,  letterSpacing: 1.8, textTransform: 'uppercase' },
  reading:    { fontFamily: fonts.reading,   fontSize: 14, lineHeight: 24 },
}
```

### Spacing scale
```typescript
// constants/spacing.ts
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  xxxl: 40,
}

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   18,
  pill: 100,
  full: 9999,
}
```

### Core component rules
- **Screens:** white background (`colors.white`), no exceptions for interior screens
- **Cards:** cream background (`colors.cream`), radius `lg` or `xl`
- **Cobalt:** structural color — nav active, RSVP buttons, article source tags, auth screens
- **Blush:** meetup blocks only (group cards + group detail banner + chat strip)
- **Soleil:** Science & Wellness header + science-related CTA only
- **Fuchsia:** week/baby-age pills, unread pips, primary identity accent
- **Bold accents:** category signals (lime = Classes, orange = Products, lavender = Nutrition, pool = active filter states)
- **Profile colors:** user picks one bold or soft color at onboarding — used in avatars throughout the app
- **No dark mode at MVP**

### Interaction patterns
- Cards are tappable — full card hit area, no separate arrow button
- Buttons disabled until required input is present (onboarding Continue, chat Send)
- Chat bubbles: cream + left-aligned (others), cobalt + right-aligned (self)
- Category pills: inactive = cream bg + muted text; active = pool bg + white text
- Stage chips (science): inactive = cream; active = lime

---

## API & Integrations

### Supabase
```
EXPO_PUBLIC_SUPABASE_URL=https://[project].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon key]
```

**Row Level Security (RLS) rules — critical:**
- `messages`: users can only read messages in groups they belong to
- `group_members`: users can only see groups they are members of
- `dm_threads`: only participants can read/write
- `users`: users can read their own row and other members of shared groups; cannot read strangers
- `recco_posts`: public read, no user writes
- `contributors`: public read, no user writes
- `matching_queue`: users can only read/write their own row

**Realtime channels:**
- `group:{groupId}` — subscribe for all messages in a group
- `dm:{threadId}` — subscribe for DM thread messages

**Edge Functions:**
- `match-users` — scheduled nightly, scores unmatched users, creates groups, sends push notifications
- `inactive-group-check` — scheduled weekly, checks `last_active_at`, sends prompts

### Sanity.io (Science CMS)
```
EXPO_PUBLIC_SANITY_PROJECT_ID=[project id]
EXPO_PUBLIC_SANITY_DATASET=production
```

**Sanity schema — `scienceArticle`:**
```javascript
{
  name: 'scienceArticle',
  fields: [
    { name: 'title',       type: 'string' },
    { name: 'deck',        type: 'string' },       // italic subtitle
    { name: 'category',    type: 'string' },       // Sleep | Nutrition | Recovery | etc.
    { name: 'babyStage',   type: 'string' },       // pregnancy | 0-4wks | 1-3mo | 3-6mo | 6-12mo
    { name: 'author',      type: 'string' },
    { name: 'authorTitle', type: 'string' },       // "MSc Biomedical Engineering" or "Pediatrics, 2023"
    { name: 'readMinutes', type: 'number' },
    { name: 'lead',        type: 'text' },         // Lora font, bold opening paragraph
    { name: 'body',        type: 'array',          // block content with h2, p, pullquote, keyPoints
      of: [{ type: 'block' }] },
    { name: 'keyPoints',   type: 'array', of: [{ type: 'string' }] },
    { name: 'source',      type: 'string' },       // "Pediatrics, 2023"
    { name: 'publishedAt', type: 'datetime' },
  ]
}
```

### Expo Push Notifications
- Register device token on first launch, store on `users.expo_push_token`
- Trigger from Edge Functions (server-side push via Expo Push API)
- Notification types: `group_matched`, `new_message`, `inactive_group_prompt`

### Apple / Google SSO
- Configured via Supabase Auth providers dashboard
- No custom OAuth flow — use `supabase.auth.signInWithOAuth`
- Deep link callback: `moma://auth/callback`

---

## Development Guidelines

### Environment setup
```bash
npm install -g eas-cli
npx create-expo-app moma
cd moma
npx expo install expo-router supabase @supabase/supabase-js zustand expo-font
npx expo install expo-notifications expo-apple-authentication
```

### Testing strategy (MVP)
- Manual testing on Expo Go (iOS + Android physical devices)
- No unit test suite required at MVP — write tests when preparing for store launch
- Test matching logic with seed data scripts in `supabase/seed.sql`

### Commit conventions
```
feat: add group chat realtime subscription
fix: meetup RSVP not persisting on Android
design: update blush banner border radius
db: add inactive_at column to groups table
```

### Error handling
- All Supabase calls: destructure `{ data, error }`, log error, show user-friendly toast
- Never expose raw Supabase error messages to users
- Offline state: show subtle banner "Reconnecting…", queue no messages (inform user to retry)

### Security rules
- Enable RLS on every table — no table left with RLS disabled
- Never put `service_role` key in the mobile app — only `anon` key
- Admin operations (verify contributor, create Science articles) done via Supabase dashboard or a separate admin script, not the mobile app

---

## Current Status

### Decided ✅
- Full product scope and MVP feature set
- 8-screen design system (mockups exist as `moma-complete.html`)
- Color tokens, typography, spacing, interaction patterns
- Data model
- Tech stack (free-tier constrained)
- Matching algorithm weights
- Group lifecycle (30-day inactivity prompt → re-queue option)
- Trusted Recommendations: admin-only contributor verification
- Science content: founder-authored (MSc Biomedical Engineering) + journal-licensed
- Auth: Apple + Google SSO only
- Notifications: Expo Push
- Geography: any city, Amsterdam-first beta
- Monetisation: free at MVP

### Still open ⚠️
- Meetup creation UI: who creates meetups? (currently assumed: any group member can propose, others RSVP) — needs a decision before building `meetups` table UI
- Admin dashboard: Supabase dashboard is sufficient at MVP for managing contributors and Science articles — no custom admin UI needed
- App name trademark / domain check not done

---

## Immediate Next Steps for Claude Code

1. **Scaffold the project**
   ```bash
   npx create-expo-app moma --template tabs
   ```
   Install all dependencies. Set up `.env.local` with Supabase + Sanity keys. Configure Expo Router. Load custom fonts via `expo-font`.

2. **Set up Supabase schema**
   Create all tables in `supabase/migrations/001_initial.sql`. Enable RLS on every table. Write RLS policies per the rules above. Add seed data for 5 test users in Amsterdam.

3. **Build the onboarding flow**
   Implement all 6 steps in `app/(auth)/onboarding/`. Wire Apple + Google SSO via Supabase Auth. On completion, write `users` and `matching_queue` rows. Navigate to `waiting.tsx`.

4. **Build group chat**
   This is the core retention mechanic. Implement `app/(tabs)/index.tsx` (groups list) → `app/group/[groupId]/index.tsx` (detail) → `app/group/[groupId]/chat.tsx` (chat). Wire Supabase Realtime. Apply full design system.

5. **Write the matching Edge Function**
   Implement `supabase/functions/match-users/index.ts`. Score all `waiting` users in `matching_queue` pairwise. Create groups of 3–5. Insert `group_members` rows. Send push notification via Expo Push API. Test with seed data before deploying.
