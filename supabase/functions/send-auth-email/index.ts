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

  // The dashboard shows the secret as `v1,whsec_<base64>` but people paste it in
  // several shapes, and standardwebhooks wants the bare base64 — anything else
  // dies as "Base64Coder: incorrect characters for decoding", which says nothing
  // about what to fix. Normalise, and if it still fails say WHY in terms that
  // point at the secret without ever printing it.
  // How Supabase encodes this secret is not documented and their own example
  // does not survive contact with it: the dashboard hands out
  // `v1,whsec_<base64url>`, standardwebhooks decodes standard base64, and the
  // two disagree on '-' and '_'. Converting the alphabet got us past
  // "Base64Coder: incorrect characters" and straight into "No matching
  // signature", which means the bytes were still not the ones GoTrue signed
  // with.
  //
  // So stop guessing and try the plausible readings, in order, and say which
  // one worked. Whichever it is, it is stable — the log line below is what a
  // future reader needs when this breaks again.
  const bare = secret.trim().replace(/^v1,/, '').replace(/^whsec_/, '').trim();
  const candidates: { name: string; key: string }[] = [
    // base64url decoded to the same bytes standard base64 would give
    { name: 'base64url->base64', key: bare.replace(/-/g, '+').replace(/_/g, '/') },
    // already standard base64
    { name: 'base64-as-is', key: bare },
    // the string itself IS the key, so re-encode it for a library that decodes
    { name: 'raw-string-key', key: btoa(bare) },
    // the key includes the prefix
    { name: 'raw-with-prefix', key: btoa(secret.trim()) },
  ];

  let payload: HookPayload | null = null;
  const failures: string[] = [];
  for (const c of candidates) {
    try {
      payload = new Webhook(c.key).verify(raw, Object.fromEntries(req.headers)) as HookPayload;
      console.log(`[send-auth-email] secret interpreted as ${c.name}`);
      break;
    } catch (e) {
      failures.push(`${c.name}: ${String(e).slice(0, 60)}`);
    }
  }

  if (!payload) {
    console.error(
      '[send-auth-email] no reading of SEND_EMAIL_HOOK_SECRET verifies the ' +
        'signature. length=' + bare.length + ' — check it is THIS project\'s hook ' +
        'secret (dev and pre-prod each have their own). Tried: ' + failures.join(' | '),
    );
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
        // Trimmed: a stray newline from a dashboard paste makes the header
        // malformed and Resend answers 401 "API key is invalid", which reads
        // like the key is wrong rather than merely dirty.
        Authorization: `Bearer ${resendKey.trim()}`,
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
      const k = resendKey.trim();
      console.error(
        '[send-auth-email] resend rejected', res.status, body.slice(0, 200),
        `| key len=${k.length} startsWithRe_=${k.startsWith('re_')} hadWhitespace=${k !== resendKey}`,
      );
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
