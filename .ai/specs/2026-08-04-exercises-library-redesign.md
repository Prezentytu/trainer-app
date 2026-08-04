# Redesign zakładki Ćwiczenia (UX / Acid)

## TLDR

Wyciszenie biblioteki ćwiczeń: jeden widoczny rząd filtrów (partie) + panel „Filtry”, ciche pigułki, play tylko na hover, karta bez czerwonego „Usuń”, podgląd wideo w `Dialog`. Zero zmian backendu.

## Problem

Po imporcie ~134 ćwiczeń z YT lista stała się ścianą: ~35 pigułek filtrów naraz, limonkowy play na każdej miniaturze (łamie budżet lime ≤3%), destrukcja „Usuń” na każdej karcie, sticky filtry chowały się pod mobilnym headerem, modal podglądu bez Escape/focus trapu.

## Proponowane rozwiązanie

1. **Filtry** — szukajka + rząd partii zawsze; sprzęt / wzorzec / typ / opcje w panelu „Filtry · N”; chipy aktywnych filtrów; liczniki fasetowe kontekstowe.
2. **Wyszukiwanie** — `lib/exerciseSearch.ts`: foldowanie diakrytyków + dopasowanie po nazwie, sprzęcie, mięśniach, partii.
3. **Karta** — cała karta linkiem do szczegółów; miniatura z `play="hover"` (cichy SVG); akcje `IconButton` (Pencil/Trash2) ujawniane na hover od `md:`.
4. **Play** — `ExerciseThumb.play`: `none` | `hover` | `always`. `YoutubeLite` = `always`. Zero limonki na overlay.
5. **Pigułki** — `Pill quiet` = tint active nav; na stronie jedna limonkowa dominanta: „+ Nowe ćwiczenie”.
6. **Podgląd** — `Dialog` z `footer={null}` (Escape, focus trap).
7. **Sticky** — tylko od `md:`.

## Model danych / API

Bez zmian. Filtrowanie po stronie klienta (jak w [2026-07-30-exercise-library-youtube.md](2026-07-30-exercise-library-youtube.md)).

## UI

- `/exercises` — przebudowany pasek, siatka kart, Dialog podglądu i formularza.
- `ExerciseThumb`, `YoutubeLite`, `Pill`, `Dialog`, `ExerciseListSkeleton`.
- Helper: `apps/web/lib/exerciseSearch.ts`.

## Fazy implementacji

- [x] Faza 1 — helper wyszukiwania + prymitywy (`Pill`, `Dialog`)
- [x] Faza 2 — `ExerciseThumb` / `YoutubeLite`
- [x] Faza 3 — strona `/exercises` (filtry, karty, podgląd) + skeleton
- [x] Faza 4 — spec, lekcja, lint / typecheck / build

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Play tylko na hover — mobile bez hover | Znacznik czasu zostaje jako sygnał „jest wideo”; klik w miniaturę nadal otwiera podgląd |
| `Pill quiet` zmienia wygląd tylko gdy przekazane | Domyślny `Pill` bez zmian na innych ekranach |
| Overlay-link + przyciski w karcie | `pointer-events-none` na treści, `pointer-events-auto` na akcjach |

## Changelog

- 2026-08-04 — utworzono i wdrożono redesign listy ćwiczeń (filtry progressive disclosure, cicha siatka, Dialog podglądu).
