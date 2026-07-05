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
- **rozkładu jednej pozycji na wiele serii o różnej roli i różnym %** — metoda Poliquina 6-4-2-5-3-1 (rampa do topu + „seria anaboliczna" 80%×5-10 + seria 60%×10-15) oraz szablon 15-10-5 (50%/75%/100% × 15) z planu „Asia",
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

Przykład — szablon 15-10-5 (wariant „15"): trzy serie `LoadPercent` 50/75/100, `PercentOf:"top"`, `Reps:15`.

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

Przebudowa `apps/web/components/PlanBuilder.tsx` + stron `plans/new` i `plans/[id]`:

- Nagłówek planu: nazwa, opis (zasady ogólne), szablon.
- Zakładki/akordeon tygodni → w tygodniu lista dni (etykieta + notatka dnia) → w dniu lista pozycji.
- Przyciski: „+ Tydzień", „Kopiuj tydzień" (klonuje dni i pozycje z podbiciem `weekNumber`), „+ Dzień", „+ Ćwiczenie".
- Pozycja: wybór ćwiczenia, serie, powtórzenia (od–do) / czas (od–do) / dystans wg typu ćwiczenia, tempo, RPE, ciężar, schemat serii, przerwy, notatka, numer superserii.
- Pozycja — tryb zaawansowany „rozpisz serie": dodawanie wierszy `PlanSet` (powtórzenia/zakres, % + baza `1RM`/`top` albo ciężar, rola, notatka). Gotowe presety w kreatorze: **6-4-2-5-3-1** (generuje serie per tydzień) i **15-10-5** — trener wybiera z listy zamiast klikać ręcznie.
- Podgląd planu (`plans/[id]`) grupuje pozycje superserii (3a/3b), renderuje dni per tydzień i rozpisuje serie z `PrescribedSets` (z wyliczonym kg gdy jest baza %).
- Prymitywy z `components/ui.tsx`; teksty po polsku.

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
