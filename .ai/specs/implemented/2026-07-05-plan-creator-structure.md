# Kreator planów: tygodnie, dni, superserie, tempo, RPE

## TLDR

Rozbudowa struktury planu z płaskiej listy ćwiczeń do hierarchii **Plan → Tygodnie → Dni → Pozycje → Serie** z polami potrzebnymi do zapisania realnych planów trenera (superserie, zakresy powtórzeń, tempo, RPE, dystans, schematy serii typu „Rampa", oraz rozkład jednej pozycji na wiele serii o różnym % i roli). Do tego kreator w UI pozwalający budować takie plany. To jest MVP — fundament, na którym staną maxy klienta (%1RM) i logowanie wyników.

## Problem

Obecny `Plan` to płaska lista `PlanItem` (ćwiczenie + serie/powtórzenia/przerwy/ciężar). Realne plany trenera (przykłady: „Tata", „Marti", „Asia", arkusz Seby Kota) wymagają:

- dni treningowych („Poniedziałek", „Trening A", „Środa"),
- wielu tygodni z progresją (Tydzień 1–6, Week 1–8),
- superserii (3a/3b, 4a/4b/4c),
- zakresów powtórzeń (8–10 powt., 2×10–15 s),
- tempa (3110, 20X1), docelowego RPE (RPE7/8),
- dystansu (spacer farmera 2×15 m),
- schematów serii („Rampa 6", „Back-off 80%") i notatek progresji („+2,5–5 kg"),
- **rozkładu jednej pozycji na wiele serii o różnej roli i różnym %** — budulec pod metodę Poliquina 6-4-2-5-3-1 (rampa do topu + „seria anaboliczna" 80%×5-10 + seria 60%×10-15) oraz pod rampę „50/75/100% × N" z planu „Asia" (jedna pozycja, jeden dzień). **Uwaga:** pełna metoda 15-10-5 to podział TYGODNIOWY (Pon = dzień 15 powt., Śr = dzień 10, Pt = dzień 5, te same ćwiczenia, inny zakres) — patrz `.ai/specs/2026-07-05-method-templates.md`; ten spec modeluje tylko rozkład serii w obrębie jednej pozycji/dnia,
- zasad ogólnych / rozgrzewki na poziomie planu i dnia.

Żadnej z tych rzeczy nie da się dziś zapisać strukturalnie.

## Proponowane rozwiązanie

Hierarchia `Plan → PlanDay (WeekNumber, Label) → PlanItem`. Tydzień nie jest osobną encją — to `WeekNumber` na dniu (mniej tabel, kopiowanie tygodnia to operacja po stronie kreatora, bo edycja planu i tak jest replace-all). Superserie jako numer grupy na pozycji (te same numery w obrębie dnia = seria łączona, renderowana jako 3a/3b). Pola „miękkie" (tempo, schemat serii) jako wolny tekst — trenerzy zapisują je bardzo różnie i sztywna struktura by przeszkadzała.

Decyzje:

- **`Exercise.Type` rozszerzony o `"distance"`** (`reps | time | distance`) zamiast osobnego enuma typu pomiaru — logowane metryki (spec logowania) i tak same określą, co liczyć w statystykach.
- **Wszystkie nowe pola opcjonalne** — prosty plan (1 dzień, ćwiczenie, 3×10) działa bez podawania czegokolwiek nowego.
- **Dwa poziomy szczegółowości serii.** Prosty przypadek: `Sets` + `Reps` (+`RepsMax`) na pozycji — wystarcza dla „3×10", „4×8-12". Zaawansowany: opcjonalna lista `PlanSet` w pozycji, gdzie każda seria ma własne powtórzenia/%/rolę. Gdy lista niepusta, definiuje serie i **nadpisuje** proste `Sets`/`Reps`. To pozwala zapisać 6-4-2-5-3-1 i 15-10-5 bez sztywnych enumów metod.
- **`PlanSet.PercentOf`** określa bazę procentu: `"1rm"` (aktualny max klienta — patrz spec maxów) lub `"top"` (najcięższa/topowa seria tej samej pozycji w tej sesji, np. rampa). Dzięki `"top"` metoda Poliquina i szablon 15-10-5 liczą się **w obrębie jednej sesji**, bez zależności między tygodniami.
- **Rampa jako tekstowe `SetScheme`** + opcjonalny `PlanSet` z rolą `"ramp"` — narracyjny opis („Rampa 8-11 serii po 1 powt") zostaje tekstem, a wyliczane serie back-off idą przez `PlanSet`.
- **Zależności ciężaru między tygodniami są poza MVP.** Reguła „T4: 5 powt ciężarem, który w T2 był 4RM" wymaga odczytu faktycznie osiągniętego wyniku z innego tygodnia (logi). W MVP trener wpisuje ten ciężar ręcznie w pozycji danego tygodnia (`LoadKg`). Automatyczne przenoszenie RM między tygodniami — potencjalne rozszerzenie po wdrożeniu logowania.

## Model danych

`apps/api/Models.cs`:

```csharp
public class PlanDay
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public Plan? Plan { get; set; }
    public int WeekNumber { get; set; } = 1;   // Tydzień 1..N
    public int Order { get; set; }             // kolejność dnia w tygodniu
    public string Label { get; set; } = "";    // „Poniedziałek", „Trening A"
    public string? Notes { get; set; }         // rozgrzewka / wskazówki dnia
    public List<PlanItem> Items { get; set; } = [];
}
```

`PlanItem` — zmiany:

```csharp
public int PlanDayId { get; set; }             // zastępuje PlanId
public PlanDay? Day { get; set; }

public int? SupersetGroup { get; set; }        // ta sama wartość w dniu = superseria (a/b/c wg Order)
public int? RepsMax { get; set; }              // zakres: Reps..RepsMax (np. 8–10)
public int? RepDurationSecondsMax { get; set; }// zakres czasu (np. 10–15 s)
public int? DistanceMeters { get; set; }       // np. spacer farmera 15 m
public string? Tempo { get; set; }             // „3110", „20X1"
public double? TargetRpe { get; set; }         // 7, 8
public string? SetScheme { get; set; }         // „Rampa 6", „Rampa 4 + BO 80%"
public List<PlanSet> PrescribedSets { get; set; } = []; // opcjonalny rozkład na serie; niepusty = nadpisuje Sets/Reps
// istniejące zostają: Sets, Reps, RepDurationSeconds, RestBetweenSetsSeconds,
// RestAfterExerciseSeconds, LoadKg, Notes
```

Nowa encja `PlanSet` (opcjonalny rozkład pozycji na serie o różnej roli/%):

```csharp
public class PlanSet
{
    public int Id { get; set; }
    public int PlanItemId { get; set; }
    public PlanItem? Item { get; set; }
    public int Order { get; set; }               // kolejność serii w pozycji
    public int? Reps { get; set; }
    public int? RepsMax { get; set; }             // zakres (np. 5–10, 10–15)
    public int? DurationSeconds { get; set; }     // dla serii czasowych
    public int? DistanceMeters { get; set; }
    public double? LoadKg { get; set; }           // ciężar bezwzględny (alternatywa dla %)
    public double? LoadPercent { get; set; }      // % bazy PercentOf
    public string? PercentOf { get; set; }        // "1rm" | "top" (null = bezwzględny LoadKg)
    public double? TargetRpe { get; set; }
    public string? Tempo { get; set; }
    public string? Role { get; set; }             // "warmup" | "ramp" | "top" | "backoff" | "work"
    public string? Note { get; set; }             // „seria anaboliczna", „bardzo ładne powt."
}
```

Przykład — 6-4-2-5-3-1, Tydzień 3 dla ćwiczenia głównego (rozkład jako `PrescribedSets`):
- `{ Order:1, Role:"ramp", Reps:2, Note:"ustal 2RM" }`
- `{ Order:2, Role:"backoff", Reps:5, RepsMax:10, LoadPercent:80, PercentOf:"top", Note:"seria anaboliczna" }`
- `{ Order:3, Role:"backoff", Reps:10, RepsMax:15, LoadPercent:60, PercentOf:"top" }`

Przykład — rampa do serii roboczej, wariant „15 powt." (dzień 15 metody 15-10-5, jedna pozycja): trzy serie `LoadPercent` 50/75/100, `PercentOf:"top"`, `Reps:15`. Pełny podział tygodniowy (Dzień 15/10/5) opisuje `.ai/specs/2026-07-05-method-templates.md`.

`Exercise` — minimalne zmiany: `Type` przyjmuje też `"distance"`; nowe pole `int? DefaultDistanceMeters`.

`Plan.Description` pełni rolę „zasad ogólnych" (już istnieje).

`AppDb.cs`: cascade `Plan → PlanDay → PlanItem → PlanSet`. `DbSet<PlanDay>`, `DbSet<PlanSet>`.

> Zmiana schematu = usunięcie `apps/api/trainer.db` (EnsureCreated nie migruje). Seed odtwarza dane, w tym plan wielodniowy jako przykład.

## Kontrakt API

Kształt planu zmienia się z `items[]` na `days[]` (zmiana kontraktu — zatwierdzona, bo to sedno funkcji):

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/plans` | — | lista (podsumowania: liczba tygodni/dni) |
| GET | `/api/plans/{id}` | — | `{ ..., days: [{ weekNumber, order, label, notes, items: [...] }] }` |
| POST/PUT | `/api/plans[/{id}]` | `PlanInput { name, description, isTemplate, days: PlanDayInput[] }` | jw. |

`PlanDayInput { weekNumber, order, label, notes, items: PlanItemInput[] }`; `PlanItemInput` rozszerzony o nowe pola (wszystkie opcjonalne, defaulty w rekordzie) + `prescribedSets: PlanSetInput[]` (domyślnie puste). Pozycje nadal zwracają efektywne parametry (nadpisanie ?? default z ćwiczenia) + `overrides`.

Wyliczanie `computedLoadKg` dla `PlanSet` z `PercentOf:"top"` odbywa się przy odczycie planu (baza = topowa seria z `LoadKg`/`ramp` w tej pozycji). Dla `PercentOf:"1rm"` bazą jest max klienta z `?clientId=` — realizuje to spec maxów (`2026-07-05-client-maxes-percent-loading.md`); bez `clientId` zwracamy sam `loadPercent`.

Duplikacja planu (`POST /api/plans/{id}/duplicate`) kopiuje dni i pozycje. Kopiowanie tygodnia w obrębie planu robi kreator po stronie klienta (edycja jest replace-all — bez nowego endpointu).

Typy w `apps/web/lib/api.ts` lustrzane: `Plan`, `PlanDay`, `PlanItem` (+ pola `supersetGroup`, `repsMax`, `tempo`, `targetRpe`, `setScheme`, `distanceMeters`, ...).

## UI — kreator

Kreator rozbity na moduł `apps/web/components/plan-builder/` (`PlanBuilder`, `WeekTabs`, `DayBoard`, `DayColumn`, `ExerciseRow`, `SetSchemeEditor`, `ExercisePicker`, `types.ts`, `dnd.ts`) + strony `plans/new` i `plans/[id]`:

- Nagłówek planu: nazwa, opis (zasady ogólne), szablon.
- **Zakładki tygodni** (`WeekTabs`, pigułki) — jeden tydzień widoczny na raz, „+ Tydzień", „Kopiuj tydzień" (klonuje dni i pozycje z podbiciem `weekNumber`).
- **Tablica dni w kolumnach** (`DayBoard`/`DayColumn`, poziomy scroll) — każdy dzień to karta z etykietą, notatką i listą pozycji, „+ Dodaj ćwiczenie" (wyszukiwarka `ExercisePicker`, nie `<select>`).
- **Kompaktowy wiersz pozycji** (`ExerciseRow`) — domyślnie zwinięty (podsumowanie „serie × powt · przerwa · ciężar · tempo", uchwyt drag&drop, znacznik superserii, kropka notatki); klik rozwija edycję inline pogrupowaną: Podstawowe / Zaawansowane / Rozkład serii.
- **Superserie jako akcja, nie pole liczbowe**: przycisk „Połącz w superserię"/„Rozłącz" ustawia flagę `linkedToNext` na sąsiadującej pozycji; `apps/web/lib/supersets.ts` wylicza z tych flag numery `supersetGroup` (przy zapisie) i czytelne etykiety A1/A2, B1/B2… (przy renderze, także w podglądzie `plans/[id]`). Wizualnie: lewy żółty pasek + `Badge` z etykietą.
- **Drag & drop** (`@dnd-kit/core` + `@dnd-kit/sortable`) — zmiana kolejności pozycji w dniu i przenoszenie między dniami (multi-container `SortableContext` + `useDroppable` na kontener dnia dla pustych dni), `DragOverlay` z podglądem, `KeyboardSensor` dla obsługi klawiaturowej. Fallback: przyciski ↑/↓ na każdej pozycji (zawsze działają, niezależnie od DnD).
- Pozycja — tryb zaawansowany „rozpisz serie" (`SetSchemeEditor`): dodawanie wierszy `PlanSet` (powtórzenia/zakres, % + baza `1RM`/`top` albo ciężar, rola, notatka). Gotowe presety — budulce rozkładu serii dla jednej pozycji: **6-4-2-5-3-1** (generuje serie per tydzień) i **rampa do serii roboczej** (15/10/5 powt.) — trener wybiera z listy zamiast klikać ręcznie. To NIE są generatory całej metody na cały tydzień/plan; taka funkcja jest opisana jako przyszłe rozszerzenie w `.ai/specs/2026-07-05-method-templates.md`.
- Podgląd planu (`plans/[id]`) renderuje dni per tydzień, superserie z paskiem i etykietą A1/A2, i rozpisuje serie z `PrescribedSets` (z wyliczonym kg gdy jest baza %).
- Prymitywy z `components/ui.tsx` (rozszerzone o `Pill`, `IconButton`); teksty po polsku.

## Fazy implementacji

- [x] Faza 1 — backend: `PlanDay` + rozszerzony `PlanItem` + `PlanSet` + `Exercise.DefaultDistanceMeters`, DTO, endpointy, wyliczanie `computedLoadKg` dla `PercentOf:"top"`, seed (plan wielodniowy + ćwiczenie z rozkładem 6-4-2-5-3-1), reset bazy, testy API
- [x] Faza 2 — frontend: typy w `api.ts`, kreator (PlanBuilder: tygodnie/dni/pozycje), podgląd planu, duplikacja
- [x] Faza 3 — frontend: tryb „rozpisz serie" + presety 6-4-2-5-3-1 i 15-10-5, kopiowanie tygodnia, walidacje, edge case'y (dzień bez pozycji, plan jednodniowy)

## Ryzyka i wpływ

- **Reset bazy kasuje dane lokalne** — mitygacja: seed odtwarza komplet danych demo; operacja jednorazowa.
- **Przebudowa PlanBuilder to największy kawałek frontu** — mitygacja: kontrakt replace-all bez zmian (tylko głębszy JSON), stan kreatora jako jedna struktura `days[]`.
- **Puste dni/tygodnie w payloadzie** — walidacja: dzień wymaga etykiety; pozycja wymaga `exerciseId`.
- **Nadmierne skomplikowanie `PlanSet`** — mitygacja: pole opcjonalne; prosty plan go nie używa; w UI ukryte pod „rozpisz serie" + presetami, więc trener nie klika wierszy ręcznie.
- **`PercentOf:"top"` bez zdefiniowanej serii topowej** — reguła: bazą jest seria z najwyższym `LoadKg` (lub rola `ramp`/`top`); brak bazy → `computedLoadKg = null`, UI pokazuje sam %.
- **Zależności między tygodniami** (T4 = ciężar 4RM z T2) — poza MVP; ciężar wpisywany ręcznie. Ryzyko rezydualne: trener przepisuje liczby między tygodniami (akceptowalne, wspomaga „Kopiuj tydzień").
- **Stare plany w bazie** — nie istnieją po resecie; seed od razu w nowym kształcie.

## Changelog

- 2026-07-05 — utworzono spec.
- 2026-07-05 — dodano encję `PlanSet` (rozkład pozycji na serie o różnej roli/%), `PercentOf:"top"|"1rm"`, presety 6-4-2-5-3-1 i 15-10-5; doprecyzowano, że zależności ciężaru między tygodniami są poza MVP.
- 2026-07-05 — WDROŻONO wszystkie fazy. Backend: `PlanDay`/`PlanItem`(rozszerzony)/`PlanSet`, kaskady w `AppDb`, DTO z domyślnymi wartościami (MVP-tolerancja), przebudowany `PlanToDto` z `computedLoadKg` dla `PercentOf:"top"`, endpointy POST/PUT/duplicate w nowej strukturze, seed z planem 6-4-2-5-3-1. Frontend: typy + słowniki w `api.ts`, `lib/planPresets.ts`, przebudowany `PlanBuilder` (tygodnie/dni/pozycje/serie, presety, „Kopiuj tydzień"), podgląd `plans/[id]` z superseriami i tabelą serii, aktualizacja list (`plans`, dashboard, karta klienta) i biblioteki ćwiczeń o typ `distance`. Bramka zielona; smoke test API potwierdził `computedLoadKg` 50/40/30. Baza `trainer.db` zresetowana (nowy schemat).
- 2026-07-05 — KOREKTA interpretacji metod. Presety „Szablon 15-10-5" błędnie sugerowały, że jedno kliknięcie generuje całą metodę — w rzeczywistości 15-10-5 to podział TYGODNIOWY (Pon/Śr/Pt = dzień 15/10/5 dla wszystkich ćwiczeń), a rozpisane tu serie (50/75/100% itd.) to tylko rampa do serii roboczej dla jednej pozycji w jednym dniu. Przeetykietowano presety na „Rampa do serii roboczej — N powt." (`apps/web/lib/planPresets.ts`, funkcja `rampToWorkingSet`), doprecyzowano opisy w tym specu i wydzielono pełną, poprawną definicję obu metod (15-10-5 i 6-4-2-5-3-1) jako przyszłą funkcję „szablonów metod" do `.ai/specs/2026-07-05-method-templates.md`. Dodatkowo poprawiono rolę serii w tygodniach 4/5 presetu 6-4-2-5-3-1 z „work" na „ramp" (to wciąż rampa, tylko ciężarem bliskim wcześniejszemu rekordowi, nie sztywna seria robocza).
- 2026-07-05 — PRZEBUDOWA UX kreatora (bez zmian backendu/kontraktu API). Płaski, w pełni rozwinięty formularz zastąpiono modułem `apps/web/components/plan-builder/`: zakładki tygodni (`WeekTabs`) + tablica dni w kolumnach (`DayBoard`/`DayColumn`) + kompaktowe, domyślnie zwinięte wiersze pozycji z edycją inline (`ExerciseRow`, pogrupowane pola Podstawowe/Zaawansowane/Rozkład serii) + wyszukiwarka ćwiczeń (`ExercisePicker`) zamiast `<select>`. Superserie: zamiast wpisywania numeru grupy, akcja „Połącz w superserię" ustawia flagę sąsiedztwa, z której `apps/web/lib/supersets.ts` wylicza `supersetGroup` (do zapisu) i etykiety A1/A2… (do wyświetlenia, także w podglądzie `plans/[id]`). Dodano drag & drop (`@dnd-kit`) do zmiany kolejności pozycji w dniu i przenoszenia między dniami, z fallbackiem ↑/↓. Nowe prymitywy `Pill`/`IconButton` w `components/ui.tsx`. Bramka zielona (backend build+testy, web lint/typecheck/build); sanity test API potwierdził round-trip superserii (`supersetGroup`) i rozpisanych serii (`computedLoadKg`) z nowym kreatorem.
