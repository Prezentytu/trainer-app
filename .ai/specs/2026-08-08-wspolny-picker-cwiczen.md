# Wspólny picker ćwiczeń (ExerciseCombobox)

## TLDR

Jeden wspólny komponent `ExerciseCombobox` (typeahead + „+ Utwórz” inline) zastępuje natywne `<select>` w importerze planu i formularzu maxów 1RM — ten sam UX co w kreatorze planu: wpisz literę, wybierz lub utwórz ćwiczenie.

## Problem

Poza kreatorem planu wybór ćwiczenia to długi `<select>` bez wyszukiwania. W importerze przy braku w bibliotece osobny przycisk tworzy tylko pod nazwą z AI (bez poprawki). W maxach 1RM `maxExerciseId` startuje jako `""` bez opcji pustej — submit jest cichym no-opem.

## Proponowane rozwiązanie

- `ExerciseCombobox` — samowystarczalny (bez `ExerciseLibraryProvider`): stany resolved/unresolved, `matchExercisesByName` z `foldDiacritics`, wiersz `CreateExerciseRow`, create przez `createOrReuseExercise`.
- Importer: combobox z `suggestedName` z AI, „Utwórz wszystkie brakujące (N)”, auto-mapowanie duplikatów nazw.
- Maxy 1RM: combobox z inline-create + komunikat „Wybierz ćwiczenie.”
- Kreator planu bez zmian (QuickComposer / ListComposer / ExerciseDrawer).

## Model danych

Bez zmian encji / migracji.

## Kontrakt API

Bez nowych endpointów. Istniejące: `GET/POST /api/exercises`.

## UI

- `apps/web/components/ExerciseCombobox.tsx` — nowy
- `apps/web/components/CreateExerciseRow.tsx` — przeniesiony z `plan-builder/`
- `apps/web/lib/exerciseSearch.ts` — `matchExercisesByName`
- `apps/web/lib/exerciseLibrary.ts` — `createOrReuseExercise`
- `apps/web/app/(app)/plans/import/page.tsx`
- `apps/web/app/(app)/clients/[id]/page.tsx`

## Fazy implementacji

- [x] Faza 1 — helpery + CreateExerciseRow + ExerciseCombobox
- [x] Faza 2 — importer + maxy 1RM
- [x] Faza 3 — `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Duplikaty nazw przy bulk create w imporcie | sekwencyjne tworzenie + `createOrReuseExercise` (409 → reuse) |
| Menu ucięte przez overflow | portal + `position: fixed` + auto-flip (jak QuickComposer) |
| Regresja kreatora | kreator nietknięty poza importem `CreateExerciseRow` |

## Changelog

- 2026-08-08 — utworzono spec; wdrożenie Etapu A.
