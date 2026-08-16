# Harmonogram treningów i szybki kreator

## TLDR

Trener wyklika plan jedną linią we wszystkich widokach kreatora (lista serii jak `5x52.5, 5x67.5`). Do dni planu przypina zalecane dni tygodnia. Klient widzi treningi na kalendarzu i może je przełożyć — bez kary, bez sztywnych dat. Panel i portal liczą „następny dzień” tym samym algorytmem.

## Problem

- Widok Lista umie jedną linią złożyć ćwiczenie z seriami (`ListComposer` + `parseQuickEntry` + `extractSetList`). Tablica i Arkusz tego nie umieją — `QuickComposer` nie aplikuje listy serii. Ściągawka jej nie dokumentuje.
- Harmonogram nie istnieje: plan to kolejka dni (`Sessions.NextDueDayAsync`), `Assignment.StartDate` jest martwe, `WeekStrip` zgaduje dzień z etykiety. Panel trenera liczy „następny dzień” inaczej niż portal.
- Przykład (wt/czw/sob/nd w tyg. 1, wt/śr/pt w tyg. 2) wymaga dnia tygodnia **per dzień planu**, nie jednego wzorca na plan.

## Proponowane rozwiązanie

1. **Kreator — parytet składni.** Wspólny helper z `loggedSets` podłączony w `QuickComposer`. Ostatnio używane ćwiczenia (localStorage). Duplikacja dnia do innego tygodnia.
2. **Harmonogram hybrydowy.** `PlanDay.DayOfWeek` (1=pn…7=nd, null = bez zalecenia). `Assignment.StartDate` kotwiczy kalendarz. `AssignmentDayOverride` to przełożenie jednego treningu na datę (kasowane po ukończeniu).
3. **Portal.** Jeśli na dziś przypada zaplanowany, nieukończony dzień — to „Dzisiejszy trening”. Inaczej kolejka z etykietą „Następny · zaplanowany na czw 20.08”. Akcja „Przełóż na inny dzień”.
4. **Panel + cron.** `ClientProgress.nextDay` z backendu. Przypomnienia tylko w zaplanowane dni, gdy assignment ma harmonogram.

## Model danych

Zmiana schematu: migracja EF + usunięcie lokalnej `apps/api/trainer.db`.

`PlanDay` (`Models.cs`):

- `DayOfWeek` (`int?`) — 1=poniedziałek … 7=niedziela. Null = bez zalecenia.

Nowa encja `AssignmentDayOverride`:

- `Id`, `AssignmentId`, `PlanDayId`, `Date` (`DateOnly`), `CreatedAt`
- Unikalne `(AssignmentId, PlanDayId)`
- Kasowane po ukończeniu sesji z tym `PlanDayId` w danym assignment

`Assignment.StartDate` — kotwica: poniedziałek tygodnia startu + `(WeekNumber−1)·7` + `(DayOfWeek−1)`, chyba że jest override.

Helper `apps/api/Scheduling.cs`:

- `MondayOf(DateOnly)`
- `ScheduledOn(PlanDay, StartDate, override?)`
- `TodayScheduledDay(...)` — zaplanowany, nieukończony dzień na daną datę
- `ApplyWeekdaysFrom(sourceWeek, targetDays)` — kopia `DayOfWeek` po `Order`

DTO:

```csharp
public record PlanDayRescheduleInput(DateOnly Date);
```

`PlanDayInput` / `PlanInput` dostają `int? DayOfWeek`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| PUT/POST | `/api/plans` (istniejące) | `PlanDay` + `dayOfWeek` | jak dziś + `dayOfWeek` |
| GET | `/api/portal/{token}` | `?today=` | `week[].scheduledOn?`, `today.scheduledOn?`, `today.movedFrom?` |
| POST | `/api/portal/{token}/days/{dayId}/reschedule` | `{ date }` | `{ date }` |
| GET | `/api/clients/{id}/progress` | — | + `nextDay { id, label, scheduledOn, movedFrom? }` |

Zachowanie:

