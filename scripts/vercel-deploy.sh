#!/usr/bin/env bash
# Deploy frontu z prebuilt (Vercel CLI). Target: dev | prod.
# Vercel nie pozwala przemianować wbudowanej produkcji — argument `prod`
# mapujemy na --environment=production / --prod (ich słownik, nie nasz).
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

vercel pull --yes --environment=dev --token="$VERCEL_TOKEN"
vercel build --target=dev --token="$VERCEL_TOKEN"
url=$(vercel deploy --prebuilt --target=dev --token="$VERCEL_TOKEN")
echo "Wdrożono dev: ${url}"

alias="${VERCEL_DEV_ALIAS:-dev.repmaxer.pl}"
vercel alias set "$url" "$alias" --token="$VERCEL_TOKEN" --scope "$VERCEL_ORG_ID"
echo "Alias: ${alias}"
