# Higiena środowiska macOS (antywirus + Gatekeeper)

Te kroki są **poza repo** — trzeba je zrobić raz na maszynie. Bez nich HMR Next.js + skan AV potrafią zamrozić system nawet przy Webpacku.

## 1. Wykluczenia w Kaspersky

Ustawienia → **Zagrożenia i wykluczenia** → **Zarządzaj wykluczeniami** → dodaj foldery:

| Ścieżka | Po co |
|---|---|
| `~/Documents/repos/trainer-app/apps/web/node_modules` | tysiące małych plików przy instalacji / resolve |
| `~/Documents/repos/trainer-app/apps/web/.next` | ciągły zapis przy HMR / build |
| `~/Documents/repos/trainer-app/apps/api/bin` | artefakty .NET |
| `~/Documents/repos/trainer-app/apps/api/obj` | artefakty .NET |
| `~/.nuget` | cache paczek NuGet |
| `~/.dotnet` | runtime / tooling .NET |
| `~/.npm` | cache npm |

Po dodaniu sprawdź w Activity Monitor, że `kavd` nie siedzi stale powyżej ~10–15% CPU przy spokojnym systemie.

## 2. Tryb deweloperski macOS (Gatekeeper)

```bash
sudo spctl developer-mode enable-terminal
```

Następnie: **Ustawienia systemowe** → **Prywatność i ochrona** → **Narzędzia dla programistów** → włącz Terminal oraz Cursor.

## 3. Weryfikacja

```bash
./scripts/dev.sh
# po ~10–30 min pracy w builderze planów:
./scripts/dev-doctor.sh
```

Oczekiwanie: footprint `next-server` stabilny poniżej ~4 GB, `vm.swapusage` bliski zeru, brak rosnącego `IOAccelerator` w `vmmap`.
