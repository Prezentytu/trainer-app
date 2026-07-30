#!/usr/bin/env bash
# Usuwa lokalne artefakty builda (Next.js .next, .NET bin/obj).
# Uruchamiaj z dowolnego katalogu: ./scripts/clean.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGETS=(
  "apps/web/.next"
  "apps/api/bin"
  "apps/api/obj"
  "tests/api/bin"
  "tests/api/obj"
)

echo "==> Rozmiary przed czyszczeniem:"
before_total=0
for t in "${TARGETS[@]}"; do
  if [[ -e "$t" ]]; then
    kb="$(du -sk "$t" 2>/dev/null | awk '{print $1}')"
    before_total=$((before_total + kb))
    printf '  %-24s %s\n' "$t" "$(du -sh "$t" 2>/dev/null | awk '{print $1}')"
  else
    printf '  %-24s (brak)\n' "$t"
  fi
done

echo
echo "==> Usuwanie…"
for t in "${TARGETS[@]}"; do
  if [[ -e "$t" ]]; then
    rm -rf "$t"
    echo "  usunięto $t"
  fi
done

# Przybliżenie odzyskanego miejsca (du -sk = KB)
mb=$((before_total / 1024))
echo
echo "==> OK — odzyskano ok. ${mb} MB (przybliżenie)."
echo "    Następny start: ./scripts/dev.sh (cache odbuduje się od zera)."
