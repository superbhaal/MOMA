// Seeds a fresh system meetup_proposal for active groups that have no `open` proposal
// AND whose most recent proposal closed (decided/expired) >= QUIET_DAYS ago.
// Schedule: hourly. Skipped if a member already created one in the meantime.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const QUIET_DAYS = 5;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const cutoffIso = new Date(
    Date.now() - QUIET_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Active groups + their proposals (we'll filter in app code — keeps SQL simple).
  const { data: groups, error: gErr } = await supabase
    .from('groups')
    .select('id, proposals:meetup_proposals(id, state, scheduled_at, decided_at, created_at)')
    .eq('status', 'active');

  if (gErr) return jsonResp({ ok: false, error: gErr.message }, 500);

  const seeded: string[] = [];

  for (const g of groups ?? []) {
    const props = (g.proposals ?? []) as any[];
    const hasOpen = props.some((p) => p.state === 'open');
    if (hasOpen) continue;
    if (props.length === 0) {
      // No history yet — seed if the group has been around > QUIET_DAYS via group meta.
      // We'll trust the group's existence here; the app fires opener-chip messaging in chat.
    } else {
      // Find most recently closed proposal.
      const mostRecent = props
        .map((p) => ({
          ...p,
          closedAt: p.decided_at ?? p.scheduled_at ?? p.created_at,
        }))
        .sort((a, b) => +new Date(b.closedAt) - +new Date(a.closedAt))[0];
      if (new Date(mostRecent.closedAt) > new Date(cutoffIso)) continue; // too recent
    }

    // Seed: pick a default time = next Saturday 11:00 local.
    const next = nextSaturday11();
    const { error: insErr } = await supabase.from('meetup_proposals').insert({
      group_id: g.id,
      proposed_by: null, // system
      scheduled_at: next.toISOString(),
      location_name: null,
      note: 'system suggestion — counter-propose to swap',
      state: 'open',
    });
    if (!insErr) seeded.push(g.id);
  }

  return jsonResp({ ok: true, seeded_count: seeded.length });
});

function nextSaturday11(): Date {
  const d = new Date();
  const dow = d.getDay();
  const delta = (6 - dow + 7) % 7 || 7; // always at least next week
  d.setDate(d.getDate() + delta);
  d.setHours(11, 0, 0, 0);
  return d;
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
