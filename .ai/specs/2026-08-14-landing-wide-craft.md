# Landing: wide screen, waga, latarka

## TLDR

Na ultrawide treść nie tonie w 1200 px: miara 1360, hero full-bleed z latarką na cały kadr. Sticky telefonu nie nachodzi na 02. Jeden `SECTION_SPACE`. Kolumny: H2+lead | artefakt. Wiązka większa i czytelniejsza.

## Problem

H2 panelu był ucinany przez płytę `lg:sticky` + `lg:-mt-[32svh]`. Panel miał H2 nad siatką i listę 380 px z `items-center` — prawa góra pusta. `SECTION_SPACE` vs `TIGHT` plus tor 32svh dawały nierówny oddech. LogWall siedział w `max-w-[1200px]`, wiązka 200 px, ghost 13%.

## Proponowane rozwiązanie

- Miara `max-w-[1360px]`. Hero pełna szerokość; LogWall `inset-0` na sekcji.
- Bez `min-h-[100svh+32svh]` i bez `-mt-[32svh]`. Scrub od naturalnej wysokości 01.
- Wszystkie sekcje na `SECTION_SPACE`.
- 02 i 04: H2+lead | artefakt, `items-start`.
- H2 `leading-[1.12]`, hero `overflow-x-hidden overflow-y-visible`.
- Ghost ~20% fg; wiązka `clamp(280px, 32vw, 560px)`.

Hydracja `data-cursor-ref` = injekcja przeglądarki Cursora. Nie łatać `Button`.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`components/landing/*`, `globals.css` (`.landing-log-*`). Copy i mock telefonu bez zmian. Skille: `design-system`, `responsive-ui`, `apple-design`.

## Fazy implementacji

- [x] Faza 1 — spec + miara 1360 + sticky bez overlap
- [x] Faza 2 — balans 02/04 + latarka
- [x] Faza 3 — QA + lekcja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Scrub 01 za krótki bez 32svh | Progress i tak z `rect.height`; naturalna wysokość ~100svh |
| Mocniejszy ghost konkuruje z H1 | Maska środka ciaśniejsza; H1 zostaje z-10 |
| `clamp()` w `circle` maski nie wejdzie | Fallback `circle 32vw` jeśli trzeba |

## Changelog

- 2026-08-14 — utworzono spec i wdrożono wide craft.
