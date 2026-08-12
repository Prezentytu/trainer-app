# Superserie jako rundy

## TLDR

Superseria w wykonaniu to **seria pary**: A → B → przerwa → A → B → przerwa. Grupa z planu (`supersetGroup`) kopiuje się na `LoggedExercise`, logger odpala timer tylko po ostatnim ruchu pary, portal i ETA liczą serie grupy zamiast niezależnych straight setów.

**Copy UI:** „superseria” / „seria” / „po superserii”. Nigdy „runda”.

## Problem

Trener programuje klamrę 1a/1b z copy „bez przerwy”, ale sesja kopiuje ćwiczenia płasko. Logger startuje `restSeconds` po każdym checku, Dziś pokazuje osobne wiersze, `estimateDuration` dolicza przerwę per item. Klient robi straight sets albo walczy z timerem między A i B — plan jest kłamstwem.

## Proponowane rozwiązanie

Jedna prawda: **jedna seria superserii** = jedna seria każdego członka grupy w kolejności `Order`. Przerwa po superserii (`restBetweenSetsSeconds` zsynchronizowane w grupie). Między A i B: 0 s timera. Giant set (3+) = ten sam silnik.

- `LoggedExercise.SupersetGroup` kopiowane przy prefill (sesja nie zależy od żywego dnia).
- DTO sesji: `supersetGroup`, `supersetLabel`, `restSeconds` wspólne dla grupy, mapowane po logged exercise (nie `ExerciseId`).
- Logger: klamra, fokus na partnera, rest tylko gdy zaliczono ostatniego członka bieżącej serii i jest następna praca.
- Kreator: jedno pole „Po superserii”; portal: `1a → 1b` + `N serie`.

Warmupy poza przeplotem (najpierw warmupy A, potem B, potem serie robocze). Intra-round timer = v2.

## Model danych

`LoggedExercise` — nowa kolumna:

```csharp
public int? SupersetGroup { get; set; }
```

Kopia z `PlanItem.SupersetGroup` w `PrefillFromDay`; z źródłowej sesji w `PrefillFromSession`. Swap partnera zostaje w grupie. Stare sesje: `null` = straight (zachowanie sprzed zmiany).

`PlanItem.RestBetweenSetsSeconds` w grupie = jedna wspólna wartość (przerwa po superserii). `RestAfterExerciseSeconds` w grupie nie steruje timerem ani ETA.

Zmiana schematu: migracja EF + reset lokalnego `trainer.db`.

## Kontrakt API

Bez nowych endpointów. Additive w `GET /api/sessions/{id}` i `GET /api/portal/{token}/sessions/{id}` (`Stats.SessionDetail`):

| Pole na ćwiczeniu | Typ | Znaczenie |
|---|---|---|
| `supersetGroup` | `number \| null` | ta sama wartość = jedna klamra |
| `supersetLabel` | `string \| null` | `"1a"` / `"1b"` (null gdy solo) |
| `restSeconds` | `number \| null` | po superserii (wspólne) albo między seriami (solo) |

Typ `LoggedExercise` w `apps/web/lib/api.ts` lustrzany. `PUT` sesji nie wymaga `supersetGroup` od klienta — serwer zachowuje kolumnę przy upsertcie ćwiczeń.

`LoadRestSecondsAsync`: klucz = `LoggedExercise.Id` (albo para `Order`+`ExerciseId`), nie sam `ExerciseId`.

## UI

- Logger: klamra jak w podglądzie planu; siatka SET \| POPRZ. \| KG \| POWT bez zmian; highlight „teraz”; dock/Lock Screen: „Seria n z N” / „Dalej: 1b …”.
- Kreator lista: slot D „Po superserii (s)” sync na grupę; nagłówek `a → b · 90s po superserii`.
- Portal Dziś, DayPreview, SessionReview: grupy zamiast płaskiej listy.
- `estimateDuration` / meta: seria pary = suma pracy członków + 1 rest (bez restu po ostatniej serii grupy jeśli nie ma dalszej pracy — spójnie z timerem).

Teksty po polsku, tokeny mono v2, wyłącznie `api` z `lib/api.ts`. Nigdy słowo „runda” w copy.

## Fazy implementacji

- [x] Faza 1 — `SupersetGroup` + DTO + prefill + ETA/summary
- [x] Faza 2 — `sessionRounds.ts` + SessionLogger (klamra, rest, fokus)
- [x] Faza 3 — kreator „Po superserii” + portal Dziś/preview/review
- [x] Faza 4 — testy + `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Reset `trainer.db` | Seed odtwarza demo; migracja na Postgres |
| Sesje in_progress bez grupy | `null` = straight jak dziś |
| Rampa + superseria | przeplot po `setNumber`; nie blokować |
| Double rest | w grupie ignorować `restAfterExerciseSeconds` w timerze i ETA |
| Nierówne serie | `roundCount` = `max(setCount)`; brakujący partner = solo + rest |

## Changelog

- 2026-08-12 — utworzono spec (seria superserii jako jednostka wykonania, kopia grupy na sesję, rest po parze).
- 2026-08-12 — wdrożono: `LoggedExercise.SupersetGroup`, DTO `supersetLabel` / rest po superserii, `sessionRounds`, klamra w loggerze, pole „Po superserii” w kreatorze, grupy na Dziś/preview/review, ETA.
- 2026-08-12 — copy UI: „superseria” / „seria” / „po superserii”; nigdy „runda”.
