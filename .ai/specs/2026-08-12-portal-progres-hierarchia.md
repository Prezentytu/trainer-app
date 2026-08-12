# Portal Progres — hierarchia i affordance

## TLDR

Reorganizacja zakładki Progres w portalu klienta: odwrócona piramida (KPI → highlight → spójność → trendy → rekordy → narzędzia), czytelny wiersz kalkulatora %1RM, jeden system nagłówków sekcji. Bez zmian API.

## Problem

Ekran `/portal/[token]/progress` ma płaską hierarchię (wszystkie sekcje hairline + ten sam mono-caps), goły link „Kalkulator %1RM" bez affordance, zdublowane nagłówki aktywności oraz redundancję słupków tygodniowych i kalendarza. Negatyw („Bez progresu") pojawia się przed pozytywem („Największy progres").

## Proponowane rozwiązanie

Wzorce Gravitus / Hevy / Strong / Styrka + skille `design-system`, `fitness-ui-ux`, `senior-ux-cro`:

1. **KPI strip** — etykieta streaka „Seria tygodni".
2. **Highlight** — „Największy progres" jako jedyna karta `Card` (surface + hairline) nad „Bez progresu".
3. **Spójność** — jedna sekcja z `SegmentedControl` `Tygodnie | Kalendarz` (progressive disclosure).
4. **SectionHeader** — lokalny, tytuł + opcjonalny sufiks okna (np. `12 TYG.`).
5. **Narzędzia** — kalkulator jako `Link`-wiersz z ikoną, podtytułem i chevronem na dole strony.
6. **WeeklyActivityBar** — prop `showHeader` (default `true`), na Progres wyłączony.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian — istniejące `sessions`, `records`, `muscleVolume`, `trends`, `mostImproved`, `stagnation`, `exerciseStats`.

## UI

- Strona: `apps/web/app/portal/[token]/progress/page.tsx`
- Prymitywy: `Card`, `StatBlock`, `SegmentedControl`, `EmptyState`, `Icon`
- Komponent: `WeeklyActivityBar` (`showHeader`)
- Ikona: `calculator` w `Icon.tsx` (Phosphor)

Kolejność sekcji: Header → KPI → Największy progres → Bez progresu → Spójność → Tonaż → Objętość mięśniowa → Rekordy → Narzędzia.

## Fazy implementacji

- [x] Faza 1 — spec + restrukturyzacja UI (bez API)
- [ ] Faza 2 (opcjonalnie, później) — globalny przełącznik zakresu 4/8/12 tyg. dla trendów

## Ryzyka i wpływ

- SegmentedControl spójności ukrywa kalendarz za jednym tapnięciem — akceptowalne (progressive disclosure); domyślnie widoczne są słupki (ważniejsze do skanowania trendu).
- Przeniesienie kalkulatora na dół — affordance rośnie, odkrywalność lekko spada; kompensacja: wyraźny wiersz-karta w sekcji „Narzędzia".

## Changelog

- 2026-08-12 — utworzono spec; wdrożono hierarchię UI.
