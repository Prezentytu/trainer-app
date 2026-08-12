# Poprawki UX sesji treningowej (portal klienta)

## TLDR

Cztery poprawki frontendowe w portalu klienta: estetyczny stan ładowania CTA „Rozpocznij trening”, przycisk „Gotowe” przy notatkach, czytelny ciężar hantli jako `2×15 kg` (konwencja: waga jednej hantli) oraz padding/scroll, żeby klawiatura nie zasłaniała ostatniej serii ani notatki.

## Problem

1. Po tapnięciu „Rozpocznij trening” przycisk dostaje `disabled` → `opacity-45` i wygląda na wyłączony, zanim pojawi się widok sesji.
2. Notatki (ćwiczenie / trening / seria) mają autosave bez przycisku zatwierdzenia — użytkownik nie wie, jak zamknąć edycję.
3. Przy hantlach waga jest jedną liczbą; niejasne, czy to na sztukę, czy na parę.
4. Przy edycji ostatniej serii / notatki do treningu klawiatura iOS zasłania pole — statyczny `pb-40` nie wystarcza.

## Proponowane rozwiązanie

### 1. CTA — stan loading

- `Button`: przy `loading` pełna nieprzezroczystość (spinner + `aria-busy`); `opacity-45` tylko dla zwykłego `disabled`.
- `PortalStickyCta.loading` → `PortalBottomNav`.
- Po sukcesie `start()` / `repeatLast()` nie resetować flagi — stan „Startuję…” do odmontowania strony.

### 2. Notatki — „Gotowe” w docku

- `SessionLogger` śledzi fokus pól notatek (`noteActive`).
- `SessionDock` pokazuje primary „Gotowe” (jak przy serii); blur + zamknięcie edycji; autosave bez zmian.

### 3. Hantle — konwencja jednej hantli

Benchmark (Gravitus / Hevy / Built With Science): wpisujemy **wagę jednej hantli**. Tonaż liczy wpisaną wartość (bez ×2) — spójność > teoretyczna objętość.

- Helper `apps/web/lib/weight.ts`: `isDumbbellPair` (`equipment` zawiera `dumbbell` i `!isUnilateral`), `formatPairWeight` → `2×15 kg`.
- Etykieta w: home (`schemeLine`), meta ćwiczenia w loggerze, PR/summary gdzie widać kg, review trenera (Cel/Wynik).
- Kolumna POPRZ. bez zmian (`15×12`).
- PlanBuilder: przy polu ciężaru dopisek „na hantlę”.
- Ograniczenia: goblet (jedna hantla) może dostać mylące `2×`; stare plany wpisane „na parę” — ręczna korekta trenera, bez migracji.

### 4. Klawiatura

- Dynamiczny `paddingBottom` = baza docka + `useKeyboardInset()`.
- `scrollIntoView({ block: "center" })` przy bezpośrednim fokusie KG/POWT i notatek (z uwzględnieniem `prefers-reduced-motion`).

## Model danych

Bez zmian encji / schematu.

## Kontrakt API

Bez zmian endpointów. Home portalu może dodatkowo pobrać `api.portal.exercises` wyłącznie do mapowania `exerciseId → equipment` (frontend).

## UI

- `apps/web/components/ui.tsx` — `Button` loading
- `apps/web/components/portal/PortalChrome.tsx` + `PortalBottomNav.tsx`
- `apps/web/app/portal/[token]/page.tsx`
- `apps/web/components/SessionLogger.tsx` + `session/SessionDock.tsx`
- `apps/web/lib/weight.ts` (nowy)
- `SessionSummaryView` / `SessionReview` / PlanBuilder (etykiety ciężaru)

## Fazy implementacji

- [x] Spec
- [x] CTA loading
- [x] Notatki Gotowe + keyboard inset/scroll
- [x] Hantle helper + miejsca wyświetlania
- [x] Walidacja web (lint / typecheck / build)

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Goblet / jedna hantla → `2×` | `isUnilateral` wyłącza; brak osobnego sprzętu „single DB” — akceptujemy |
| Stare plany z wagą na parę | Brak migracji; trener poprawia load |
| iOS visualViewport różnice | Istniejący `useKeyboardInset` + opóźniony scroll |

## Changelog

- 2026-08-12 — utworzono spec i wdrożono: CTA loading, Gotowe przy notatkach, `2×15 kg` dla hantli, dynamiczny padding + scroll pod klawiaturą.
