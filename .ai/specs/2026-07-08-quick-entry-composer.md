# Composer „szybkie wpisywanie" w kreatorze planu

## TLDR

Klawiaturowy, jednowierszowy composer do dodawania pozycji do dnia planu — wpisujesz `"romanian 3x8-10 3010 rir2"`, dostajesz podpowiedź ćwiczenia z biblioteki z domyślnymi parametrami, `↵` dodaje pozycję bez dotykania myszy (wzorem `htmls from design/Kreator planu - szybkie wpisywanie (standalone).html`). Czysto frontendowa funkcja nad istniejącym stanem `PlanBuilder` — zero zmian kontraktu API.

Zależy od: `.ai/specs/implemented/2026-07-05-plan-creator-structure.md` (struktura `BuilderDay`/`BuilderItem`), `2026-07-08-rir-support.md` (RIR jako pole intensywności — composer parsuje `rir2`, nie `rpe8`).

## Problem

Dzisiejszy sposób dodawania ćwiczenia w kreatorze (`DayColumn.tsx`, `TableDay.tsx`) wymaga: kliknąć „+ Dodaj ćwiczenie" → otworzyć `ExercisePicker` → przewinąć/przefiltrować listę myszą → kliknąć wynik → rozwinąć wiersz → wypełnić pola serie/powtórzenia/tempo/RIR osobno. Dla trenera, który układa plan „jak na kartce" i zna nazwy ćwiczeń, to wielokrotnie więcej interakcji niż wpisanie jednej linijki tekstu. Makieta `Kreator planu - szybkie wpisywanie (standalone).html` pokazuje wzorzec: pole tekstowe → lista podpowiedzi z ćwiczeniami i ich domyślnymi parametrami → `↵` dodaje wybrany/pierwszy wynik z domyślnymi parametrami ćwiczenia, opcjonalnie nadpisanymi tym, co trener dopisał w linijce.

## Proponowane rozwiązanie

Nowy komponent `QuickComposer` zastępujący (lub uzupełniający, patrz Open Questions rozstrzygnięte poniżej) `ExercisePicker` jako domyślny sposób dodawania pozycji w obu widokach kreatora (Tablica i Arkusz). Parsuje jedną linię tekstu na dopasowanie ćwiczenia + opcjonalne nadpisania parametrów, tworzy `BuilderItem` z domyślnymi wartościami ćwiczenia tam, gdzie nic nie podano — analogicznie do tego, jak API dziś liczy `Sets = i.Sets ?? Exercise.DefaultSets` (`ItemToDto` w `apps/api/Program.cs`), tylko po stronie klienta i przed zapisem.

Decyzje:

- **Composer zastępuje `ExercisePicker` jako domyślną akcję „+ Dodaj ćwiczenie"**, ale nie usuwamy wyszukiwania myszą — po wpisaniu tekstu lista podpowiedzi to właśnie przefiltrowana lista ćwiczeń (ta sama logika co dziś w `ExercisePicker`: `name.toLowerCase().includes(q)`), więc jest to rozszerzenie, nie usunięcie funkcji. Klik na podpowiedź działa tak jak `↵`.
- **Format linii**: `{fragment nazwy} [SxR[-Rmax]] [tempo] [rirN]`, tokeny rozdzielone spacją, w dowolnej kolejności po nazwie, wszystkie opcjonalne:
  - `{fragment nazwy}` — dopasowywany fuzzy do `exercises[].name` (case-insensitive `includes`, jak dziś w `ExercisePicker`); jeśli wiele wyników, pierwszy trafiony (najkrótsza nazwa / najwyższy priorytet dopasowania prefiksu) jest podświetlony jako domyślny wybór dla `↵`, strzałki ↑/↓ zmieniają wybór.
  - `SxR` lub `SxR-Rmax` — np. `3x8`, `3x8-10` → `sets=3, reps=8[, repsMax=10]`.
  - token 4-cyfrowy z cyframi/`X` — tempo, np. `3110`, `20X1` → `tempo`.
  - `rirN` lub `rir N` (liczba, dopuszcza `.5`) → `targetRir` (patrz `2026-07-08-rir-support.md`).
  - token nierozpoznany jako żaden wzorzec → ignorowany (nie blokuje dodania), żeby literówka nie psuła całej linii.
- **Superserie z klawiatury**: prefiks `0a`/`0b`/`1a`/`1b`… na początku linii (odpowiadający etykietom z `apps/web/lib/supersets.ts`) ustawia `linkedToNext` na poprzedniej pozycji, gdy litera powtarza numer grupy poprzedniego wpisu — czyli wpisanie `0a ffe split squat`, `↵`, `0b glute bridge`, `↵` daje efekt identyczny jak dziś kliknięcie „Połącz w superserię" między tymi dwiema pozycjami. Prefiks jest czysto interpretacyjny — nie zapisuje się jako tekst, tylko ustawia `linkedToNext`.
- **Podpowiedź (dropdown pod polem)** pokazuje do 6 najlepiej dopasowanych ćwiczeń z ich domyślnymi parametrami jako podgląd (`{sets}×{reps} · {tempo default lub —} · RIR {defaultRir lub —}`), żeby trener widział, co dostanie zanim wciśnie `↵` — wzorem sekcji composera w makiecie (`3×8–10 · 3010 · RIR 2` przy nazwie ćwiczenia).
- **`Tab`** uzupełnia nazwę do aktualnie podświetlonej podpowiedzi bez dodawania pozycji (pozwala doprecyzować parametry przed `↵`).
- **Zero zmian kontraktu API** — composer produkuje ten sam `BuilderItem` co dzisiejszy przepływ (`ExercisePicker` → rozwinięcie → edycja pól), więc `PlanBuilder.addItem`/`patchItem` i serializacja do `PlanItemInput` nie się zmieniają.

