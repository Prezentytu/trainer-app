# Parytet ze Styrką — Fale 0 i 1

## TLDR

Naprawiamy martwe „BW", domykamy craft loggera (RIR za przełącznikiem, klawiatura, kolejność, przecinek, limit 4 h) oraz szybki start treningu: „Powtórz ostatni", ostatnio używane w pickerze, streak kroczący. Bez migracji schematu.

Benchmark: `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md`.

## Problem

1. `formatPrev` sprawdza `category === "bodyweight"`, a bodyweight jest w `equipment` — funkcja nigdy nie działa.
2. Klient nie może zapisać RIR mimo pól w API i celu z planu.
3. Bez planu na dziś portal jest ślepą uliczką; nie ma „Powtórz ostatni".
4. Streak resetuje się w poniedziałek (Styrka 3.1 przeszła na kroczący).

## Proponowane rozwiązanie

### Fala 0 — craft + BW + RIR

- DTO sesji: `equipment: string[]` na ćwiczeniu; logger: `isBw = equipment.includes("bodyweight")`; placeholder `BW`; walidacja pustych serii bez wagi dla BW.
- Kolumna RIR w loggerze tylko gdy `readLogRir()` (preferencja portalu, domyślnie wyłączona); carry-forward na następną serię.
- Tap poza polem → blur klawiatury; menu ćwiczenia: W górę / W dół; `NumInput` z przecinkiem; `CompleteAsync` cap 4 h.

### Fala 1 — szybki start

- `StartSessionInput.RepeatSessionId` + `Sessions.PrefillFromSession`.
- Portal Dziś: plan = primary CTA; „Powtórz ostatni" = secondary (lub primary gdy brak dnia).
- `GET /api/portal/{token}/exercises` → `lastPerformedOn`; sekcja „Ostatnio" w pickerze podmiany.
- Streak: okno 7 dni kończące się dziś (nie tydzień kalendarzowy).

## Model danych

Bez migracji. Preferencje lokalne: `wa-log-rir` w `portalPrefs`.

## Kontrakt API

| Zmiana | Szczegóły |
|---|---|
| Session DTO exercise | + `equipment: string[]` |
| `StartSessionInput` | + `RepeatSessionId?: int` — prefill z ukończonej sesji tego klienta |
| `GET /api/portal/{token}/exercises` | Rzutowanie: pola Exercise + `lastPerformedOn: DateOnly?` |

Typy w `apps/web/lib/api.ts` lustrzane. `startSession` przyjmuje opcjonalne `repeatSessionId`.

## UI

- Logger: kolumna RIR (gdy włączona), BW placeholder, reorder w menu, tap-outside.
- Profil portalu: Switch „Zapisuj RIR".
- Dziś: przycisk „Powtórz ostatni trening".
- Picker podmiany: sekcja „Ostatnio" + data.
- Progres: streak kroczący (etykieta „tyg." zostaje).

## Fazy implementacji

- [x] Faza 0 — ten spec + update inwentaryzacji w specu Styrki
- [x] Faza 1 — BW + Equipment w DTO
- [x] Faza 2 — RIR toggle + kolumna
- [x] Faza 3 — craft (klawiatura, reorder, przecinek, 4 h)
- [x] Faza 4 — Powtórz ostatni (API + UI)
- [x] Faza 5 — Ostatnio używane + streak
- [x] Faza 6 — check.sh, changelog, lekcja

## Ryzyka

| Ryzyko | Mitigacja |
|---|---|
| RepeatSessionId z sesją innego klienta | Walidacja `ClientId` w `StartAsync` |
| RIR zwiększa tarcie | Domyślnie wyłączone |
| Streak zmienia semantykę | Dokumentujemy; etykieta bez zmiany copy „tyg." |
| Portal exercises zmienia kształt odpowiedzi | Additive `lastPerformedOn`; pozostałe pola jak Exercise |

## Changelog

- 2026-08-06 — utworzono spec (Fale 0–1).
- 2026-08-06 — wdrożono Fale 0–1: Equipment w DTO sesji + BW, RIR za przełącznikiem, tap-outside, reorder w menu, przecinek w NumInput, cap 4 h, RepeatSessionId + PrefillFromSession, lastPerformedOn w portal exercises, streak kroczący.
