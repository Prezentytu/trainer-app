# Import planu przez AI + rampa z backoff

## TLDR

Trener wkleja tekst planu (lub plik `.txt/.md/.csv`) → backend przez OpenRouter zwraca draft → podgląd z mapowaniem ćwiczeń → kreator przed zapisem. Równolegle kreator: dowolny cel rampy, backoff w trybie Rampa, composer z kg/%/rampa/BO, duplikacja pozycji, kopiuj tydzień z progresją.

## Problem

Trenerzy piszą plany w notatkach / arkuszach (np. „Rampa 3 + BO 80%”) i ręcznie przepisują do aplikacji. Tryb „Rampa” w Liście pozwala tylko na chipy 6/4/2/1RM i nie generuje serii backoff — mimo że model `PlanSet` już je wspiera (`role: "backoff"`, `percentOf: "top"`).

## Proponowane rozwiązanie

1. **`POST /api/ai/plan-import`** — OpenRouter (klucz tylko na backendzie), JSON draft z tygodniami/dniami/pozycjami; matching nazw do biblioteki; nic nie zapisuje.
2. **Strona `/plans/import`** — wklejanie + plik tekstowy → podgląd → mapowanie ćwiczeń → handoff do `PlanBuilder` przez `sessionStorage`.
3. **Kreator**:
   - Cel rampy: `NumInput` 1–15 + chipy skrótów; BO: przełącznik → `prescribedSets` (ramp + backoff).
   - Composer: tokeny `NNkg`, `NN%`, `rampa N [+ bo NN%]`.
   - Duplikacja pozycji; kopiuj tydzień z opcjonalną progresją (`+X kg` / `+X %` / `+1 powt.`).

Decyzje (z planowania):
- Wejście v1: tekst + `.txt/.md/.csv` (bez xlsx/PDF).
- Po parsowaniu: podgląd + mapowanie, potem kreator (nie bezpośredni zapis).
- Brak zmiany schematu DB / migracji.

## Model danych

Bez nowych encji. Nowe DTO (odpowiedź importu, nie zapis):

```csharp
public record PlanImportRequest(string Text);

public record PlanImportDraft(
    string? Name,
    string? Description,
    List<PlanImportDay> Days);

public record PlanImportDay(
    int WeekNumber,
    int Order,
    string Label,
    string? Notes,
    List<PlanImportItem> Items);

public record PlanImportItem(
    string ExerciseName,
    int? MatchedExerciseId,   // null = brak w bibliotece
    int Order,
    int? SupersetGroup,
    bool IsWarmup,
    string? MeasureType,
    int? Sets,
    int? Reps,
    int? RepsMax,
    int? RepDurationSeconds,
    int? DistanceMeters,
    string? Tempo,
    double? TargetRpe,
    double? TargetRir,
    string? SetScheme,
    int? RestBetweenSetsSeconds,
    int? RestAfterExerciseSeconds,
    double? LoadKg,
    double? LoadPercent,
    string? Notes,
    List<PlanSetInput>? PrescribedSets);
```

`PlanSetInput` — istniejący (role, loadPercent, percentOf, …).

Konfiguracja (bez sekretów w repo):

```json
"Ai": {
  "BaseUrl": "https://openrouter.ai/api/v1",
  "Model": "google/gemini-3.1-flash-lite",
  "OpenRouterApiKey": ""
}
```

Env: `Ai__OpenRouterApiKey`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/ai/plan-import` | `{ text }` | `PlanImportDraft` |
| — | — | brak klucza / błąd LLM | `502 { message }` lub `503` |

Typy/metody w `apps/web/lib/api.ts`: `PlanImportDraft`, `PlanImportDay`, `PlanImportItem`, `api.ai.importPlan(text)`.

Zapis planu i tworzenie ćwiczeń — istniejące `POST /api/plans`, `POST /api/exercises`.

## UI

- `apps/web/app/(app)/plans/import/page.tsx` — 3 kroki: wklej → podgląd/mapowanie → otwórz w kreatorze.
- Przycisk „Importuj” na liście planów.
- `ListEntryEditor` — cel rampy + sekcja Backoff.
- `CopyWeekPopover` — progresja przy kopiowaniu.
- Composer help — nowe przykłady formatu.
- Handoff: `sessionStorage` klucz `trainer-app:plan-import-draft` → `plans/new` / `PlanBuilder`.

## Fazy implementacji

- [x] Faza 1 — kreator: rampa dowolna + BO; composer kg/%/rampa; duplikacja pozycji; copy week + progresja
- [x] Faza 2 — backend AI: pakiety, config, endpoint, matching, testy z fake `IChatClient`
- [x] Faza 3 — frontend import: api client, strona, handoff do buildera + `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Halucynacje LLM / zły JSON | `ChatResponseFormat.Json` + deserializacja + clamp; podgląd przed zapisem |
| Brak klucza OpenRouter lokalnie | 503 z jasnym komunikatem PL |
| Rampa + prescribedSets sprzeczne z starym założeniem UI | BO w rampie świadomie generuje serie; `setScheme` nadal opisuje schemat |
| Matching nazw ćwiczeń | Exact/contains case-insensitive + ręczny picker w podglądzie |
| Koszt API | Endpoint tylko na żądanie trenera; bez streamingu |

## Changelog

- 2026-08-01 — utworzono spec (decyzje z planu: tekst+pliki, draft→kreator, OpenRouter jak fizjo-app).
- 2026-08-01 — wdrożono: rampa+BO w Liście, composer kg/%/rampa, duplikacja pozycji, kopiuj tydzień z progresją, `POST /api/ai/plan-import`, `/plans/import` → kreator; testy + `./scripts/check.sh` OK.
