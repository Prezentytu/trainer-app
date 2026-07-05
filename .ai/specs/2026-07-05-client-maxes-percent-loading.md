# Maxy klienta i obciążenia procentowe (%1RM)

## TLDR

Rejestr maxów klienta (1RM per ćwiczenie) + możliwość zapisania obciążenia w planie jako **procent maxa**. Przy podglądzie planu w kontekście klienta aplikacja wylicza ciężary — jak arkusz „8 Week Powerbuilding" Seby Kota (wpisz 1RM → wyliczone kg) i szablon 15-10-5 (50/75/100%).

Zależy od: `2026-07-05-plan-creator-structure.md` (struktura dni/tygodni).

## Problem

Plany procentowe wymagają dwóch rzeczy, których nie ma: (1) przechowywania aktualnych maxów klienta per ćwiczenie, (2) zapisu obciążenia pozycji planu jako `%` zamiast kg. Dziś trener przelicza to ręcznie w arkuszu.

## Proponowane rozwiązanie

- Nowa encja `ClientMax` (klient + ćwiczenie + wartość + data). Historia maxów zostaje (nowy wpis nie nadpisuje starego) — do statystyk i śledzenia progresu; „aktualny max" = najnowszy wg daty.
- `PlanItem.LoadPercent` (np. `75` = 75%). `LoadKg` i `LoadPercent` są alternatywne; jeśli oba puste — default z ćwiczenia.
- **Poziom serii**: `PlanSet.LoadPercent` z `PercentOf:"1rm"` (ze specu kreatora) korzysta z tego samego maxa klienta. `PercentOf:"top"` nie dotyka maxów — liczy się względem topowej serii w sesji (bez `clientId`).
- Wyliczenie następuje **przy odczycie** planu z kontekstem klienta (`?clientId=`): `computedLoadKg = round(LoadPercent/100 × aktualny max, do 0,5 kg)` — zarówno dla pozycji, jak i dla serii `PlanSet` z bazą `"1rm"`. Brak maxa → `computedLoadKg = null`, UI pokazuje „ustal max".

## Model danych

```csharp
public class ClientMax
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public int ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }
    public double MaxKg { get; set; }
    public DateOnly MeasuredOn { get; set; }
    public string? Note { get; set; }          // np. „test 1RM", „szacowane z 5RM"
}
```

`PlanItem`: `+ double? LoadPercent`.

`AppDb.cs`: `DbSet<ClientMax>`, cascade `Client → ClientMax`; usunięcie ćwiczenia zablokowane, gdy ma maxy (jak przy PlanItems — 409 z komunikatem).

> Zmiana schematu → reset `trainer.db` (najlepiej wdrożyć razem ze specem kreatora — jeden reset).

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/clients/{clientId}/maxes` | — | `ClientMax[]` (z nazwą ćwiczenia, sortowane po dacie malejąco) |
| POST | `/api/clients/{clientId}/maxes` | `ClientMaxInput { exerciseId, maxKg, measuredOn, note? }` | `201` |
| DELETE | `/api/maxes/{id}` | — | `204` |
| GET | `/api/plans/{id}?clientId=N` | — | plan jak w specu kreatora + `computedLoadKg` na pozycjach z `loadPercent` |

`apps/web/lib/api.ts`: typ `ClientMax`, metody `api.clients.maxes(...)`; `PlanItem` + `loadPercent`, `computedLoadKg`.

## UI

- Karta klienta (`clients/[id]` lub sekcja na liście): tabela maxów (ćwiczenie, kg, data) + formularz dodania.
- Kreator planu: pole „Ciężar" z przełącznikiem kg / % maxa.
- Podgląd planu z poziomu przypisania klienta pokazuje wyliczone kg obok procentu (np. „75% → 90 kg").

## Fazy implementacji

- [ ] Faza 1 — backend: `ClientMax`, `PlanItem.LoadPercent`, endpointy, wyliczanie `computedLoadKg`, seed (maxy Jana Kowalskiego), testy
- [ ] Faza 2 — frontend: maxy na karcie klienta, przełącznik kg/% w kreatorze, wyliczone ciężary w podglądzie

## Ryzyka i wpływ

- **Brak maxa dla ćwiczenia z `LoadPercent`** — plan działa, `computedLoadKg = null`, UI komunikuje; brak twardej blokady.
- **Zaokrąglanie** — do 0,5 kg (najmniejszy talerzyk); w przyszłości konfigurowalne per ćwiczenie.
- **Dwa źródła ciężaru (kg vs %)** — walidacja w kreatorze: wypełnione może być tylko jedno.

## Changelog

- 2026-07-05 — utworzono spec.
