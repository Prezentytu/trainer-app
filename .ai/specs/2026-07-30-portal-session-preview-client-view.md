# Portal: podgląd sesji, czas treningu i redesign widoku klienta

## TLDR

Historia w portalu otwiera podgląd ukończonej sesji (z opcją „Popraw wyniki") zamiast pełnego loggera. Na karcie „Dziś" pokazujemy szacowany czas treningu. Widok klienta u trenera dostaje hero z kluczowymi metrykami (bez duplikacji), start następnego dnia planu oraz minimalistyczny sparkline trendu siły („Szacowany max").

## Problem

1. Klik w ukończony trening w Historii portalu montuje `SessionLogger` w trybie edycji — live clock od starego `createdAt`, przycisk „Zakończ".
2. Klient nie wie, ile mniej więcej zajmie trening.
3. Strona klienta u trenera duplikuje liczniki (stat-karty = zakładki), formularz przypisania zawsze rozwinięty, brak sygnałów „kiedy ostatnio / czy regularnie / czy postęp", „Loguj trening" zawsze startuje pierwszy dzień planu.
4. Endpoint trendu e1RM istnieje, brak UI; słowo „e1RM" jest nieczytelne dla laika.

## Proponowane rozwiązanie

Frontend-only (bez zmian schematu / nowych endpointów poza użyciem istniejącego `GET /api/clients/{id}/exercises/{exerciseId}/stats`):

- `SessionSummaryView` dla `status === "completed"`; lokalny tryb edycji → `SessionLogger` z `completedEdit`.
- Helper `estimateDayMinutes` (heurystyka jak w kreatorze) + realny czas w Historii.
- Hero klienta: aktywny plan + StatBlocki (ostatni trening, treningi 30d, PR 30d); zwijany formularz przypisania; start następnego niezrobionego dnia.
- `TrendSparkline` (inline SVG) w zakładce Rekordy; słownictwo „Szacowany max" (portal) / „Szacowany max (e1RM)" (trener).

## Model danych

Bez zmian encji. Używamy istniejących pól: `WorkoutSession.Status`, `DurationSeconds`, `PlanItem.sets` / `restBetweenSetsSeconds` / `prescribedSets`, odpowiedź stats z `trend[]`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/clients/{id}/exercises/{exerciseId}/stats` | — | `ExerciseStats` (już istnieje; dodajemy typ + metodę w `api.ts`) |

Pozostałe endpointy bez zmian.

## UI

- Portal: `apps/web/app/portal/[token]/page.tsx`, `…/session/[sessionId]/page.tsx`
- Komponenty: `SessionSummaryView.tsx`, `TrendSparkline.tsx`, `lib/estimateDuration.ts`
- Trener: `apps/web/app/clients/[id]/page.tsx`
- `SessionLogger.tsx` — prop `completedEdit`

## Fazy implementacji

- [x] Faza 1 — portal: podgląd sesji + szacowany/realny czas
- [x] Faza 2 — trener: hero, plany, historia, sparkline Rekordów
- [x] Faza 3 — walidacja (lint / typecheck / build)

## Ryzyka i wpływ

- Edycja ukończonej sesji woła ponownie `complete` — backend nie nadpisuje `DurationSeconds` gdy już ustawione; OK.
- Heurystyka czasu to przybliżenie — etykieta z `~` i zaokrąglenie do 5 min.
- Sparkline tylko u trenera (endpoint bez tokenu portalowego).

## Changelog

- 2026-07-30 — utworzono spec.
- 2026-07-30 — wdrożono: SessionSummaryView, estimateDuration, redesign klienta (hero + następny dzień), TrendSparkline + „Szacowany max”.
