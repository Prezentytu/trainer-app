#!/usr/bin/env bash
# Deploy frontu z prebuilt (Vercel CLI). Target: dev | prod.
# Vercel ma własny słownik: `prod` → --environment=production / --prod.
# `dev` → wbudowane Preview (Hobby). Custom Environment `dev` jest płatne (Pro).
# Development (Vercel) = tylko lokalny `vercel pull` / `vercel dev` — nie hostujemy tam.
# Wymaga: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID. Uruchamiaj z roota repo.
set -euo pipefail

TARGET="${1:-}"
if [[ "$TARGET" != "dev" && "$TARGET" != "prod" ]]; then
  echo "Użycie: $0 dev|prod" >&2
  exit 2
fi

# Sekrety z UI często mają spację / nową linię — CLI wtedy nie znajduje projektu.
VERCEL_TOKEN="${VERCEL_TOKEN//[$'\t\r\n ']}"
VERCEL_ORG_ID="${VERCEL_ORG_ID//[$'\t\r\n ']}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID//[$'\t\r\n ']}"

if [[ -z "${VERCEL_TOKEN}" || -z "${VERCEL_ORG_ID}" || -z "${VERCEL_PROJECT_ID}" ]]; then
  echo "::error::Brak VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID."
  exit 1
fi

echo "Vercel: token=${#VERCEL_TOKEN} znaków, org=${VERCEL_ORG_ID:0:5}… (${#VERCEL_ORG_ID}), project=${VERCEL_PROJECT_ID:0:4}… (${#VERCEL_PROJECT_ID})"
if [[ "$VERCEL_PROJECT_ID" != prj_* ]]; then
  echo "::error::VERCEL_PROJECT_ID ma zaczynać się od prj_ (Settings → General → Project ID). Nie wklejaj Team ID."
  exit 1
fi
if [[ "$VERCEL_ORG_ID" == prj_* ]]; then
  echo "::error::VERCEL_ORG_ID to Team ID (team_…), nie Project ID."
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Projekt Vercel ma Root Directory = apps/web. CLI z apps/web szuka apps/web/apps/web/package.json.
cd "$ROOT"

mkdir -p .vercel
cat > .vercel/project.json <<EOF
{"orgId":"${VERCEL_ORG_ID}","projectId":"${VERCEL_PROJECT_ID}"}
EOF

if ! command -v vercel >/dev/null 2>&1; then
  echo "::error::Brak Vercel CLI (npm i -g vercel)."
  exit 1
fi

if [[ "$TARGET" == "prod" ]]; then
  # Wbudowana nazwa Vercela — nie da się przemianować na `prod`.
  vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
  vercel build --prod --token="$VERCEL_TOKEN"
  vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
  echo "Wdrożono prod (repmaxer.pl)."
  exit 0
fi

# Preview, nie Development i nie płatny Custom Environment.
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
url=$(vercel deploy --prebuilt --token="$VERCEL_TOKEN")
echo "Wdrożono dev: ${url}"

alias="${VERCEL_DEV_ALIAS:-dev.repmaxer.pl}"
vercel alias set "$url" "$alias" --token="$VERCEL_TOKEN" --scope "$VERCEL_ORG_ID"
echo "Alias: ${alias}"
