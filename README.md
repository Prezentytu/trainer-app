# Trainer App

Portal trenera personalnego: biblioteka ćwiczeń, plany treningowe (szablony + plany klientów) i przypisywanie planów klientom. Monorepo: API w .NET 10 + frontend w Next.js 16, jeden git, wspólna bramka walidacyjna i harness dla agentów AI.

## Struktura

```
trainer-app/
├── apps/
│   ├── api/     # .NET 10 Minimal API + EF Core + SQLite   (port 5210)
│   └── web/     # Next.js 16 (App Router) + Tailwind 4      (port 3000)
├── tests/
│   └── api/     # testy integracyjne API (xUnit + WebApplicationFactory)
├── .ai/         # spec-first (.ai/specs) + pamięć projektu (.ai/lessons.md)
├── .cursor/     # skille agentów (add-crud-feature, spec-writing, code-review, check-and-commit)
├── scripts/     # check.sh — pełna bramka walidacyjna
├── AGENTS.md    # zasady dla agentów (start tutaj)
└── TrainerApp.slnx  # solucja .NET (api + testy)
```

## Wymagania

- Node.js (wersja z `.nvmrc`) + npm
- .NET SDK 10

## Uruchomienie lokalne

Jedno polecenie (API :5210 + web :3000; Ctrl+C ubija oba procesy):

```bash
./scripts/dev.sh
```

Pierwszy raz w `apps/web` (jeśli nie masz `node_modules`):

```bash
cd apps/web && npm install && cd ../..
./scripts/dev.sh
```

Baza SQLite (`apps/api/trainer.db`) tworzy się automatycznie przy pierwszym starcie razem z danymi startowymi (10 ćwiczeń, przykładowy klient i szablon planu FBW). Żeby zresetować dane, usuń plik `trainer.db` i zrestartuj API.

### Diagnostyka i czyszczenie

```bash
./scripts/dev-doctor.sh   # pamięć, swap, cache, porty, sieroty procesów
./scripts/clean.sh        # usuwa apps/web/.next + bin/obj (.NET) — odzysk miejsca
```

Dev web domyślnie idzie na **Webpacku** z limitem pamięci 4 GB (`npm run dev`), bo Turbopack w Next 16.2 na Apple Silicon wycieka natywną pamięć `IOAccelerator` i potrafi zamrozić cały macOS. Turbopack zostaje na `next build` i opcjonalnie: `npm run dev:turbo` w `apps/web`. Po stabilnym Next **16.3+** wracamy na Turbopack (patrz `.ai/lessons.md`).

### Higiena środowiska (macOS + antywirus)

Antywirus skanujący `node_modules` / `.next` mocno obciąża CPU przy HMR. **Wykluczenia w Kaspersky** (Ustawienia → Zagrożenia i wykluczenia → Zarządzaj wykluczeniami → Folder):

- `~/Documents/repos/trainer-app/apps/web/node_modules`
- `~/Documents/repos/trainer-app/apps/web/.next`
- `~/Documents/repos/trainer-app/apps/api/bin`
- `~/Documents/repos/trainer-app/apps/api/obj`
- `~/.nuget`, `~/.dotnet`, `~/.npm`

**Tryb deweloperski macOS** (mniej przechwytów Gatekeepera na plikach narzędzi):

```bash
sudo spctl developer-mode enable-terminal
```

Potem: Ustawienia systemowe → Prywatność i ochrona → Narzędzia dla programistów → dodaj Terminal i Cursor.

Szczegóły i checklista: [scripts/macos-dev-hygiene.md](scripts/macos-dev-hygiene.md).

## Bramka walidacyjna

Jedno polecenie sprawdzające całość (build + testy API, lint + typecheck + build web):

```bash
./scripts/check.sh
```

Te same kroki (build + testy + lint + typecheck + build web) uruchamia CI (`.github/workflows/ci.yml`) na pull requestach. `main` jest trunkiem — krótkie gałęzie, bez długowiecznego `dev`. Merge odpala **Release** (tylko dev); produkcja to ręczny **Promote to prod**. Runbook: [`docs/ci-cd.md`](docs/ci-cd.md).

## Flow MVP

1. **Ćwiczenia** — biblioteka z domyślnymi parametrami (serie, powtórzenia / czas, przerwa między seriami, obciążenie kg).
2. **Plany** — builder: dodajesz ćwiczenia, opcjonalnie nadpisujesz parametry per ćwiczenie (puste pole = domyślne z ćwiczenia), ustawiasz przerwę po ćwiczeniu i kolejność.
   - **Szablon** — wielokrotnego użytku; przyciskiem „Użyj → plan klienta" tworzysz z niego przypisywalny plan.
   - **Plan klienta** — można przypisać klientowi.
3. **Klienci** — dodajesz klienta, na jego profilu przypisujesz plan z datą startu; przypisanie można zakończyć/anulować/wznowić.

## API (REST, JSON)

| Zasób | Endpointy |
|---|---|
| Klienci | `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/{id}` |
| Ćwiczenia | `GET/POST /api/exercises`, `PUT/DELETE /api/exercises/{id}` |
| Plany | `GET/POST /api/plans`, `GET/PUT/DELETE /api/plans/{id}`, `POST /api/plans/{id}/duplicate` |
| Przypisania | `GET/POST /api/assignments`, `PATCH /api/assignments/{id}/status`, `DELETE /api/assignments/{id}` |

Plany zwracają **efektywne parametry** (nadpisanie z planu albo default z ćwiczenia) + surowe `overrides` — gotowe pod przyszły mobilny player klienta.

## Praca wspomagana agentami (AI)

Repozytorium jest przygotowane pod pracę z agentami (Cursor, Claude Code, Codex):

- **[AGENTS.md](AGENTS.md)** — punkt startowy: zasady `Always / Ask First / Never`, Task Router, bramka walidacyjna. Zagnieżdżone `AGENTS.md` w `apps/api` i `apps/web`.
- **Spec-first** — nietrywialne zmiany projektujemy w `.ai/specs/` (szablon: `.ai/specs/TEMPLATE.md`).
- **Skille** — powtarzalne workflow w `.cursor/skills/` (m.in. `add-crud-feature` — scaffold nowego zasobu end-to-end na wzór modułu `Clients`).
- **Pamięć** — `.ai/lessons.md` gromadzi wnioski, żeby nie powtarzać błędów.

## Auth i deploy

- Login trenera: **Clerk** (gdy ustawione `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `Clerk__Authority` w API).
- Lokalnie bez Clerk: API działa jako seedowy trener `local-dev`.
- **Production:** puste `Clerk__Authority` = API **nie startuje** (fail-fast).
- Portal klienta: magic link `/portal/[token]` (bez konta), `noindex`, rotacja tokenu u trenera.
- Deploy: [`docs/deploy.md`](docs/deploy.md). CI/CD: [`docs/ci-cd.md`](docs/ci-cd.md). Zmienne: [`.env.example`](.env.example).

## Poza zakresem early access (świadomie)

Billing/Stripe, osobna aplikacja natywna, import backupu z innych trackerów, Sentry (do decyzji). Model danych jest przygotowany pod dalszy rozwój.
