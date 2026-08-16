# Odzyskiwanie importu i korekta historii

## TLDR

Draft planu z historii nie może ginąć przy cofnięciu z kreatora — punkt wejścia „Złóż plan z historii” liczy z bazy. W kreatorze `prescribedSets` jest jedynym źródłem prawdy (rampa materializuje serie z docelowym ciężarem). Trener poprawia źle rozpoznane ćwiczenie w całej historii klienta i edytuje maxy. Zakładka Wyniki zostaje skanowalna przy setkach rekordów.

## Problem

- Draft planu jedzie przez `sessionStorage` i `consumeImportHandoff()` kasuje go przy pierwszym odczycie. Cofnięcie z kreatora = pusto.
- Po zatwierdzeniu importu `ClientHistoryImport.status = "applied"`, więc pending znika i wizard startuje od kroku 1. Generowanie planu jest możliwe tylko w trakcie importu, z sesjami z pamięci przeglądarki — mimo że `HistoryImport.Analyze` nie potrzebuje AI.
- Gałąź importu w `/plans/new` nie przekazuje `assignTo`, więc plan nie przypina się do klienta.
- Korekta ćwiczenia istnieje tylko per sesja. Nie da się podmienić SDL → RDL w całej historii. Maxów nie da się edytować (jest POST i DELETE).
- Rekordy to nieskończona lista kart bez wyszukiwania, filtrów i limitu. Zdjęcia postępu są na górze zakładki Wyniki.
- Rampa w kreatorze czyści serie, chowa tabelę i zostawia martwe pole ciężaru. Klient dostaje puste kg, bo seria `ramp` nie dziedziczy topu.

## Proponowane rozwiązanie

1. **Plan z historii z bazy.** `HistoryImport.FromWorkoutSessions` mapuje ukończone sesje. `POST /api/clients/{id}/plan-from-history` zwraca istniejące `HistoryImportAnalyzeResult`. Przycisk na profilu i ekran „gotowe” po imporcie. Handoff w `sessionStorage` jest nieniszczony (`read` / `clear` po zapisie).
2. **`prescribedSets` = źródło prawdy.** Rampa jest generatorem tabeli serii (rozbieg + top + BO), nie trybem wykluczającym edycję. `setScheme` to etykieta z serii. `PlanLoads.ComputedSetLoad` daje fallback topu dla `ramp`/`top`.
3. **Remap + edycja maxa.** `POST .../exercises/{id}/remap` przepisuje `LoggedExercise` i `ClientMax` klienta. `PUT /api/maxes/{id}` uzupełnia CRUD.
4. **Wyniki przy skali.** Rekordy i maxy: search, chipsy kategorii, sort, limit 8 + doładowanie. Zdjęcia na końcu, zwinięte.
5. **Import QoL.** PUT draftu pending, nadpisywanie pending zamiast sierot, usuwanie treningu w review i sesji w `SessionReview`.

Bez zmian schematu bazy — żadnej migracji EF.

## Model danych

Bez nowych encji. Istniejące pola:

- `PlanSet`: `role`, `loadKg`, `loadPercent`, `percentOf`, `tempo`, `targetRpe`, `targetRir`, `note`, `durationSeconds`, `distanceMeters`
- `ClientMax`: `MaxKg`, `MeasuredOn`, `Note`
- `LoggedExercise.ExerciseId`, `ClientHistoryImport.DraftJson` / `Status`

Nowe input DTO w `Dtos.cs`:

```csharp
public record PlanFromHistoryInput(double TopKgDelta = 2.5, int SinceDays = 120);
public record ExerciseRemapInput(int TargetExerciseId);
public record ClientMaxUpdateInput(double MaxKg, DateOnly MeasuredOn, string? Note = null);
```

