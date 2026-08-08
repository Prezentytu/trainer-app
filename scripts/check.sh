#!/usr/bin/env bash
# Bramka walidacyjna Trainer App: backend (build + testy) oraz web (lint + typecheck + build).
# Uruchamiaj z dowolnego katalogu: ./scripts/check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [1/5] Backend: build"
dotnet build apps/api/TrainerApp.Api.csproj -nologo

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
