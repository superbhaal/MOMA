# Recette — passe espagnole

Simulateur en `es-ES`, 2026-09-06. Parcours complet d'une nouvelle utilisatrice :
inscription → confirmation e-mail → onboarding 5 étapes → appariement réel
(fonction `match-users`) → aperçu → groupe → chat → Descubrir → Yo → réglages.

12 défauts, plus une question de registre. Les correctifs de la passe française
ont été revérifiés en espagnol et tiennent tous.

**État au 2026-09-06 (soir).** Tout est corrigé sauf ce qui relevait d'un choix
et a été tranché autrement — voir « Décisions » en fin de document.

## Ce qui va bien

L'espagnol est de bonne tenue partout où il existe : `¿` et `¡` ouvrants,
accents corrects, « Cuéntanos un poco sobre ti », « rompe el hielo con una de
estas ». Ce n'est pas du traduit, c'est de l'écrit. Le sélecteur de date natif,
le sélecteur de photos et le contenu Sanity sortent tous en espagnol.

## Correctifs français confirmés en espagnol

- Compteur d'étapes continu : « PASO 1 DE 5 » → « PASO 5 DE 5 ».
- Décompte de l'aperçu : « Encontramos a tus **tres** madres » pour trois fiches.
- Chips d'ouverture en espagnol (elles partaient en anglais).
- Aucun bouton « Mensaje » sur son propre profil.
- `users.locale` = `es` écrit à la fin de l'onboarding.
- Dates longues correctes : « 1 de septiembre de 2026 ».

---

## Défauts

## Critiques

**1. L'e-mail de confirmation d'inscription part toujours en anglais.**
Toutes langues confondues, depuis toujours. `localeFor()` dans
`send-auth-email` lit `users.locale` / `users.primary_language`, mais à
l'inscription la ligne `users` n'existe pas encore — elle est créée pendant
l'onboarding. Repli systématique sur `en`. Vérifié dans les journaux : tous les
`sent signup in en`, alors que les `recovery` sortent bien dans la bonne langue.
C'est le tout premier message reçu, celui qui décide si l'inscription aboutit.
Correctif : passer la langue dans `signUp({ options: { data: { locale } } })`
et la lire depuis `user.user_metadata` dans le hook.

## Mineurs

**2. Badge « BÊTA »** codé en dur avec l'accent circonflexe français, affiché
tel quel en espagnol et en anglais. `components/ui/EnvBadge.tsx:35`.

**3. « REENVIAR EN 58S »** — en espagnol l'unité se sépare du nombre : « 58 s ».
Même remarque pour le français si le format est partagé.

**4. Les explications d'autorisation iOS restent en anglais.** Vérifié à
l'écran : le dialogue photos affiche son titre en espagnol (« "møma" quiere
acceder a tus fotos », fourni par iOS) et juste en dessous, notre phrase à
nous : « møma needs your photos so you can add a picture to your profile and
to what you bring to the table. » Les traductions existent
(`ios/localization/{fr,es}.lproj/InfoPlist.strings`) mais ne sont pas rattachées
à la cible Xcode, donc c'est l'anglais d'`Info.plist` qui sort. Passé de
« différé » à « à faire » : c'est une phrase anglaise au moment précis où l'on
demande l'accès aux photos.

**5. Le bouton désactivé ne dit pas ce qui manque.** Tous les champs remplis,
« CONTINUAR AL CUESTIONARIO » restait inerte parce que la photo manquait. Rien
ne le signale ; on peut relire le formulaire longtemps. Vaut pour les 3 langues.

**6. Le nom du groupe est fabriqué dans une langue figée, et mélangée.**
L'apparieur a produit « Madrid Table n°1 » pour un groupe entièrement espagnol :
« Table » est anglais, « n° » est l'abréviation française. En espagnol ce serait
« Mesa n.º 1 ». Le nom vient de la fonction Postgres `group_city_table_name`,
donc il est figé au moment de la création et le même pour tout le monde — un
groupe mixte n'a de toute façon pas de langue unique. À trancher : soit un nom
neutre (« Madrid · 1 »), soit un nom traduit à l'affichage plutôt que stocké.
Le même souci existait déjà en français (« Paris Table n°1 »), je ne l'avais pas
relevé.

