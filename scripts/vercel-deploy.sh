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
# Ręczny project.json (same id) CLI traktuje jako zepsuty link — „remove the .vercel directory”.
rm -rf .vercel apps/web/.vercel

if ! command -v vercel >/dev/null 2>&1; then
  echo "::error::Brak Vercel CLI (npm i -g vercel)."
  exit 1
fi

export VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID
scope=(--token "$VERCEL_TOKEN" --scope "$VERCEL_ORG_ID")

# pull zapisuje env w .vercel/ (root). Next buduje w apps/web i czyta tylko tamtejsze .env*.
link_next_env() {
  local pulled="$1"
  if [[ ! -f "$pulled" ]]; then
    echo "::error::Brak ${pulled} po vercel pull — Preview/Production nie ma zmiennych?"
    exit 1
  fi
  if ! grep -q '^NEXT_PUBLIC_API_URL=' "$pulled"; then
    echo "::error::W ${pulled} nie ma NEXT_PUBLIC_API_URL. Dodaj ją w Vercel (checkbox Preview/Production)."
    exit 1
  fi
  local pk
  pk="$(grep -E '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' "$pulled" | head -n1 | cut -d= -f2- | tr -d '"'\''[:space:]')"
  if [[ -z "$pk" ]]; then
    echo "::error::Brak NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY w tym środowisku Vercel (Preview/Production). Dodaj pk_test_ / pk_live_ z Clerk → API Keys."
    exit 1
  fi
  if [[ ! "$pk" =~ ^pk_(test|live)_ ]]; then
    echo "::error::NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY w Vercel nie zaczyna się od pk_test_ / pk_live_ (ucięty klucz albo wklejona cała linia .env)."
    exit 1
  fi
  if [[ ${#pk} -lt 40 ]]; then
    echo "::error::NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY jest za krótki (${#pk} znaków) — skopiuj z Clerk przyciskiem kopiuj, nie z uciętego podglądu."
    exit 1
  fi
  cp "$pulled" apps/web/.env.production.local
  echo "Env z pull skopiowany do apps/web/.env.production.local (Clerk pk: ${#pk} znaków)"
}

if [[ "$TARGET" == "prod" ]]; then
  # Wbudowana nazwa Vercela — nie da się przemianować na `prod`.
  vercel pull --yes --environment=production "${scope[@]}"
  link_next_env .vercel/.env.production.local
  vercel build --prod "${scope[@]}"
  vercel deploy --prebuilt --prod "${scope[@]}"
  echo "Wdrożono prod (repmaxer.pl)."
  exit 0
fi

# Preview, nie Development i nie płatny Custom Environment.
vercel pull --yes --environment=preview "${scope[@]}"
link_next_env .vercel/.env.preview.local
vercel build "${scope[@]}"
url=$(vercel deploy --prebuilt "${scope[@]}")
echo "Wdrożono dev: ${url}"

alias="${VERCEL_DEV_ALIAS:-dev.repmaxer.pl}"
vercel alias set "$url" "$alias" "${scope[@]}"
echo "Alias: ${alias}"
