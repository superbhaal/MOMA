// admin-api — privileged backend for the møma admin panel (GitHub Pages UI).
//
// SECURITY MODEL
//   - Runs with the service_role key (server-side only — NEVER shipped to the browser).
//   - Deployed with verify_jwt = false; it does its OWN auth instead:
//     every request must carry  x-admin-credentials: base64("<user>:<password>").
//     The user must equal ADMIN_USER and SHA-256(password) must equal ADMIN_HASH.
//   - The repo is public, so the password is stored only as a SHA-256 hash here.
//     Set an ADMIN_PASSWORD function secret to override (plaintext compare) and rotate.
//
// This guards a throwaway MVP test DB. It is intentionally simple, not hardened
// against brute force — put it behind a real auth provider before production.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ADMIN_USER = Deno.env.get('ADMIN_USER') ?? 'admin_moma';
// SHA-256 of the shared passphrase. Overridable via the ADMIN_PASSWORD secret.
const ADMIN_HASH = 'c75dbaafeb77bb8abb627b7bd7cee93c8c86cefdd129395997613048b690c1e2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-admin-credentials',
};

// Columns an admin may edit on public.users. Anything else in a patch is ignored.
const EDITABLE = new Set([
  'display_name', 'last_name', 'age', 'city', 'neighbourhood', 'address',
  'latitude', 'longitude',
  'baby_dob', 'life_stage', 'kid_count', 'is_first_baby', 'is_mentor_eligible',
  'primary_language', 'secondary_languages', 'profile_color', 'bio',
  'instagram_handle', 'interests', 'pref_age_window_weeks', 'pref_distance_minutes',
  'pref_baby_at_meetups', 'pref_meetup_formats', 'pref_free_blocks', 'paused_until',
]);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authed = await checkAuth(req);
    if (!authed) return json({ ok: false, error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    switch (action) {
      case 'list_users':   return json(await listUsers());
      case 'update_user':  return json(await updateUser(body.id, body.patch));
      case 'delete_user':  return json(await deleteUser(body.id));
      case 'add_test_user':return json(await addTestUser(body.fields ?? {}));
      case 'set_queue':    return json(await setQueue(body.id, body.status));
      case 'cleanup_groups': return json({ ok: true, deleted: await cleanupEmptyGroups() });
      case 'list_groups':  return json(await listGroups());
      case 'group_meetup_data': return json(await groupMeetupData(body.group_id));
      case 'create_meetup': return json(await createMeetup(body));
      case 'run_matching': return json(await runMatching());
      case 'score_matrix': return json(await scoreMatrix(body.only_waiting === true));
      default:             return json({ ok: false, error: `unknown action: ${action}` }, 400);
    }
  } catch (e) {
    return json({ ok: false, error: String(e?.message ?? e) }, 500);
  }
});

// ---- auth ------------------------------------------------------------------

