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
Ce n'est pas un accident isolé : les deux registres sont installés. Trois voies :
 - **tout basculer en britannique** (mum/mums) — cohérent avec la bêta
   d'Amsterdam, où l'anglais de référence est européen ;
 - **tout basculer en américain** (color, neighborhood) — cohérent avec « moms »,
   qui est déjà le mot de la marque et apparaît 27 fois ;
 - **assumer le mélange** — « moms » comme mot de marque, orthographe
   britannique pour le reste. Défendable, mais c'est un choix à poser, pas un
   hasard.
Vérifié au passage : « practise » (verbe) / « practice » (nom) est correct en
britannique, ce n'est pas une incohérence.
