// Forms candidate groups of 3–5 from waiting users + sets matching_queue.status = 'previewing'.
// Schedule: nightly.
//
// MVP algorithm:
//   1. Get waiting users (paused_until null or past, < 2 group memberships).
//   2. For each seed user (oldest queued first), greedily pick the top-K most compatible others.
//   3. Hard filters: same life_stage, baby_dob within seed.pref_age_window_weeks,
//      same neighbourhood (or same city if seed.pref_distance_minutes == -1),
//      primary_language overlap.
//   4. Score: +10 same neighbourhood, +5 same kid_count, +1 per overlapping recurring-availability cell,
//      +1 per overlapping language.
//   5. Form group of 3–5; insert group + group_members; flip seed (and members) to 'previewing'.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MIN_GROUP = 3;
const MAX_GROUP = 5;

// ---- scoring weights -------------------------------------------------------
// Only geography is a HARD filter. Everything else is soft weighting.
//   Criterion 1 (dominant): distance proximity + shared language.
//   Criterion 2 (secondary): same birth stage + same kid count.
const SCORE_THRESHOLD = 30;     // min total score for a pair to be groupable
const WALK_M_PER_MIN = 80;      // ~4.8 km/h walking → metres per minute
const CITY_RADIUS_M = 25000;    // radius used when a user picks "anywhere in city" (-1)
const DIST_MAX_PTS = 40;        // full proximity points at distance 0
const CITY_FALLBACK_PTS = 20;   // proximity points when we only know "same city" (no coords)
const LANG_PRIMARY_PTS = 30;    // same primary language
const LANG_SHARED_PTS = 15;     // shared language but not the primary
const LANG_EXTRA_PTS = 5;       // per additional shared language (max 2)
const STAGE_SAME_PTS = 15;      // identical life_stage
const STAGE_ADJ_PTS = 8;        // adjacent life_stage (expecting↔newborn, etc.)
const KID_SAME_PTS = 10;        // same kid_count
const AVAIL_CAP = 6;            // availability overlap is a minor tiebreaker

const LIFE_STAGE_ORDER = ['expecting', 'newborn', 'growing', 'veteran'];

interface RecurringAvailability {
  weekday_morning: boolean;
  weekday_afternoon: boolean;
  weekday_evening: boolean;
  weekend_morning: boolean;
  weekend_afternoon: boolean;
  weekend_evening: boolean;
}

interface UserRow {
  id: string;
  display_name: string;
  email: string | null;
  expo_push_token: string | null;
  baby_dob: string;
  city: string | null;
  neighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
  life_stage: string | null;
  kid_count: string | null;
  recurring_availability: RecurringAvailability | null;
  primary_language: string | null;
  secondary_languages: string[] | null;
  pref_age_window_weeks: number;
  pref_distance_minutes: number;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: string;
  data: Record<string, unknown>;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const nowIso = new Date().toISOString();
  const { data: queueRows, error: qErr } = await supabase
    .from('matching_queue')
    .select('user_id, queued_at, user:users(*)')
    .eq('status', 'waiting')
    .order('queued_at', { ascending: true });

  if (qErr) return jsonResp({ ok: false, error: qErr.message }, 500);

  const waiters = (queueRows ?? [])
    .map((r: any) => r.user as UserRow)
    .filter((u): u is UserRow => !!u && !!u.life_stage);

  // 2-group cap enforcement (the DB trigger also blocks at INSERT time).
  const { data: members } = await supabase.from('group_members').select('user_id');
  const memberCounts = new Map<string, number>();
  for (const m of (members ?? []) as { user_id: string }[]) {
    memberCounts.set(m.user_id, (memberCounts.get(m.user_id) ?? 0) + 1);
  }
  const eligible = waiters.filter((u) => (memberCounts.get(u.id) ?? 0) < 2);

  const used = new Set<string>();
  const formedGroups: { seed: UserRow; mates: UserRow[] }[] = [];