**7. La barre de progression passe sous le badge BÊTA** à l'étape 5 sur 5, quand
elle atteint sa pleine largeur.

**8. L'intitulé de semaine perd le mois de départ quand la semaine est à
cheval.** Affiché : « SEMANA DEL 31 AL 6 DE SEPTIEMBRE » — la semaine va du
31 **août** au 6 septembre, mais un seul mois est passé au libellé
(`busy.weekOf` reçoit `from`, `to`, `month`), donc on lit « 31 septembre », qui
n'existe pas. Vaut pour les 3 langues : `WEEK OF 31–6 SEPTEMBER`,
`SEMAINE DU 31 AU 6 SEPTEMBRE`. `app/group/[groupId]/busy.tsx:184`.

**9. Les plages horaires sont en horaire 12 h, en dur.** `busy.tsx:19-22`
code `'7–12'`, `'12–5'`, `'5–9'` comme constantes. En espagnol comme en
français on compte en 24 h : « 12–17 » et « 17–21 ». « 12–5 » se lit
littéralement comme « de midi à cinq heures du matin ».

## Critique (remonté par Simon depuis sa boîte mail)

**10. L'e-mail « groupe formé » est à moitié traduit.** Sujet
« Your group is ready » et pied « Open møma to meet your group. » codés en dur
en anglais dans `match-users/index.ts:280-281`, autour d'un corps qui, lui, est
bien localisé (« Te juntamos con 3 madres en Madrid… »). Résultat : un e-mail
espagnol avec un sujet et une chute en anglais.
Le correctif est petit : `sendMatchEmail(to, body)` ne reçoit pas la langue
alors que l'appelant l'a déjà ; `push-i18n` contient déjà `matchTitle` traduit
dans les 3 langues (« Tu grupo está listo », « Votre groupe est prêt »). Il ne
manque qu'une clé pour la ligne d'appel à l'action.

**11. Le même e-mail n'a aucune mise en forme.** Il part en `text:` brut —
pas de `html:`, donc pas d'en-tête møma, pas de bouton, pas de typographie,
rien. Les e-mails d'authentification ont pourtant déjà un gabarit maison
(`_shared/auth-email.ts`, tables + police de la marque) qui n'est utilisé que
par eux. À reprendre pour l'e-mail de groupe, avec le sujet et l'appel à
l'action localisés (défaut 10) — les trois se corrigent d'un coup.

**À trancher (pas un défaut) :** la formation de groupe part en push **et** en
e-mail, parce que `notif_email` vaut `true` par défaut (migration 022). Les deux
canaux se déclenchent ensemble. À confirmer que c'est voulu pour cet événement.

## Registre : trois chaînes basculent en *vosotros*

Le reste de l'app tutoie (**tú**, 80 occurrences, zéro *usted*), ce qui est
universel. Mais trois chaînes emploient *vosotros* — la 2ᵉ personne du pluriel
d'Espagne, qui sonne nettement étrangère en Amérique latine. Deux d'entre elles
sont des messages **envoyés**, pas des libellés.

| Clé | Actuel | Proposition |
|---|---|---|
| `grp.opener1` | hola a todas — con ganas de **conoceros** | hola a todas — qué ganas de **conocernos** |
| `grp.opener2` | ¿**vosotras dormís**? (o no) | ¿qué tal el sueño por aquí? (o la falta de él) |
| `me.leaveConfirmBlurb` | también se va **vuestra** conversación — … los sitios que **compartisteis** | también se va toda la conversación del grupo — mensajes, fotos, los sitios compartidos |
| `preview.bothSpeak` | Las dos **habláis** {{language}}. | Las dos **hablan** {{language}}. |

