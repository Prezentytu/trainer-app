# Audyt mono v2 — plan naprawczy

## TLDR

Po audycie UI (mono v2 / Styrka / CRO / Apple craft) naprawiamy systemowe łamanie non-negotiables: typografia <12px (w tym w prymitywach), akcenty danych bez glifów, `truncate` na kluczowych nazwach, zepsuty Peak-End sesji, słabe empty states, jeden `backdrop-blur` oraz polish craft (motion Dialog/Sheet, timing, tap targets). Bez zmian API/schematu.

## Problem

Fundament tokenów jest dojrzały, ale dyscyplina wykonania rozjeżdża się:

1. **Typografia <12px** (~54 wystąpienia) — `Badge`/`Pill`/`Marker`/`ListRow`/`StatBlock` i konsumenci.
2. **Akcenty bez glifu** — `text-pr` / `text-gain` / `text-loss` bez ★/▲/▼.
3. **`truncate` na nazwach** planu / klienta / ćwiczenia.
4. **Peak-End** — po ukończeniu sesji redirect na home zamiast `SessionSummaryView`.
5. **Empty states „Brak X"** + `EmptyState` bez CTA.
6. **`/exercises`** — ściana kafelków + `backdrop-blur`.
7. **Craft** — brak motion Dialog/Sheet, timing poza tokenami, cele <44px.

## Proponowane rozwiązanie

Cztery fale od źródła do polish. Respektujemy niezacommitowany redesign portalu (profile/progress).

### Fala A — fundament

- Floor 12px w prymitywach `ui.tsx`; press → `var(--press)`; hover na `Switch`.
- `EmptyState`: `action` wymagane (jawne `null` dla stanów informacyjnych).
- `PortalBottomNav`: ≥12px, tap ≥44px, press.
- `globals.css`: kontrast `--line` ≥3:1; `prefers-reduced-transparency`; usunąć martwe `acid-*`.
- `/exercises`: usunąć blur.

### Fala B — twarde P0

- Glify przy wszystkich akcentach danych.
- `truncate` → `break-words` na nazwach.
- Sweep pozostałych `text-[10px]`/`[11px]`/`[9px]`.
- Martwe `shadow-*`, gradient `LineChart`, inset-shadow → border.

### Fala C — hierarchia P1

- Peak-End → `SessionSummaryView`.
- `/exercises` → hairline lista + skeleton.
- Pomiary → `ListRow`, typografia `.t-*`.
- Empty states edukacyjne + CTA; jedna dominanta CTA; skala `.t-*` w portalu.

### Fala D — craft P2

- Dialog/Sheet motion + focus trap Sheet; drawer AppShell.
- Timing tokeny; focus/press braki; cele dotykowe; drobny polish.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

Dotknięte: `ui.tsx`, `globals.css`, `PortalBottomNav`, AppShell, TrainerDashboard, clients, plans, PlanBuilder/*, SessionLogger, SessionSummaryView, SessionReview, portal (history/progress/measurements/calculator/home), exercises, LineChart, skeletons, landing primitives.

## Fazy implementacji

- [x] Fala A — fundament
- [x] Fala B — P0
- [x] Fala C — P1
- [x] Fala D — P2
- [x] Walidacja `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| `EmptyState` required `action` łamie TS | Jawne `action={null}` w call sites informacyjnych |
| Kontrast hairline zmieni wygląd | Delikatne podbicie `--ink-500` / light `--line` |
| Peak-End zmienia flow sesji | Check-in zostaje jako lekki krok przed summary |
| Lista ćwiczeń zamiast gridu | Skeleton 1:1; zachować thumb w wierszu |

## Changelog

- 2026-08-12 — utworzono spec z listy findingów audytu.
- 2026-08-12 — wdrożono Fale A–D: floor 12px w prymitywach, EmptyState `action` wymagane, PortalBottomNav 44px, kontrast hairline ≥3:1, usunięty blur/acid-*, glify ★/▲/▼, break-words na nazwach, Peak-End → SessionSummaryView, /exercises i pomiary jako hairline, empty states + jedna dominanta CTA, Dialog/Sheet/drawer motion + focus trap, craft polish. Bramka `./scripts/check.sh` zielona.
