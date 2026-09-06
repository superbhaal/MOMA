# Sauvegardes des datasets Sanity

Exports NDJSON complets, pris avant chaque manipulation destructive.

- `dev-2026-09-06.ndjson` — le dataset qui s'appelait `production` jusqu'au
  2026-09-06, exporté juste avant sa suppression et son retour sous le nom
  `dev`. 56 lignes.

**Le compte ne tombe pas juste, et c'est normal.** L'export contient 56
documents, l'import n'en repose que 45 : les 10 `system.group` et le
`system.retention` sont refusés par l'importeur. Sanity les gère lui-même, par
dataset. Ne cherchez pas à les forcer.

Ré-importer :

    cd studio
    npx sanity dataset import seed/backups/<fichier>.ndjson <dataset> --replace

`--replace` écrase les documents de même `_id` et laisse le reste en place.
