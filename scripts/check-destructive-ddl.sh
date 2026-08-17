#!/usr/bin/env bash
# Strażnik destrukcyjnego DDL: tylko NOWE migracje względem bazy PR (zwykle main).
# Pełny `dotnet ef migrations script --idempotent` zawsze zawiera historyczne DROP
# z ewolucji schematu — skanowanie go blokowałoby każdy PR bez zmiany modelu.
# Usage: ./scripts/check-destructive-ddl.sh [base-ref] [true|false]
set -euo pipefail

BASE_REF="${1:-main}"
ALLOW="${2:-false}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --verify "origin/${BASE_REF}" >/dev/null 2>&1; then
  echo "Fetch origin/${BASE_REF}…"
  git fetch --depth=1 origin "${BASE_REF}"
fi
BASE="origin/${BASE_REF}"

list_base() {
  git ls-tree -r --name-only "$BASE" -- apps/api/Migrations \
    | grep -E 'Migrations/[0-9]+_[^/]+\.cs$' \
    | grep -v Designer \
    | grep -v Snapshot \
    | sed 's|.*/||' \
    | sort || true
}

list_head() {
  find apps/api/Migrations -maxdepth 1 -name '*.cs' \
    ! -name '*Designer.cs' \
    ! -name 'AppDbModelSnapshot.cs' \
    -print \
    | sed 's|.*/||' \
    | grep -E '^[0-9]+_' \
    | sort || true
}

new="$(comm -13 <(list_base) <(list_head))"
if [[ -z "$new" ]]; then
  echo "OK — brak nowych migracji względem ${BASE}. Historyczne DROP nie blokują."
  exit 0
fi

echo "Nowe migracje względem ${BASE}:"
echo "$new"

mkdir -p artifacts
delta="${ROOT}/artifacts/ef-delta.sql"
last_base="$(list_base | tail -1)"

if [[ -z "$last_base" ]]; then
  echo "Brak migracji na ${BASE} — sprawdzam pełny skrypt."
  (cd apps/api && dotnet ef migrations script --idempotent --output "$delta")
else
  from="${last_base#*_}"
  from="${from%.cs}"
  echo "Skrypt przyrostowy od ${from}…"
  (cd apps/api && dotnet ef migrations script "$from" --idempotent --output "$delta")
fi

bash "${ROOT}/scripts/check-migration-script.sh" "$delta" "$ALLOW"
