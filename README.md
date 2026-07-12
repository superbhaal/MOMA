# møma

B2C mobile app matching new mothers into small, local support groups of 3–5 people based on
life stage, location, and rhythm. Built for Gen Z moms who want genuine human connection.

> **Tagline:** "everyone says 'it takes a village.' here's yours."

**Read [`CLAUDE.md`](./CLAUDE.md) first** — it is the single source of truth for the product scope,
architecture, database schema, design system, and conventions. This README only covers getting the
app running.

---

## Tech stack

| Layer | Tool |
|---|---|
| Mobile framework | Expo `~54` + React Native `0.81` (Expo Router, file-based) |
| Backend / DB / Auth / Realtime | Supabase (Postgres + Auth + Realtime + Storage + Edge Functions) |
| CMS (Learn tab) | Sanity.io v3 |
| State | Zustand (UI/local state only; server state via hooks) |
| Push | Expo Push Notifications |

Auth: email/password + Apple Sign-In + Google SSO. Deep-link callback: `moma://auth/callback`.

---

## Prerequisites

- Node.js 20+ and npm
- Xcode (for iOS) and/or Android Studio (for Android)
- A Supabase project and a Sanity project (keys go in `.env.local` — see below)
- **A development build is required.** Apple/Google SSO and the `moma://` deep links do **not**
  work in Expo Go — you must build the dev client.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local and fill in the Supabase + Sanity values
# (ask the project owner for the keys — they are NOT in this repo)
```

### Environment variables (`.env.local`)

| Var | Where to find it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon/public key) |
| `EXPO_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `EXPO_PUBLIC_SANITY_DATASET` | usually `production` |
| `SANITY_API_TOKEN` | Sanity write token — **only** needed for the seed script, keep out of the client |

> `EXPO_PUBLIC_*` vars are inlined into the client bundle. Never put the Supabase
> `service_role` key or any private secret in an `EXPO_PUBLIC_*` var.

---

## Run

```bash
# Generate native projects (ios/ and android/ are NOT committed)
npx expo prebuild

# iOS dev build on simulator or device
npx expo run:ios

# Android dev build
npx expo run:android
```

After the first native build, day-to-day you can just start Metro with `npm start` and open the
existing dev build.

---

## Project layout

```
app/              Expo Router screens (auth, tabs, group, member, modals)
components/       UI primitives + feature components (onboarding, groups, chat, learn, ...)
hooks/            Server-state hooks (useAuth, useGroups, useChat, useMatching, useLearn, ...)
lib/              supabase.ts, sanity.ts, geocode.ts, notifications, instagram
store/            Zustand store (UI state only)
constants/        colors, typography, spacing design tokens
types/            Shared TS types (Supabase rows + Sanity docs)
supabase/
  migrations/     SQL schema (source of truth for the DB)
  functions/      Edge Functions (match-users, expire-proposals, seed-next-proposal, ...)
scripts/          seed_sanity.mjs (populate the Learn CMS)
design/           moma-enhanced.html — canonical interactive design (17 screens)
```

---

## Backend notes

- **Database schema** lives in `supabase/migrations/`. Apply it to a fresh Supabase project via the
  Supabase CLI or dashboard. RLS is enabled on every table — do not disable it.
- **Edge Functions** in `supabase/functions/` are scheduled jobs (nightly matcher, hourly proposal
  expiry/seeding, weekly prompts). They use the `service_role` key from the function environment,
  never the client.
- **Learn content** (articles, reels, recommendations) lives in Sanity, not Supabase. Seed demo
  content with `node scripts/seed_sanity.mjs` (needs `SANITY_API_TOKEN`).

---

## Auth providers (external config)

Both SSO providers require console setup outside this repo:

- **Google** — create a Web OAuth client in Google Cloud, set the redirect URI to
  `https://<project-ref>.supabase.co/auth/v1/callback`, then enable Google in
  Supabase → Auth → Providers and add `moma://auth/callback` to the allowed redirect URLs.
- **Apple** — enabled via `usesAppleSignIn` in `app.json`; configure the Apple provider in Supabase.

The client is configured for the PKCE OAuth flow (`flowType: 'pkce'` in `lib/supabase.ts`).
