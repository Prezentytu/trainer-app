# Kreator planów 1:1 z makietą „WA redesign”

## TLDR

Doprowadzenie kreatora planów do stanu 1:1 z makietą `Kreator planu - WA redesign.dc.html` (ramki 01–06): refaktor na czyste komponenty/hooki, nagłówek z CTA „Przypisz do {imię}”, poziome kolumny dni, wizualne grupy superserii z multi-select, drop-indicator DnD, drawer dodawania ćwiczeń i edytor serii z kolumną „= kg”. Zero zmian backendu/schematu.

## Problem

Mechanika kreatora istnieje (DnD, presety, superserie łańcuchowe, autosave, composer), ale wygląd i podział komponentów odbiegają od makiety WA. `PlanBuilder.tsx` (~650 linii) miesza stan, DnD, persystencję i layout.

## Proponowane rozwiązanie

### Mapa ramka → komponent

| Ramka | Komponenty |
|---|---|
| 01 góra | `PlanHeader`, `WeekTabs`, `CopyWeekPopover`, `AssignDialog` |
| 01 dół | `DayBoard`, `DayColumn`, `DayHeader`, `ExerciseCard`, `SupersetGroup` |
| 02 | `ExerciseEditor` (grid 3 pól + Zaawansowane + Switch „Rozpisz serie”) |
| 03 | `SetSchemeEditor` (chipy METODA, tabela z `= kg`) |
| 04 | `SelectionBar` + multi-select checkboxy |
| 05 | `DropIndicator` + ghost `DragOverlay` |
| 06 | `ExerciseDrawer` |

### Hooki (bez UI)

- `usePlanDraft` — stan `days` + mutatory
- `usePlanPersistence` — autosave, submit, `buildPlanInput`
- `useBuilderDnd` — sensors, handlery, drop target

### Adaptacje vs makieta

- RIR jako główna intensywność (RPE pomocniczo)
- Filtry typów ćwiczeń zamiast grup mięśniowych
- Bez markerów deload/peak i badge PR (brak danych w modelu)

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian. Wykorzystanie: `api.plans`, `api.exercises`, `api.assignments`, `api.clients`.

## UI

Pliki w `apps/web/components/plan-builder/` + strony `/plans/new`, `/plans/[id]`.

## Fazy implementacji

- [x] Faza 1 — refaktor na hooki
- [x] Faza 2 — PlanHeader + WeekTabs
- [x] Faza 3 — DayBoard / ExerciseCard / SupersetGroup
- [x] Faza 4 — ExerciseEditor + SetSchemeEditor
- [x] Faza 5 — multi-select + DropIndicator
- [x] Faza 6 — ExerciseDrawer
- [x] Faza 7 — bramka + changelog

## Ryzyka i wpływ

- Reorder przy „Połącz” dla niesąsiadujących zaznaczeń — kolejność względna, wstawienie w pozycji pierwszego.
- Drop-indicator — aktualizacja tylko przy zmianie indeksu docelowego.
- Refaktor fazy 1 — bramka obowiązkowa przed zmianami wizualnymi.

## Changelog

- 2026-07-29 — utworzono spec.
- 2026-07-29 — wdrożono: hooki usePlanDraft/usePlanPersistence/useBuilderDnd, PlanHeader+AssignDialog+CopyWeekPopover, DayBoard 300px, ExerciseCard/Editor, SupersetGroup, SelectionBar, DropIndicator, ExerciseDrawer, SetSchemeEditor z „= kg”.
