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
const SCORE_THRESHOLD = 5;

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
  life_stage: string | null;
  kid_count: string | null;
  recurring_availability: RecurringAvailability | null;
  is_mentor_eligible: boolean;
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
    const groupName = `${g.seed.neighbourhood ?? g.seed.city ?? 'møma'} ${g.seed.life_stage ?? 'group'}`.toLowerCase();
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
    const key = m.neighbourhood ?? m.city;
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

function scorePair(a: UserRow, b: UserRow): number | null {
  if (a.life_stage !== b.life_stage) return null;
  if (!withinAgeWindow(a.baby_dob, b.baby_dob, Math.max(a.pref_age_window_weeks, b.pref_age_window_weeks))) {
    return null;
  }
  if (!geoCompatible(a, b)) return null;
  if (!langCompatible(a, b)) return null;

  let score = 0;
  if (a.neighbourhood && a.neighbourhood === b.neighbourhood) score += 10;
  if (a.kid_count && a.kid_count === b.kid_count) score += 5;
  score += availabilityOverlap(a.recurring_availability, b.recurring_availability);

  const langA = new Set([
    a.primary_language ?? '',
    ...(a.secondary_languages ?? []),
  ].filter(Boolean));
  for (const l of [b.primary_language ?? '', ...(b.secondary_languages ?? [])]) {
    if (l && langA.has(l)) score += 1;
  }

  return score;
}

function withinAgeWindow(dobA: string, dobB: string, weeks: number): boolean {
  const diffDays = Math.abs(
    (new Date(dobA).getTime() - new Date(dobB).getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays <= weeks * 7;
}

function geoCompatible(a: UserRow, b: UserRow): boolean {
  if (a.pref_distance_minutes === -1 || b.pref_distance_minutes === -1) {
    return !!a.city && a.city === b.city;
  }
  return !!a.neighbourhood && a.neighbourhood === b.neighbourhood;
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

function langCompatible(a: UserRow, b: UserRow): boolean {
  if (!a.primary_language || !b.primary_language) return true;
  if (a.primary_language === b.primary_language) return true;
  const aSet = new Set([a.primary_language, ...(a.secondary_languages ?? [])]);
  if (aSet.has(b.primary_language)) return true;
  const bSet = new Set([b.primary_language, ...(b.secondary_languages ?? [])]);
  if (bSet.has(a.primary_language)) return true;
  return false;
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
