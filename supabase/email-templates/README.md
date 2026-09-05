# Auth email templates

Paste these into **Authentication → Emails → Templates** on BOTH projects
(dev `rqesqrlr…`, pre-prod `uxpbekyl…`).

## Why they exist

Supabase's stock template is a bare heading, one sentence and a naked link. Our
very first reset email landed in Gmail's spam WITH the red "this message may be
dangerous" banner — the phishing classifier, not the spam filter. Three things
caused it, and two are fixed here:

1. **The link pointed at `<ref>.supabase.co` while the sender was joinmoma.org.**
   A sender/destination domain mismatch is one of the strongest phishing signals
   Gmail uses. These templates route through `{{ .SiteURL }}/auth/confirm`
   instead, which also makes the Universal Link open the app directly — and
   handleAuthCallback's PKCE branch already reads `token_hash` + `type`, so no
   app change was needed.
2. **The content had the exact shape of a phishing mail.** These carry the
   masthead, a sentence saying why the mail arrived, the expiry, and a footer
   saying what to do if it wasn't you.
3. Zero domain reputation — only time and volume fix that.

## Fonts

Google Fonts do not load in most mail clients, so the serif falls back to
Georgia. Don't add a <link> to fonts.googleapis.com: it is stripped by Gmail and
makes the mail look machine-generated to filters.

## Language

These are English. The trilingual version goes through the Send Email Hook
(`supabase/functions/send-auth-email`), which reads `users.locale`. Until that
hook is enabled these templates are what ships — and they remain the fallback if
the hook is ever turned off, so keep them in step.