async function checkAuth(req: Request): Promise<boolean> {
  const raw = req.headers.get('x-admin-credentials');
  if (!raw) return false;
  let decoded = '';
  try { decoded = atob(raw); } catch { return false; }
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  if (user !== ADMIN_USER) return false;

  const override = Deno.env.get('ADMIN_PASSWORD');
  if (override) return pass === override;
  return (await sha256Hex(pass)) === ADMIN_HASH;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---- actions ---------------------------------------------------------------

function isTest(email: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return e.endsWith('@moma.dev') || e.includes('.test@') || e.includes('+test@');
}

async function listUsers() {
  const { data: users, error } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const [{ data: memberships }, { data: queue }, { data: groups }] = await Promise.all([
    admin.from('group_members').select('user_id, group_id, role'),
    admin.from('matching_queue').select('user_id, status, current_preview_group_id'),
    admin.from('groups').select('id, name'),
  ]);

  const groupName = new Map((groups ?? []).map((g: any) => [g.id, g.name]));
  const byUser = new Map<string, any[]>();
  for (const m of memberships ?? []) {
    const arr = byUser.get(m.user_id) ?? [];
    arr.push({ group_id: m.group_id, name: groupName.get(m.group_id) ?? m.group_id, role: m.role });
    byUser.set(m.user_id, arr);
  }
  const queueByUser = new Map((queue ?? []).map((q: any) => [q.user_id, q]));

  const rows = (users ?? []).map((u: any) => ({
    ...u,
    is_test: isTest(u.email),
    groups: byUser.get(u.id) ?? [],
    queue_status: queueByUser.get(u.id)?.status ?? null,
  }));
  return { ok: true, users: rows };
}

async function updateUser(id: string, patch: Record<string, unknown>) {
  if (!id || !patch) return { ok: false, error: 'id and patch required' };
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (EDITABLE.has(k)) clean[k] = v === '' ? null : v;
  clean.updated_at = new Date().toISOString();
  const { error } = await admin.from('users').update(clean).eq('id', id);
  if (error) throw error;
  return { ok: true };
}

async function deleteUser(id: string) {
  if (!id) return { ok: false, error: 'id required' };
  // auth.users delete cascades to public.users and all its children.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw error;
  await cleanupEmptyGroups();
  return { ok: true };
}

async function addTestUser(fields: Record<string, any>) {
  const name: string = (fields.display_name ?? 'Test').toString().trim() || 'Test';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'test';
  // Enforce test-only: we always mint a *.test@moma.dev address, never a real one.
  const email = `${slug}.${Date.now().toString(36)}.test@moma.dev`;

  const { data: created, error: aErr } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (aErr) throw aErr;
  const id = created.user!.id;

  const row: Record<string, unknown> = {
    id,
    email,
    display_name: name,
    last_name: fields.last_name ?? null,
    age: fields.age ?? null,
    city: fields.city ?? null,
    neighbourhood: fields.neighbourhood ?? null,
    latitude: fields.latitude != null && fields.latitude !== '' ? Number(fields.latitude) : null,
    longitude: fields.longitude != null && fields.longitude !== '' ? Number(fields.longitude) : null,
    baby_dob: fields.baby_dob ?? null,
    life_stage: fields.life_stage ?? null,
    kid_count: fields.kid_count ?? null,
    is_first_baby: fields.is_first_baby ?? null,
    primary_language: fields.primary_language ?? null,
    secondary_languages: fields.secondary_languages ?? null,
    profile_color: fields.profile_color ?? '#E8389C',
    recurring_availability: fields.recurring_availability ?? null,
  };
  const { error: uErr } = await admin.from('users').insert(row);
  if (uErr) { await admin.auth.admin.deleteUser(id); throw uErr; }

  // Put them in the matching queue so they can be matched, like a real signup.
  await admin.from('matching_queue').upsert({ user_id: id, status: 'waiting' }, { onConflict: 'user_id' });
  return { ok: true, id, email };
}

async function setQueue(id: string, status: string) {
  if (!id || !['waiting', 'previewing', 'matched'].includes(status)) {
    return { ok: false, error: 'valid id and status required' };
  }
  const patch: Record<string, unknown> = { status };
  if (status === 'waiting') {
    // A full reset for testing: pull the user out of every group (the matcher
    // pre-joins candidates, so "waiting" must undo that) and clear the preview.
    patch.current_preview_group_id = null;
    patch.matched_at = null;
    await admin.from('group_members').delete().eq('user_id', id);
    await cleanupEmptyGroups();
  }
  const { error } = await admin.from('matching_queue').upsert(
    { user_id: id, ...patch }, { onConflict: 'user_id' },
  );
  if (error) throw error;
  return { ok: true };
}

// Delete groups that no longer have any members. All group children cascade,
// so a single delete per empty group cleans messages/proposals/votes/dm_threads.
async function cleanupEmptyGroups(): Promise<number> {
  const [{ data: groups }, { data: members }] = await Promise.all([
    admin.from('groups').select('id'),
    admin.from('group_members').select('group_id'),
  ]);
  const alive = new Set((members ?? []).map((m: any) => m.group_id));
  const empty = (groups ?? []).map((g: any) => g.id).filter((gid: string) => !alive.has(gid));
  if (empty.length) await admin.from('groups').delete().in('id', empty);
  return empty.length;
}

// ---- meetup scheduling -----------------------------------------------------

const BLOCK_HOURS: Record<string, number> = { morning: 9, afternoon: 14, evening: 18 };

async function listGroups() {
  const { data: groups } = await admin
    .from('groups')
    .select('id, name, city, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  const { data: members } = await admin.from('group_members').select('group_id');
  const counts = new Map<string, number>();
  for (const m of members ?? []) counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
  return {
    ok: true,
    groups: (groups ?? []).map((g: any) => ({ ...g, member_count: counts.get(g.id) ?? 0 })),
  };
}

async function groupMeetupData(groupId: string) {
  if (!groupId) return { ok: false, error: 'group_id required' };

  const { data: memberRows } = await admin
    .from('group_members')
    .select('user_id, role, user:users(id, display_name, profile_color)')
    .eq('group_id', groupId);
  const members = (memberRows ?? []).map((m: any) => ({
    id: m.user.id,
    name: m.user.display_name,
    color: m.user.profile_color,
    role: m.role,
  }));
  const memberIds = members.map((m) => m.id);
  const memberCount = members.length;

  // Busy windows (availability_slots with available=false) for the next 14 days.
  const today = new Date().toISOString().slice(0, 10);
  const to = new Date();
  to.setDate(to.getDate() + 13);
  const toIso = to.toISOString().slice(0, 10);

  const busyByCell = new Map<string, number>();
  if (memberIds.length) {
    const { data: slots } = await admin
      .from('availability_slots')
      .select('date, block, available')
      .in('user_id', memberIds)
      .eq('available', false)
      .gte('date', today)
      .lte('date', toIso);
    for (const s of slots ?? []) {
      const k = `${s.date}|${s.block}`;
      busyByCell.set(k, (busyByCell.get(k) ?? 0) + 1);
    }
  }

  // Build the 14-day × 3-block grid with free counts, ranked for the admin.
  const blocks = ['morning', 'afternoon', 'evening'];
  const grid: any[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    for (const block of blocks) {
      const busy = busyByCell.get(`${date}|${block}`) ?? 0;
      grid.push({ date, block, busy, free: memberCount - busy, all_free: busy === 0 });
    }
  }

  // Shared places (place-card messages) posted in this group.
  const { data: placeMsgs } = await admin
    .from('messages')
    .select('attachment_data, sender_id, created_at')
    .eq('group_id', groupId)
    .eq('attachment_type', 'place')
    .order('created_at', { ascending: false });
  const nameById = new Map(members.map((m) => [m.id, m.name]));
  const places = (placeMsgs ?? []).map((m: any) => ({
    ...(m.attachment_data ?? {}),
    shared_by: nameById.get(m.sender_id) ?? 'someone',
    shared_at: m.created_at,
  }));

  const { data: openProposal } = await admin
    .from('meetup_proposals')
    .select('*')
    .eq('group_id', groupId)
    .eq('state', 'open')
    .maybeSingle();

  return { ok: true, member_count: memberCount, members, grid, places, open_proposal: openProposal };
}

async function createMeetup(body: any) {
  const { group_id, date, block, note, location_name, location_lat, location_lng } = body;
  if (!group_id || !date || !block) {
    return { ok: false, error: 'group_id, date and block are required' };
  }
  // Compose the scheduled timestamp from the chosen day + block hour.
  const hour = BLOCK_HOURS[block] ?? 12;
  const scheduled_at = `${date}T${String(hour).padStart(2, '0')}:00:00`;

  // One open proposal per group — retire any existing open one first.
  await admin
    .from('meetup_proposals')
    .update({ state: 'expired' })
    .eq('group_id', group_id)
    .eq('state', 'open');

  const { data: proposal, error } = await admin
    .from('meetup_proposals')
    .insert({
      group_id,
      proposed_by: null, // system/admin-generated
      scheduled_at,
      location_name: location_name ?? null,
      location_lat: location_lat ?? null,
      location_lng: location_lng ?? null,
      note: note ?? null,
      state: 'open',
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;

  // Notify members that møma dropped a time + place.
  const { data: memberRows } = await admin
    .from('group_members')
    .select('user_id')
    .eq('group_id', group_id);
  const ids = (memberRows ?? []).map((m: any) => m.user_id);
  const { data: recips } = await admin
    .from('users')
    .select('expo_push_token, notif_meetup_reminders')
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const tokens = (recips ?? [])
    .filter((r: any) => r.expo_push_token && r.notif_meetup_reminders !== false)
    .map((r: any) => r.expo_push_token);
  if (tokens.length) {
    const when = new Date(scheduled_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    });
    const push = tokens.map((to: string) => ({
      to,
      title: 'møma picked a time',
      body: `${when}${location_name ? ` · ${location_name}` : ''}. Tap to RSVP.`,
      sound: 'default',
      data: { type: 'proposal_decided', groupId: group_id, route: `/group/${group_id}/chat` },
    }));
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(push),
      });
    } catch (_e) { /* best-effort */ }
  }

  return { ok: true, proposal, pushed: tokens.length };
}

