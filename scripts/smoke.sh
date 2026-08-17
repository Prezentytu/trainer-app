#!/usr/bin/env bash
# Smoke po deployu API: liveness (SHA), readiness (baza), publiczny /, chroniony 401.
# Uruchamiaj z dowolnego katalogu:
#   ./scripts/smoke.sh --base-url https://host [--expect-version SHA] [--retries 12]
set -euo pipefail

BASE=""
EXPECT=""
RETRIES=12
SLEEP=15
PROTECTED="/api/clients"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE="${2%/}"; shift 2 ;;
    --expect-version) EXPECT="$2"; shift 2 ;;
    --retries) RETRIES="$2"; shift 2 ;;
    --sleep) SLEEP="$2"; shift 2 ;;
    --protected) PROTECTED="$2"; shift 2 ;;
    -h|--help)
      echo "Użycie: $0 --base-url URL [--expect-version SHA] [--retries N] [--sleep S]"
      exit 0
      ;;
    *)
      echo "Nieznany argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$BASE" ]]; then
  echo "Użycie: $0 --base-url https://host [--expect-version SHA]" >&2
  exit 2
fi

# Bez schematu curl idzie po http → Azure odpowiada 301 z pustym ciałem (exit 0),
# co wyglądało jak „API zwraca nie-JSON”. Host bez https:// to konfiguracja, nie awaria.
if [[ "$BASE" != http://* && "$BASE" != https://* ]]; then
  echo "  base-url bez schematu — zakładam https://${BASE}" >&2
  BASE="https://${BASE}"
fi

json_field() {
  python3 -c 'import json,sys
try:
    print(json.loads(sys.stdin.read()).get(sys.argv[1], "") or "")
except (ValueError, AttributeError):
    print("")' "$1"
}

is_json() {
  printf '%s' "$1" | python3 -c 'import json,sys
try:
    json.loads(sys.stdin.read())
except ValueError:
    sys.exit(1)' 2>/dev/null
}

# Przy starcie kontenera Azure potrafi zwrócić 200 z pustym ciałem albo stroną HTML —
# to jeszcze nie odpowiedź API, więc czekamy tak samo jak na błąd HTTP.
wait_body() {
  local url="$1"
  local i body code
  for i in $(seq 1 "$RETRIES"); do
    if body=$(curl -fsSL --max-time 20 "$url" 2>/dev/null) && is_json "$body"; then
      printf '%s' "$body"
      return 0
    fi
    # 000 = DNS/połączenie (literówka w hoście), 404 = zła ścieżka w URL-u,
    # 200 tutaj = odpowiedź nie-JSON (kontener jeszcze wstaje). Host maskuje GitHub.
    code=$(curl -sSL -o /dev/null -w '%{http_code}' --max-time 20 "$url" 2>/dev/null || true)
    echo "  próba $i/$RETRIES — HTTP ${code:-000}, czekam ${SLEEP}s…" >&2
    sleep "$SLEEP"
  done
  return 1
}

version_matches() {
  local actual="$1"
  local expected="$2"
  [[ "$actual" == "$expected" ]] && return 0
  [[ "$actual" == "${expected:0:12}" ]] && return 0
  [[ "$expected" == "$actual"* ]] && return 0
  [[ "$actual" == "$expected"* ]] && return 0
  return 1
}

echo "==> liveness ${BASE}/api/health/live"
if ! live=$(wait_body "${BASE}/api/health/live"); then
  echo "::error::Liveness nie zwrócił JSON-a. Sprawdź API_BASE_URL (ze schematem https://) i Log stream Web App."
  exit 1
fi
status=$(printf '%s' "$live" | json_field status)
version=$(printf '%s' "$live" | json_field version)
if [[ "$status" != "ok" ]]; then
  echo "::error::Liveness status=${status}"
  exit 1
fi
echo "    version=${version}"

if [[ -n "$EXPECT" ]]; then
  if ! version_matches "$version" "$EXPECT"; then
    echo "::error::Oczekiwałem version=${EXPECT}, dostałem ${version} (stary obraz?)."
    exit 1
  fi
  echo "    SHA zgodny"
fi

echo "==> readiness ${BASE}/api/health"
if ! ready=$(wait_body "${BASE}/api/health"); then
  echo "::error::Readiness nie zwrócił JSON-a (baza / start kontenera)."
  exit 1
fi
rstatus=$(printf '%s' "$ready" | json_field status)
rdb=$(printf '%s' "$ready" | json_field database)
if [[ "$rstatus" != "ok" || "$rdb" != "ok" ]]; then
  echo "::error::Readiness status=${rstatus} database=${rdb}"
  exit 1
fi

echo "==> public GET ${BASE}/"
code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "${BASE}/")
if [[ "$code" != "200" ]]; then
  echo "::error::GET / zwrócił ${code}"
  exit 1
fi

echo "==> chroniony GET ${BASE}${PROTECTED} (oczekiwany 401)"
pcode=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "${BASE}${PROTECTED}")
if [[ "$pcode" != "401" ]]; then
  echo "::error::GET ${PROTECTED} zwrócił ${pcode} (oczekiwany 401 — Clerk ma być włączony)."
  exit 1
fi

echo "==> OK smoke"
