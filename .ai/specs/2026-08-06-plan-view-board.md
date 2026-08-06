# Widok planu — board dni + panel szczegółów

## TLDR

Przebudowa `/plans/[id]` na minimalistyczny board (jak Jira / FitPros): kolumna = dzień, karta = ćwiczenie z jedną linią schematu. Szczegóły (serie, tempo, %1RM, RIR, notatki) otwierają się w panelu po kliknięciu. Bez zmian API / schematu.

## Problem

Obecny widok renderuje wszystko naraz: siatkę kart dni `minmax(18rem,1fr)` i w każdej karcie 6-kolumnową tabelę serii. Tabela (~500px min-content) nie mieści się w kolumnie (~288px) — stąd rozjazd. Trener skanuje: *czy to ten plan → co w którym dniu → dopiero rozpis jednego ćwiczenia*. Trzeci poziom to <5% czasu, a zajmuje większość pikseli.

## Proponowane rozwiązanie

Read-only board wizualnie spójny z kreatorem (`DayBoard` / `DayColumn`):

1. **Plan** — dwa pasy chrome (`Toolbar` + pasek tygodni): tytuł + badge szablonu + avatary; prawa `···` (opis) + `Edytuj plan`. Meta `N dni · M ćwiczeń` w pasie 2. Bez `PageHeader`.
2. **Tydzień** — same cyfry w pigułkach (bez „Tydzień x z y”); scroll poziomy.
3. **Dzień** — kolumna `md:w-[300px]`. Nagłówek + mono `N ćwiczeń · M serii · ~X min`.
4. **Ćwiczenie** — karta: nazwa + jedna linia `schemeLine`. Superserie: hairline + monogram `A1` (bez hue chrome).
5. **Szczegóły** — panel (bottom sheet mobile / prawy panel desktop): hairline wiersze serii, meta, link do ćwiczenia.

Nowe pliki w `apps/web/components/plan-view/`. Strona chudnie do orkiestracji stanu `selectedItemId`.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian. Używane istniejące: `GET /api/plans/{id}`, `GET /api/assignments`.

## UI

- Strona: `apps/web/app/(app)/plans/[id]/page.tsx`
- Komponenty: `apps/web/components/plan-view/{summary,PlanBoard,PlanDayColumn,PlanItemCard,PlanItemPanel}.ts(x)`
- Skeleton: `PlanDetailSkeleton` 1:1 z boardem
- Prymitywy: `Toolbar`, `OverflowMenu`, `Badge`, `Button`, `Avatar`, `EmptyState`, `Icon`
- Edycja: `PlanToolbar` + `WeekTabs` (ten sam kształt dwóch pasów; rzadkie akcje w `···`)

## Fazy implementacji

- [x] Faza 1 — `summary.ts` + nagłówek planu + board (kolumny + karty)
- [x] Faza 2 — `PlanItemPanel` + a11y + przepisanie strony
- [x] Faza 3 — skeleton, empty state, walidacja, lekcja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Panel zasłania board na wąskim desktopie | Od `md:` panel 380px; board scrolluje poziomo jak w kreatorze |
| Utrata widoczności serii „na pierwszy rzut” | Karta pokazuje schemat; jeden klik = szczegóły (Hick / progressive disclosure) |
| Superserie z `accent` = biała ramka w mono | Hairline + monogram litery grupy |

## Changelog

- 2026-08-06 — utworzono spec; decyzja: board + panel (nie lista jednokolumnowa / nie inline expand).
- 2026-08-06 — wdrożono: `components/plan-view/*`, przepisany `/plans/[id]`, skeleton 1:1, lekcja; `./scripts/check.sh` zielony.
