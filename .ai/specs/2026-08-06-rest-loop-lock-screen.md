# Przerwa na ekranie blokady — odpowiednik Live Activity w PWA

## TLDR

Styrka rozwiązuje pętlę przerwy przez Live Activity (Lock Screen / Dynamic Island). U nas alarm i tick giną w tle iOS. Budujemy cichy keep-alive audio + Media Session: odliczanie i następne ćwiczenie na ekranie blokady, alarm punktualnie przy zgaszonym ekranie, bez natywnej aplikacji.

## Problem

Pętla przerwy w portalu jest połowiczna:

1. `playRestEndAlarm()` używa `AudioContext` — iOS zawiesza go w tle; alarm odpala się dopiero z `visibilitychange` po powrocie.
2. `setInterval(…, 250)` w `useRestTimer` jest throttlowany w tle.
3. `navigator.wakeLock` nie istnieje w Safari iOS — `useWakeLock` nic nie daje na telefonie klienta.
4. Ekran blokady nie pokazuje odliczania ani postępu serii.

Klient odkłada telefon → ekran gaśnie → przerwa cicho mija. To dokładnie problem, który Styrka rozwiązała w 2.3–3.6.

## Proponowane rozwiązanie

Jeden mechanizm: **cichy, zapętlony `<audio>`** (`public/silence.wav`) utrzymuje aktywną sesję dźwiękową na iOS. Dzięki temu:

- timery nie są throttlowane,
- alarm (WebAudio + wibracja) może zabrzmieć punktualnie,
- `navigator.mediaSession` wystawia metadane i pasek postępu na Lock Screen (na iOS wymaga aktywnego elementu media — WebAudio go nie aktywuje).

Źródło prawdy o końcu przerwy: `setTimeout` na `endsAt` (nie polling). Druga warstwa: lokalne `showNotification` gdy karta w tle (belt-and-braces). Preferencja klienta: przełącznik w profilu portalu (domyślnie włączony).

Benchmark i backlog pozostałych luk: `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md`.

## Model danych

Brak zmian schematu. Preferencja lokalna: `localStorage` klucz `wa-rest-lock-screen` (obok `wa-auto-rest`).

## Kontrakt API

Brak nowych endpointów.

## UI

- `RestTimer` — pod ringiem linia `Seria 4 z 12`.
- Profil portalu — Switch „Przerwa na ekranie blokady" z krótkim wyjaśnieniem (aplikacja pojawia się w kontrolkach odtwarzania).
- Media Session: tytuł = odliczanie `m:ss`, artysta = `Dalej: {ćwiczenie}`, album = `Seria {done} z {total}`.

## Fazy implementacji

- [x] Faza 0 — ten spec
- [x] Faza 1 — `restKeepAlive.ts` + `silence.wav` + Media Session
- [x] Faza 2 — `useRestTimer`: `setTimeout` na `endsAt`, integracja keep-alive, powiadomienie przy zerze w tle
- [x] Faza 3 — `SessionLogger` / `RestTimer` (licznik serii) + preferencja w profilu
- [x] Faza 4 — walidacja, changelog, lekcja

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| iOS wymaga gestu użytkownika do startu audio | Start w `toggleComplete` (już gest); `unlockAudio()` zostaje |
| Aplikacja w kontrolkach odtwarzania | Przełącznik w profilu + jasna etykieta |
| Media Session bez aktywnego media | Keep-alive audio jest warunkiem; bez niego fallback jak dziś |
| Powiadomienie bez permission | Graceful no-op; push i tak prosi o permission w profilu |
| Pełna funkcja tylko w PWA standalone | Dokumentujemy; istniejący prompt instalacji |

## Czego NIE kopiujemy

Watch, widgety, własne profile progresji u klienta. Pozostałe luki (Powtórz ostatni, L/R, %1RM UI, streak kroczący…) — backlog Fali B/C w specu Styrki.

## Changelog

- 2026-08-06 — utworzono spec (analiza luki vs Styrka Live Activity, keep-alive + Media Session).
- 2026-08-06 — wdrożono: `restKeepAlive` + `silence.wav`, `setTimeout` na `endsAt`, Media Session (odliczanie / Dalej / Seria X z Y), lokalne powiadomienie w tle, Switch w profilu portalu, linia licznika w `RestTimer`.
- 2026-08-06 — fix skakania na Lock Screen: `playbackRate: 0`, update metadata tylko przy zmianie sekundy; tytuł = sam countdown (bliżej widgetu niż „muzyki”).
