# PWA klienta — magic-link (portal)

## TLDR

Klient dostaje link `/portal/{token}` (bez konta, bez app store). Widzi dzisiejszy trening z miniaturkami, startuje sesję i loguje serie na tych samych tabelach co portal trenera. Instalowalna PWA (`manifest.webmanifest`) + kolejka zapisów w `localStorage` przy utracie zasięgu.

Zastępuje odłożoną wizję Expo z `2026-07-08-client-mobile-app.md` jako rozwiązanie MVP.

## Problem

Bez surface'u klienta pętla plan → trening → progres nie domyka się między sesjami z trenerem. Osobna apka Expo to miesiące opóźnienia i otwarte pytania o auth.

## Proponowane rozwiązanie

- Encja `ClientAccessToken` (losowy token, opcjonalne wygaśnięcie).
- Scoped endpointy `/api/portal/{token}/…` — te same `WorkoutSession` / `LoggedSet`, autoryzacja tokenem.
- Strony mobile-first pod `apps/web/app/portal/[token]/` bez sidebara trenera (`AppShell` wykrywa `/portal`).
- Przycisk „Skopiuj link dla klienta” na karcie klienta.

## Model danych

`ClientAccessToken { Id, ClientId, Token, ExpiresAt?, CreatedAt }` — unikalny indeks na `Token`.

## Kontrakt API

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/api/clients/{id}/access-token` | zwraca lub tworzy aktywny token |
| POST | `/api/clients/{id}/access-token/rotate` | unieważnia stare, nowy token |
| GET | `/api/portal/{token}` | home: klient, dzisiejszy dzień, progres, sesja w trakcie |
| POST | `/api/portal/{token}/sessions/start` | start sesji z dnia planu |
| GET/PUT | `/api/portal/{token}/sessions/{id}` | szczegóły / zapis |
| PATCH | `/api/portal/{token}/sessions/{id}/complete` | zakończenie |

## UI

- `/portal/[token]` — „Dzisiejszy trening” (lista z `ExerciseThumb`), CTA start.
- `/portal/[token]/session/[sessionId]` — `SessionLogger` (duże −/+, timer, PR).
- Manifest + ikona SVG.

## Fazy implementacji

- [x] Faza 1 — token + scoped API
- [x] Faza 2 — strony portalu + SessionLogger
- [x] Faza 3 — manifest + kolejka offline

## Ryzyka

- Token w URL = każdy z linkiem widzi dane — akceptowalne jak niepubliczny link; przy multi-tenant wymienić na auth.
- Offline: kolejka `localStorage` flush przy `online`.

## Changelog

- 2026-07-30 — wdrożono MVP PWA klienta (magic-link).