`PUT` draftu importu przyjmuje istniejące `HistoryImportDraft`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/clients/{id}/plan-from-history` | `PlanFromHistoryInput` | `HistoryImportAnalyzeResult` |
| POST | `/api/clients/{id}/exercises/{exerciseId}/remap` | `ExerciseRemapInput` | `{ sessions, sets, maxes }` |
| GET | `/api/clients/{id}/exercises/{exerciseId}/usage` | — | `{ sessions, sets, firstOn, lastOn }` |
| PUT | `/api/maxes/{id}` | `ClientMaxUpdateInput` | `{ id }` |
| PUT | `/api/clients/{id}/history-imports/{importId}` | `HistoryImportDraft` | `{ id }` |
| GET | `/api/clients/{id}/records` | — | jak dziś + `category`, `lastPerformedOn`, `sessionCount` |

Zachowanie:

- `plan-from-history`: ukończone sesje z `SinceDays` (domyślnie 120). Brak sesji → `400` `{ message: "Brak treningów w historii — wgraj je albo wpisz trening." }`.
- `remap`: własność klienta + obu ćwiczeń (własne trenera lub wspólne). `target == source` → `409` z polskim komunikatem. Przepisuje `LoggedExercise.ExerciseId` i `ClientMax.ExerciseId` tego klienta. Danych nie kasuje.
- `POST /api/clients/{id}/history-imports`: nadpisuje najnowszy wiersz `pending` zamiast tworzyć kolejny.
- `ComputedSetLoad`: seria `role` `ramp` \| `top` bez `LoadKg` i bez `LoadPercent` bierze `TopLoadKg(item)`.

Typy i metody w `apps/web/lib/api.ts` (lustrzane, camelCase):

- `api.clients.planFromHistory(clientId, { topKgDelta, sinceDays })`
- `api.clients.remapExercise(clientId, exerciseId, { targetExerciseId })`
- `api.clients.exerciseUsage(clientId, exerciseId)`
- `api.clients.updateMax(id, { maxKg, measuredOn, note })`
- `api.clients.updateHistoryImport(clientId, importId, draft)`
- `ClientRecord` + `category`, `lastPerformedOn`, `sessionCount`

## UI

Panel trenera, tokeny mono v2, prymitywy z `ui.tsx`. Teksty po polsku — CTA = czasownik + obiekt.

- Profil klienta, zakładka Plany: przycisk **Złóż plan z historii** (gdy są sesje) + empty state. Dialog: „Na najcięższej serii: bez zmian / +2,5 kg”.
- Wizard importu: krok `done` po zapisie — podsumowanie + „Złóż plan z tych treningów” / „Wróć do profilu”.
- Kreator: `RampControls` we wszystkich trzech widokach. Tabela serii z nagłówkami Seria · Powtórzenia · Ciężar. Szablony po sygnaturze, undo po zastosowaniu.
- Rekordy / maxy: `ClientRecordsSection`, `ClientMaxesSection` — search, chipsy, sort, limit 8. Akcje: „To nie to ćwiczenie”, „Popraw serię”, „Edytuj” max.
- Wyniki: Ostatnio → Podsumowanie → Zastój → Rekordy → Maxy → Trendy → Objętość → Pomiary → Zdjęcia (zwinięte).
- `HistoryImportReview`: „Usuń ten trening z importu”. `SessionReview`: „Usuń trening” z potwierdzeniem.

## Fazy implementacji

Każda faza kończy się działającą aplikacją i przechodzi bramkę walidacyjną.

- [x] Faza 1 — spec
- [x] Faza 2 — backend: helper, endpointy, `PlanLoads`, nadpisywanie pending
- [x] Faza 3 — handoff + plan z historii + krok `done`
- [x] Faza 4 — kreator: rampa, tabela, presety, parytet, podgląd
- [x] Faza 5 — remap, edycja maxa, rekordy/maxy, kolejność Wyników
- [x] Faza 6 — import QoL + testy + `./scripts/check.sh` + lekcja

## Ryzyka i wpływ

| Scenariusz | Groźba | Mitygacja | Residual |
|---|---|---|---|
| Cofnięcie z kreatora nadal gubi draft | Trener traci pracę | `readImportHandoff` nie kasuje; `clear` tylko po zapisie | Inna karta / inna przeglądarka i tak nie widzi `sessionStorage` — plan z historii jest wtedy z bazy |
| Remap na złe ćwiczenie | Historia i maxy pod niewłaściwą nazwą | Dialog z `usage` (liczba treningów i maxów); dane nie są kasowane | Cofnięcie = remap z powrotem |
| Dwa pending importy | Sieroty, zły draft po odświeżeniu | POST nadpisuje najnowszy pending; PUT zapisuje review | Stare `pending` sprzed wdrożenia zostają — trener dismissuje ręcznie |
| Rampa nadpisze ręczny rozpis | Utrata serii | `applyRamp` zachowuje istniejące wiersze i dopisuje brakujące role; undo na szablonie | Świadome kliknięcie szablonu nadpisuje — toast Cofnij |
| Portal czyta nowy kształt rekordów | Pęknięcie typu | Pola tylko dodane; istniejące zostają | Stary cache frontu ignoruje nowe pola |
| Prefill sesji z rampy bez kg | Klient widzi puste pole | Fallback `ComputedSetLoad` → `TopLoadKg` | Rampa bez topu i bez `item.LoadKg` nadal pusta — UI każe ustawić docelowy ciężar |

Poza zakresem: nowe typy schematów (piramida, dropset, cluster, myo-reps), automatyczne przenoszenie ciężarów między tygodniami 6-4-2-5-3-1, wirtualizacja listy rekordów, migracja EF.

## Changelog

- 2026-08-16 — utworzono spec (plan z historii z bazy, prescribedSets jako prawda, remap, Wyniki przy skali).
- 2026-08-16 — wdrożono: `plan-from-history` + handoff `read`/`clear`, rampa materializuje `prescribedSets`, remap i PUT maxa, rekordy/maxy ze search/limitem, krok `done` i PUT draftu importu.
