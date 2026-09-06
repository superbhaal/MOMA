// 30-day inactive group prompt: pushes "still here?" + writes inactive_group_prompts row.
// Schedule: weekly. Idempotent within a 30-day window per user/group.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { pushLocaleFor, pt } from '../_shared/push-i18n.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const INACTIVE_DAYS = 30;

/** The two columns the language choice is read from. */
type A = { locale?: string | null; primary_language?: string | null };

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const cutoffIso = new Date(
    Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: groups, error: gErr } = await supabase
    .from('groups')
    .select('id, name, last_active_at, members:group_members(user_id, user:users(id, expo_push_token, locale, primary_language))')
    .eq('status', 'active')
    .lt('last_active_at', cutoffIso);

  if (gErr) return jsonResp({ ok: false, error: gErr.message }, 500);

  const messages: Array<{ to: string; title: string; body: string; sound: string; data: any }> = [];
  const promptRows: Array<{ group_id: string; user_id: string }> = [];
  const recentCutoff = new Date(
    Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  for (const g of groups ?? []) {
    for (const m of (g.members ?? []) as any[]) {
      // Skip if we already prompted this user/group within the window.
      const { data: existing } = await supabase
        .from('inactive_group_prompts')
        .select('id')
        .eq('group_id', g.id)
        .eq('user_id', m.user_id)
        .gte('prompted_at', recentCutoff)
        .maybeSingle();
      if (existing) continue;

      promptRows.push({ group_id: g.id, user_id: m.user_id });
      const token = m.user?.expo_push_token;
      if (token) {
        const loc = pushLocaleFor((m.user as A | null)?.locale, (m.user as A | null)?.primary_language);
        messages.push({
          to: token,
          title: pt(loc, 'quietTitle'),
          body: pt(loc, 'quietBody', { group: g.name ?? pt(loc, 'yourGroup') }),
          sound: 'default',
          data: { route: `/group/${g.id}` },
        });
      }
    }
  }

  if (promptRows.length > 0) {
    await supabase.from('inactive_group_prompts').insert(promptRows);
  }
  await sendChunked(messages);

  return jsonResp({ ok: true, prompted: promptRows.length, pushed: messages.length });
});

async function sendChunked<T>(items: T[], size = 100) {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(chunk),
    });
  }
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
