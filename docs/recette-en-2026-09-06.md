# Recette — passe anglaise

Simulateur en `en-US`, 2026-09-06. L'anglais est la langue source : on n'y
attend pas de manques de traduction, mais des problèmes de mise en page, de
cohérence de ton, et des tournures que personne n'a relues depuis qu'elles ont
été écrites.

## Défauts

**1. La langue d'une utilisatrice survit à sa déconnexion.** (corrigé)
`applyProfileLanguage` écrit `users.locale` dans le stockage local **de la même
façon qu'un choix fait dans les réglages** — pour éviter que l'app clignote dans
la langue du système au démarrage. Mais rien ne l'effaçait à la sortie. Constaté
en direct : compte espagnol supprimé, téléphone en anglais, personne de
connectée — et l'écran d'accueil affichait toujours « CADA UNA TRAE ALGO A LA
MESA ». La clé `moma.locale` valait bien `es` dans `AsyncStorage`.
Premier correctif insuffisant, et je l'ai vu en le testant : effacer la clé à la
déconnexion aurait aussi jeté une langue **délibérément choisie dans les
réglages**. Le code ne distinguait pas les deux — tout passait par `setLocale`.
Correctif retenu : **deux clés**.
 - `moma.locale` — son choix dans les réglages. Lui appartient, survit à la
   déconnexion.
 - `moma.locale.session` — la langue adoptée depuis `users.locale`, pour éviter
   le clignotement au démarrage. C'est un cache de qui est connectée : il meurt
   avec la session.
Vérifié à l'écran : français choisi dans les réglages → déconnexion → l'écran
d'accueil reste en français, et le stockage contient `moma.locale: 'fr'`,
`moma.locale.session: absent`.

**2. « your name is missing » quand seul le nom de famille manque.** Ma propre
ligne d'aide, ajoutée aujourd'hui : elle regroupe prénom et nom sous un seul
message. Avec « Hannah » saisi et le nom vide, elle dit « votre nom manque », ce
qui laisse chercher. À séparer en deux messages. Vaut pour les 3 langues.

**3. L'exemple d'adresse est parisien dans une app Amsterdam-first.**
« e.g. Rue de Rivoli, Paris » en anglais, « calle de Rivoli, París » en
espagnol. La bêta se lance à Amsterdam ; l'exemple devrait y ressembler.
Cosmétique, mais c'est le premier repère géographique que voit l'utilisatrice.

**4. L'anglais mélange deux variantes — à trancher, pas à corriger d'office.**
27 occurrences de « mom / moms » (américain ; le britannique dit « mum ») contre
9 tournures d'orthographe britannique (« colour » ×3, « neighbourhood » ×4,
« cancelled », « practise »). Zéro « mum ».
**Tranché par Simon : on passe en américain.** Neuf chaînes converties —
colour → color (3), neighbourhood → neighborhood (4), cancelled → canceled,
practise → practice. Zéro forme britannique restante dans `en.json`. Les
32 « moms » étaient déjà américains et deviennent cohérents avec le reste.
Vérifié à l'écran : « Your color » dans les préférences de rapprochement.

Restent britanniques, volontairement : la colonne `users.neighbourhood` et les
identifiants de code (`PROFILE_COLOUR_SWATCHES`, variables locales). Ce ne sont
pas des chaînes affichées ; les renommer serait une migration pour zéro
bénéfice utilisateur.
Vérifié au passage : « practise » (verbe) / « practice » (nom) est correct en
britannique, ce n'est pas une incohérence.
