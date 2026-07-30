# Inline tworzenie ćwiczenia w kreatorze planu

## TLDR

Trener wpisuje nieistniejącą nazwę w composerze kreatora i jednym Enterem tworzy ćwiczenie w bibliotece oraz wstawia je do dnia — bez opuszczania kreatora. Tab otwiera mini-formularz (typ czas/dystans). Backend waliduje pustą nazwę i chroni przed duplikatami (case-insensitive).

## Problem

W `ListComposer` / `QuickComposer` brak dopasowania kończy się linkiem do `/exercises`. Nawigacja poza kreator gubi draft nowego planu (stan tylko w React). To ślepa uliczka w środku najgęstszego przepływu produktu.

## Proponowane rozwiązanie

1. **Rząd „Utwórz”** jako stała opcja dropdownu composera (nie komunikat błędu): Enter = POST + wstaw do dnia; Tab = mini-dialog ze szczegóły (typ).
2. Parametry z quick-entry (`3x8`, tempo, RIR) dziedziczone do biblioteki i pozycji.
3. Biblioteka w kreatorze: `useState` + `useRef` + stabilny `getExerciseById` — unika wyścigu, w którym `addItem` widzi starą listę po POST.
4. Akcje przez `ExerciseLibraryContext` (bez prop-drillingu przez ListView / DayBoard / PlanTable).
5. API: trim nazwy, 400 przy pustej, 409 przy duplikacie; przy 409 frontend dociąga listę i używa istniejącego.

## Model danych

Bez zmian schematu. Encja `Exercise` i `ExerciseInput` bez nowych pól.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/exercises` | `ExerciseInput` | `201` Exercise; `400` `{ message }` (pusta nazwa); `409` `{ message }` (duplikat) |
| PUT | `/api/exercises/{id}` | `ExerciseInput` | `200` Exercise; `400` / `409` jak wyżej; `404` |

Frontend: `api.exercises.create` / `update` bez zmian sygnatur; obsługa `message` już w `request<T>()`.

## UI

- `CreateExerciseRow` — rząd w dropdownie / drawerze / pickerze.
- `NewExerciseDialog` — na `Dialog` z `ui.tsx`: nazwa, typ (`SegmentedControl`), serie, powt/czas/dystans, przerwa; tryby create i edit (toast „Popraw szczegóły”).
- `ListComposer`, `QuickComposer`, `ExerciseDrawer`, `ExercisePicker` — bez linków wyprowadzających z kreatora (`target="_blank"` tylko przy opcjonalnym „Otwórz bibliotekę”).
- Toast: `Nowe ćwiczenie „X” w bibliotece` + `Popraw szczegóły`.

## Fazy implementacji

- [x] Faza 1 — backend: walidacja POST/PUT + `ExercisesEndpointsTests`
- [x] Faza 2 — frontend: `exerciseDraft`, `useExerciseLibrary`, `getExerciseById` w `usePlanDraft`, kontekst
- [x] Faza 3 — UI: rząd „Utwórz”, dialog, composerzy, drawer/picker, wiring w `PlanBuilder`

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Cicha utrata pozycji po POST (stare domknięcie `exercises`) | Lookup przez ref (`getExerciseById`) |
| Duplikaty przy podwójnym Enter | Flaga `creating` + 409 → reuse istniejącego |
| Autosave z fikcyjnym `exerciseId` | Czekamy na realne `201` przed `addItem` |
| Strona `/exercises` dostaje 409 na duplikat | Świadoma zmiana; UI już pokazuje `message` |

## Changelog

- 2026-07-29 — utworzono spec.
- 2026-07-29 — wdrożono: walidacja API + inline tworzenie w kreatorze (Enter / Tab / dialog / toast).
