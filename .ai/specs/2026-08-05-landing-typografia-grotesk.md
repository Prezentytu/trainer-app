# Landing — typografia grotesk (Apple / Feji)

## TLDR

Usunięcie Fraunces i kursywy z landingu oraz auth. Display = Archivo 700 sentence case (`.display-landing` / `.display-landing-xl`). Copy skrócone do krótkich, pełnych zdań. Hierarchia z powietrza i skali, nie z szeryfu.

## Problem

Fraunces (cienkie kreski + italic) na ciemnym tle w dużym stopniu jest nieczytelny. Kursywa jako ozdoba i długie zdania w hero psują test 5 sekund i odbiegają od minimalizmu Feji/Apple.

## Proponowane rozwiązanie

- Jedna rodzina display: Archivo 700, sentence case. Zero szeryfów, zero kursywy.
- Klasy: `.display-landing` (H2, tracking −0.03em) i `.display-landing-xl` (H1 / cena, tracking −0.04em).
- Usunięcie z `layout.tsx`: `Fraunces`, `Instrument_Serif`.
- Skala: H1 `clamp(1.75rem, 5.2vw, 4.5rem)`; H2 `clamp(1.5rem, 3.4vw, 2.75rem)`; cena `clamp(5rem, 15vw, 9rem)`.
- Copy: „Wysyłasz link. / Widzisz każdy trening." + krótkie leady w każdej sekcji.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

| Plik | Zmiana |
|---|---|
| `globals.css` | Usuń `.display-serif*`, `.accent-serif`; dodaj `.display-landing*` |
| `layout.tsx` | Tylko Archivo + Space Grotesk + IBM Plex Mono; metadata |
| `landing/Hero.tsx` itd. | Nowe klasy + skrócone copy |
| `AuthScreen.tsx` | H1 bez kursywy, spójne z hero |
| `opengraph-image.tsx` | Spójny subline |

## Fazy implementacji

- [x] Faza 1 — fonty / CSS / layout
- [x] Faza 2 — komponenty landingu + auth + OG
- [x] Faza 3 — skill `design-system`, lekcja, walidacja

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Archivo 700 „za miękkie" na hero | Tracking −0.04em + skala do 72 px; waga 700 czytelniejsza niż cienki szeryf |
| Stare klasy w cache SW | Dev SW cleanup w root layout; produkcja: nowy build |

## Changelog

- 2026-08-05 — wdrożono: grotesk display, zero szeryfów/kursywy, krótkie copy, usunięte Fraunces i Instrument Serif.
