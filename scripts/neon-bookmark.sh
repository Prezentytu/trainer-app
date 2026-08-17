#!/usr/bin/env bash
# Branch Neon przed ryzykowną migracją. Soft-skip bez NEON_API_KEY / NEON_PROJECT_ID.
# Usage: ./scripts/neon-bookmark.sh [nazwa-suffix]
set -euo pipefail

if [[ -z "${NEON_API_KEY:-}" || -z "${NEON_PROJECT_ID:-}" ]]; then
  echo "Brak NEON_API_KEY / NEON_PROJECT_ID — pomijam bookmark Neon."
  exit 0
fi

suffix="${1:-$(date -u +%Y%m%d%H%M%S)}"
# Nazwa: alfanumeryczne i myślnik, max 128.
name="pre-migrate-${suffix}"
name="${name:0:128}"

if [[ -n "${NEON_PARENT_BRANCH_ID:-}" ]]; then
  body=$(printf '{"branch":{"name":"%s","parent_id":"%s"}}' "$name" "$NEON_PARENT_BRANCH_ID")
else
  body=$(printf '{"branch":{"name":"%s"}}' "$name")
fi

curl -fsS -X POST "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches" \
  -H "Authorization: Bearer ${NEON_API_KEY}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "$body" >/dev/null

echo "Utworzono branch Neon: ${name}"
