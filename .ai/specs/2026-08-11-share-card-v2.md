# Share card v2 — chwal się treningiem

## TLDR

Przebudowa „Udostępnij" po treningu: 3 warianty karty PNG (Statystyki, Rekord, Story) w estetyce mono v2 z brandowymi fontami + sheet z podglądem i wyborem wariantu przed udostępnieniem. Bez zmian API backendu; token nigdy nie wycieka (share tylko plikiem).

## Problem

Obecna karta (Fala 3) jest generyczna: `system-ui`, PR tylko jako licznik, brak listy ćwiczeń, jeden format, share bez podglądu. Najlepsze aplikacje (Strava, Hevy) dają wybór wariantu + hero PR + format Stories.

## Proponowane rozwiązanie

1. Route `share-image?v=stats|pr|story` generuje PNG przez `ImageResponse` (edge) z fontami Instrument Sans + Geist Mono.
2. `SessionSummaryView` otwiera `Sheet` z podglądem, `SegmentedControl` wariantów i CTA Udostępnij / Zapisz obraz.
3. Domyślnie `pr` gdy sesja ma rekordy (peak-end); inaczej `stats`.
4. Karta chwali wynik: hero objętość + najlepsze serie (kg×reps), nie lista adherence 0/3. Bez porównań „jak motocykl” — objętość treningowa ≠ masa obiektu.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian backendu. Next route:

| Metoda | Ścieżka | Query | Response |
|---|---|---|---|
| GET | `/portal/{token}/session/{sessionId}/share-image` | `v=stats\|pr\|story` | `image/png` |

Dane z istniejącego `GET /api/portal/{token}/sessions/{id}`.

## UI

- `apps/web/app/portal/.../share-image/route.tsx` — 3 layouty flex (satori)
- `apps/web/components/SessionSummaryView.tsx` — Sheet + SegmentedControl
- Fonty: `apps/web/assets/fonts/` (Instrument Sans 600/700, Geist Mono 700)
- Kolory: stałe z tokenów mono (`#0b0c0d`, `#e0b13f` pr, `#57bf82` gain) — satori nie czyta CSS vars
- Brand: wordmark + `lib/brandMark.tsx` gdzie sensowne

## Fazy implementacji

- [x] Faza 1 — spec + fonty w `assets/fonts/`
- [x] Faza 2 — redesign route z wariantami + porównanie objętości
- [x] Faza 3 — Sheet z podglądem w `SessionSummaryView`
- [x] Faza 4 — `./scripts/check.sh` + test lokalny

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Satori: tylko flex | Layouty flex od początku |
| Rozmiar fontów w edge | Tylko 2–3 wagi, latin-ext |
| Brak `navigator.share` (desktop / in-app) | Fallback „Zapisz obraz" |
| `v=pr` bez PR | Fallback do `stats` |

## Poza zakresem

Overlay na zdjęciu, muscle map, Year in Review, streak na karcie, publiczny link OG.

## Changelog

- 2026-08-11 — utworzono spec; decyzje: 3 warianty, sheet z podglądem, fonty brandowe, bez zmian API.
- 2026-08-11 — wdrożono: `lib/shareCard.ts`, fonty TTF, route `?v=stats|pr|story`, Sheet w `SessionSummaryView`; `./scripts/check.sh` zielony; lokalnie PNG 1080×1350 / 1080×1920.
- 2026-08-11 — redesign brag: usunięto porównania objętości; hero kg + top serie (bez 0/3); PR card mocniejsza hierarchia.
