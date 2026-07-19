// notify-message — sends an Expo push to the recipients of a newly-inserted
// message (group members except the sender, or the other DM participant).
//
// Invoked by the `on_message_insert_notify` DB trigger (pg_net) with
// { message_id }. Deployed with verify_jwt = true; the trigger passes the public
// anon key as the Bearer token, which satisfies JWT verification. All data access
// uses the service_role key internally.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    const { message_id } = await req.json().catch(() => ({}));
    if (!message_id) return json({ ok: false, error: 'message_id required' }, 400);

    const { data: msg } = await supabase
      .from('messages')
      .select('id, group_id, dm_thread_id, sender_id, content, attachment_type')
      .eq('id', message_id)
      .maybeSingle();
    if (!msg) return json({ ok: false, error: 'message not found' }, 404);

    // Resolve recipients (everyone in the conversation except the sender).
    let recipientIds: string[] = [];
    let route = '';
    let context = '';

    if (msg.group_id) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', msg.group_id);
      recipientIds = (members ?? []).map((m) => m.user_id).filter((id) => id !== msg.sender_id);
      const { data: g } = await supabase
        .from('groups')
        .select('name')
        .eq('id', msg.group_id)
        .maybeSingle();
      context = g?.name ?? 'your group';
      route = `/group/${msg.group_id}/chat`;
    } else if (msg.dm_thread_id) {
      const { data: t } = await supabase
        .from('dm_threads')
        .select('participant_a, participant_b')
        .eq('id', msg.dm_thread_id)
        .maybeSingle();
      if (t) {
        recipientIds = [t.participant_a, t.participant_b].filter((id) => id !== msg.sender_id);
      }
      route = `/group/dm/${msg.sender_id}`; // opens the DM with the sender
    }

    if (recipientIds.length === 0) return json({ ok: true, pushed: 0, reason: 'no recipients' });

    const { data: sender } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', msg.sender_id)
      .maybeSingle();
    const senderName = sender?.display_name ?? 'Someone';

    const { data: recips } = await supabase
      .from('users')
      .select('id, expo_push_token, notif_chat_activity')
      .in('id', recipientIds);

    // Respect the per-user chat-activity preference: 'off' opts out of message
    // pushes entirely. (every/daily/weekly are treated as "notify" for MVP.)
    const tokens = (recips ?? [])
      .filter((r) => r.expo_push_token && r.notif_chat_activity !== 'off')
      .map((r) => r.expo_push_token as string);

    const title = msg.group_id ? `${senderName} · ${context}` : senderName;
    const body = previewFor(msg);
    const data = { type: 'new_message', route, groupId: msg.group_id ?? undefined };

    const messages = tokens.map((to) => ({ to, title, body, sound: 'default', data }));
    await sendPushChunked(messages);

    return json({ ok: true, pushed: messages.length });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 500);
  }
});

function previewFor(msg: { attachment_type: string | null; content: string | null }): string {
  if (msg.attachment_type === 'place') return '📍 shared a place';
  if (msg.attachment_type === 'proposal_ref') return 'suggested a meetup';
  const c = (msg.content ?? '').trim();
  if (!c) return 'sent a message';
  return c.length > 140 ? c.slice(0, 139) + '…' : c;
}

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
      console.error('[notify-message] push send failed', e);
    }
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