- Reschedule: upsert override. Data w przeszłości → 400. Dzień nie z planu assignmentu → 404.
- Override kasowany przy `complete` sesji z tym `planDayId`.
- Cron reminders: gdy którykolwiek dzień assignmentu ma `DayOfWeek`, push tylko w dni zaplanowane (z override). Bez harmonogramu — jak dziś.
- Stare plany bez `DayOfWeek` — heurystyka etykiet (`weekdayIndexFromLabel`) jako fallback w `WeekStrip`.

Typy w `apps/web/lib/api.ts` (lustrzane, camelCase):

- `PlanDay.dayOfWeek`, `PlanDayInput.dayOfWeek`
- `PortalWeekDay.scheduledOn?`, `PortalHome.today.scheduledOn?`, `today.movedFrom?`
- `api.portal.rescheduleDay(token, dayId, { date })`
- `ClientProgress.nextDay?: { id, label, scheduledOn, movedFrom? }`

## UI

Panel, tokeny mono v2, prymitywy z `ui.tsx`. Teksty po polsku — CTA = czasownik + obiekt.

- Kreator: `DayScheduleChips` (Pn–Nd) w nagłówku dnia (Lista / Tablica / Arkusz). Domyślna etykieta „Dzień N” → nazwa dnia tygodnia po wyborze chipa. „Zastosuj te dni do pozostałych tygodni”.
- Composer / drawer: ostatnio używane na górze.
- Przypisanie na profilu: podgląd dat od `startDate`.
- Portal `DaySheet`: „Przełóż na inny dzień” — spokojna microcopy, bez wstydu.
- Hero klienta: „dalej: FBW B · sob 22.08”; przy override „przełożony z sob na nd”.

## Fazy implementacji

Każda faza kończy się działającą aplikacją i przechodzi bramkę walidacyjną.

- [x] Faza 1 — spec
- [x] Faza 2 — kreator: parytet `loggedSets`, ściągawka, ostatnio używane, duplikuj dzień między tygodniami
- [x] Faza 3 — backend: `DayOfWeek`, `AssignmentDayOverride`, `Scheduling.cs`, migracja
- [x] Faza 4 — kreator: chipy dni + zastosuj do tygodni + podgląd dat w przypisaniu
- [x] Faza 5 — portal: hybrydowe Dziś, `WeekStrip` po datach, reschedule
- [x] Faza 6 — panel `nextDay` + cron + testy + `./scripts/check.sh` + lekcja

## Ryzyka i wpływ

| Scenariusz | Groźba | Mitygacja | Residual |
|---|---|---|---|
| Reset `trainer.db` | Lokalne dane testowe znikają | Migracja EF na prod; lokalnie EnsureCreated po usunięciu pliku | Świadome |
| Override w wielocyklu | Stary override wraca w kolejnym cyklu | Kasowanie po ukończeniu dnia | Świadome uproszczenie |
| Plan bez `DayOfWeek` | Pusty pasek / zła „dziś” | Fallback heurystyki etykiet; kolejka bez zmian | Etykiety nie-dni-tygodnia jak dziś |
| Rozjazd next-day | Trener i klient widzą inny dzień | Jeden helper + `progress.nextDay` z API | — |
| Start w środku tygodnia | Data przed `StartDate` | Kotwica = poniedziałek tygodnia `StartDate`; dni przed startem i tak w kolejce | Pierwszy tydzień może mieć dni „wstecz” względem startu w środę |

Poza zakresem: sztywny kalendarz z datą na każdy trening, ICS, SMS, automatyczna progresja ciężarów między tygodniami.

## Changelog

- 2026-08-16 — utworzono spec (parytet kreatora, harmonogram hybrydowy, przekładanie).
- 2026-08-16 — wdrożono: `PlanDay.DayOfWeek`, `AssignmentDayOverride`, `Scheduling` + `ResolveHero`, portal `scheduledOn`/`reschedule`, panel `nextDay`, cron tylko w zaplanowane dni, parytet składni w kreatorze.
