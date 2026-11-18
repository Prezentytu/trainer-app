#!/usr/bin/env bash
# Bramka walidacyjna Trainer App: backend (build + testy) oraz web (lint + typecheck + build).
# Uruchamiaj z dowolnego katalogu: ./scripts/check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [0/5] Agenci: modułowy AGENTS.md ma obok CLAUDE.md (Claude Code wczytuje tylko CLAUDE.md podkatalogu)"
missing=0
while IFS= read -r f; do
  d="$(dirname "$f")"
  if ! grep -qx '@AGENTS.md' "$d/CLAUDE.md" 2>/dev/null; then echo "brak $d/CLAUDE.md z linią @AGENTS.md"; missing=1; fi
done < <(git ls-files '*/AGENTS.md')
[ "$missing" -eq 0 ]

echo "==> [1/5] Backend: build"
dotnet build apps/api/TrainerApp.Api.csproj -nologo -warnaserror

echo "==> [2/5] Backend: testy"
dotnet test -nologo

echo "==> [3/5] Web: lint"
npm run lint --prefix apps/web

echo "==> [4/5] Web: typecheck"
npm run typecheck --prefix apps/web

echo "==> [5/5] Web: build"
# Jak CI: build bez sekretów Vercel nie powinien padać na brak NEXT_PUBLIC_API_URL.
SKIP_ENV_VALIDATION=true npm run build --prefix apps/web

echo "==> OK — bramka walidacyjna zielona."
