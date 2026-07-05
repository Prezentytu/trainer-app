# Logowanie sesji treningowych i statystyki progresu

## TLDR

Zapis tego, co klient **faktycznie zrobił** (sesja → ćwiczenia → serie z kg/powt./czasem/dystansem/RPE) oraz liczone z tych zapisów statystyki w stylu Gravitusa: szacowane 1RM (Epley), max ciężar, max wolumen, rep maxes, trend w czasie, rekordy (PR). Bez tej warstwy żadne wykresy „dokładania ciężaru" nie są możliwe.

Zależy od: `2026-07-05-plan-creator-structure.md`. Współgra z: `2026-07-05-client-maxes-percent-loading.md` (zalogowany rekord może aktualizować maxa).

## Problem

Aplikacja przechowuje tylko definicje i plany („co klient ma robić"). Nie ma zapisu wykonania, więc nie da się pokazać historii, progresji ciężaru, 1RM ani wolumenu — funkcji, które w Gravitusie stanowią zakładki Stats/History ćwiczenia i podsumowanie sesji.

## Proponowane rozwiązanie

Trzy warstwy (wzorzec Gravitusa): definicja (`Exercise`) / zapis (`WorkoutSession → LoggedExercise → LoggedSet`) / statystyki **liczone na żądanie** z zapisów (nie składowane — zawsze spójne, brak denormalizacji).

Decyzje:

- Metryki serii **rozdzielone i opcjonalne** (`WeightKg`, `Reps`, `DurationSeconds`, `DistanceMeters`, `Rpe`) — jeden typ serii obsługuje wszystkie modalności; `weighted pull-up 0×3` = obciążenie dodane 0 kg (masa ciała).
- 1RM liczone wzorem Epleya `w·(1+r/30)` tylko z serii mających ciężar i powtórzenia; dla czasowych rekordem jest czas, dla dystansowych dystans.
- MVP loguje **trener** (portal trenera); logowanie przez klienta to osobna przyszła funkcja.

## Model danych

```csharp
public class WorkoutSession
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public int? PlanId { get; set; }               // opcjonalnie: wg jakiego planu
    public Plan? Plan { get; set; }
    public DateOnly PerformedOn { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<LoggedExercise> Exercises { get; set; } = [];
}

public class LoggedExercise
{
    public int Id { get; set; }
    public int WorkoutSessionId { get; set; }
    public WorkoutSession? Session { get; set; }
    public int ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }
    public int Order { get; set; }
    public string? Note { get; set; }
    public List<LoggedSet> Sets { get; set; } = [];
}

public class LoggedSet
{
    public int Id { get; set; }
    public int LoggedExerciseId { get; set; }
    public LoggedExercise? LoggedExercise { get; set; }
    public int SetNumber { get; set; }
    public double? WeightKg { get; set; }          // 0 = masa ciała
    public int? Reps { get; set; }
    public int? DurationSeconds { get; set; }
    public int? DistanceMeters { get; set; }
    public double? Rpe { get; set; }
    public bool IsWarmup { get; set; }             // serie rozgrzewkowe poza statystykami PR
}
```

`AppDb.cs`: cascade `Client → WorkoutSession → LoggedExercise → LoggedSet`; `WorkoutSession → Plan` jako `SetNull`. Usunięcie ćwiczenia zablokowane, gdy ma logi (409).

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/clients/{clientId}/sessions` | — | podsumowania (data, liczba serii, tonaż, czas) |
| GET | `/api/sessions/{id}` | — | szczegóły + liczone: `totalVolumeKg`, `totalSets`, `prs[]`, `muscleEngagement[]`* |
| POST/PUT/DELETE | `/api/sessions[/{id}]` | `WorkoutSessionInput { clientId, planId?, performedOn, durationSeconds?, note?, exercises: [...] }` (replace-all jak plany) | — |
| GET | `/api/clients/{clientId}/exercises/{exerciseId}/stats` | — | `estimated1RM`, `maxWeightKg`+data, `maxVolumeKg`+data, `repMaxes[]`, `trend[]` (data → est. 1RM) |
| GET | `/api/clients/{clientId}/exercises/{exerciseId}/history` | — | sesje z seriami `set/kg/reps/1rm` + znaczniki PR |

\* `muscleEngagement` tylko jeśli wdrożony spec wzbogacenia biblioteki (mięśnie na ćwiczeniu); do tego czasu pomijane w odpowiedzi.

Wzory w helperze `apps/api/Stats.cs`: Epley; wolumen = Σ w·r (bez rozgrzewkowych); PR = nowy rekord est. 1RM / czasu / dystansu w historii klient+ćwiczenie.

`apps/web/lib/api.ts`: typy `WorkoutSession`, `LoggedExercise`, `LoggedSet`, `ExerciseStats`, `api.sessions.*`, `api.stats.*`.

## UI

- Karta klienta: zakładka „Sesje" — lista + formularz logowania (dodawanie ćwiczeń i serii; pola wg typu ćwiczenia; przycisk „wypełnij z planu" kopiuje przepisane serie z przypisanego planu).
- Widok ćwiczenia w kontekście klienta: zakładki **Statystyki** (1RM, max ciężar, max wolumen, rep maxes) i **Historia** (sesje + tabela serii, wykres trendu — prosty inline SVG, bez nowej zależności; biblioteka wykresów wymagałaby zgody).

## Fazy implementacji

- [ ] Faza 1 — backend: encje + DTO + endpointy sesji + seed (kilka sesji Jana z progresją) + testy
- [ ] Faza 2 — backend: `Stats.cs` + endpointy stats/history + testy wzorów (Epley, PR, wolumen)
- [ ] Faza 3 — frontend: logowanie sesji na karcie klienta
- [ ] Faza 4 — frontend: statystyki + historia + wykres trendu

## Ryzyka i wpływ

- **Wydajność liczenia statystyk** — dataset jednoosobowego trenera jest mały (tysiące serii); liczenie w pamięci wystarczy. Rezydualne: przy dużej historii dodać indeks `(ClientId, ExerciseId)`.
- **Serie rozgrzewkowe zawyżają PR** — flaga `IsWarmup` wyklucza je z rekordów.
- **Niekompletne serie** (np. sam czas) — statystyki liczą tylko z serii mających wymagane metryki; reszta ignorowana, nie błąd.

## Changelog

- 2026-07-05 — utworzono spec.
