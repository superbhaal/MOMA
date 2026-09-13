# Publier un article Learn dans møma — contrat pour un agent

Ce fichier est destiné à être donné tel quel à un agent (Claude, ChatGPT) qui
rédige des articles pour møma et les publie dans Sanity. Il décrit ce qu'il
doit produire et comment le publier. Rien d'autre n'est nécessaire.

---

## Ce que tu publies

Un article n'est pas un document, mais **trois** : l'anglais, le français et
l'espagnol. C'est ce qui permet à chaque lectrice de lire dans sa langue, à un
« j'aime » de suivre le texte d'une langue à l'autre, et à un lien partagé de
s'ouvrir dans la bonne langue.

Les trois documents sont reliés par une convention d'identifiant :

| langue    | `_id`                  | `language` | `translationOf`        |
| --------- | ---------------------- | ---------- | ---------------------- |
| anglais   | `learn-<slug>`         | `en`       | *(absent)*             |
| français  | `learn-<slug>-fr`      | `fr`       | `learn-<slug>`         |
| espagnol  | `learn-<slug>-es`      | `es`       | `learn-<slug>`         |

Le `<slug>` est en anglais, en minuscules, mots séparés par des tirets, sans
accent : `four-month-sleep`, `pelvic-floor`, `cluster-feeding`.

**L'anglais est la source.** Traduis la prose — titre, chapô, accroche, corps,
points clés. Ne traduis pas les champs de classement (`category`, `babyStage`),
ni le nom de l'autrice, ni la source : l'application les traduit ou les affiche
telles quelles.

---

## Les champs

Obligatoires — un document sans eux est refusé à la saisie et s'affiche mal :

| champ          | type   | remarque                                              |
| -------------- | ------ | ----------------------------------------------------- |
| `_id`          | texte  | voir la convention ci-dessus                          |
| `_type`        | texte  | toujours `learnArticle`                               |
| `language`     | texte  | `en`, `fr` ou `es`                                    |
| `title`        | texte  | le titre, traduit                                     |
| `deck`         | texte  | une phrase sous le titre, traduite                    |
| `category`     | texte  | **en anglais**, une valeur de la liste fermée         |
| `babyStage`    | texte  | un code de la liste fermée                            |
| `author`       | texte  | identique dans les trois langues                      |
| `readMinutes`  | nombre | durée de lecture en minutes                           |
| `source`       | texte  | la référence, ex. `Pediatrics, 2023`                  |
| `publishedAt`  | texte  | date ISO 8601, ex. `2026-09-13T09:00:00Z`             |

Facultatifs mais recommandés : `translationOf` (obligatoire sur `fr` et `es`),
`authorTitle`, `lead`, `body`, `keyPoints`.

### `category` — six valeurs, pas une de plus

```
Sleep   Mind   Recovery   Nutrition   Feeding   Development
```

Toute autre valeur s'affichera en anglais brut dans une application française
ou espagnole : l'application ne sait traduire que ces six-là.

### `babyStage` — onze codes

```
T1   T2   T3          (grossesse, par trimestre)
0-4wks   1-3mo   3-6mo   6-12mo      (bébé)
1-2yr   2-3yr   3+yr                 (jeune enfant)
wellness                             (pour la mère, pas pour l'âge du bébé)
```

### `body` — le corps de l'article

Un tableau de blocs Portable Text. Chaque bloc a une `style` :
`normal` pour un paragraphe, `h2` pour un intertitre, `blockquote` pour une
citation mise en avant. Les `_key` doivent être uniques dans le document.

```json
{"_type":"block","_key":"b1","style":"normal",
 "children":[{"_type":"span","_key":"s1","text":"Le texte du paragraphe."}]}
```

### `keyPoints`

Un tableau de chaînes courtes, trois en général. Traduites.

---

## Comment publier

Un seul appel, qui crée ou remplace les trois documents ensemble. Si l'appel
échoue, rien n'est écrit — pas de demi-article en ligne.

```bash
curl -s -X POST \
  "https://5hfvgbis.api.sanity.io/v2021-06-07/data/mutate/preprod" \
  -H "Authorization: Bearer $SANITY_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @article.json
```

Le fichier `article.json` :

```json
{"mutations":[
  {"createOrReplace":{ ...le document anglais... }},
  {"createOrReplace":{ ...le document français... }},
  {"createOrReplace":{ ...le document espagnol... }}
]}
```

`createOrReplace` et non `create` : republier le même `<slug>` corrige
l'article au lieu d'en créer un second.

**Le dataset s'appelle `preprod`.** Il n'y a pas d'autre endroit où publier.
`dev` existe mais contient du contenu de test signé de médecins inventés — n'y
écris jamais.

---

## Vérifier après coup

La requête ci-dessous est exactement celle que fait l'application. Si l'article
n'y apparaît pas, il n'existe pas pour les lectrices, quoi qu'en dise Sanity.

```bash
curl -s -G "https://5hfvgbis.api.sanity.io/v2024-01-01/data/query/preprod" \
  --data-urlencode 'query=*[_type=="learnArticle" && coalesce(language,"en")=="fr"]{_id,title,translationOf}'
```

Remplace `"fr"` par `"en"` ou `"es"` pour contrôler les trois. Les trois
documents doivent répondre, et les deux traductions doivent porter le
`translationOf` de l'anglais.

---

## Le jeton

`SANITY_TOKEN` est un jeton d'API Sanity de rôle **Editor**. Il autorise
l'écriture sur tout le projet : traite-le comme un mot de passe. Il ne doit
jamais être écrit dans un fichier partagé, envoyé dans une conversation, ni
déposé dans un dépôt de code.
