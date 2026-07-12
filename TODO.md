# møma — Manual Setup TODO

Tout ce qui ne peut pas se faire depuis le code et qui reste à ta charge.

---

## 0. Domaine + Universal Links (`joinmoma.org`)

Pour un flow de confirmation email propre (lien dans le mail → ouvre l'app direct, pas de prompt browser).

### Étape A — Domaine + hosting (15 min)
- [ ] Acheter `joinmoma.org` (Cloudflare Registrar, Porkbun, Namecheap…)
- [ ] Créer un projet Vercel (ou Cloudflare Pages) connecté au dossier `web/` du repo
- [ ] Ajouter `joinmoma.org` comme custom domain → suivre les instructions DNS
- [ ] Vérifier que `https://joinmoma.org/.well-known/apple-app-site-association` répond avec **Content-Type: application/json** (pas `text/plain`)

### Étape B — Apple Team ID (après inscription Apple Developer)
- [ ] S'inscrire à Apple Developer Program (99 $/an)
- [ ] Récupérer le **Team ID** (10 chars) sur [developer.apple.com → Membership](https://developer.apple.com/account)
- [ ] Remplacer `TEAMID_PLACEHOLDER` dans `web/.well-known/apple-app-site-association` par ton Team ID
- [ ] Re-déployer Vercel
- [ ] Valider que Apple a bien indexé l'AASA : ouvrir `https://app-site-association.cdn-apple.com/a/v1/joinmoma.org`

### Étape C — Android (au premier `eas build --platform android`)
- [ ] EAS imprime un **SHA-256 fingerprint** de la clé de release
- [ ] Le coller dans `web/.well-known/assetlinks.json`
- [ ] Re-déployer

### Étape D — Supabase
- [ ] [Auth → URL Configuration](https://supabase.com/dashboard/project/rqesqrlrlxetnvihpoxt/auth/url-configuration) → **Site URL** : `https://joinmoma.org/auth/confirm`
- [ ] **Redirect URLs allowlist** : `https://joinmoma.org/**` et `moma://**`

### Étape E — Build de l'app (pour activer Universal Links)
- [ ] `npx expo install expo-dev-client`
- [ ] `eas build --profile development --platform ios` (puis android)
- [ ] Installer l'IPA → tester l'email confirmation

Une fois Étapes A + D faites, le flow de confirmation marche déjà via fallback browser. Étapes B + E sont pour avoir l'expérience complète "tap → ouvre l'app sans détour".

---

## 1. Auth providers (Supabase Dashboard)

### Google SSO
- [ ] Google Cloud Console → créer projet `moma`
- [ ] OAuth consent screen → External → app name "møma", support email, dev email
- [ ] Credentials → Create credentials → OAuth client ID → **Web application**
  - Authorized redirect URI : `https://rqesqrlrlxetnvihpoxt.supabase.co/auth/v1/callback`
  - Récupérer **Client ID** + **Client secret**
- [ ] [Supabase → Auth → Providers → Google](https://supabase.com/dashboard/project/rqesqrlrlxetnvihpoxt/auth/providers?provider=Google) : ON, paste credentials, save

### Apple Sign-In
- [ ] Vérifier que le provider Apple est enabled dans [Supabase → Auth → Providers → Apple](https://supabase.com/dashboard/project/rqesqrlrlxetnvihpoxt/auth/providers?provider=Apple)
- [ ] Pour test sur device iOS uniquement (le simulator marche aussi en SDK 17+)

### Sécurité Auth
- [ ] [Supabase → Auth → Settings](https://supabase.com/dashboard/project/rqesqrlrlxetnvihpoxt/auth/policies) → activer **Leaked Password Protection** (HaveIBeenPwned)
- [ ] Vérifier que **Confirm email** est OFF en dev (sinon signup bloqué jusqu'à confirmation)

---

## 2. Edge functions — scheduling (cron)

[Dashboard → Edge Functions](https://supabase.com/dashboard/project/rqesqrlrlxetnvihpoxt/functions) → onglet Cron sur chaque function :

- [ ] `match-users` → `0 2 * * *` (nightly 2am UTC)
- [ ] `expire-proposals` → `0 * * * *` (toutes les heures)
- [ ] `seed-next-proposal` → `0 * * * *` (toutes les heures)
- [ ] `availability-prompt` → `0 18 * * 0` (dimanche 18h)
- [ ] `inactive-group-check` → `0 9 * * 1` (lundi 9h)

---

## 3. Sanity CMS (Learn tab)

- [ ] Aller sur le Sanity Studio du projet `5hfvgbis` (ou en créer un nouveau si pas encore fait)
- [ ] Créer 3 schemas avec les champs documentés dans `CLAUDE.md` :
  - `learnArticle` (Read · long-form)
  - `learnReel` (Watch · IG/TikTok)
  - `learnRecommendation` (Recco · places/products/classes)
- [ ] Publier au moins 3-5 docs de chaque type pour tester le feed
- [ ] Sans contenu, le Learn tab affiche "nothing here yet"

---

## 4. Stores (avant de publier)

- [ ] Apple Developer Program — **99 $/an** (App Store)
- [ ] Google Play Developer — **25 $ one-time** (Play Store)
- [ ] Remplacer les placeholders dans `assets/images/` :
  - `icon.png` (1024x1024)
  - `splash-icon.png`
  - `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`
  - `favicon.png`

---

## 5. Code gaps connus (à faire quand tu veux)

### Push notifications
- [ ] Brancher `registerForPushNotifications()` (déjà dans `lib/notifications.ts`) après login
  - Endroit : `hooks/useAuth.ts` → après `fetchProfile()`
  - UPDATE `users.expo_push_token` avec le token retourné
  - Sans ça, les 5 edge functions qui pushent ne touchent personne

### Onboarding ergonomie
- [ ] Remplacer `TextInput YYYY-MM-DD` du baby DOB par un vrai date picker
  - Recommandé : `@react-native-community/datetimepicker`
- [ ] Pré-remplir `display_name` depuis Google `user_metadata.full_name` après `exchangeCodeForSession` (~5 lignes dans `signInWithGoogle`)

### Chat polish
- [ ] Vraie recherche de lieux dans `PlacePicker` (5 suggestions Amsterdam hardcodées)
  - Recommandé : Google Places API ou Mapbox Places (~5 €/mois)
- [ ] Rendering visuel des place attachments dans `ChatBubble` (cards spécifiques au lieu d'afficher le `name` en texte)
- [ ] Sheet "RSVP undo" sur `MeetupBanner` (Just remove me / Suggest a time) au lieu du toggle going/maybe actuel
- [ ] Action sheet groupe (••• → Mute / Report / Leave) sur l'écran group detail
- [ ] `PastMeetupSummary` inline dans l'historique chat avec quick actions (Save the place / Share a tip)

### Matching
- [ ] Per-member `matchNote` calculé dans `match-users` edge function et stocké quelque part (pour l'instant `GroupPreviewCard.matchNote` est `undefined`)
- [ ] Vraie distance lat/lng dans `geoCompatible()` (utilise neighbourhood comme proxy)
- [ ] Notif push après match (la function crée le groupe + flippe la queue, mais n'envoie pas de push)

### Home/unread
- [ ] Read-receipts (table `message_reads` ou colonne `last_read_at` sur `group_members`) → vraie valeur de `unread_count`

---

## 6. Operational

- [ ] Activer un backup quotidien Postgres (Pro plan) avant de prendre des vrais users
- [ ] Surveiller les advisor warnings après chaque migration (12 warnings `pg_graphql_anon_table_exposed` connus — décider si OK ou révoquer SELECT à `anon` table par table)
- [ ] Penser à upgrade Supabase au plan Pro (~25 $/mois) avant la phase de test avec users actifs — le free tier pause le projet après 1 semaine d'inactivité

---

## Cleanup

- [ ] Nettoyer les `console.log` de debug ajoutés pendant le fix du flow login SSO :
  - `[AuthGate] ...` dans `app/_layout.tsx`
  - `[Login] handleApple ...` / `[Login] setError` dans `app/(auth)/login.tsx`
  - `[Apple] ...` dans `hooks/useAuth.ts`
