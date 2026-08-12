# Portal — treningi do przodu + powtórki

## TLDR

Klient w portalu widzi trening przypisany do każdego dnia tygodnia (klikalny pasek P–N z podglądem ćwiczeń), może wykonać trening z wyprzedzeniem / poza kolejką oraz powtórzyć dowolny ukończony trening (osobna sesja). Sesja poza kolejką dostaje flagę `OutOfOrder` widoczną u trenera (badge + wpis na dashboardzie).

## Problem

„Dzisiejszy trening” w portalu to następny `PlanDay` w cyklu ukończeń — nie dzień kalendarza. Klient w środę widzi „Czwartek” i nie może podglądać / wystartować innego dnia planu. Pasek P–N to tylko habit tracker. Brakuje też powtórki dowolnego ukończonego treningu (dziś tylko „Powtórz ostatni”).

## Proponowane rozwiązanie

1. **Klikalny pasek P–N** — mapowanie etykiet dni planu → dni tygodnia; tap otwiera `DayPreviewSheet` z ćwiczeniami i CTA.
2. **Start dowolnego dnia planu** — data wykonania = dziś; gdy dzień ≠ należny → potwierdzenie + flaga `OutOfOrder`.
3. **Kolejka bez zmian** — algorytm min-ukończeń; pominięte dni zostają w kolejce.
4. **Powtórka** — `repeatSessionId` (istniejący mechanizm); nowa sesja **bez** `PlanDayId` (nie liczy się do cyklu), bez `OutOfOrder`.
5. **Trener** — badge „Poza kolejką” przy sesji + sygnał na dashboardzie (`fromClients` kind `out_of_order`).
6. **Hero** — gdy etykieta należnego dnia ≠ dziś → „Następny trening” zamiast „Dzisiejszy trening”.

## Model danych

`WorkoutSession.OutOfOrder` (`bool`, default `false`) — ustawiane raz przy starcie, gdy `PlanDayId` ≠ aktualnie należny dzień.

Zmiana schematu → migracja EF + usunięcie lokalnego `apps/api/trainer.db`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/portal/{token}?today=` | — | `week[]` + `lastCompletedSessionId` per dzień |
| GET | `/api/portal/{token}/days/{dayId}` | — | pełny dzień planu (items + obciążenia) |
| POST | `/api/portal/{token}/sessions/start` | `planDayId` / `repeatSessionId` | sesja z `outOfOrder` |
| GET | `/api/dashboard` | — | `fromClients` + kind `out_of_order`; sesje z `outOfOrder` |
| GET | `/api/clients/{id}/sessions` | — | + `outOfOrder` |
| GET | `/api/sessions/{id}` / portal detail | — | + `outOfOrder`; opcjonalnie `repeatOfDayLabel` |

Typy TS w `apps/web/lib/api.ts` lustrzane.

## UI

- Portal Dziś: klikalny pasek, `DayPreviewSheet`, hero „Następny trening”, fallback lista „Wszystkie treningi”.
- Portal Historia: „Powtórz” przy każdej sesji.
- Panel trenera: badge na karcie klienta; wiersz w „Od klientów”.

## Fazy implementacji

- [x] Faza 1 — spec
- [x] Faza 2 — backend: schemat, helper kolejki, flaga, endpoint dnia, DTO, dashboard
- [x] Faza 3 — web: mapping, sheet, start/powtórka, UI trenera
- [x] Faza 4 — testy API + `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Powtórka zalicza dzień w następnym cyklu | Powtórka bez `PlanDayId` |
| Plan bez etykiet dni tygodnia | Fallback: lista „Wszystkie treningi” |
| `OutOfOrder` post-hoc nieodtwarzalne | Flaga przy starcie |
| Reset lokalnego `trainer.db` | Akceptacja w planie |

## Changelog

- 2026-08-12 — utworzono spec.
- 2026-08-12 — wdrożono: klikalny pasek P–N / lista dni, DayPreviewSheet, start poza kolejką (`OutOfOrder`), powtórki, badge + sygnał u trenera.
