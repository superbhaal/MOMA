# møma web

Static landing + auth callbacks. Hosted on `joinmoma.org`.

## Pages

| Path | Purpose |
|---|---|
| `/` | Coming-soon landing |
| `/auth/confirm` | Supabase email-confirmation Universal Link target. iOS opens the app directly when the AASA file is honoured; otherwise this page tries `moma://` as a fallback and shows an "Open møma" button. |
| `/.well-known/apple-app-site-association` | Apple AASA — registers `/auth/*` paths as Universal Links for the møma iOS app. **Replace `TEAMID_PLACEHOLDER`** with your Apple Developer Team ID once you enroll. |
| `/.well-known/assetlinks.json` | Android App Links. Replace the SHA-256 fingerprint with your release-keystore fingerprint (EAS prints it after a build). |

## Deploy (Vercel)

```bash
cd web
npx vercel --prod
```

Add `joinmoma.org` as a custom domain in the Vercel project settings → DNS records auto-suggested.

`vercel.json` makes sure the AASA file is served as `application/json` (Apple is strict about this).

## After first iOS standalone build

1. Get your Apple **Team ID** at https://developer.apple.com/account → Membership.
2. Replace `TEAMID_PLACEHOLDER` in `.well-known/apple-app-site-association` with that 10-char ID.
3. Re-deploy: `npx vercel --prod`.
4. Validate via: https://app-site-association.cdn-apple.com/a/v1/joinmoma.org

## After first Android build

1. EAS prints the release SHA-256 fingerprint after `eas build --platform android`.
2. Paste it into `.well-known/assetlinks.json`.
3. Re-deploy.

## Supabase config

- Authentication → URL Configuration → **Site URL**: `https://joinmoma.org/auth/confirm`
- **Redirect URLs allowlist**: `https://joinmoma.org/**`, `moma://**`
