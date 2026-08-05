# Landing — mega minimalizm ze screenami

## TLDR

Przebudowa strony powitalnej na 5 sekcji (nav → hero → screeny → punkty 01–06 → cena/CTA → stopka). Inspiracja filozofią Feji/Styrka (odejmowanie, powietrze, produkt w screenach), bez plagiatu — zostaje tożsamość Acid i własne copy PL.

## Problem

Obecny landing ma ~10 sekcji (marquee, how-it-works, differentiators, early access, pricing, FAQ, CTA band + animowana makieta). Za dużo chrome'u względem obietnicy minimalizmu produktu. Brak prawdziwych screenów apki.

## Proponowane rozwiązanie

| Sekcja | Komponent | Uwagi |
|---|---|---|
| Nav | `LandingNav` | Wordmark + Cennik + Zaloguj + CTA |
| Hero | `Hero` | Bez `landing-rules`; link „Zobacz produkt ↓” |
| Screeny | `ProductShots` (nowy) | Panel desktop + 2–3 mobile portal |
| Punkty | `Points` (nowy) | 01–06, tekst + linie, bez kart/ikon |
| Cena + CTA | `FinalCta` (nowy) | 0 zł + jedna linia + CTA |
| Stopka | `LandingFooter` | Jeden rząd |

Usuwane: `Marquee`, `HowItWorks`, `Differentiators`, `EarlyAccess`, `Faq`, `Pricing`, `CtaBand`, `PanelPreview`.

### Screeny — odtwarzanie

Pliki w `apps/web/public/landing/` (PNG, DPR 2/3). Playwright lokalnie (bez zależności w `apps/web`):

- Panel: viewport 1440×900 → `panel-client.png` (używany), `panel-dashboard.png` (zapas)
- Portal: viewport 390×844 → `portal-home.png`, `portal-session.png`, `portal-progress.png`
- Token demo: `demo-jan-kowalski` (seed); sesję: `POST /api/portal/{token}/sessions/start`

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian (screeny używają istniejących stron / lokalnych danych).

## UI

- Tokeny Acid wyłącznie; lime ≤3% (1 CTA na region).
- `next/image` z fixed width/height (zero layout-shift).
- Mobile: screeny portalu w poziomym scroll-snap.
- `prefers-reduced-motion` respektowany (reveal bez animacji).

## Fazy implementacji

- [x] Faza 0 — ten spec
- [x] Faza 1 — screenshoty do `public/landing/`
- [x] Faza 2 — nowe komponenty + odchudzenie Hero/Nav/Footer
- [x] Faza 3 — cleanup starych sekcji + walidacja web

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Pusta / brzydka lokalna baza | Dosiew przez API przed zrzutem |
| Screeny się starzeją | Procedura odtwarzania w tym specu |
| Plagiat Feji | Własne copy, Acid, inna struktura (trener↔klient, nie solo app store) |

## Changelog

- 2026-08-05 — utworzono spec; zakres uzgodniony (agresywne cięcie + prawdziwe screeny).
- 2026-08-05 — wdrożono: 5 sekcji, screeny PNG, usunięto marquee/FAQ/makietę/martwy CSS.
