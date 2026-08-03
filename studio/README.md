# møma · Learn CMS (Sanity Studio)

The editing UI for **Discover · Learn** (Read articles) and **Watch** (reels). The
app reads this content via `lib/sanity.ts` from the same Sanity project
(`5hfvgbis`, dataset `production`). Explore places/people are **not** here — those
live in Supabase (`loved_spots`).

## One-time setup

```bash
cd studio
npm install
npx sanity login      # log in with the Sanity account that owns project 5hfvgbis
```

## Author content locally

```bash
npm run dev           # opens the Studio at http://localhost:3333
```

Create a **Read · Article** or **Watch · Reel**, fill the fields, and hit
Publish. It appears in the app's Learn/Watch feed on next load (pull to refresh).

- `babyStage` drives the app's stage filter — pick the matching stage.
- Articles **require a citable `source`** (e.g. "Pediatrics, 2023").
- Reels **require a `credential`** (e.g. "MD · Perinatal") — no credential, no reel.
- Article body supports three block styles the app renders: **Normal**,
  **Heading** (h2), **Pull-quote** (blockquote). Other styles won't show.

## Deploy the hosted Studio (so non-devs can edit in a browser)

```bash
npm run deploy        # pick a hostname, e.g. moma-learn → https://moma-learn.sanity.studio
```

Invite editors in <https://manage.sanity.io> → project → Members (free tier: 3 users).

## Seed the demo content (3 articles + 2 reels)

Ready-made fixtures live in `seed/learn-seed.ndjson` (the handoff's canonical Read
+ Watch samples). Import them with your CLI login — no API token needed:

```bash
cd studio
npx sanity dataset import seed/learn-seed.ndjson production --replace
```

`--replace` makes it idempotent (stable `_id`s), so re-running just refreshes them.
They show up in the app's Learn/Watch feed immediately.

## Seeding via the HTTP API instead

The app's read token (`SANITY_API_TOKEN` in `.env.local`) is **read-only** (writes
return 403). For API writes create an **Editor** token: manage.sanity.io → project
`5hfvgbis` → API → Tokens → **Add token** → Editor, then POST mutations to
`https://5hfvgbis.api.sanity.io/v2024-01-01/data/mutate/production`.
