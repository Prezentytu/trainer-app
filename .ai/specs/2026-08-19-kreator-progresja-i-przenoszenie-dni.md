# Kreator: progresja, przenoszenie dni i jedna prawda serii

## TLDR

Kreator planu przestaje gubić dane i fokus. Rozpisane serie stają się jedynym źródłem prawdy dla podsumowań, każda seria dostaje własną przerwę, tygodnie są zawsze numerowane ciągle `1…N`, a ćwiczenia i dni przenosi się przeciąganiem w każdym widoku. Zakładka „Progresja” zmienia się z martwego podglądu w edytowalną macierz tygodni z generatorem progresji liniowej, schodkowej i falowej — zawsze z podglądem przed zastosowaniem i z globalnym Cofnij/Ponów.

## Problem

1. **Utrata fokusu.** Wpisanie jednej cyfry w pole ciężaru w panelu bocznym wyrzucało fokus i podświetlało kafelek ćwiczenia. `SidePanel` miał w zależnościach efektu `onClose` i `title` (ReactNode tworzony przy każdym renderze), więc efekt restartował się przy każdym wpisanym znaku, a jego cleanup oddawał fokus poprzednio aktywnemu elementowi.
2. **Fałszywe podsumowania.** `aggregatesFromSets` sprowadzało różne serie do min–max i zapisywało wynik w `item.reps`/`item.repsMax`. Rozpis `3/3/1/1/1/3/3` pokazywał się jako `8 × 1–10`.
3. **Utrata danych.** Zwinięcie rozpiski czyściło `prescribedSets`; przełączenie `Serie ↔ Rampa` kasowało ciężary i powtórzenia. Nie było globalnego cofania.
4. **Brak przerwy per seria.** Rozgrzewkowe i robocze serie mają realnie inne przerwy, a model znał tylko jedną wartość na ćwiczenie.
5. **Niespójna hierarchia.** Tygodnie i dni mieszały się w jednym pasie identycznych pigułek; numeracja tygodni potrafiła być nieciągła (`2, 5`).
6. **Brak DnD poza Tablicą.** Lista i Arkusz nie pozwalały przestawić ćwiczenia, dni nie dało się przenieść między tygodniami.
7. **Martwa Progresja.** Widok tylko wypisywał dni obok siebie — bez edycji, delt i jakiegokolwiek programowania.

## Rozwiązanie

### Fokus i stabilność panelu

`SidePanel` zapamiętuje i oddaje fokus wyłącznie przy realnym otwarciu/zamknięciu (`useEffect` zależny tylko od `open`). Obsługa klawiatury żyje w osobnym efekcie, a `onClose` czytany jest z refa, żeby nowa referencja funkcji nie restartowała focus-trapu.

### Serie jako jedno źródło prawdy

- `prescribedSets`, jeśli istnieje, wygrywa z polami agregatu. `usePlanDraft` nie wylicza już min–max z różnych serii; synchronizuje wyłącznie `sets` (liczba serii) oraz `reps`/`loadKg`, gdy wszystkie serie są identyczne.
- `schemeSummary.ts` daje jedno podsumowanie dla wszystkich powierzchni: identyczne serie `3 × 8–10 @ 80 kg`, różne `7 serii · 3/3/1/1/1/3/3 · 40–115 kg`, zmienna przerwa jako `przerwa 60–180 s`.
- Zwinięcie rozpiski chowa wiersze, nie kasuje danych. Świadome wyczyszczenie jest osobną akcją z Cofnij.

### Przerwa per seria

`PlanSet.RestSeconds` (nullable). `null` = dziedzicz `PlanItem.RestBetweenSetsSeconds`. Kompaktowy pas `DOMYŚLNIE` ustawia wartość dla całego ćwiczenia; kolumna „przerwa” w wierszu serii pokazuje rozwiązaną wartość jako muted placeholder, a wpisana liczba jest własnym override’em tej serii.

### Bezpieczna edycja i historia

- Przełącznik `Serie × wartość / Rampa` nie czyści niczego. Rampa generuje podgląd; dopiero „Zastosuj rampę” zastępuje rozpis.
- `usePlanHistory` trzyma do 50 transakcji draftu. `Cmd/Ctrl+Z` cofa, `Cmd/Ctrl+Shift+Z` ponawia. Wpisywanie cyfr w jednym polu jest jedną transakcją (grupowanie po czasie i po ścieżce pola), operacje strukturalne są pojedynczymi transakcjami.

### Jedno pole zakresu powtórzeń

`parseRepRange` / `formatRepRange` w `lib/measure.ts` mapują `5`, `5-10`, `5–10` na istniejące `reps`/`repsMax`. Encje i DTO bez zmian — zmienia się tylko interfejs.

### Hierarchia tygodni i dni, DnD

