# Landing: rytm i kreski

## TLDR

Hairline na landingu enumeruje dane albo zamyka chrome — nie stempluje każdej sekcji 01–06. Dwa tokeny odstępu: rozdział (`SECTION_SPACE`) i para w rozdziale (`SECTION_SPACE_TIGHT`), oba rosną z viewportem od tabletu.

## Problem

`SectionHead` dawał identyczny `border-t` nad 01–06. Między closerem hero a `01` powstawała kanapka: linia → ~96 px pustki → linia. `SECTION_SPACE` (`clamp(6rem, 10vw, 10rem)`) był płaski od 360 do 959 px. 01→02 i 02→03 dostawały ten sam oddech. FAQ miał trzecią linię (head + lista).

## Proponowane rozwiązanie

Kreska = dane albo chrome. Indeks + skok skali H2 zaczynają rozdział.

Zostaje: nav po scrollu, closer hero, wiersze panelu/FAQ, wynik kalkulatora, stopka.

Znika: `border-t` z `SectionHead`; `border-t` owijający listę FAQ.

Tokeny:

| Token | Rola | Clamp |
|---|---|---|
| `SECTION_SPACE` | nowy rozdział | `clamp(5rem, 4rem + 8vw, 12rem)` |
| `SECTION_SPACE_TIGHT` | para w rozdziale | `clamp(3rem, 2rem + 5vw, 6rem)` |

Mapowanie: 01 i 03, 05, 06 = space; 02 i 04 = tight. Sticky `32svh` bez zmian.

Fallback, gdyby strona płynęła: jedna linia między trzema grupami — nie wracać do 6 stempli.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`components/landing/primitives.tsx` + sekcje homepage. Copy i mocki bez zmian. Skille: `design-system`, `senior-ux-cro` (odejmowanie), `responsive-ui`.

## Fazy implementacji

- [x] Faza 1 — tokeny + `SectionHead` bez stempla
- [x] Faza 2 — mapowanie sekcji, FAQ bez podwójnej linii
- [x] Faza 3 — QA 360 / 768 / 1280 / 1440 + lekcja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Po odejmowaniu strona „płynie” | Jedna linia między grupami (historia / pieniądze / domknięcie), nie 6 stempli |
| Zmiana `SECTION_SPACE` psuje oddech po sticky telefonu | `lg:-mt-[32svh]` i `min-h` zostają 1:1 |
| Clamp z `+` w arbitrary Tailwind nie wejdzie do CSS | Underscore / brak spacji: `4rem+8vw` |

## Changelog

- 2026-08-14 — utworzono spec i wdrożono: kreska = dane/chrome, dwa tokeny space.
