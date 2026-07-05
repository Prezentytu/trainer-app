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

Dwa terminale:

```bash
# Terminal 1 — API (http://localhost:5210)
cd apps/api
dotnet run

# Terminal 2 — portal (http://localhost:3000)
cd apps/web
npm install
npm run dev
```

Baza SQLite (`apps/api/trainer.db`) tworzy się automatycznie przy pierwszym starcie razem z danymi startowymi (10 ćwiczeń, przykładowy klient i szablon planu FBW). Żeby zresetować dane, usuń plik `trainer.db` i zrestartuj API.

## Bramka walidacyjna

Jedno polecenie sprawdzające całość (build + testy API, lint + typecheck + build web):

```bash
./scripts/check.sh
```

Te same kroki uruchamia CI (`.github/workflows/ci.yml`) na push do `main` i na pull requestach.

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

## Poza zakresem MVP (świadomie)

Auth/logowanie, aplikacja mobilna klienta, historia wykonań treningów, multi-trener/multi-tenant, media ćwiczeń. Model danych (plan → pozycje z parametrami i przerwami) jest przygotowany pod player mobilny (odznaczanie serii + timery przerw).
