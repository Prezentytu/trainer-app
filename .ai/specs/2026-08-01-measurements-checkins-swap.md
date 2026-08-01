# Pomiary, check-in i podmiana ćwiczeń (Faza 4)

## TLDR

Rozszerzamy portal trenera i klienta o pomiary ciała (waga, obwody), krótki wellness check-in po sesji (1–5) oraz podmianę ćwiczenia w loggerze bez utraty serii.

## Problem

Trenerzy potrzebują śledzić progres poza siłą (waga, talia), a klient po treningu powinien szybko zasygnalizować samopoczucie. W sali często trzeba zamienić ćwiczenie (zajęta maszyna) — bez tego logger łamie flow.

## Proponowane rozwiązanie

- Nowa encja `ClientMeasurement` z CRUD po stronie trenera i POST/GET w portalu (token).
- Pola wellness na `WorkoutSession` + `PATCH …/checkin` po ukończeniu sesji.
- Podmiana `ExerciseId` na `LoggedExercise` przez istniejący `PUT` sesji; UI „Podmień” z wyszukiwarką biblioteki.
- Lekka integracja ChurnRadar: niskie średnie samopoczucie (<2.5/5 z ostatnich 3 sesji).

## Model danych

**ClientMeasurement** — `ClientId`, `MeasuredOn`, opcjonalnie `WeightKg`, `WaistCm`, `ChestCm`, `HipsCm`, `Note`.

**WorkoutSession** (rozszerzenie) — `FeelingScore`, `SleepScore`, `EnergyScore` (nullable int 1–5).

DTO: `ClientMeasurementInput`, `SessionCheckinInput`.

## Kontrakt API

| Metoda | Ścieżka | Uwagi |
|---|---|---|
| GET | `/api/clients/{clientId}/measurements` | Trener, `OwnsClientAsync` |
| POST | `/api/clients/{clientId}/measurements` | Trener |
| DELETE | `/api/measurements/{id}` | Trener, `OwnedMeasurementAsync` |
| GET | `/api/portal/{token}/measurements` | Portal |
| POST | `/api/portal/{token}/measurements` | Portal — klient loguje wagę |
| GET | `/api/portal/{token}/exercises` | Shared + ćwiczenia trenera klienta |
| PATCH | `/api/sessions/{id}/checkin` | Po `completed` |
| PATCH | `/api/portal/{token}/sessions/{id}/checkin` | Portal |

Podmiana ćwiczenia: istniejący `PUT /api/sessions/{id}` (zmiana `exerciseId` w `LoggedExerciseInput`, serie bez zmian).

## UI

- Profil klienta: zakładka **Pomiary** (lista, formularz waga/talia, wykres `WeightTrendSparkline`).
- Profil klienta: StatBlocki średniego check-inu (ostatnie 3 sesje).
- `SessionLogger`: check-in 1–5 po „Zakończ”, przycisk **Podmień** + picker z wyszukiwarką.
- Portal: te same flow w loggerze; biblioteka z `api.portal.exercises`.

## Fazy implementacji

- [x] Backend: encje, endpointy, migracja Postgres, testy izolacji
- [x] Frontend: `api.ts`, zakładka Pomiary, check-in, swap
- [x] ChurnRadar: `low_wellness` przy średnim feeling < 2.5

## Ryzyka

- **Swap a statystyki** — zamiana ćwiczenia bez `substitutedFrom` może zafałszować trendy e1RM; na razie akceptowalne (P1), w przyszłości metadane podmiany.
- **EnsureCreated (SQLite dev)** — po zmianie schematu usunąć `trainer.db`.

## Changelog

- 2026-08-01 — wdrożono Fazę 4 (pomiary, check-in, swap, spec).
