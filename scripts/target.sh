#!/usr/bin/env bash
# Switch which Supabase project the NEXT local build will talk to.
#
# This exists because of a gap that is easy to miss: an Xcode archive does not
# read EAS environments. It runs `expo export:embed` locally, which reads
# .env.local. So the EAS `preview` environment — correct as it is — has no
# effect whatsoever on the builds we actually ship today.
#
# Only the two Supabase lines are rewritten. Everything else in .env.local
# (Sanity project, dataset, API token) is shared between environments and is
# left exactly as it was.
#
#   ./scripts/target.sh dev       → the sandbox, where bug-hunters break things
#   ./scripts/target.sh preprod   → where real mothers will be
#   ./scripts/target.sh           → says which one is active, changes nothing
set -euo pipefail
cd "$(dirname "$0")/.."

DEV_REF=rqesqrlrlxetnvihpoxt
PRE_REF=uxpbekyllfagnxqguppz

current() {
  local url; url=$(grep -oE '^EXPO_PUBLIC_SUPABASE_URL=.*' .env.local | cut -d= -f2-)
  case "$url" in
    *$DEV_REF*) echo "dev" ;;
    *$PRE_REF*) echo "preprod" ;;
    *)          echo "inconnu" ;;
  esac
}

if [ $# -eq 0 ]; then
  echo "cible actuelle : $(current)"
  grep -oE '^EXPO_PUBLIC_SUPABASE_URL=.*' .env.local | sed 's/^/  /'
  exit 0
fi

case "$1" in
  dev)     REF=$DEV_REF; LABEL="DEV — bac à sable" ;;
  preprod) REF=$PRE_REF; LABEL="PRÉ-PROD — vraies utilisatrices" ;;
  *) echo "usage: $0 [dev|preprod]" >&2; exit 1 ;;
esac

# The publishable key is fetched rather than stored here, so this script never
# holds a credential and never goes stale when a key is rotated.
KEY=$(npx --yes supabase projects api-keys --project-ref "$REF" 2>/dev/null \
      | grep -oE 'sb_publishable_[A-Za-z0-9_-]+' | head -1)
[ -z "$KEY" ] && { echo "impossible de récupérer la clé publiable de $REF" >&2; exit 1; }

tmp=$(mktemp)
sed -e "s|^EXPO_PUBLIC_SUPABASE_URL=.*|EXPO_PUBLIC_SUPABASE_URL=https://$REF.supabase.co|" \
    -e "s|^EXPO_PUBLIC_SUPABASE_ANON_KEY=.*|EXPO_PUBLIC_SUPABASE_ANON_KEY=$KEY|" \
    .env.local > "$tmp"
mv "$tmp" .env.local

echo
echo "  ┌────────────────────────────────────────────────┐"
printf "  │  PROCHAIN BUILD →  %-27s │\n" "$LABEL"
echo "  └────────────────────────────────────────────────┘"
echo
echo "  https://$REF.supabase.co"
echo
echo "  Le bundle JS est lu au moment de l'archivage, pas maintenant :"
echo "  relance Metro (ou archive) pour que ça prenne effet."
