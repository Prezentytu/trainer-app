# Wywiad klienta (Client Intake)

## TLDR

Dodanie klienta zostaje błyskawiczne (obecny modal bez zmian). Wywiad to osobna, opcjonalna struktura `ClientIntake` (1:1 z klientem) — wypełniana częściowo przez trenera w profilu i/lub przez klienta w portalu. Sekcja zdrowia uproszczona (nie pełny PAR-Q+).

## Problem

Trener potrzebuje danych z pierwszej rozmowy (cel, zdrowie, styl życia, doświadczenie, organizacja), żeby bezpiecznie ułożyć plan — ale nie chce spowalniać dodawania klienta. Obecnie jest tylko wolne `Client.Note` (UI: chip celu). Brak struktury wywiadu i brak możliwości uzupełnienia przez klienta w portalu.

## Proponowane rozwiązanie

1. **Modal „Dodaj klienta” bez zmian** — imię, e-mail, cel jako chip → `note`.
2. **Nowa encja `ClientIntake`** — wszystkie pola opcjonalne; upsert przez trenera i klienta.
3. **Profil klienta** — 4. zakładka „Wywiad” (odczyt / edycja / empty state z CTA: przeprowadź lub wyślij link).
4. **Portal** — `/portal/[token]/intake` + baner na home, dopóki kluczowe sekcje puste.
5. **Zdrowie uproszczone** — pola tekstowe (kontuzje, bóle, choroby, leki), bez 7 pytań PAR-Q+.

Decyzje:
- GET pustego intake → `200` z obiektem o nullach (nie 404) — prostszy frontend.
- PUT = pełny upsert (nadpisanie wszystkich pól z body; brak pola = null).
- „Kluczowe sekcje” dla banera portalu: wypełniony cel (`goalType` lub `goalDetails`) **lub** dowolne pole zdrowia / doświadczenia — baner znika, gdy jest choć jeden istotny wpis (cel albo zdrowie albo doświadczenie).

## Model danych

```csharp
public class ClientIntake
{
    public int Id { get; set; }
    public int ClientId { get; set; }          // unique
    public Client? Client { get; set; }

    // Cel
    public string? GoalType { get; set; }
    public string? GoalDetails { get; set; }

    // Zdrowie (uproszczone)
    public string? Injuries { get; set; }
    public string? Pains { get; set; }
    public string? ChronicConditions { get; set; }
    public string? Medications { get; set; }

    // Styl życia
    public string? WorkType { get; set; }       // siedząca | stojąca | fizyczna | mieszana
    public int? StressLevel { get; set; }       // 1–5
    public string? SleepHours { get; set; }
    public string? FreeTimeActivity { get; set; }

    // Doświadczenie
    public string? ExperienceLevel { get; set; } // brak | początkujący | średniozaawansowany | zaawansowany
    public string? PastActivities { get; set; }
    public string? TrainingHistoryNotes { get; set; }

    // Organizacja
    public int? SessionsPerWeek { get; set; }
    public string? Availability { get; set; }
    public string? Equipment { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

Relacja: `Client` 1:0..1 `ClientIntake`, cascade delete. Indeks unique na `ClientId`.

Input DTO: `ClientIntakeInput` — te same pola (bez Id/ClientId/UpdatedAt).

Zmiana schematu → migracja EF + usunięcie lokalnej `apps/api/trainer.db`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/clients/{id}/intake` | — | `ClientIntake` (puste → nulle) |
| PUT | `/api/clients/{id}/intake` | `ClientIntakeInput` | `ClientIntake` |
| GET | `/api/portal/{token}/intake` | — | `ClientIntake` |
| PUT | `/api/portal/{token}/intake` | `ClientIntakeInput` | `ClientIntake` |

Kształt odpowiedzi (camelCase):

```ts
{
  clientId, goalType, goalDetails,
  injuries, pains, chronicConditions, medications,
  workType, stressLevel, sleepHours, freeTimeActivity,
  experienceLevel, pastActivities, trainingHistoryNotes,
  sessionsPerWeek, availability, equipment,
  updatedAt // null gdy jeszcze nie utworzono wiersza
}
```

Typy/metody w `apps/web/lib/api.ts`: `ClientIntake`, `ClientIntakeInput`, `WORK_TYPES`, `EXPERIENCE_LEVELS`, `api.clients.getIntake/saveIntake`, `api.portal.getIntake/saveIntake`.

## UI

- `apps/web/app/(app)/clients/[id]/page.tsx` — zakładka „Wywiad”.
- `apps/web/app/portal/[token]/intake/page.tsx` — ankieta startowa.
- `apps/web/app/portal/[token]/page.tsx` — baner.
- Wspólny formularz/sekcje: `apps/web/components/ClientIntakeForm.tsx` (trener + portal).
- Prymitywy: `Tabs`, `Card`, `Button`, `Field`, `Pill`, `EmptyState`, `ErrorBanner`, `inputClass`.

## Fazy implementacji

- [x] Faza 1 — backend: encja + DTO + endpointy + migracja + reset DB + testy
- [x] Faza 2 — typy TS + zakładka Wywiad u trenera
- [x] Faza 3 — portal (strona + baner) + walidacja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| PUT nadpisuje pola drugiej strony nullami | UI zawsze ładuje aktualny stan przed edycją i wysyła pełny obiekt; częściowe „merge” nie w v1 |
| Reset lokalnej DB kasuje dane | Zgodnie z AGENTS.md; migracja dla prod |
| Cel w `Client.Note` vs `Intake.GoalType` | Modal nadal zapisuje chip do `note`; zakładka Wywiad ma własne `goalType` — w przyszłości można zsynchronizować |
| Baner irytujący klienta | Znika po pierwszym istotnym wpisie; nie blokuje treningu |

## Changelog

- 2026-08-01 — utworzono spec; decyzje: trener+klient, zdrowie uproszczone, GET pusty = 200 z nullami, wspólny formularz.
- 2026-08-01 — wdrożono: `ClientIntake`, endpointy trener/portal, zakładka Wywiad, ankieta w portalu + baner.
