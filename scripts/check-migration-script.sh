#!/usr/bin/env bash
# Fail, gdy idempotentny skrypt EF zawiera destrukcyjne DDL bez świadomej zgody.
# Usage: ./scripts/check-migration-script.sh <plik.sql> [true|false]
set -euo pipefail

SCRIPT="${1:-}"
ALLOW="${2:-false}"

if [[ -z "$SCRIPT" || ! -f "$SCRIPT" ]]; then
  echo "Użycie: $0 <plik.sql> [true|false]" >&2
  exit 2
fi

matches="$(grep -Ein 'DROP[[:space:]]+(COLUMN|TABLE)|ALTER[[:space:]]+COLUMN[[:space:]].*TYPE' "$SCRIPT" || true)"
if [[ -n "$matches" ]]; then
  if [[ "$ALLOW" == "true" ]]; then
    echo "Destrukcyjne DDL dozwolone (etykieta allow-destructive-ddl albo [allow-destructive-ddl] w commicie)."
    echo "$matches"
    exit 0
  fi
  echo "::error::Migracja zawiera DROP COLUMN/TABLE albo ALTER COLUMN … TYPE."
  echo "Dodaj etykietę PR \`allow-destructive-ddl\` albo \`[allow-destructive-ddl]\` w komunikacie commita."
  echo "$matches"
  exit 1
fi

echo "OK — brak destrukcyjnego DDL w $(basename "$SCRIPT")."
