# Parytet ze Styrką — Fala 3 (retencja + migracja)

## TLDR

Domknięcie retencji w portalu (share card, rep-maxy, kalkulator %1RM ze strefami, zastój dla klienta) oraz jedna migracja: notatka per seria, L/R, waga docelowa.

Benchmark: `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md`. Fale 0–2: `2026-08-06-styrka-parity-fale-0-1.md`, `2026-08-06-styrka-parity-fala-2.md`.

## Problem

Po Falach 0–2 klient ma insights progresu, ale brakuje: udostępniania treningu, rep-maxów, kalkulatora stref, sygnału zastoju. W modelu brakuje notatki/strony serii oraz celu wagowego — wymagają migracji.

## Proponowane rozwiązanie

1. Migracja: `LoggedSet.Note`, `LoggedSet.Side`, `Client.GoalWeightKg` + `IsUnilateral` w DTO sesji.
2. Logger: notatka per seria (menu wiersza), chipy L/P dla unilateral.
3. Waga docelowa u trenera + „Cel / zostało" na portalowych pomiarach.
4. Share card PNG (`ImageResponse`) + `navigator.share({ files })` — nigdy URL z tokenem.
5. `RepMaxList` w expandzie rekordu (portal + trener).
6. Kalkulator %1RM ze strefami na `/portal/.../calculator` (źródło: `records`).
7. `GET /api/portal/{token}/stagnation` + karta motywująca na `/progress`.

## Model danych

| Encja | Pole | Typ |
|---|---|---|
| `LoggedSet` | `Note` | `string?` |
| `LoggedSet` | `Side` | `string?` (`"left"` / `"right"` / null) |
| `Client` | `GoalWeightKg` | `double?` |

Lokalnie: usunąć `apps/api/trainer.db` po migracji (`EnsureCreated` nie migruje). Prod: migracja EF.

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| — | Session DTO exercise | + `isUnilateral`; set: + `note`, `side` |
| PUT/POST | clients / sessions | `ClientInput.goalWeightKg`; `LoggedSetInput.note/side` |
| GET | `/api/portal/{token}/stagnation` | jak trener `/clients/{id}/stagnation` lub `null` |
| GET | share-image (Next route) | PNG podsumowania sesji |

## UI

- `SessionLogger` — notatka serii, L/P
- `clients/[id]` — GoalWeightKg
- `portal/.../measurements` — cel wagi
- `SessionSummaryView` — Udostępnij
- `portal/.../session/.../share-image/route.tsx`
- `RepMaxList` + expand na `/progress` i u trenera
- `portal/.../calculator`
- `/progress` — karta zastoju

## Fazy

- [x] Faza 0 — ten spec + update inwentaryzacji Styrki
- [x] Faza 1 — migracja + DTO + api.ts
- [x] Faza 2 — logger note/side + goal weight
- [x] Faza 3 — share card + rep-maxy + kalkulator + stagnation
- [x] Faza 4 — testy, check.sh, changelog

## Ryzyka

| Ryzyko | Mitigacja |
|---|---|
| Share z tokenem w URL | Tylko plik PNG przez `navigator.share({ files })` |
| `IsUnilateral` bez DTO | Jak BW/`equipment` — dodać do SessionDetail |
| Reset lokalnej DB | Dokumentowane; seed odtwarza demo |

## Poza zakresem

Cardio totals, avg RPE/RIR, drill-down mięśnia, licznik wykonań, CSV z seriami, import backupu, dystans w loggerze, notatka sesji w trakcie, edycja daty w UI.

## Changelog

- 2026-08-06 — utworzono spec.
- 2026-08-06 — wdrożono: migracja `Note`/`Side`/`GoalWeightKg`, logger L/P + notatka serii, cel wagi, share card PNG, `RepMaxList`, kalkulator %1RM, `GET portal/.../stagnation` + karta na `/progress`.
