#!/usr/bin/env bash
# Zapadka słów dla instrukcji ładowanych zawsze (AGENTS.md, apps/*/AGENTS.md, aktywne .ai/lessons.md).
# Każdy agent czyta je na starcie; każde słowo kosztuje kontekst w każdej sesji.
# Limity w scripts/word-limits.txt („<limit> <ścieżka>”). Limit wolno tylko obniżać.
# Usage: ./scripts/check-word-limits.sh [base-ref]
#   bez argumentu: tylko liczby słów ≤ limit
#   z base-ref (np. main): dodatkowo limit nie rośnie i nie znika względem origin/<base-ref>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LIMITS="scripts/word-limits.txt"
BASE_REF="${1:-}"
fail=0

while read -r limit path || [[ -n "${limit:-}" ]]; do
  [[ -z "${limit}" || "${limit}" == \#* ]] && continue
  if [[ ! -f "${path}" ]]; then
    echo "::error::${path}: plik z ${LIMITS} nie istnieje."
    fail=1
    continue
  fi
  words=$(wc -w < "${path}" | tr -d ' ')
  if (( words > limit )); then
    echo "::error::${path}: ${words} słów > limit ${limit}. Skróć plik albo przenieś szczegóły do skilla/archiwum."
    fail=1
  else
    echo "OK ${path}: ${words}/${limit}"
  fi
done < "${LIMITS}"

if [[ -n "${BASE_REF}" ]]; then
  if ! git rev-parse --verify --quiet "origin/${BASE_REF}" >/dev/null; then
    git fetch --depth=1 origin "${BASE_REF}"
  fi
  if base_limits=$(git show "origin/${BASE_REF}:${LIMITS}" 2>/dev/null); then
    while read -r base_limit path || [[ -n "${base_limit:-}" ]]; do
      [[ -z "${base_limit}" || "${base_limit}" == \#* ]] && continue
      head_limit=$(awk -v p="${path}" '$1 !~ /^#/ && $2 == p { print $1 }' "${LIMITS}")
      if [[ -z "${head_limit}" ]]; then
        echo "::error::${path}: limit usunięty z ${LIMITS} (było ${base_limit})."
        fail=1
      elif (( head_limit > base_limit )); then
        echo "::error::${path}: limit podniesiony ${base_limit} → ${head_limit}. Limit wolno tylko obniżać."
        fail=1
      fi
    done <<< "${base_limits}"
  else
    echo "Brak ${LIMITS} na origin/${BASE_REF} — pierwsze wprowadzenie zapadki, pomijam porównanie."
  fi
fi

exit "${fail}"