async function runMatching() {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/match-users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json' },
    body: '{}',
  });
  const result = await res.json().catch(() => ({}));
  return { ok: res.ok, result };
}

// ---- scoring (mirror of match-users/scorePair) -----------------------------
// Distance is the only hard filter. Criterion 1: distance + language.
// Criterion 2: birth stage + kid count. Keep in sync with match-users.
const SCORE_THRESHOLD = 30;
const WALK_M_PER_MIN = 80;
const CITY_RADIUS_M = 25000;
const DIST_MAX_PTS = 40;
const CITY_FALLBACK_PTS = 20;
const LANG_PRIMARY_PTS = 30;
const LANG_SHARED_PTS = 15;
const LANG_EXTRA_PTS = 5;
const STAGE_SAME_PTS = 15;
const STAGE_ADJ_PTS = 8;
const KID_SAME_PTS = 10;
const AVAIL_CAP = 6;
const LIFE_STAGE_ORDER = ['expecting', 'newborn', 'growing', 'veteran'];

async function scoreMatrix(onlyWaiting: boolean) {
  let q = admin.from('users').select('*').not('life_stage', 'is', null);
  const { data: users, error } = await q.order('display_name');
  if (error) throw error;

  let pool = users ?? [];
  if (onlyWaiting) {
    const { data: queue } = await admin.from('matching_queue').select('user_id, status');
    const waiting = new Set((queue ?? []).filter((r: any) => r.status === 'waiting').map((r: any) => r.user_id));
    pool = pool.filter((u: any) => waiting.has(u.id));
  }

  const pairs: any[] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i], b = pool[j];
      const d = scorePairDetailed(a, b);
      pairs.push({
        a_id: a.id, a_name: a.display_name, b_id: b.id, b_name: b.display_name,
        score: d.score, reason: d.reason, pass: d.score !== null && d.score >= SCORE_THRESHOLD,
      });
    }
  }
  return { ok: true, threshold: SCORE_THRESHOLD, users: pool.map((u: any) => ({ id: u.id, name: u.display_name })), pairs };
}

