#!/usr/bin/env bash
# Diagnostyka środowiska lokalnego Trainer App (pamięć, swap, cache, sieroty).
# Uruchamiaj z dowolnego katalogu: ./scripts/dev-doctor.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

hr() { printf '\n%s\n' "────────────────────────────────────────"; }
section() { hr; printf '==> %s\n' "$1"; }

bytes_human() {
  local b="${1:-0}"
  if command -v numfmt >/dev/null 2>&1; then
    numfmt --to=iec --suffix=B "$b" 2>/dev/null || du -h -d0 /dev/null 2>/dev/null
  else
    # macOS: du -h style approx
    if (( b >= 1073741824 )); then awk -v b="$b" 'BEGIN { printf "%.1fG\n", b/1073741824 }'
    elif (( b >= 1048576 )); then awk -v b="$b" 'BEGIN { printf "%.1fM\n", b/1048576 }'
    elif (( b >= 1024 )); then awk -v b="$b" 'BEGIN { printf "%.1fK\n", b/1024 }'
    else printf '%sB\n' "$b"
    fi
  fi
}

dir_size() {
  local path="$1"
  if [[ -e "$path" ]]; then
    du -sh "$path" 2>/dev/null | awk '{print $1}'
  else
    echo "(brak)"
  fi
}

section "Host"
echo "arch:     $(uname -m)"
echo "cpus:     $(sysctl -n hw.ncpu 2>/dev/null || echo '?')"
if mem="$(sysctl -n hw.memsize 2>/dev/null)"; then
  echo "ram:      $(bytes_human "$mem")"
fi
echo "node:     $(node -v 2>/dev/null || echo '?')"
echo "dotnet:   $(dotnet --version 2>/dev/null || echo '?')"
if [[ -f apps/web/node_modules/next/package.json ]]; then
  echo "next:     $(node -e "console.log(require('./apps/web/node_modules/next/package.json').version)")"
fi

section "Pamięć systemowa / swap"
sysctl vm.swapusage 2>/dev/null || true
if command -v memory_pressure >/dev/null 2>&1; then
  # Pierwsze linie wystarczą — pełny dump jest długi
  memory_pressure 2>/dev/null | head -n 8 || true
fi

section "Rozmiary cache / artefaktów"
printf 'apps/web/.next              %s\n' "$(dir_size apps/web/.next)"
printf 'apps/web/.next/dev/cache    %s\n' "$(dir_size apps/web/.next/dev/cache)"
printf 'apps/web/node_modules       %s\n' "$(dir_size apps/web/node_modules)"
printf 'apps/api/bin                %s\n' "$(dir_size apps/api/bin)"
printf 'apps/api/obj                %s\n' "$(dir_size apps/api/obj)"

# Ostrzeżenie przy dużym cache
if [[ -d apps/web/.next ]]; then
  next_bytes="$(du -sk apps/web/.next 2>/dev/null | awk '{print $1}')"
  # du -sk = kilobytes; 1GB = 1048576 KB
  if (( next_bytes > 1048576 )); then
    echo
    echo "⚠  apps/web/.next > 1 GB — rozważ: ./scripts/clean.sh"
  fi
fi

section "Procesy dev (next / node / dotnet / MSBuild)"
DEV_LINES="$(ps -Ao pid,ppid,pcpu,pmem,rss,command 2>/dev/null \
  | rg -i 'next-server|next dev|node_modules/next|dotnet.*(run|TrainerApp)|MSBuild' \
  | rg -v 'rg -i|dev-doctor' || true)"

if [[ -z "$DEV_LINES" ]]; then
  echo "(brak aktywnych procesów next/dotnet/MSBuild)"
else
  echo "$DEV_LINES"

  section "Realny footprint (footprint / vmmap IOAccelerator)"
  echo "$DEV_LINES" | awk '{print $1}' | sort -u | while read -r pid; do
    [[ -z "$pid" ]] && continue
    cmd="$(ps -p "$pid" -o command= 2>/dev/null | cut -c1-80 || true)"
    echo "--- pid=$pid  $cmd"
    if command -v footprint >/dev/null 2>&1; then
      footprint -p "$pid" 2>/dev/null | head -n 12 || echo "(footprint niedostępny dla pid=$pid)"
    fi
    if command -v vmmap >/dev/null 2>&1; then
      vmmap --summary "$pid" 2>/dev/null \
        | rg -i 'IOAccelerator|Physical footprint|TOTAL' \
        | head -n 20 || true
    fi
    echo
  done
fi

section "Top procesów (pamięć)"
ps -Ao pid,pcpu,pmem,rss,comm -m 2>/dev/null | head -n 12 || true

section "Porty 3000 / 5210"
for port in 3000 5210; do
  if command -v lsof >/dev/null 2>&1; then
    hits="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$hits" ]]; then
      echo "port $port:"
      echo "$hits"
    else
      echo "port $port: wolny"
    fi
  fi
done

section "Osierocone / podejrzane procesy"
orphans="$(ps -Ao pid,ppid,pcpu,pmem,rss,command 2>/dev/null \
  | rg -i 'next-server|MSBuild\.exe|VBCSCompiler' \
  | rg -v 'rg -i|dev-doctor' || true)"
if [[ -n "$orphans" ]]; then
  echo "$orphans"
  echo
  echo "⚠  Znaleziono procesy next-server / MSBuild — po zamknięciu terminala powinny zniknąć."
  echo "   Jeśli zostają: kill <pid> albo ./scripts/dev.sh (ma trap ubijający drzewo)."
else
  echo "(brak oczywistych sierot)"
fi

hr
echo "OK — diagnostyka zakończona."
echo "Po sesji dev: porównaj footprint next-server (powinien < ~4 GB przy --webpack)."
echo "Przy .next > 1 GB: ./scripts/clean.sh"
