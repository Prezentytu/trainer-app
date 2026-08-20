# Landing: jeden rytm, jedna skala, mniej treści

## TLDR

Landing `/` dostaje jeden rytm pionowy (tylko `pt` sekcji, `pb` tylko na 06), jedną skalę H2 30–40 px i lead 19 px, hero na siatce zamiast `absolute`, oraz odejmowanie zdublowanego artefaktu. Ten sam rytm i miara idą na strony marketingowe.

## Problem

Rytm między sekcjami jest przypadkowy (112 / 83 / 292 px), H2 konkuruje z H1, hero łamie się na 1024 i 360 px, a 02 powtarza ten sam przegląd trzy razy.

## Proponowane rozwiązanie

- Jeden token `SECTION_SPACE` (tylko `pt`). Kasacja `SECTION_SPACE_TIGHT` / `SHELL_TIGHT` / `GUTTER` / `CTA`.
- `SectionHead` i 01 na tym samym progu `lg:` i szynie 200 px.
- Hero: siatka `xl:[1fr_280px]`, `cqw` od miary, ★ przy „niedzielę”, CTA i belka na krawędziach.
- 02: bez `ReviewProof`, jedna wiadomość, teaser w hero bez podpisów.
- `/wdrozenie` i `/ile-tracisz` na `LANDING_MEASURE` + `SECTION_H2` + `SECTION_COPY`. Pozostałe strony marketingowe — miara i skala.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`components/landing/*`, `app/globals.css` (`.landing-measure`, kasacja `.landing-log-*`), strony `wdrozenie`, `ile-tracisz`, `gotowce`, `checklista`, `pakiet-retencji`. Skille: `odejmowanie`, `design-system`, `ux-writing`, `senior-ux-cro`, `apple-design`, `responsive-ui`.

## Fazy implementacji

- [x] Faza 1 — primitives + rytm sekcji + hero + 01 + odejmowanie 02
- [x] Faza 2 — sprzątanie (LogWall, nav, reveal) + strony marketingowe
- [x] Faza 3 — QA 360/768/1024/1440/1920 + `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| `cqw` bez kontenera skaluje od viewportu | `.landing-measure { container-type: inline-size }` na `LANDING_MEASURE` |
| Scrub 01 psuje się po zmianie `pt` | `lg:pt-[112px]` zostaje, `PIN_TOP = 112` bez zmian |
| Szeroka miara na `/wdrozenie` rozciąga formularz | Copy zostaje w `SECTION_COPY` / `max-w-[46ch]`; formularz nie idzie na pełne 1360 |

## Changelog

- 2026-08-18 — utworzono spec.
- 2026-08-18 — wdrożono: jeden rytm `pt`, H2 30–40 px, hero na siatce `xl`, odejmowanie 02, kasacja LogWall, strony marketingowe na `PAGE_SHELL`.