Les propositions contournent la personne plutôt que de choisir un camp : elles
se lisent naturellement à Madrid comme à Bogotá. (`misc.addressPlaceholder`
était un faux positif de ma détection — « París » finit en *ís*.)

**12. « Bebé nacido el 1 sept » — il manque le « de ».** En espagnol la date
s'écrit « el 1 **de** septiembre ». La clé `me.bornOn` colle « el {{date}} » à
un `toLocaleDateString` court qui rend « 1 sept ». Deux issues : demander un
format long au formateur, ou intégrer le « de » dans la clé. Le français
(« Bébé né le 1 sept ») est correct tel quel — c'est une différence de langue,
pas un bug partagé. `lib/babyAge.ts:46`.

---

## Décisions de Simon

**Le nom de groupe reste « Madrid Table n°1 ».** Assumé comme un nom de marque
plutôt qu'une phrase à traduire : « Table » porte la métaphore du produit, et un
groupe multilingue n'a de toute façon pas *une* langue. Le défaut 6 est donc
clos sans changement de code.

**Push + e-mail sur la formation de groupe : les deux restent.** Mais l'e-mail
devait être mis en forme comme les autres — fait (défauts 10 et 11).

**Bouton désactivé : une ligne discrète.** Grise, sous le bouton, nommant ce qui
manque, sans icône ni rouge. Vérifié à l'écran : « falta la foto de perfil ».

## État des correctifs

| # | Sujet | État |
|---|---|---|
| 1 | E-mail d'inscription toujours en anglais | corrigé — la langue passe par `user_metadata` à l'inscription |
| 2 | Badge « BÊTA » avec accent français | corrigé — vérifié à l'écran |
| 3 | « REENVIAR EN 58S » | non traité — convention typographique mineure |
| 4 | Autorisations iOS en anglais | corrigé — plugin `withLocalizedPermissions`, sources dans `localization/` à la racine |
| 5 | Bouton désactivé muet | corrigé — vérifié à l'écran |
| 6 | Nom de groupe mixte | clos par décision (voir ci-dessus) |
| 7 | Barre de progression sous le badge | non traité — chevauchement mineur à l'étape 5/5 |
| 8 | Semaine à cheval : « 31 septiembre » | corrigé — le mois de départ est nommé quand il diffère |
| 9 | Plages horaires en 12 h | corrigé — 24 h en fr et es, depuis le fichier de langue |
| 10 | E-mail de groupe à moitié traduit | corrigé |
| 11 | E-mail de groupe sans mise en forme | corrigé — coquille partagée `_shared/email-shell.ts` |
| 12 | « Bebé nacido el 1 sept » | **retiré** — c'est la forme abrégée d'Intl pour es-ES |
| — | Registre *vosotros* | corrigé — zéro forme restante, on tutoie partout |
| — | « Next up: languages » (trouvé en vérifiant) | corrigé — le hook rendait des libellés anglais en dur |

## Une leçon d'infrastructure, payée cher

Les traductions d'autorisations vivaient dans `ios/localization/`. Deux erreurs
dans ce seul choix de chemin :

1. **`ios/` est gitignoré.** `git add -A` ne les a donc jamais prises. Un commit
   antérieur les annonçait comme ajoutées — c'était faux, elles n'existaient que
   sur un disque.
2. **`expo prebuild --clean` efface `ios/` en entier.** C'est comme ça que la
   première série a disparu, au moment précis où j'essayais de la câbler.

La règle qui en sort, écrite dans `localization/README.md` : *ce que le build
consomme ne doit jamais vivre dans le répertoire que le build régénère.*

Le plugin, lui, a bien fait son travail : il a refusé de compiler plutôt que de
livrer l'anglais en silence. C'est le garde-fou qui a rendu la perte visible
tout de suite au lieu de la laisser filer jusqu'en production.
