#!/usr/bin/env bash
# Promote the backend from dev to pre-prod: schema, then functions, then proof.
#
# What this does NOT do, on purpose: it never copies data. Pre-prod exists so
# real mothers meet a clean database, not a copy of the sandbox where the
# bug-hunters have been breaking things.
#
#   ./scripts/promote.sh            → dry run, shows what would change
#   ./scripts/promote.sh --apply    → does it
#
# A limitation worth knowing: the CLI cannot reach the DEV project at all —
# neither `db query` nor `db push`, both fail with
# LegacyDbConfigLoginRoleStatusError ("permission denied to alter role"). It
# works fine against pre-prod. So this script only ever talks to pre-prod, and
# the dev side of any comparison has to be done through the MCP tools or the
# dashboard SQL editor. Migrations to dev go the same way.
set -euo pipefail
cd "$(dirname "$0")/.."

DEV_REF=rqesqrlrlxetnvihpoxt   # unreachable from the CLI, see note above
PRE_REF=uxpbekyllfagnxqguppz
APPLY=${1:-}

cat > /tmp/_sig.sql <<'SQL'
select
 (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') as tables,
 (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public') as fonctions,
 (select count(*) from pg_policies where schemaname='public') as politiques,
 (select count(*) from information_schema.columns where table_schema='public') as colonnes;
SQL
cat > /tmp/_data.sql <<'SQL'
select (select count(*) from auth.users) as comptes,
       (select count(*) from public.groups) as groupes,
       (select count(*) from public.messages) as messages;
SQL

ask() { npx --yes supabase db query --linked -f "$1" 2>/dev/null \
  | python3 -c "import sys,json,re;m=re.search(r'\{.*\}',sys.stdin.read(),re.S);d=json.loads(m.group(0)) if m else {};print(json.dumps(d.get('rows',[{}])[0],ensure_ascii=False))"; }

echo "── 1. migrations en attente sur la pré-prod ──"
npx --yes supabase link --project-ref "$PRE_REF" >/dev/null 2>&1
if [ "$APPLY" = "--apply" ]; then
  npx --yes supabase db push 2>&1 | grep -E "Applying|up to date|error" | sed 's/^/  /' || true
else
  npx --yes supabase db push --dry-run 2>&1 | grep -oE '"message":"[^"]*"|^ •.*' | sed 's/^/  /' || true
fi

echo
echo "── 2. fonctions edge ──"
FNS=$(ls -d supabase/functions/*/ | grep -v _shared | xargs -n1 basename)
if [ "$APPLY" = "--apply" ]; then
  for f in $FNS; do
    printf "  %-26s " "$f"
    extra=""; [ "$f" = "admin-api" ] && extra="--no-verify-jwt"
    npx --yes supabase functions deploy "$f" $extra 2>&1 | grep -oE '"message":"[^"]*"' | head -1
  done
else
  echo "  $(echo "$FNS" | wc -w | tr -d ' ') fonctions seraient redéployées"
fi

echo
echo "── 3. schéma de la pré-prod ──"
echo "  $(ask /tmp/_sig.sql)"
echo "  (référence dev au 2026-08-29 : tables=15 fonctions=21 politiques=35 colonnes=146)"

echo
echo "── 4. contenu de la pré-prod ──"
echo "  $(ask /tmp/_data.sql)"

npx --yes supabase link --project-ref "$DEV_REF" >/dev/null 2>&1
echo
echo "CLI rebranché sur le dev."
[ "$APPLY" != "--apply" ] && echo "Essai à blanc — relance avec --apply pour exécuter."
exit 0
