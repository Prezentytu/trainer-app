# Przebudowa panelu trenera (dashboard)

## TLDR

Minimalistyczny, akcyjny panel: 3 KPI tygodnia, jedna scalona lista statusu klientów z ikonami i akcjami 1-klik, bez żargonu i sekcji-duplikatów. API dostaje `clientActivity` + `prsLast7Days`; „Formuła” → „Szablon” w UI.

## Problem

Panel rozprasza uwagę: żargon („churn”, „zgodność zespołu”), nierówne kafelki KPI, heatmapa bez wartości przy małej liczbie sesji, złota karta PR jako mylna dominanta, sekcje duplikujące nawigację. Teksty bez decyzji trenera zajmują miejsce priorytetowe.

## Proponowane rozwiązanie

Odwrócona piramida (status → kontekst → szczegół) jak u TrueCoach / Everfit / CoachRx:

1. 3 równe KPI tygodnia (trenowało X/Y, sesje + delta, nowe PR).
2. Jedna lista „Klienci w tym tygodniu” — wymagający uwagi na górze z akcją 1-klik; reszta ze statusem ikoną.
3. Ostatnie sesje + rekordy PR na dole (gold tylko na badge kg).
4. Usunięcie heatmapy z panelu, karty-pustaka „Wszystko pod kontrolą”, sekcji „Klienci”/„Ostatnie plany”.

## Model danych

Bez zmian schematu / migracji. Agregacje z istniejących `Client`, `Assignment`, `PlanDay`, `WorkoutSession`, `LoggedSet`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response (zmiany) |
|---|---|---|---|
| GET | `/api/dashboard` | — | + `clientActivity[]`, + `prsLast7Days`, + `sessionsLast7Days`, + `sessionsPrev7Days`; − `complianceDates` |

`clientActivity` item: `{ clientId, clientName, sessions7d, lastSessionOn, activePlans, weeklyTarget, portalToken }`.

`weeklyTarget` = liczba dni w pierwszym tygodniu aktywnego planu (null gdy brak planu).

Typy TS w `apps/web/lib/api.ts` lustrzane (camelCase).

## UI

- `apps/web/components/TrainerDashboard.tsx` — nowy layout.
- `apps/web/components/skeletons.tsx` — `DashboardSkeleton` 1:1.
- Rename „Formuła” → „Szablon” w planach / builderze / skeletonach.
- Ikony: `lucide-react` (już w zależnościach). Prymitywy: `PageHeader`, `Card`, `StatBlock`, `Avatar`, `Badge`, `Button`, `IconButton`, `EmptyState`.

## Fazy implementacji

- [x] Faza 1 — backend: rozszerzenie `/api/dashboard` + test
- [x] Faza 2 — frontend: typy + dashboard + skeleton
- [x] Faza 3 — rename Formuła → Szablon + walidacja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| `prsLast7Days` wymaga pełnego przebiegu serii (koszt przy wielu klientach) | Jeden walk chronologiczny w endpointcie; przy skali — osobny cache/job |
| Usunięcie `complianceDates` łamie stary front | Zmiana atomowa front+API; heatmapa klienta używa własnych dat |
| Rename „Formuła” niespójny w copy | Grep po `Formuł` / `formuł` w `apps/web` |

## Changelog

- 2026-08-01 — utworzono spec; decyzje: lista aktywności per klient zamiast heatmapy, Formuła→Szablon.
- 2026-08-01 — wdrożono: `clientActivity` + KPI tygodnia, scalona lista klientów, rename Formuła→Szablon.
