# Kreator: hierarchia, porządki UI i niezawodność

## TLDR

Kreator planów (edycja zestawu) dostaje szerszą przestrzeń roboczą, arkuszową tabelę serii i czytelną hierarchię. Portal i karty planu gubią szum: dublowane nazwy EN, surowe enumy, RIR 0 / przerwa 0 s. Zapis planu merge'uje dni po Id, żeby sesje i override'y klienta przeżyły edycję.

## Problem

Edycja zestawu to rdzeń produktu, ale kreator jest ciasny, tabela serii się rozjeżdża, a karta/portal pokazują teksty developerskie i dwujęzyczne nazwy. PUT planu kasuje i odtwarza dni — sesje tracą `PlanDayId`, override'y harmonogramu znikają.

## Proponowane rozwiązanie

Trzy warstwy, bez zmiany schematu encji:

1. **Ergonomia kreatora (A)** — szersze kontenery, płynna siatka serii, pola zaawansowane inline, numeracja rozgrzewki `R1`/`R2`.
2. **Porządki UI (B)** — helper nazw PL/EN, polskie role, sanityzacja `setScheme`, ukrycie zer, containment na mobile.
3. **Niezawodność (C)** — merge dni przy PUT, undo przy czyszczeniu serii, parytet Listy, akcje na dotyku, widoczny błąd autosave, „Zamień ćwiczenie".

## Model danych

Bez nowych encji. `PlanDay` / `PlanItem` / `PlanSet` bez zmian schematu.

Builder trzyma opcjonalne `id` wczytanych dni i pozycji i wysyła je w PUT, żeby backend mógł zmergować zamiast `RemoveRange`.

## Kontrakt API

`PUT /api/plans/{id}` — input dni i pozycji dostaje opcjonalne `id`. Brak `id` = nowy rekord. Istniejące Id są aktualizowane w miejscu; usuwane tylko te, których nie ma w payloadzie.

Typy w `apps/web/lib/api.ts` lustrzane (`PlanDayInput.id?`, `PlanItemInput.id?`).

## UI

- Kreator: `ListView`, `DayColumn`, `SidePanel`, `SetRow`, `SetSchemeEditor`, `ExerciseEditor`, `RampControls`, `ListEntryEditor`, `ListEntryCard`, `ExerciseCard`.
- Widok planu: `PlanItemCard`, `PlanItemPanel`, `PlanDayColumn`, `SupersetGroup`.
- Portal: `ExercisePreviewList`, `SessionLogger`.
- Helper: `apps/web/lib/exerciseName.ts`.

## Fazy implementacji

- [x] Faza A — przestrzeń, tabela serii, hierarchia edytora, numeracja
- [x] Faza B — nazwy, copy, zera, superserie, portal mobile
- [x] Faza C — merge PUT, undo serii, parytet Listy, touch, autosave, zamiana ćwiczenia
- [x] Faza D — test integracyjny C1 + `./scripts/check.sh`

## Ryzyka i wpływ

| Scenariusz | Groźba | Mitygacja |
|---|---|---|
| Merge PUT źle dopasuje Id | Dwa dni z tym samym Id / utrata pozycji | Match tylko Id należące do planu; reszta = insert |
| Helper nazw rozetnie prawdziwy nawias (np. ciężar) | Ucięta nazwa | Regex: końcowy nawias z literami, nie samymi cyframi |
| Ukrycie RIR 0 | Trener nie widzi „do upadku" na karcie | Wartość zostaje w edytorze serii |

## Changelog

- 2026-08-18 — utworzono spec.
- 2026-08-18 — wdrożono A/B/C: przestrzeń i arkusz serii, helper nazw, merge PUT po Id, undo serii, parytet Listy, touch, autosave, zamiana ćwiczenia.
