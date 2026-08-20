# Landing D — editorial

## TLDR

Landing `/` jak mockup D: editorial hero (lewa oś, typewriter, animacja „trening” + ★), naprzemienne pasy (ciemne 01 / 03 / 05, jasny 06 + stopka), nav w hero (nie sticky). Font zostaje Instrument Sans + Geist Mono — bez Rubik Spray Paint. H1, CTA i cennik bez zmian pozycjonowania.

## Problem

Landing po specu typografii jest wyśrodkowany, belka ma 4 fakty, closer jest ciemny, 01 i 05 są jasne. Mockup D ma inny rytm i kompozycję: lewostronny hero, 2 fakty, ciemny produkt i FAQ, jasny start. Spray Paint z mocka kłóci się z brandem („cichy instrument”).

## Proponowane rozwiązanie

- D = układ i rytm. Brand = Instrument Sans, tokeny mono v2, locked copy.
- Home: nav w hero (96 px, nie sticky). `/wdrozenie` i `/ile-tracisz`: sticky nav w `MarketingShell`.
- Hero: H1 sentence case, linia 2 większa, typewriter tylko `lg:`, belka `0 zł` / `5 osób`.
- 01 ciemny + telefon `data-theme="light"`. Scrub/autoplay bez zmian.
- 03: `▼ −kwota`, etykieta „Tyle nie weszło na konto”, copy „Płacisz od 39 zł / 15 osób — nie za klienta.”
- 05 ciemny. 06 + stopka jasne.
- Keyframes hero w `globals.css`. `prefers-reduced-motion` = stan końcowy.

Supersede: `.ai/specs/2026-08-18-landing-mockup-typografia.md` (rytm closer/belka/nav).

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`components/landing/*`, `app/globals.css` (hero motion), `app/ile-tracisz/page.tsx` (wspólny kalkulator). Skille: `odejmowanie`, `design-system`, `ux-writing`, `senior-ux-cro`, `apple-design`, `responsive-ui`.

## Fazy implementacji

- [x] Faza 1 — spec + skills + primitives + nav/shell
- [x] Faza 2 — hero, 01–06, kalkulator, FAQ copy
- [x] Faza 3 — lint / typecheck / build + QA 360/768/1280

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| H1 `nowrap` z D ucina „Wysyłasz link.” na 360 px | Zawijanie dozwolone; clamp, nie nowrap |
| Jasny sticky nav na ciemnym 01 | Nav home tylko w hero |
| Typewriter dubluje 01 na telefonie | `hidden lg:flex`, `aria-hidden` |
| „Nieodbyte” wraca z D | Zakaz — etykieta locked |
| Spray Paint wraca z mocka | Instrument Sans; trzeci font = nie |

## Changelog

- 2026-08-18 — utworzono spec (decyzje: Instrument Sans, rytm D, nav w hero).
- 2026-08-18 — wdrożono układ D: hero editorial, typewriter, ciemne 01/03/05, jasny 06.
- 2026-08-18 — `[data-theme="dark"]` w `globals.css` (zagnieżdżony atrybut nie dziedziczył ciemnych tokenów).
