// delete-account — lets a signed-in user permanently delete THEIR OWN account.
//
// SECURITY MODEL
//   - Runs with the service_role key (server-side only — NEVER shipped to the app).
//   - The caller is identified from their own JWT (the Authorization: Bearer
//     token that supabase.functions.invoke() attaches automatically). We resolve
//     the user id from that token — a user can therefore only ever delete
//     themselves, never an arbitrary id passed in the body.
//   - Deleting the auth.users identity CASCADES to public.users and every child
//     row (group_members, proposal_votes, messages, saved_tips, matching_queue,
//     availability_slots, match_decline_reasons, …) via the ON DELETE CASCADE
//     FK on public.users.id → auth.users.id. This is the real fix over the old
//     client-side row-by-row delete, which left the auth identity orphaned.
//
// Called from the app via supabase.functions.invoke('delete-account').

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

// service_role client — bypasses RLS, can delete auth identities.
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // Resolve the caller from their own JWT — this is who gets deleted.
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ ok: false, error: 'missing bearer token' }, 401);
    }

    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    const uid = userData?.user?.id;
    if (userErr || !uid) {
      return json({ ok: false, error: 'invalid or expired session' }, 401);
    }

    // The group ids this user belongs to, captured BEFORE the delete so we can
    // clean up any groups left empty afterwards.
    const { data: memberships } = await admin
      .from('group_members')
      .select('group_id')
      .eq('user_id', uid);
    const affectedGroupIds = [...new Set((memberships ?? []).map((m) => m.group_id))];

    // One shot: deletes auth.users → cascades to public.users and all children.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw delErr;

    // Remove any groups that are now empty (all members gone).
    let cleanedGroups = 0;
    for (const gid of affectedGroupIds) {
      const { count } = await admin
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', gid);
      if ((count ?? 0) === 0) {
        await admin.from('groups').delete().eq('id', gid);
        cleanedGroups++;
      }
    }

    return json({ ok: true, deleted_user: uid, cleaned_groups: cleanedGroups });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}
