# Landing redesign — editorial serif, near-mono

## TLDR

Redesign strony powitalnej w duchu Feji Studios / Apple / top startupów 2026: Instrument Serif na nagłówkach, niemal monochrom (lime tylko na głównym CTA), minimum tekstu, rząd screenów telefonu, dużo przestrzeni i lekkie animacje. UI-only — bez zmian API/schematu.

## Problem

Obecny landing krzyczy typografią (Archivo 800 plakatowy), kumuluje treść blisko nawigacji i ma za dużo tekstu oraz lime-atmosfery. Feji/Styrka i trendy 2026 pokazują: lekki editorial serif, near-mono, przestrzeń, screeny produktu.

## Proponowane rozwiązanie

- Nagłówki landingu: `.display-serif` (Instrument Serif 400, sentence case) — nie plagiat Feji, własny charakter.
- Body: Space Grotesk; etykiety: IBM Plex Mono caps.
- Lime ≤1 region na ekran (hero CTA + final CTA); bez `landing-atmosphere`, bez `accent-serif` dekoracji w nagłówkach.
- Hero: pełny viewport, wyśrodkowany.
- Produkt: rząd 4 telefonów z mono podpisami.
- Wartość: siatka 2×3 z cienkimi borderami (3 trener / 3 klient), copy ≤8 słów.
- Animacje: fade + rise 12px; `prefers-reduced-motion` respektowane.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

Pliki: `apps/web/components/landing/*`, tokeny w `apps/web/app/globals.css`, skill `design-system`.

## Fazy implementacji

- [x] Faza 1 — `.display-serif` + złagodzenie animacji + spec
- [x] Faza 2 — Hero, ProductShots, Points, Nav, FinalCta, Footer
- [x] Faza 3 — walidacja + update skilla

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Instrument Serif zbyt kondensowany przy dużej skali | Plan B: Fraunces (Google Fonts) |
| Brak mobilnego screenu panelu | Fallback: 3 telefony portalu + desktop panel poniżej |

## Changelog

- 2026-08-05 — utworzono spec.
- 2026-08-05 — wdrożono redesign (serif, near-mono, przestrzeń, siatka wartości).