- Dwa osobne pasy: `WeekTabs` (numery `1…N` + menu tygodnia) i `DayTabs` (`D1`, `D2`…). Zachowanie identyczne w każdym widoku.
- `normalizeWeeks` przelicza `weekNumber` do ciągu `1…N` po wczytaniu planu i po każdej operacji strukturalnej.
- Wspólny `DndContext` nad Listą, Tablicą i Arkuszem; identyfikatory z prefiksami `item:`, `day:`, `day-container:`, `week:`. Uchwyt `DragHandle` jest jedynym miejscem startu przeciągania.
- Czyste helpery `builderMove.ts`: `moveItemTo`, `moveDayTo`, `normalizeWeeks`, `insertWeek`, `removeWeek`, `duplicateWeek`.

### Progresja jako edytowalna macierz

Wiersze = ćwiczenia dnia (`dayOrder` + `exerciseId` + wystąpienie), kolumny = tygodnie. Komórka to jedno pole: ciężar serii szczytowej, a pod nim objętość (`4×5`) i delta względem poprzedniego tygodnia. Kolumna z nazwą ćwiczenia jest przyklejona przy przewijaniu w poziomie. Brak ćwiczenia w danym tygodniu to komórka przerywana — luki uzupełnia się kopiowaniem tygodnia albo przeciąganiem dnia, bez drugiego mechanizmu w tym widoku.

Zapis idzie przez `topLoadPatch`: gdy pozycja ma rozpisane serie, zmienia się tylko seria szczytowa (procenty tej serii schodzą na sztywne kg); zbiorczy `loadKg` pozycji ustawiamy wyłącznie wtedy, gdy wszystkie serie mają ten sam ciężar.

### Generator progresji

`lib/progressionModels.ts` — czyste funkcje bez wiedzy o kreatorze, `generateProgression(model, params) → kg[]`:

- **liniowa** — stały krok co tydzień,
- **schodkowa** — `blockWeeks` tygodni bez zmiany, potem krok,
- **falowa** — fale po `blockWeeks` tygodni, każda kolejna startuje o jeden krok wyżej.

Wspólne: zaokrąglenie do 2,5 kg i opcjonalny lżejszy ostatni tydzień (85% ostatniego tygodnia roboczego). Zakres: jedno ćwiczenie albo cały dzień — przy całym dniu każde ćwiczenie liczy ten sam wzór od własnego ciężaru z pierwszego tygodnia. Zawsze podgląd `T1…Tn` przed zastosowaniem; zastosowanie to jedna transakcja historii (wszystkie `patchItem` lecą w jednym tiku, więc `useUndoRedo` widzi jeden krok).

## Model danych

```
PlanSet
+ RestSeconds : int?   // przerwa po tej serii; null = dziedziczy z PlanItem
```

Migracja: `PlanSetRestSeconds` (addytywna, kolumna nullable). Lokalny `apps/api/trainer.db` trzeba usunąć, bo SQLite tworzony jest przez `EnsureCreated()`.

## Kontrakt API

Bez nowych endpointów. Rozszerzenia istniejących kształtów:

- `PlanSetInput` (`POST/PUT /api/plans`, import, bundle) dostaje `restSeconds: int?`.
- `PlanSet` w odpowiedziach `GET /api/plans/{id}`, sesji i bundle’a klienta dostaje `restSeconds: number | null`.
- `apps/web/lib/api.ts` lustrzanie: `PlanSet.restSeconds`, `PlanSetInput.restSeconds`.

Stare plany mają `NULL` i zachowują się jak dotąd (fallback do przerwy ćwiczenia).

## Fazy implementacji

1. Spec + naprawa fokusu w `SidePanel`.
2. Jedna prawda serii, podsumowania, `RestSeconds` end-to-end + migracja.
3. Niedestrukcyjne tryby edycji + `usePlanHistory`.
4. Jedno pole zakresu powtórzeń we wszystkich edytorach.
5. Rozdzielone pasy tygodni/dni, ciągła numeracja, DnD ćwiczeń i dni w każdym widoku.
6. Progresja jako edytowalna macierz.
7. Generator progresji z podglądem.
8. Walidacja bramką (`./scripts/check.sh`). Web nie ma runnera testów jednostkowych — czystą logikę (`progressionModels`, `builderMove`, `measure`) trzymamy bez zależności od Reacta, żeby dało się ją pokryć testami, gdy runner dojdzie.

## Ryzyka

- **Migracja i lokalna baza.** Zmiana schematu kasuje lokalne dane deweloperskie. Zaakceptowane przez właściciela produktu.
- **Historia a autosave.** Cofnięcie zmienia draft, więc musi wyzwalać autosave; historia nie może się zerować po zapisie.
- **DnD dni.** Przeniesienie dnia zmienia `weekNumber` istniejącej encji — backend to obsługuje, ale klony (`copyWeek`, `duplicateDay`) muszą tracić `entityId`, żeby nie nadpisać oryginału.
- **Zakres powtórzeń.** Pojedyncze pole musi tolerować oba myślniki i nie gubić wartości przy częściowym wpisaniu (`5-`).

## Changelog

- 2026-08-19 — spec utworzony; wdrożone fazy 1–5.
- 2026-08-20 — Progresja jako edytowalna macierz + generator (liniowa / schodkowa / falowa, zakres ćwiczenie albo dzień). Zakres „cały plan” i „skopiuj poprzedni tydzień” odjęte: kopiowanie tygodnia i przeciąganie dni robią to samo bez nowego mechanizmu.
