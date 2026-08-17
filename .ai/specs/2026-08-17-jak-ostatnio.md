# Jak ostatnio — presety serii z historii klienta

## TLDR

Przy dodawaniu ćwiczenia do planu dla konkretnego klienta serie podstawiają się z ostatniego wykonania (logger, fallback: rozpis w przypisanym planie). Trener widzi etykietę i może cofnąć do defaultów z biblioteki.

## Problem

Każde dodane ćwiczenie startuje od `defaultSets`/`defaultReps` z biblioteki (zwykle 3 × 10). Trener przepisuje te same ciężary ręcznie przy każdym bloku.

## Proponowane rozwiązanie

Nowy wsadowy endpoint zwraca ostatnie serie per ćwiczenie. Kreator ładuje mapę raz i używa jej w `addItem` / podpowiedziach composera. Bez klienta (szablon) funkcja jest nieaktywna.

Źródło, w tej kolejności:

1. Ostatnie ukończone serie robocze z loggera (`Completed && !IsWarmup`).
2. Ostatni rozpis w aktywnym planie przypisanym klientowi.
3. Defaulty z biblioteki.

## Model danych

Bez zmian encji. Tylko nowy kształt odpowiedzi.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/clients/{id}/exercises/last-prescription?exerciseIds=1,2,3` | query | `{ items: LastPrescription[] }` |

`LastPrescription`: `exerciseId`, `performedOn` (ISO lub null przy `planned`), `source` (`logged` \| `planned`), `label`, `sets: { reps, repsMax, loadKg }[]`.

Typy i metoda w `apps/web/lib/api.ts`: `api.clients.lastPrescription`.

## UI

Kreator: etykieta „jak 12 sie: 4 × 8 · 60 kg — cofnij” pod nową pozycją. Composer pokazuje te liczby zamiast 3×10.

## Fazy implementacji

1. Endpoint + test.
2. Kontekst w `PlanBuilder` + `addItem`.
3. Composer preview + undo.

## Ryzyka

- Pusty `exerciseIds` → pusta lista, nie błąd.
- Klient bez historii → cisza, defaulty biblioteki.

## Changelog

- 2026-08-17 — wdrożenie.
