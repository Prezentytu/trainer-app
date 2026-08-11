# Portal — świeżość sesji, CTA i cykl planu

## TLDR

Sesja należy do dnia lokalnego, w którym została rozpoczęta. Zalegające `in_progress` nie blokują już „Kontynuuj trening” we wtorek dla poniedziałku: puste auto-abandon, z postępem → karta Zapisz/Odrzuć. Plan zapętla się jako cykl. Jedna definicja „dziś” = czas lokalny klienta.

## Problem

Klient widzi CTA „Kontynuuj trening” dla sesji z poprzedniego dnia, podczas gdy karta pokazuje następny dzień planu. Brak abandon, brak blokady drugiej sesji, mieszanka UTC/lokalnej daty, po ukończeniu planu wiecznie ostatni dzień.

## Proponowane rozwiązanie

**Reguła:** sesja należy do dnia lokalnego startu. Grace period 4 h przez północ (spójne z capem duration).

- Świeża `in_progress` → `inProgressSession` + CTA „Kontynuuj: {dzień}”.
- Zalegająca, 0 ukończonych serii → auto-abandon przy GET home.
- Zalegająca, ≥1 seria → `staleSession` + karta Zapisz/Odrzuć; primary CTA = Rozpocznij (następny dzień).
- Start idempotentny: jeśli świeża `in_progress` istnieje, zwróć ją.
- Cykl planu: licznik ukończeń per `PlanDayId`; następny = pierwszy z min. liczbą.
- Front przekazuje lokalną datę (`?today=` + `performedOn`).

Bez zmiany schematu DB — nowy status string `"abandoned"`.

## Model danych

- `WorkoutSession.Status`: `"in_progress" | "completed" | "abandoned"` (string, bez migracji).
- Brak nowych kolumn; grace z `CreatedAt`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/portal/{token}?today=YYYY-MM-DD` | query `today` (opcjonalne) | `PortalHome` + `staleSession`, bogatsze `inProgressSession`, `cycleRestart` |
| POST | `/api/portal/{token}/sessions/start` | + `performedOn` lokalne | istniejąca świeża sesja lub nowa |
| PATCH | `/api/portal/{token}/sessions/{id}/abandon` | — | DTO sesji |

`staleSession`: `{ id, planDayId, dayLabel, performedOn, completedSets, totalSets }`.
`inProgressSession`: + `dayLabel`, `completedSets`, `totalSets`.

## UI

Home `/portal/[token]`:
- Świeża sesja: karta dnia sesji + postęp + CTA „Kontynuuj: {label}".
- Zalegająca: karta „Niedokończony trening" (Zapisz / Odrzuć) + primary „Rozpocznij trening".
- Nowy cykl: „Cykl ukończony — zaczynasz od nowa".
- `todayIsoLocal()` wszędzie w portalu zamiast `toISOString().slice(0,10)`.

## Fazy implementacji

- [x] Faza 1 — backend: freshness, abandon, cycle, StartAsync guard, testy
- [x] Faza 2 — frontend: dates, api.ts, home UX
- [x] Faza 3 — bramka `./scripts/check.sh`

## Ryzyka i wpływ

| Scenariusz | Mitigacja |
|---|---|
| Klient w innej TZ niż UTC | `?today=` + tolerancja ±1 dzień w `ValidatePerformedOn` |
| Trening przez północ | grace 4 h od `CreatedAt` |
| Race double-start | StartAsync zwraca istniejącą świeżą sesję |
| Historia zaśmiecona | `abandoned` poza filtrem `completed` |

## Changelog

- 2026-08-11 — utworzono spec i wdrożono.
