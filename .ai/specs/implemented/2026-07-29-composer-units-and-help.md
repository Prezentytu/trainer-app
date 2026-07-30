# Kreator planu: jednostki (czas/dystans) + zwinięta ściągawka

## TLDR

Composer kreatora rozpoznaje jednostki czasu i dystansu (`3x30s`, `3x15m`), a rozwinięta pozycja pozwala przełączyć miarę niezależnie od typu w bibliotece (`PlanItem.MeasureType`). Ściana podpowiedzi zwija się do jednej kontekstowej linii + ściągawki pod „?”.

## Problem

1. Parser `parseQuickEntry` zna tylko `SxR` bez jednostki — `deska boczna 3x30s` nie parsuje się i trafia do nazwy jako typ *powtórzenia*.
2. Miara jest własnością ćwiczenia (`Exercise.Type`), więc ta sama pozycja nie może być raz na 15 m, a raz na 40 s.
3. `ListComposer` zawsze pokazuje 6 chipów hintów + 3-liniową legendę — szum wizualny.
4. Zdublowany nagłówek (`PageHeader` + `PlanHeader`) i dwa CTA „Utwórz plan”.

## Proponowane rozwiązanie

1. **`PlanItem.MeasureType`** (`"reps" | "time" | "distance" | null`) — null dziedziczy z `Exercise.Type`; efektywna miara w DTO jako `measureType`.
2. **Parser jednostek** — token z jednostką przed `SxR`; `measure` / `value` / `valueMax`; normalizacja „3 serie po 30s”.
3. **`lib/measure.ts`** — `measurePatch`, `formatMeasureCore`, etykiety; przełącznik chipów w `ListEntryEditor`.
4. **`ComposerHelp`** — popover ze ściągawką, progressive disclosure w `localStorage`, kontekstowa linia zamiast 6 chipów.
5. **Porządki nagłówka** — jeden tytuł, jedno CTA, krok 2 z 3 w meta.

## Model danych

`PlanItem` (+ `PlanItemInput`):

```csharp
// "reps" | "time" | "distance"; null = dziedziczy z Exercise.Type
public string? MeasureType { get; set; }
```

**Uwaga:** `EnsureCreated()` nie migruje — usuń `apps/api/trainer.db`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST/PUT | `/api/plans[/{id}]` | `PlanItemInput.measureType` opcjonalne | `ItemToDto.measureType` = `i.MeasureType ?? i.Exercise.Type`; `overrides.measureType` = surowa wartość |
| GET | `/api/plans/{id}` | — | j.w. |

Fallbacki jednostek świadome miary: `RepDurationSeconds` / `DistanceMeters` dziedziczą default ćwiczenia tylko gdy efektywna miara to `time` / `distance`.

Typy TS w `apps/web/lib/api.ts` lustrzane (`PlanItem.measureType`, `PlanItemInput.measureType`, `overrides.measureType`).

## UI

- `ListComposer` / `QuickComposer` — jednostki w quick-entry; `ComposerHelp` (`?`).
- `ListEntryEditor` — chipy `powt. · czas · dystans`.
- `PlanHeader` — meta z krokiem 2 z 3; bez zdublowanego `PageHeader` i dolnego CTA.

## Fazy implementacji

- [x] Faza 1 — backend: `MeasureType` + DTO + `ItemToDto`/`BuildItem` + test + reset `trainer.db`
- [x] Faza 2 — frontend model: `api.ts`, `types.ts`, `measure.ts`, persistence, load
- [x] Faza 3 — parser + composer apply + przełącznik miary + render sites
- [x] Faza 4 — `ComposerHelp` + porządki nagłówka + bramka

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Reset bazy kasuje dane dev | Świadoma decyzja; seed odtwarza bibliotekę |
| `2min` parsowane jako 2 metry | Alternatywy `min` przed `m` |
| `3x15 m` zjedzone przez `SxR` | Token z jednostką przed `SxR` |
| Stare plany bez `MeasureType` | null → dziedziczenie z `Exercise.Type` |

## Changelog

- 2026-07-29 — utworzono spec.
- 2026-07-30 — wdrożono: `PlanItem.MeasureType`, parser jednostek, przełącznik miary, `ComposerHelp`, porządki nagłówka.