  for (const seed of eligible) {
    if (used.has(seed.id)) continue;
    const candidates = eligible
      .filter((c) => c.id !== seed.id && !used.has(c.id))
      .map((c) => ({ user: c, score: scorePair(seed, c) }))
      .filter((s) => s.score !== null && s.score >= SCORE_THRESHOLD)
      .sort((a, b) => (b.score! - a.score!))
      .slice(0, MAX_GROUP - 1);

    if (candidates.length < MIN_GROUP - 1) continue;

    const picked: UserRow[] = [seed];
    for (const c of candidates) {
      if (picked.every((p) => scorePair(p, c.user) !== null)) {
        picked.push(c.user);
      }
      if (picked.length >= MAX_GROUP) break;
    }
    if (picked.length < MIN_GROUP) continue;

    formedGroups.push({ seed, mates: picked });
    for (const u of picked) used.add(u.id);
  }

  const previews: string[] = [];
  const pushMessages: PushMessage[] = [];
  const emailJobs: Promise<void>[] = [];
  for (const g of formedGroups) {
    const groupName = `${g.seed.city ?? 'møma'} ${g.seed.life_stage ?? 'group'}`.toLowerCase();
    const { data: groupRow, error: gErr } = await supabase
      .from('groups')
      .insert({
        name: groupName,
        city: g.seed.city,
        neighbourhood: g.seed.neighbourhood,
        type: 'neighbourhood',
        status: 'active',
      })
      .select('id')
      .maybeSingle();
    if (gErr || !groupRow) continue;

    const memberRows = g.mates.map((u) => ({ group_id: groupRow.id, user_id: u.id }));
    const { error: mErr } = await supabase.from('group_members').insert(memberRows);
    if (mErr) continue;

    await supabase
      .from('matching_queue')
      .update({ status: 'previewing', current_preview_group_id: groupRow.id })
      .in('user_id', g.mates.map((u) => u.id));

    previews.push(groupRow.id);

    // Notify every member: "the notification IS the UX" (spec screen 09).
    const now = Date.now();
    const weeks = g.mates
      .map((u) => weeksOld(u.baby_dob, now))
      .filter((w): w is number => w !== null);
    const wLo = weeks.length ? Math.min(...weeks) : null;
    const wHi = weeks.length ? Math.max(...weeks) : null;
    const hood = majorityNeighbourhood(g.mates);

    for (const u of g.mates) {
      const others = g.mates.length - 1;
      const body = matchBody(others, hood, wLo, wHi);
      if (u.expo_push_token) {
        pushMessages.push({
          to: u.expo_push_token,
          title: 'Your group is ready',
          body,
          sound: 'default',
          data: { type: 'group_matched_preview', groupId: groupRow.id, route: '/group-preview' },
        });
      }
      if (u.email) {
        emailJobs.push(sendMatchEmail(u.email, body));
      }
    }
  }

  await sendPushChunked(pushMessages);
  await Promise.allSettled(emailJobs);

  return jsonResp({
    ok: true,
    run_at: nowIso,
    candidates: eligible.length,
    groups_created: previews.length,
    pushed: pushMessages.length,
  });
});

function weeksOld(dob: string | null, now: number): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / (7 * 24 * 60 * 60 * 1000)));
}

function majorityNeighbourhood(members: UserRow[]): string {
  const counts = new Map<string, number>();
  for (const m of members) {
    const key = m.city ?? m.neighbourhood;
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = 'your area';
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function matchBody(others: number, hood: string, wLo: number | null, wHi: number | null): string {
  const who = others === 1 ? '1 mom' : `${others} moms`;
  if (wLo === null || wHi === null) {
    return `We matched you with ${who} in ${hood}. Tap to meet them.`;
  }
  const weeks = wLo === wHi ? `week ${wLo}` : `week ${wLo}–${wHi}`;
  return `We matched you with ${who} in ${hood}, all at ${weeks}. Tap to meet them.`;
}

async function sendPushChunked(items: PushMessage[], size = 100) {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(chunk),
      });
    } catch (e) {
      console.error('[match-users] push send failed', e);
    }
  }
}

