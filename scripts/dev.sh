#!/usr/bin/env bash
# Uruchamia API (.NET :5210) + web (Next.js :3000) w jednym procesie-grupie.
# Ctrl+C ubija całe drzewo — bez osieroconych next-server / MSBuild.
# Uruchamiaj z dowolnego katalogu: ./scripts/dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export MSBUILDDISABLENODEREUSE=1
export DOTNET_CLI_TELEMETRY_OPTOUT=1

API_PORT=5210
WEB_PORT=3000

port_busy() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

if port_busy "$API_PORT"; then
  echo "Błąd: port $API_PORT jest zajęty (API)."
  echo "Zajmujący proces:"
  lsof -nP -iTCP:"$API_PORT" -sTCP:LISTEN 2>/dev/null || true
  echo "Zamknij go albo: kill \$(lsof -t -iTCP:$API_PORT -sTCP:LISTEN)"
  exit 1
fi

if port_busy "$WEB_PORT"; then
  echo "Błąd: port $WEB_PORT jest zajęty (web)."
  echo "Zajmujący proces:"
  lsof -nP -iTCP:"$WEB_PORT" -sTCP:LISTEN 2>/dev/null || true
  echo "Zamknij go albo: kill \$(lsof -t -iTCP:$WEB_PORT -sTCP:LISTEN)"
  exit 1
fi

# Prefiksowane logi bez zewnętrznych zależności
prefix() {
  local tag="$1"
  # shellcheck disable=SC2016
  while IFS= read -r line || [[ -n "$line" ]]; do
    printf '[%s] %s\n' "$tag" "$line"
  done
}

cleanup() {
  # kill 0 = cała grupa procesów tego skryptu
  trap - EXIT INT TERM
  echo
  echo "==> Zatrzymywanie API + web…"
  kill 0 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> API  → http://localhost:$API_PORT"
echo "==> Web  → http://localhost:$WEB_PORT"
echo "==> Ctrl+C zatrzymuje oba procesy."
echo

(
  cd "$ROOT/apps/api"
  # Bez --watch: jeden proces, mniej I/O i mniej MSBuild node reuse
  exec dotnet run --no-launch-profile --urls "http://localhost:$API_PORT"
) 2>&1 | prefix "api" &

(
  cd "$ROOT/apps/web"
  if [[ ! -d node_modules ]]; then
    echo "Brak node_modules — uruchamiam npm install…"
    npm install
  fi
  exec npm run dev
) 2>&1 | prefix "web" &

# Czekaj na oba joby; wyjście jednego kończy skrypt (trap sprząta resztę)
wait
