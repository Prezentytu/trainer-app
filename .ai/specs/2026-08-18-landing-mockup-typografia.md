# Landing: mockup, typografia i sekcje

## TLDR

Landing marketingowy jak mockupy: czystszy header, hero z belką i krótszym leadem, produkt z krokami, ciemny kalkulator straty, cennik w trzech wierszach, FAQ hairline, ciemny START ze stopką. H1 „Wysyłasz link. Widzisz trening.”, font Instrument Sans na H1 i słowo RepMaxer (`.display-caps` → REPMAXER) bez zmian. „Nieodbyte” wychodzi — język trenera.

## Problem

Obecny landing miesza Geist Mono w navie, CTA i pasek postępu w chrome, lead hero z trzecim zdaniem, kalkulator w jasnej kolumnie z etykietą „Nie odbyło się”, cennik jako jedna wielka cyfra. Mockupy są jednym rytmem: Sans na słowa, mono na liczby, hairline, invert na closerze i stracie.

## Proponowane rozwiązanie

- Header: wordmark bez zmian, 5 kotwic, pigułka „Zaloguj się”, bez „Umów wdrożenie” i bez progress. Instrument Sans caps. Linki od `lg:`.
- Hero: ten sam `LANDING_DISPLAY` na H1. Eyebrow nad H1, lead bez „Piszesz pierwszy…”, belka 4 faktów, ghost CTA z widocznym underline. Bez LogWall.
- 01: H2 + lead + 4 kroki hairline + istniejący telefon (sticky/scrub zostaje).
- 03: full-bleed `data-theme="dark"`, suwaki | wynik, etykieta „Tyle nie weszło na konto”, `text-loss` na kwocie.
- 04: H2 „Zaczynasz za 0 zł.” + 3 wiersze.
- 05: akordeon na pełną miarę, bez drugiego H2.
- 06 + stopka: jeden pas `data-theme="dark"` tylko na home. Inne strony (`MarketingShell`) jasna stopka.
- `SectionHead`: duży ghost-numer + caps label (Sans), nie `03 / Label` w mono.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`components/landing/*`, `app/page.tsx` (metadata), `app/ile-tracisz/page.tsx` (ten sam kalkulator). Tokeny `globals.css`. Skille: `design-system`, `ux-writing`, `senior-ux-cro`, `apple-design`, `responsive-ui`.

## Fazy implementacji

- [x] Faza 1 — spec + primitives (`SectionHead`, CTA className) + nav
- [x] Faza 2 — hero, produkt, kalkulator, cennik
- [x] Faza 3 — FAQ, dark closer + stopka, metadata, QA

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| 5 linków na 360 px wychodzi poza kadr | Linki tylko od `lg:`; mobile = wordmark + logowanie |
| Ciemny 03 psuje suwaki | `data-theme="dark"` na pasie — `.landing-range` czyta tokeny |
| CTA znika z nava | Zostaje w hero, cenniku i closerze (1 dominanta na widok) |
| LogWall nieużywany | Import zdjęty z hero; plik zostaje (martwy), CSS `.landing-log-*` bez szkody |

## Changelog

- 2026-08-18 — utworzono spec.
- 2026-08-18 — wdrożono: nav, hero bez LogWall, kroki 01, ciemny 03, cennik-wiersze, FAQ, dark 06+stopka.
