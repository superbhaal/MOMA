// notify-proposal-decided — sends an Expo push to every member of a group when
// one of its meetup proposals gets locked in (state -> 'decided').
//
// Invoked by the `on_proposal_decided_notify` DB trigger (pg_net) with
// { proposal_id }. Deployed with verify_jwt = true; the trigger passes the
// public anon key as the Bearer token. All data access uses the service_role key.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { asLocale, BCP47, pt } from '../_shared/push-i18n.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    const { proposal_id } = await req.json().catch(() => ({}));
    if (!proposal_id) return json({ ok: false, error: 'proposal_id required' }, 400);

    const { data: proposal } = await supabase
      .from('meetup_proposals')
      .select('id, group_id, scheduled_at, location_name, state')
      .eq('id', proposal_id)
      .maybeSingle();
    if (!proposal) return json({ ok: false, error: 'proposal not found' }, 404);
    if (proposal.state !== 'decided') {
      return json({ ok: true, pushed: 0, reason: 'not decided' });
    }

    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', proposal.group_id);
    const memberIds = (members ?? []).map((m) => m.user_id);
    if (memberIds.length === 0) return json({ ok: true, pushed: 0, reason: 'no members' });

    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', proposal.group_id)
      .maybeSingle();
    const groupName = group?.name ?? null;

    // Meetup pushes respect the notif_meetup_reminders opt-out.
    const { data: recips } = await supabase
      .from('users')
      .select('expo_push_token, notif_meetup_reminders, locale')
      .in('id', memberIds);
    const targets = (recips ?? []).filter(
      (r) => r.expo_push_token && r.notif_meetup_reminders !== false,
    );
    if (targets.length === 0) return json({ ok: true, pushed: 0, reason: 'no tokens' });

    const place = proposal.location_name ? ` · ${proposal.location_name}` : '';
    const data = {
      type: 'proposal_decided',
      route: `/group/${proposal.group_id}/chat`,
      groupId: proposal.group_id,
    };

    // Per recipient rather than once for the batch — and the date is formatted
    // inside the loop, because 'Saturday, Mar 15' has to become 'samedi 15 mars'
    // for a French reader, not just the sentence around it.
    const messages = targets.map((r) => {
      const loc = asLocale((r as { locale?: string | null }).locale);
      const when = new Date(proposal.scheduled_at).toLocaleDateString(BCP47[loc], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      return {
        to: r.expo_push_token as string,
        title: pt(loc, 'lockedTitle', { group: groupName ?? pt(loc, 'yourGroup') }),
        body: pt(loc, 'lockedBody', { when, place }),
        sound: 'default',
        data,
      };
    });
    await sendPushChunked(messages);

    return json({ ok: true, pushed: messages.length });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 500);
  }
});

async function sendPushChunked(items: unknown[], size = 100) {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(chunk),
      });
    } catch (e) {
      console.error('[notify-proposal-decided] push send failed', e);
    }
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
