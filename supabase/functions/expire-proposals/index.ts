// Marks past meetup_proposals as expired.
// Schedule: hourly (pg_cron or Supabase Cron Jobs).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('meetup_proposals')
    .update({ state: 'expired' })
    .eq('state', 'open')
    .lt('scheduled_at', nowIso)
    .select('id');

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, expired_count: data?.length ?? 0 }),
    { headers: { 'content-type': 'application/json' } },
  );
});
