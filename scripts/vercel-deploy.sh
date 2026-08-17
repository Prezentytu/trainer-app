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

if [[ -z "${VERCEL_TOKEN:-}" || -z "${VERCEL_ORG_ID:-}" || -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "::error::Brak VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID."
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/apps/web"

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
