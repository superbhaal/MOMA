// send-auth-email — Supabase Send Email Hook.
//
// Replaces Supabase's built-in auth email sending so we can do two things it
// cannot: pick the language from users.locale, and route the link through
// joinmoma.org instead of <ref>.supabase.co.
//
// Configure at Authentication → Hooks → Send Email, pointing at this function.
// Needs two secrets: RESEND_API_KEY and SEND_EMAIL_HOOK_SECRET (generated in
// that same dashboard screen, stored with the "v1,whsec_" prefix).
//
// MUST be deployed with verify_jwt = false: GoTrue calls it with a standard
// webhook signature, not a JWT. Authentication IS the signature check below —
// without it anyone could make us send mail on the domain's good name.
//
// If this function errors, GoTrue does NOT fall back to its own templates: the
// email simply does not go out. That is why every failure path is loud in the
// logs, and why supabase/email-templates/*.html are kept in step as the manual
// fallback if the hook is ever turned off.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import {
  asLocale,
  localeFromLanguageName,
  renderEmail,
  subjectFor,
  type Locale,
} from '../_shared/auth-email.ts';

const RESEND_URL = 'https://api.resend.com/emails';
const FROM = 'møma <hello@joinmoma.org>';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

type HookPayload = {
  user: { id: string; email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

/**
 * Her language, by the same chain the app uses minus the parts only a phone
 * knows: the explicit choice first, then the onboarding answer, then English.
 * A signup email is the one case where NEITHER exists yet — the public.users
 * row is written after the quiz — so new signups get English and everything
 * afterwards is in her language. Living with that is better than guessing from
 * an Accept-Language header we are not given.
 */
async function localeFor(userId: string): Promise<Locale> {
  const { data, error } = await supabase
    .from('users')
    .select('locale, primary_language')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return 'en';
  if (data.locale) return asLocale(data.locale);
  return localeFromLanguageName(data.primary_language) ?? 'en';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!secret || !resendKey) {
    console.error('[send-auth-email] missing SEND_EMAIL_HOOK_SECRET or RESEND_API_KEY');
    return json({ error: { http_code: 500, message: 'not configured' } }, 500);
  }

  const raw = await req.text();

  let payload: HookPayload;
  try {
    const wh = new Webhook(secret.replace('v1,whsec_', ''));
    payload = wh.verify(raw, Object.fromEntries(req.headers)) as HookPayload;
  } catch (e) {
    // Not ours to send. Refusing loudly beats sending on an unverified request.
    console.error('[send-auth-email] signature rejected', String(e));
    return json({ error: { http_code: 401, message: 'invalid signature' } }, 401);
  }

  try {
    const { user, email_data: d } = payload;
    const locale = await localeFor(user.id);

    // site_url comes from the project's Site URL, which is joinmoma.org on both
    // projects — so the link's domain matches the sender's. redirect_to is
    // carried through so a link that asked for a particular landing still gets
    // it once the token is verified.
    const base = (d.site_url || 'https://joinmoma.org').replace(/\/+$/, '');
    const params = new URLSearchParams({
      token_hash: d.token_hash,
      type: d.email_action_type,
    });
    if (d.redirect_to) params.set('redirect_to', d.redirect_to);
    const url = `${base}/auth/confirm?${params.toString()}`;

    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        subject: subjectFor(locale, d.email_action_type),
        html: renderEmail(locale, d.email_action_type, url),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[send-auth-email] resend rejected', res.status, body.slice(0, 300));
      return json({ error: { http_code: res.status, message: 'send failed' } }, 500);
    }

    console.log(`[send-auth-email] sent ${d.email_action_type} in ${locale}`);
    return json({});
  } catch (e) {
    console.error('[send-auth-email] failed', String(e));
    return json({ error: { http_code: 500, message: String(e) } }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
