# Wsparcie dla RIR (Reps In Reserve) w kreatorze planów

## TLDR

Makiety (`htmls from design/`) opisują intensywność planu wyłącznie w **RIR** („RIR 3+", „RIR celu: 1", „RIR 2"), a model danych dziś ma tylko `TargetRpe`. Dodajemy `TargetRir` jako nowe, równoległe pole na `PlanItem` i `PlanSet`, przełączamy UI kreatora/podglądu na RIR jako domyślną jednostkę, zachowując `TargetRpe` w modelu (relacja `RIR = 10 − RPE`) dla zgodności z przyszłym logowaniem (`workout-logging-stats.md`, które używa `Rpe` na `LoggedSet`).

Zależy od: `.ai/specs/implemented/2026-07-05-plan-creator-structure.md` (struktura `PlanItem`/`PlanSet`). Poprzedza: `2026-07-05-client-maxes-percent-loading.md`, `2026-07-05-workout-logging-stats.md` — patrz `2026-07-08-roadmap-plan-to-training.md` (Etap 1 jako pierwszy, żeby reset `trainer.db` był jednorazowy).

## Problem

- Trenerzy w makietach zapisują intensywność jako „RIR 3+" (rozgrzewka), „RIR 1" (część główna), „RIR celu: 1" (logowanie) — to konwencja, jaką faktycznie znają i której oczekuje UX (`fitness-ui-ux` skill).
- Backend ma tylko `PlanItem.TargetRpe` (`double?`) i `PlanSet.TargetRpe` (`double?`). RPE i RIR to dwie skale tej samej rzeczy, przesunięte względem siebie: `RIR = 10 − RPE` (przy RPE w skali 0–10, RIR ≈ liczba powtórzeń "w zapasie" do upadku).
- Bez osobnego pola musielibyśmy albo konwertować RPE↔RIR tylko w UI (myląca dwuznaczność przy odczycie z API), albo trzymać się RPE i ignorować makiety. Użytkownik zdecydował: dodać osobne pole RIR do modelu.

## Proponowane rozwiązanie

- Nowe pole `TargetRir (double?)` na `PlanItem` i `PlanSet`, **równoległe** do `TargetRpe`, nie zastępujące go. Oba pola są opcjonalne i niezależne w zapisie — trener w UI wypełnia jedno (RIR, domyślnie widoczne) lub opcjonalnie drugie (RPE, w polach zaawansowanych, dla trenerów przyzwyczajonych do tej skali).
- **UI kreatora i podglądu przechodzi na RIR jako domyślną, widoczną jednostkę** (zgodnie z makietami): etykieta „RIR celu", pole liczbowe (dopuszcza `.5` — RIR bywa podawany jako „1-2" zapisane jako zakres tekstowy w notatce, ale wartość liczbowa to najniższy koniec zakresu, jak dotychczas przy RPE).
- Backend **nie przelicza automatycznie** RPE↔RIR — to dwa niezależne, opcjonalne pola. Powód: automatyczne przeliczanie przy zapisie zamaskowałoby przypadek, gdy trener chce jawnie ustawić RPE (np. metoda Poliquina używa RPE w części dokumentacji branżowej) niezależnie od RIR. Jeśli oba pola są wypełnione, UI pokazuje RIR jako główną wartość i RPE jako pomocniczy tekst w nawiasie (`RIR 2 (RPE 8)`), liczony **tylko do wyświetlenia** po stronie frontendu (`rirFromRpe`/`rpeFromRir` helpery), nie zapisywany wstecz.
- To jest zmiana schematu istniejących encji → wymaga usunięcia `apps/api/trainer.db` (patrz `apps/api/AGENTS.md`, `.ai/lessons.md`). Wykonujemy ją w Etapie 1 (przed Etapem 2 z maxami), żeby był to jeden reset, nie dwa.

## Model danych

`apps/api/Models.cs` — nowe pola (obie encje już istnieją, patrz `implemented/2026-07-05-plan-creator-structure.md`):

```csharp
// PlanItem — dodać przy istniejącym TargetRpe
public double? TargetRir { get; set; }

// PlanSet — dodać przy istniejącym TargetRpe
public double? TargetRir { get; set; }
```

Żadnych nowych encji, żadnych zmian w `AppDb.cs` (proste kolumny skalarne, bez konwerterów).

> Zmiana schematu istniejących encji → usunięcie `apps/api/trainer.db` (EnsureCreated nie migruje). Seed w `Program.cs`/`SeedData` (jeśli istnieje osobny plik) odtwarza dane demo z wypełnionym `TargetRir` w przykładowym planie wielotygodniowym, zamiast/przy `TargetRpe`.

## Kontrakt API

