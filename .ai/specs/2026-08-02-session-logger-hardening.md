# Hardening loggera sesji

## TLDR

Naprawiamy bolączki logowania treningu w portalu i panelu trenera: zoom/pan przy fokusie, miganie UI, brak ułamków kg, cichy timer przerwy, utrata danych po minimalizacji. Dodajemy steppery, Wake Lock i kalkulator talerzy — bez zmian schematu bazy.

## Problem

`SessionLogger` jest źródłem frustracji mid-workout:
1. iOS zoomuje inputy poniżej 16 px; brak blokady pinch/pan.
2. `setDraft(serverResponse)` + zmiana `key` po nadaniu ID + zegar co 1 s powodują miganie i utratę focusu.
3. Kontrolowany input liczbowy gubi kropkę/przecinek przy `10.` / `10,`.
4. Timer przerwy to mały pasek na dole, bez dźwięku/wibracji; dekrementacja co tick rozjeżdża się w tle.
5. Debounce 400 ms + brak lokalnego draftu = utrata danych po zminimalizowaniu apki; panel trenera bez kolejki offline.

## Proponowane rozwiązanie

Wyłącznie frontend (+ drobne rozszerzenie `RequestInit` / `keepalive` w kliencie API):
- Viewport + `text-base` na inputach + `touch-action: manipulation`.
- `reconcile(local, server)` zamiast pełnego nadpisania; stabilne `uid` jako React key; `SessionClock` / `SetRow` w izolacji.
- `SetValueInput` z buforem tekstowym; toolbar ze stepperami ±2,5 kg / ±1 powt.
- `RestTimer` pełnoekranowy (zwijany do mini), czas od `endsAt`, alarm WebAudio + wibracja, Wake Lock.
- `sessionDraft` w localStorage + flush na `visibilitychange`/`pagehide` z `keepalive`; kolejka offline wspólna dla portalu i trenera.
- Kalkulator talerzy (`plates.ts` + UI) z konfiguracją w localStorage.

## Model danych

**Brak zmian.** `LoggedSet.WeightKg` już jest `double?`. Nowe serie z `id: null` obsługuje `Sessions.ApplyUpdate`.

## Kontrakt API

Bez nowych endpointów. Opcjonalne `keepalive` w `api.sessions.update` / `api.portal.updateSession` (przez istniejący `RequestInit`).

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| PUT | `/api/sessions/{id}` | `WorkoutSessionInput` | `SessionDetail` |
| PUT | `/api/portal/{token}/sessions/{id}` | `WorkoutSessionInput` | `SessionDetail` |

## UI

- Główny: `apps/web/components/SessionLogger.tsx` (+ podmoduły w `components/session/`).
- Lib: `sessionDraft.ts`, `sessionQueue.ts`, `restAlarm.ts`, `plates.ts`.
- Viewport: `apps/web/app/layout.tsx`, `globals.css`, `ui.tsx` (`inputClass` / `inputNumericClass`).

## Fazy implementacji

- [x] Faza 1 — viewport / anti-zoom
- [x] Faza 2 — zero migania (reconcile, uid, clock, memo)
- [x] Faza 3 — ułamki + steppery
- [x] Faza 4 — RestTimer + alarm + Wake Lock
- [x] Faza 5 — trwałość draftu + flush + kolejka trenera
- [x] Faza 6 — kalkulator talerzy
- [x] Walidacja + lekcja

## Ryzyka i wpływ

| Ryzyko | Mitigacja | Rezydualne |
|---|---|---|
| `userScalable: false` vs WCAG 1.4.4 | Bazą jest 16 px na inputach; blokada tylko siatką bezpieczeństwa | Zoom gestem niedostępny |
| iOS wycisza audio z ukrytej karty | Alarm przy powrocie (`visibilitychange`) jeśli przerwa minęła w tle | Brak push w tle (świadomie poza zakresem) |
| `keepalive` PUT może nie zwrócić body | Po powrocie reconcile z lokalnego draftu / kolejki | Last-write-wins bez concurrency token |
| Remount przy zmianie `uid` mapy | `uid` generowany raz przy mount / addSet, nigdy z serwera | — |

## Changelog

- 2026-08-02 — utworzono spec; decyzje: WebAudio (bez pliku), zakres = bugi + quick-winy + kalkulator talerzy.
- 2026-08-02 — wdrożono: viewport, reconcile/uid/SessionClock, SetValueInput + steppery, RestTimer fullscreen + alarm, sessionDraft/queue, PlateCalculator. Bramka `./scripts/check.sh` zielona.
