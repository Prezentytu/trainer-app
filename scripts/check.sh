#!/usr/bin/env bash
# Bramka walidacyjna Trainer App.
#   ./scripts/check.sh              pełna: backend (build + testy), web (lint + typecheck + build), limity słów
#   ./scripts/check.sh --zmienione  tylko pakiety dotknięte zmianą względem origin/main (+ niezacommitowane):
#                                   api → build + testy; web → lint zmienionych plików + typecheck; instrukcje → limity słów
# Pełna wersja przed PR; wariant --zmienione w trakcie pracy.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "--zmienione" ]]; then
  BASE="$(git merge-base origin/main HEAD 2>/dev/null || echo HEAD)"
  CHANGED="$( { git diff --name-only "${BASE}"; git ls-files --others --exclude-standard; } | sort -u)"
  if [[ -z "${CHANGED}" ]]; then
    echo "==> Brak zmian względem ${BASE} — nic do sprawdzenia."
    exit 0
  fi
  ran=0

  if grep -qE '^(apps/api/|tests/api/|TrainerApp\.slnx$|global\.json$)' <<< "${CHANGED}"; then
    echo "==> [api] build"
    dotnet build apps/api/TrainerApp.Api.csproj -nologo -warnaserror
    echo "==> [api] testy"
    dotnet test -nologo
    ran=1
  fi

  if grep -q '^apps/web/' <<< "${CHANGED}"; then
    web_files=()
    while IFS= read -r f; do
      [[ -f "${f}" ]] && web_files+=("${f#apps/web/}")
    done < <(grep -E '^apps/web/.*\.(ts|tsx|js|jsx|mjs)$' <<< "${CHANGED}" || true)
    if (( ${#web_files[@]} > 0 )); then
      echo "==> [web] lint ${#web_files[@]} zmienionych plików"
      (cd apps/web && npx eslint "${web_files[@]}")
    fi
    echo "==> [web] typecheck"
    npm run typecheck --prefix apps/web
    ran=1
  fi

  if grep -qE '(^|/)AGENTS\.md$|^\.ai/lessons\.md$|^scripts/word-limits\.txt$' <<< "${CHANGED}"; then
    echo "==> [instrukcje] limity słów"
    bash scripts/check-word-limits.sh
    ran=1
  fi

  if (( ran == 0 )); then
    echo "==> Zmiany poza api/web/instrukcjami — brak kroków do uruchomienia."
  fi
  echo "==> OK — sprawdzone pakiety dotknięte zmianą. Przed PR: ./scripts/check.sh (pełna)."
  exit 0
fi

echo "==> [1/6] Backend: build"
dotnet build apps/api/TrainerApp.Api.csproj -nologo -warnaserror

echo "==> [2/6] Backend: testy"
dotnet test -nologo

echo "==> [3/6] Web: lint"
npm run lint --prefix apps/web

echo "==> [4/6] Web: typecheck"
npm run typecheck --prefix apps/web

echo "==> [5/6] Web: build"
# Jak CI: build bez sekretów Vercel nie powinien padać na brak NEXT_PUBLIC_API_URL.
SKIP_ENV_VALIDATION=true npm run build --prefix apps/web

echo "==> [6/6] Instrukcje: limity słów"
bash scripts/check-word-limits.sh

echo "==> OK — bramka walidacyjna zielona."