## Model danych

Brak zmian backendu. Wyłącznie nowy plik frontendowy:

```typescript
// apps/web/lib/quickEntry.ts
export type ParsedQuickEntry = {
  query: string;                 // pozostały fragment nazwy do dopasowania
  supersetPrefix: { group: string; letter: string } | null; // "0a" -> { group: "0", letter: "a" }
  sets: number | null;
  reps: number | null;
  repsMax: number | null;
  tempo: string | null;
  targetRir: number | null;
};

export function parseQuickEntry(raw: string): ParsedQuickEntry;
export function matchExercises(query: string, exercises: Exercise[]): Exercise[]; // ranked, max 6
```

## Kontrakt API

Brak zmian — composer operuje wyłącznie na już istniejących typach `apps/web/lib/api.ts` (`Exercise`, `PlanItemInput`) i stanie `BuilderItem`/`BuilderDay` z `apps/web/components/plan-builder/types.ts`.

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| — | — | — | (bez zmian; composer nie dodaje endpointów) |

## UI

- Nowy komponent `apps/web/components/plan-builder/QuickComposer.tsx`: pole tekstowe (`inputClass` z `components/ui.tsx`) + dropdown podpowiedzi renderowany pod nim, w stylu istniejącego `ExercisePicker` (ramka, lista `button` per wynik), ale z podglądem parametrów po prawej stronie każdej podpowiedzi.
- Zastępuje wywołanie `<ExercisePicker exercises={exercises} onAdd={...} />` w `apps/web/components/plan-builder/DayColumn.tsx` i `apps/web/components/plan-builder/TableDay.tsx`. `ExercisePicker.tsx` pozostaje jako komponent (używany wewnątrz `QuickComposer` dla trybu „przeglądaj listę" po kliknięciu ikony lupy — nie usuwamy wyszukiwania myszą, patrz Proponowane rozwiązanie).
- Klawiatura: `↓`/`↑` zmiana podświetlonej podpowiedzi, `Tab` uzupełnia nazwę, `↵` dodaje pozycję i czyści pole (composer zostaje aktywny, gotowy na następny wpis — kluczowe dla „wpisywania jak na kartce" wielu ćwiczeń pod rząd), `Esc` czyści pole bez dodawania.
- Wizualny podpis „↵ dodaj" po prawej stronie pola, widoczny gdy pole ma fokus i niepustą treść (wzorem makiety).
- Superserie: gdy `supersetPrefix` wykryty, pole pokazuje mały badge z literą (np. „0b") przed tekstem, w tej samej stylistyce co istniejące etykiety A1/A2 z `apps/web/lib/supersets.ts`.
- Zgodność z designem: wyłącznie tokeny z `apps/web/app/globals.css` i prymitywy `components/ui.tsx` — przed implementacją przejść skille `design-system`, `fitness-ui-ux`, `senior-ux-cro`, `responsive-ui` (wymagane przy każdej zmianie UI wg `AGENTS.md`).

## Fazy implementacji

- [ ] Faza 1 — `apps/web/lib/quickEntry.ts`: parser (`parseQuickEntry`) + dopasowywanie ćwiczeń (`matchExercises`) + testy jednostkowe (jeśli w projekcie istnieje setup testów frontendowych; jeśli nie — ręczna weryfikacja przypadków z tego specu wystarcza jako smoke test, projekt dziś nie ma testów JS)
- [ ] Faza 2 — `QuickComposer.tsx`: input + dropdown podpowiedzi + obsługa klawiatury (↓/↑/Tab/Enter/Esc), integracja z `PlanBuilder.addItem`/`toggleLink`
- [ ] Faza 3 — podłączenie w `DayColumn.tsx` (widok Tablica) i `TableDay.tsx` (widok Arkusz), zachowanie trybu „przeglądaj listę" (ikona lupy otwierająca pełny `ExercisePicker`) dla przypadku, gdy trener nie pamięta nazwy
- [ ] Faza 4 — dopięcie: obsługa superserii wieloliterowych (0a/0b/0c), edge case (brak dopasowania → dodanie z samą nazwą jako nowe ćwiczenie odrzucone — composer działa tylko na istniejącej bibliotece, komunikat „nie znaleziono — dodaj ćwiczenie w bibliotece" z linkiem do `/exercises`)

## Ryzyka i wpływ

- **Błędne dopasowanie fuzzy** (np. „squat" trafia w niewłaściwe ćwiczenie z wielu wariantów) — mitygacja: dropdown podpowiedzi jest zawsze widoczny przed `↵`, trener widzi i koryguje strzałkami; ranking priorytetyzuje dopasowanie prefiksu nazwy.
- **Parser nadinterpretuje tokeny** (np. liczba w nazwie ćwiczenia jak „T-bar row" zinterpretowana jako parametr) — mitygacja: wzorce parametrów są ściśle formatowane (`SxR`, 4-znakowe tempo, `rirN`), więc kolizja z typową nazwą ćwiczenia jest mało prawdopodobna; token nierozpoznany trafia do `query`, nie jest odrzucany.
- **Regresja dostępności/mobile** — composer jest wzorcem desktopowym (klawiatura); na mobile (`responsive-ui` skill) dropdown musi działać też dotykiem, a `ExercisePicker` zostaje jako pełnoprawna alternatywa dla użytkowników bez fizycznej klawiatury.
- **Duplikacja logiki dopasowania z `ExercisePicker.tsx`** — mitygacja: `matchExercises` w `quickEntry.ts` staje się jedynym źródłem prawdy, `ExercisePicker` przechodzi na tę funkcję zamiast własnego `filter` inline (drobny refaktor, bez zmiany zachowania).

## Changelog

- 2026-07-08 — utworzono spec.
