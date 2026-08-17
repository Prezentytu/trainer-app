# Kreator planów — aesthetic minimalism

## TLDR

Chrome kreatora planów (Lista / Tablica / Arkusz / Progresja) przestaje opisywać nieistnienie treści. Kontrolki dnia (Pn–Nd, notatka, duplikuj, usuń) znikają do jednego popovera przy nazwie dnia. Statystyki i empty state pojawiają się tylko gdy mają co powiedzieć. Bez zmian API, schematu i modelu draftu.

## Problem

Przy planie z zerową liczbą ćwiczeń widok Tablica renderuje: 28 chipów dni tygodnia, 4 przyciski „Zastosuj te dni do pozostałych tygodni”, 4 identyczne empty state’y, 4 linie „0 ćwiczeń · 0 serii · ~5 min” (kłamstwo — `formatDurationApprox(0)` zaokrągla do 5) i 4 composery z dwiema ikonami każdy.

Trzy reguły z researchu, które łamiemy:

- **Notion** — lokalizacja kontrolki komunikuje jej zasięg. Chipy Pn–Nd mają zasięg jednego dnia, ale są wyrenderowane 4×, więc czytają się jak ustawienie tygodnia.
- **Trello** — front karty pokazuje tylko to, co istnieje. Kolumna bez kart ma jedną linijkę, nie ilustrację z instrukcją.
- **Linear** — jeden naprawdę dobry sposób. Dodanie ćwiczenia ma dziś 4 afordancje w każdej kolumnie.

Widok Lista dokłada trzeci pas nawigacji (`DayTabs`) pod tygodniami i ściska treść do 760 px na środku. `stepLabel` mówi „Krok 2 z 3”, ale krok 3 nie istnieje jako ekran (to submit).

## Proponowane rozwiązanie

Warstwy zasięgu: Plan → Tydzień → Dzień → Ćwiczenie. Każdy poziom ma jedno miejsce w UI.

1. **`DayMenu`** — popover otwierany kliknięciem w nazwę dnia. Nazwa, chipy Pn–Nd (jeden rząd), „Zastosuj…” tylko przy `weeks.length > 1`, notatka, duplikacja, usunięcie.
2. **`DayHeader`** — wspólny nagłówek dla Listy / Tablicy / Arkusza. Zawsze: `D1` + nazwa. Warunkowo: chip dnia tygodnia, statystyki (tylko gdy są ćwiczenia), notatka (tylko gdy jest).
3. **Chrome** — dwa pasy. W Liście `DayTabs` scalone z `WeekTabs` (`1 2 3 · D1 D2 D3`). `metaLabel` tylko gdy tydzień ma ćwiczenia. Krok 2 z 2.
4. **Empty state** — jeden na pusty tydzień, nie cztery na kolumny. Kolumna bez ćwiczeń = sam composer.
5. **Composer** — `?` znika z kolumn (skrót `?` + pozycja w menu planu). Lupa zostaje. `/` fokusuje composer aktywnego dnia. Jeden placeholder.

Cztery tryby widoku zostają. Zakres: warstwa prezentacji w `apps/web/components/plan-builder/`.

## Model danych

Brak zmian. Draft (`BuilderDay` / `BuilderItem`) i encje `Plan` / `PlanDay` bez zmian.

## Kontrakt API

Brak zmian.

## UI

Nowe: `DayMenu.tsx`, `DayHeader.tsx`.

Wchłaniają i zastępują w nagłówkach: `DayScheduleChips` (zostaje jako wewnętrzny helper chipów albo znika jeśli `DayMenu` ma własne), `DuplicateDayButton` (akcje w `DayMenu`), menu `···` z `DayColumn`, edytor notatki z `ListView`.

Prymitywy: `OverflowMenu` / popover jak `CopyWeekPopover`, `IconButton`, `EmptyState` (jeden, na tydzień), `SegmentedControl`, `inputClass`, tokeny mono v2.

Strony: `apps/web/app/(app)/plans/new/page.tsx` — pasek postępu i `stepLabel` na 2 kroki.

Copy (ux-writing):

- Empty tygodnia: „Wpisz «przysiad 3x8» w polu pod dniem albo otwórz bibliotekę.”
- Placeholder composera: `np. „przysiad 3x8”`
- Menu planu: „Składnia wpisywania”
- „Zastosuj te dni do pozostałych tygodni” — bez zmian (już pełna etykieta)

## Fazy implementacji

- [x] Faza 1 — spec + `DayMenu` + `DayHeader`
- [x] Faza 2 — podpięcie w Tablicy / Liście / Arkuszu; usunięcie zduplikowanych nagłówków
- [x] Faza 3 — chrome (WeekTabs + DayTabs, krok 2 z 2, warunkowe statystyki)
- [x] Faza 4 — empty state tygodnia, composer (`?`, `/`, placeholder), craft
- [x] Faza 5 — `./scripts/check.sh` + lekcja

## Ryzyka i wpływ

| Scenariusz | Groźba | Mitygacja | Residual |
|---|---|---|---|
| Harmonogram niewidoczny | Trener nie przypisze Pn–Nd | Chip `Pn` w nagłówku gdy ustawione; nazwa dnia otwiera menu | Odkrywalność pierwszego przypisania wymaga kliknięcia nazwy |
| `/` w polu tekstowym | Skrót przechwytuje wpisywanie | Ignoruj gdy focus w input/textarea/contenteditable | — |
| `DayTabs` w WeekTabs | Lista traci przełączanie dni | Drugi segment w tym samym pasie; stan `selectedDayKey` zostaje w `ListView` / unosi się do `PlanBuilder` | — |
| Usunięcie `EmptyState` z kolumny | Nowy user nie wie, że można przeciągnąć | Jeden empty na pusty tydzień + composer w stopce | Drawer nadal z lupy |

## Changelog

- 2026-08-17 — utworzono spec (decyzje: 4 widoki zostają; harmonogram w popoverze przy nazwie dnia).
- 2026-08-17 — wdrożono: `DayMenu` + `DayHeader`, scalone `WeekTabs`/`DayTabs`, krok 2 z 2, composer bez `?` w kolumnie, `/` fokus, statystyki tylko przy treści.
