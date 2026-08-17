#!/usr/bin/env bash
# Fail na high/critical, z wyjątkiem znanego pinu Next 16.2 (postcss/sharp).
# Nie bumpujemy Next w tym PR — lekcja Turbopack / 16.2 na Apple Silicon.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/apps/web"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
# npm audit kończy się !=0 przy podatnościach — to nie jest błąd skryptu.
npm audit --json --audit-level=high >"$tmp" || true

python3 - "$tmp" <<'PY'
import json, sys
path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
allowed = {"postcss", "sharp", "next"}
vulns = data.get("vulnerabilities") or {}
bad = []
for name, meta in vulns.items():
    sev = (meta.get("severity") or "").lower()
    if sev not in ("high", "critical"):
        continue
    if name in allowed:
        print(f"znany pin Next 16.2: {name} ({sev})")
        continue
    bad.append(f"{name} ({sev})")
if bad:
    print("::error::Nieoczekiwane podatności npm: " + ", ".join(bad), file=sys.stderr)
    sys.exit(1)
print("OK — brak nieoczekiwanych high/critical.")
PY
