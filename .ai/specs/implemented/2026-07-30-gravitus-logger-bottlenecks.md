# Gravitus-owy logger klienta + naprawa bottlenecków

## TLDR

Przebudowa `SessionLogger` na wzorce Gravitus/Hevy (jedna przewijana lista, kolumna POPRZ., checkmarki serii, auto-timer, podsumowanie) oraz naprawa bottlenecków: scoped historia PR, lekkie DTO, `Sessions.cs`, dashboard 1-request, działająca kolejka offline, manifest per token.

## Problem

MVP pętli plan → trening → progres działa jako demo, ale:

1. **Logger** jest pagerem jednego ćwiczenia — brakuje wzorców rynkowych (POPRZ./DZIŚ, checkmark, auto-rest, summary).
2. **Wydajność**: `LoadSessionDto` ładuje całą historię klienta przy każdym zapisie; dashboard robi ~18 requestów; `GET /api/plans` zwraca pełne drzewa.
3. **Offline** jest martwy (enqueue po sukcesie, zły listener `online`).
4. **PWA** otwiera `/` zamiast `/portal/{token}`.

## Proponowane rozwiązanie

- Wspólna logika sesji w `Sessions.cs` (start/update/complete) dla trenera i portalu.
- Scoped PR + `prevSets` + `restSeconds` w DTO sesji.
- Lekkie list DTO + `GET /api/dashboard`.
- Redesign `SessionLogger` (wzorce Gravitus, design system WA).
- Portal: historia, tydzień, wideo, manifest per token.
- Kolejka offline: enqueue w `catch`, dedupe, stabilny handler.

## Model danych

Bez nowych encji. Indeksy w `AppDb.cs` (reset `trainer.db`):

- `WorkoutSessions(ClientId, Status)`
- `LoggedExercises(ExerciseId)`
- `ClientMaxes(ClientId, ExerciseId)`
- `Assignments(ClientId, Status)`

`LoggedSet` dostaje opcjonalne `Completed` (bool, default false) — stan checkmarka serii (wymaga resetu DB).

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET | `/api/plans` | Lekkie DTO: `{ id, name, kind, dayCount, exerciseCount, assignmentCount, createdAt }` |
| GET | `/api/dashboard` | Nowy: counts + recentSessions + recentPrs |
| GET | `/api/sessions/{id}` | DTO: per exercise `prevSets[]`, `restSeconds`, set `completed` + `isPr` |
| PUT | `/api/sessions/{id}` | Upsert po Id (stabilne ID serii), nie delete+recreate |
| GET | `/api/portal/{token}` | Tydzień (lekkie dni) + dziś (pełne items) — nie cały plan |
| GET | `/api/portal/{token}/sessions` | Nowy: lista SessionSummary klienta |
| POST | `/api/portal/{token}/sessions/start` | Walidacja ownership PlanDay/Assignment |

Typy TS w `apps/web/lib/api.ts` lustrzane (camelCase).

## UI

- `SessionLogger` — sticky top (nazwa, timer, Zakończ), lista bloków ćwiczeń (SERIA \| POPRZ. \| DZIŚ), checkmark → auto rest, gold PR badge, add/remove serii, notatka, autosave debounce, ekran podsumowania.
- Portal home: zakładki Dziś / Tydzień / Historia; tap miniaturki → `YoutubeLite`.
- Manifest: `apps/web/app/portal/[token]/manifest.webmanifest/route.ts`.
- Dashboard: jeden `api.dashboard.get()`.

## Fazy implementacji

- [x] Faza 1 — backend: indeksy, Sessions.cs, scoped PR/prevSets, lekkie plans, dashboard, ownership
- [x] Faza 2 — SessionLogger Gravitus + typy api.ts
- [x] Faza 3 — portal extras + offline fix + AppShell/dashboard/plan view
- [x] Faza 4 — testy xUnit + `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Reset `trainer.db` kasuje lokalne dane | Seed odtwarza demo; dokumentujemy w AGENTS |
| Upsert serii vs stare klienty bez `id` | Nowe serie bez Id → insert; istniejące z Id → update |
| Autosave race | Debounce 400 ms + serializacja zapisów (kolejka 1) |
| Manifest per token | Route handler dynamiczny; globalny manifest zostaje dla trenera |

## Changelog

- 2026-07-30 — utworzono spec (plan Gravitus logger + bottlenecki).
- 2026-07-30 — wdrożono: Sessions.cs, scoped PR/prevSets/restSeconds, LoggedSet.Completed, lekkie `/api/plans`, `/api/dashboard` + `/api/counts`, ownership portalu, Gravitus SessionLogger, portal (Dziś/Tydzień/Historia + manifest), offline queue fix. Bramka zielona (21 testów).