Bez zmiany ścieżek/metod — tylko nowe pole w istniejących DTO i odpowiedziach.

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/plans`, `/api/plans/{id}` | — | `PlanItem`/`PlanSet` DTO zyskują `targetRir` obok `targetRpe` |
| POST/PUT | `/api/plans[/{id}]` | `PlanItemInput`/`PlanSetInput` zyskują opcjonalne `TargetRir` | jw. |
| POST | `/api/plans/{id}/duplicate` | — | kopiuje `TargetRir` tak jak `TargetRpe` |

`apps/api/Dtos.cs`: dodać `double? TargetRir = null` do `PlanItemInput` i `PlanSetInput` (analogicznie do istniejącego `TargetRpe`).

`apps/api/Program.cs` — miejsca do zmiany (każde już ma odpowiednik dla `TargetRpe`, dodać `TargetRir` tuż obok):
- `ItemToDto` (mapowanie pozycji do DTO odpowiedzi) — linia z `i.TargetRpe,` → dodać `i.TargetRir,`.
- `PrescribedSets = i.PrescribedSets...Select(s => new { ... s.TargetRpe, ... })` — dodać `s.TargetRir`.
- `BuildSet` (mapowanie `PlanSetInput` → `PlanSet` przy zapisie) — dodać `TargetRir = s.TargetRir`.
- `BuildItem` (mapowanie `PlanItemInput` → `PlanItem` przy zapisie) — dodać `TargetRir = i.TargetRir`.
- Duplikacja planu (`POST /api/plans/{id}/duplicate`) — dwa miejsca kopiujące `TargetRpe` (pozycja + `PrescribedSets`) — dodać `TargetRir` obok.

`apps/web/lib/api.ts` — lustrzane pola:
- `PlanItem.targetRir: number | null`, `PlanSet.targetRir: number | null` (odczyt).
- `PlanItemInput.targetRir: number | null`, `PlanSetInput.targetRir: number | null` (zapis).
- Nowe helpery: `export function rirFromRpe(rpe: number): number { return 10 - rpe; }` i `export function rpeFromRir(rir: number): number { return 10 - rir; }` — używane tylko do wyświetlenia pomocniczego, nigdy do zapisu wstecz.

## UI

- `apps/web/components/plan-builder/ExerciseRow.tsx` i `TableExerciseRow.tsx`: pole „RPE" zmienia etykietę na **„RIR celu"** i domyślnie edytuje `targetRir`; istniejące pole RPE przenosi się do sekcji zaawansowanej jako opcjonalne, z podpisem pomocniczym `≈ RIR {rirFromRpe(rpe)}` gdy wypełnione tylko RPE.
- `apps/web/components/plan-builder/SetSchemeEditor.tsx`: kolumna „RPE" per seria → „RIR", analogicznie z RPE jako pole dodatkowe.
- Podgląd planu (`apps/web/app/plans/[id]/page.tsx`): wyświetlanie `RIR {targetRir}` zamiast `RPE {targetRpe}`; jeśli tylko `targetRpe` wypełnione (stare dane albo trener wybrał RPE), pokazuje `RPE {targetRpe} (≈ RIR {rirFromRpe(targetRpe)})`.
- `apps/web/lib/planPresets.ts`: presety (`rampToWorkingSet`, `poliquin642531`) generujące `PlanSet[]` przechodzą na wypełnianie `targetRir` (wartości z dokumentacji metod w `method-templates.md` są już podane w RIR/RM, nie RPE — bez zmiany semantyki presetów, tylko nazwy pola).
- Etykiety: `apps/web/lib/api.ts` nie potrzebuje nowego słownika (RIR to liczba, nie string-enum jak `SET_ROLE_LABELS`), ale dodać `RIR_HELP = "Liczba powtórzeń w zapasie do upadku mięśniowego"` do użycia w `title`/tooltipach zgodnie ze skillem `fitness-ui-ux`.

## Fazy implementacji

- [ ] Faza 1 — backend: `TargetRir` na `PlanItem`/`PlanSet`, DTO, mapowania w `ItemToDto`/`BuildItem`/`BuildSet`/duplikacji, reset `trainer.db`, aktualizacja seed danych, testy API (round-trip `targetRir` w POST→GET, duplikacja kopiuje `targetRir`)
- [ ] Faza 2 — frontend: pola `targetRir` w `api.ts`, helpery `rirFromRpe`/`rpeFromRir`, zamiana etykiet RPE→RIR w `ExerciseRow`, `TableExerciseRow`, `SetSchemeEditor`, podgląd planu, aktualizacja `planPresets.ts`
- [ ] Faza 3 — dopięcie: sprawdzić wszystkie miejsca renderujące RPE w podglądzie/liście (np. skróty na karcie dnia), upewnić się że stare dane z tylko `targetRpe` nadal renderują się sensownie (fallback `≈ RIR`)

## Ryzyka i wpływ

- **Reset bazy kasuje dane lokalne** — mitygacja: jednorazowy, zapowiedziany z góry; seed odtwarza pełny komplet danych demo (zgodnie z `.ai/lessons.md`).
- **Dwie jednostki intensywności w modelu (RPE i RIR) mogą się rozjechać** — jeśli trener wypełni oba pola z niezgodnymi wartościami, UI nie waliduje zgodności (świadomy trade-off: to są niezależne pola, nie jedno przeliczane). Mitygacja: UI domyślnie pokazuje/edytuje tylko RIR; RPE jest ukryty w zaawansowanych i opisany jako opcjonalny, nie „ta sama wartość w innej skali".
- **Przyszłe logowanie (`workout-logging-stats.md`) używa `Rpe` na `LoggedSet`, nie `Rir`** — ryzyko niezgodności jednostek między planem (RIR) i logiem wykonania (RPE). Mitygacja: ten spec jawnie definiuje konwencję `RIR = 10 − RPE`; przy implementacji logowania rozważyć dodanie `Rir` też na `LoggedSet` (decyzja odłożona do tamtego specu, nie blokuje tego).
- **Migracja istniejących planów** — po resecie bazy nie ma czego migrować (SQLite lokalna, dev-only), ale gdyby w przyszłości był env z prawdziwymi danymi, `TargetRpe` wypełnione a `TargetRir` `null` nie jest błędem — UI ma fallback.

## Changelog

- 2026-07-08 — utworzono spec.