// Email at match, isolated behind one function. Uses Resend if RESEND_API_KEY is
// configured on the function; otherwise no-ops (logs) so a missing key never
// breaks the matcher. Skips silently when the address is null (Apple relay).
async function sendMatchEmail(to: string, body: string): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('MATCH_EMAIL_FROM') ?? 'møma <hello@joinmoma.org>';
  if (!key) {
    console.log('[match-users] RESEND_API_KEY not set — skipping email to', to);
    return;
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: 'Your group is ready',
        text: `${body}\n\nOpen møma to meet your group.`,
      }),
    });
  } catch (e) {
    console.error('[match-users] email send failed', e);
  }
}

// Distance is the ONLY hard filter. Returns null when the pair is out of range;
// otherwise a total soft score. Kept in sync with admin-api/scorePairDetailed.
function scorePair(a: UserRow, b: UserRow): number | null {
  const g = geoScore(a, b);
  if (!g.ok) return null;
  return g.score + langScore(a, b) + stageScore(a, b) + kidScore(a, b)
    + Math.min(availabilityOverlap(a.recurring_availability, b.recurring_availability), AVAIL_CAP);
}

// Hard geo filter + proximity score. Uses real lat/long distance when both users
// have coordinates; falls back to "same city" when either lacks them (e.g. seeded
// test users), so coordinate-less rows are still matchable within their city.
function geoScore(a: UserRow, b: UserRow): { ok: boolean; score: number } {
  const anywhere = a.pref_distance_minutes === -1 || b.pref_distance_minutes === -1;
  const hasCoords =
    a.latitude != null && a.longitude != null && b.latitude != null && b.longitude != null;

  if (hasCoords) {
    const d = haversineMeters(a.latitude!, a.longitude!, b.latitude!, b.longitude!);
    const effR = anywhere
      ? CITY_RADIUS_M
      : Math.max(radiusMeters(a.pref_distance_minutes), radiusMeters(b.pref_distance_minutes));
    const ok = anywhere || d <= effR;
    const ref = anywhere ? CITY_RADIUS_M : effR;
    const score = ok ? Math.round(DIST_MAX_PTS * Math.max(0, 1 - d / ref)) : 0;
    return { ok, score };
  }

  const sameCity =
    !!a.city && !!b.city && a.city.toLowerCase() === b.city.toLowerCase();
  return { ok: sameCity, score: sameCity ? CITY_FALLBACK_PTS : 0 };
}

function radiusMeters(minutes: number): number {
  if (minutes === -1) return CITY_RADIUS_M;
  return (minutes || 20) * WALK_M_PER_MIN;
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function langScore(a: UserRow, b: UserRow): number {
  const setA = new Set([a.primary_language ?? '', ...(a.secondary_languages ?? [])].filter(Boolean));
  const listB = [b.primary_language ?? '', ...(b.secondary_languages ?? [])].filter(Boolean);
  const shared = listB.filter((l) => setA.has(l));
  if (shared.length === 0) return 0;
  const base =
    a.primary_language && a.primary_language === b.primary_language
      ? LANG_PRIMARY_PTS
      : LANG_SHARED_PTS;
  return base + Math.min(shared.length - 1, 2) * LANG_EXTRA_PTS;
}

function stageScore(a: UserRow, b: UserRow): number {
  const ia = LIFE_STAGE_ORDER.indexOf(a.life_stage ?? '');
  const ib = LIFE_STAGE_ORDER.indexOf(b.life_stage ?? '');
  if (ia < 0 || ib < 0) return 0;
  const diff = Math.abs(ia - ib);
  if (diff === 0) return STAGE_SAME_PTS;
  if (diff === 1) return STAGE_ADJ_PTS;
  return 0;
}

function kidScore(a: UserRow, b: UserRow): number {
  return a.kid_count && a.kid_count === b.kid_count ? KID_SAME_PTS : 0;
}

function availabilityOverlap(
  a: RecurringAvailability | null,
  b: RecurringAvailability | null,
): number {
  if (!a || !b) return 0;
  let n = 0;
  for (const k of Object.keys(a) as (keyof RecurringAvailability)[]) {
    if (a[k] && b[k]) n++;
  }
  return n;
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
