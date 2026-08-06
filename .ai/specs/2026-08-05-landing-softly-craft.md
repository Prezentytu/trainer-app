# Landing — craft Softly/Feji na ciemnym Acid

## TLDR

Podniesienie landingu RepMaxer do poziomu dopracowania Softly/Feji: grain overlay, nav przezroczysty na górze i płynnie zyskujący blur po scrollu, winieta hero, poziomy scroll scenariuszy, kaskada telefonów, spotlight na kartach, FAQ i wolniejsze reveale — wszystko w ciemnym Acid, bez kursywy, bez blobów, bez łamania lime budget.

## Problem

Landing jest poprawny typograficznie (grotesk Archivo, krótkie copy), ale płaski: brak faktury, mało mikrointerakcji i rytmu sekcji. Softly i Feji pokazują wyższy poziom craftu (grain, winieta, spotlight, edge-mask, wolne fade-upy) bez pastelowych blobów ani ozdobnych fontów — techniki da się przenieść na Acid.

## Proponowane rozwiązanie

Wzór: Feji (płynność, near-mono, spotlight) + Softly (grain, scenario scroll, kaskada telefonów, FAQ) — bez kopiowania brandu Softly (kolory, cursive, pill-nav).

1. Nav pełnej szerokości: przezroczysty na górze → blur + hairline po scrollu.
2. Hero: istniejący `HeroField` + ciemna winieta radialna + wolniejsze reveale.
3. Nowa sekcja „Scenariusze" (poziomy snap z timestampami).
4. ProductShots: kaskada 3 telefonów + CSS device frame + edge-mask.
5. Points: spotlight za myszą (neutral bone, `pointer: fine`).
6. FAQ akordeon (`0fr → 1fr`).
7. Globalny grain overlay (SVG noise, opacity dostrojona do ciemnego tła).

Zero kursywy/szeryfów. Zero opinii (brak prawdziwych). Efekty wyłącznie neutralne.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

| Plik | Zmiana |
|---|---|
| `globals.css` | grain, winieta, spotlight, edge-mask, phone frame, FAQ, nav scrolled, timingi |
| `landing/LandingNav.tsx` | fixed, scroll state |
| `landing/Hero.tsx` | winieta, scroll-cta |
| `landing/ScenarioScroll.tsx` | nowa sekcja |
| `landing/ProductShots.tsx` | kaskada + frame |
| `landing/Points.tsx` | spotlight client |
| `landing/Faq.tsx` | nowa sekcja |
| `landing/FinalCta.tsx` | renumeracja |
| `landing/LandingPage.tsx` | montaż + grain |
| skill `design-system` | dokumentacja craftu landingu |

## Fazy implementacji

- [x] Faza 1 — CSS + nav + hero
- [x] Faza 2 — ScenarioScroll, ProductShots, Points, Faq, FinalCta, LandingPage
- [x] Faza 3 — skill, changelog, lint/typecheck/build

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Grain niewidoczny / brudzi tekst na ciemnym | Opacity 0.2–0.35; ewentualnie soft-light |
| Notch dubluje status bar screenshotów | Frame bez notcha — tylko side-button + radius |
| Migotanie nav przy progu scrolla | rAF-throttle + histereza (on 28 / off 12) |
| Spotlight + grain na mobile | Spotlight tylko `pointer: fine` |

## Changelog

- 2026-08-05 — utworzono spec (decyzje: zero cursive, bez blobów/opinii, nav Feji-style nie Softly pill).
- 2026-08-05 — wdrożono: grain, nav scroll-blur, winieta, ScenarioScroll, kaskada telefonów, spotlight Points, FAQ, wolniejsze reveale.