function scorePairDetailed(a: any, b: any): { score: number | null; reason: string } {
  const g = geoScore(a, b);
  if (!g.ok) return { score: null, reason: g.label };

  const parts: string[] = [`dist +${g.score} (${g.label})`];
  let score = g.score;

  const lang = langScore(a, b);
  parts.push(lang ? `lang +${lang}` : 'lang +0 (no shared)');
  score += lang;

  const st = stageScore(a, b);
  if (st) { score += st; parts.push(`stage +${st}`); }

  if (a.kid_count && a.kid_count === b.kid_count) { score += KID_SAME_PTS; parts.push(`kids +${KID_SAME_PTS}`); }

  const av = Math.min(availabilityOverlap(a.recurring_availability, b.recurring_availability), AVAIL_CAP);
  if (av) { score += av; parts.push(`avail +${av}`); }

  return { score, reason: parts.join(', ') };
}

function geoScore(a: any, b: any): { ok: boolean; score: number; label: string } {
  const anywhere = a.pref_distance_minutes === -1 || b.pref_distance_minutes === -1;
  const hasCoords = a.latitude != null && a.longitude != null && b.latitude != null && b.longitude != null;
  if (hasCoords) {
    const d = haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
    const effR = anywhere ? CITY_RADIUS_M : Math.max(radiusMeters(a.pref_distance_minutes), radiusMeters(b.pref_distance_minutes));
    const ok = anywhere || d <= effR;
    const ref = anywhere ? CITY_RADIUS_M : effR;
    const score = ok ? Math.round(DIST_MAX_PTS * Math.max(0, 1 - d / ref)) : 0;
    return { ok, score, label: `${(d / 1000).toFixed(1)}km${ok ? '' : ' — out of range'}` };
  }
  const sameCity = !!a.city && !!b.city && String(a.city).toLowerCase() === String(b.city).toLowerCase();
  return {
    ok: sameCity,
    score: sameCity ? CITY_FALLBACK_PTS : 0,
    label: sameCity ? `same city (${a.city}), no coords` : `diff city (${a.city} vs ${b.city})`,
  };
}
function radiusMeters(minutes: number): number {
  if (minutes === -1) return CITY_RADIUS_M;
  return (minutes || 20) * WALK_M_PER_MIN;
}
function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
function langScore(a: any, b: any): number {
  const setA = new Set([a.primary_language ?? '', ...(a.secondary_languages ?? [])].filter(Boolean));
  const shared = [b.primary_language ?? '', ...(b.secondary_languages ?? [])].filter(Boolean).filter((l: string) => setA.has(l));
  if (shared.length === 0) return 0;
  const base = a.primary_language && a.primary_language === b.primary_language ? LANG_PRIMARY_PTS : LANG_SHARED_PTS;
  return base + Math.min(shared.length - 1, 2) * LANG_EXTRA_PTS;
}
function stageScore(a: any, b: any): number {
  const ia = LIFE_STAGE_ORDER.indexOf(a.life_stage ?? '');
  const ib = LIFE_STAGE_ORDER.indexOf(b.life_stage ?? '');
  if (ia < 0 || ib < 0) return 0;
  const diff = Math.abs(ia - ib);
  if (diff === 0) return STAGE_SAME_PTS;
  if (diff === 1) return STAGE_ADJ_PTS;
  return 0;
}
function availabilityOverlap(a: any, b: any): number {
  if (!a || !b) return 0;
  let n = 0;
  for (const k of Object.keys(a)) if (a[k] && b[k]) n++;
  return n;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}
