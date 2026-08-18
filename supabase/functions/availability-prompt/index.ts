// Sunday-evening push: "When are you free this week?".
// Schedule: weekly (Sun 18:00).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { asLocale, pt } from '../_shared/push-i18n.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: users, error } = await supabase
    .from('users')
    .select('id, expo_push_token, paused_until, locale')
    .not('expo_push_token', 'is', null);

  if (error) {
    return jsonResp({ ok: false, error: error.message }, 500);
  }

  const now = Date.now();
  const targets = (users ?? []).filter(
    (u) => !u.paused_until || new Date(u.paused_until).getTime() < now,
  );

  // Composed per recipient, not once for the batch: each woman reads this in
  // her own language.
  const messages = targets.map((u) => {
    const loc = asLocale((u as { locale?: string | null }).locale);
    return {
      to: u.expo_push_token!,
      title: pt(loc, 'freeTitle'),
      body: pt(loc, 'freeBody'),
      sound: 'default',
      data: { route: '/availability' },
    };
  });

  await sendChunked(messages);

  return jsonResp({ ok: true, pushed: messages.length });
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
