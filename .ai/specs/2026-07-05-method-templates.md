# Szablony metod treningowych (15-10-5, 6-4-2-5-3-1) — generator startowy

## TLDR

Dziś kreator planu (`.ai/specs/implemented/2026-07-05-plan-creator-structure.md`) pozwala **manualnie wyklikać** dowolny plan, w tym poprawnie rozpisać jedną pozycję metodą 6-4-2-5-3-1 albo rampą 50/75/100% (presety w `apps/web/lib/planPresets.ts`). Ten spec opisuje **przyszłą** funkcję: „szablon metody" jednym kliknięciem generuje strukturę **całego** planu (tygodnie + dni + pozycje + serie) wg wybranej, poprawnie zdefiniowanej metody — żeby trener nie musiał ręcznie odtwarzać schematu dnia/tygodnia dla każdego ćwiczenia. Nie implementujemy tego teraz — to specyfikacja do wdrożenia po Spec 2 (maxy klienta) i Spec 3 (logowanie).

## Problem

Wcześniejsza wersja presetów w kreatorze błędnie sugerowała, że jeden preset = cała metoda 15-10-5. W rzeczywistości obie metody mają strukturę, która **przekracza pojedynczą pozycję**:

- **15-10-5 to podział TYGODNIOWY**, nie schemat jednego dnia. Wymaga rozpisania 3 (lub 4) różnych dni w tygodniu, każdy z innym zakresem powtórzeń dla wszystkich ćwiczeń, plus reguł progresji między tygodniami zależnych od wyniku ostatniego treningu.
- **6-4-2-5-3-1 to periodyzacja 6-tygodniowa** z zależnościami ciężaru między tygodniami (T4 używa ciężaru zbliżonego do 4RM z T2, T5 do 2RM z T3).

Ręczne odtworzenie tego dla kilku ćwiczeń i kilku tygodni jest pracochłonne, mimo że model danych (`PlanDay`/`PlanItem`/`PlanSet`) już to obsługuje. Potrzebny jest generator, który zna te reguły i tworzy szkielet planu automatycznie, pozostawiając trenerowi dopracowanie szczegółów.

## Poprawna definicja metod (źródło prawdy do implementacji)

### Metoda 15-10-5

Trening całego ciała (FBW) 3× w tygodniu, każdy dzień ma **inny, ustalony zakres powtórzeń dla wszystkich ćwiczeń**:

| Dzień | Zakres | Cel |
|---|---|---|
| Poniedziałek — „Dzień 15" | 15 powt. | wytrzymałość siłowa, gęstość naczyń krwionośnych |
| Środa — „Dzień 10" | 10 powt. | hipertrofia |
| Piątek — „Dzień 5" | 5 powt. | siła maksymalna |
| Sobota — „Dzień Ciekawości" (opcjonalny) | 3×20 | nauka nowych ruchów, niski ciężar |

W obrębie jednego dnia **tylko ostatnia seria jest robocza** (100% ciężaru docelowego); wcześniejsze serie to progresywna rozgrzewka do tego ciężaru:

| Dzień | Liczba serii | Progresja % |
|---|---|---|
| 15 | 3 | 50 → 75 → 100 |
| 10 | 4 | 40 → 60 → 80 → 100 |
| 5 | 5–7 (zalecane 4–6 serii dochodzenia) | 40 → 60 → 80 → 90 → 100 |

Ten fragment (progresja % w obrębie jednego dnia) jest **już zamodelowany** jako preset „Rampa do serii roboczej" (`rampToWorkingSet` w `planPresets.ts`) — to poprawny budulec, z którego generator (ten spec) złoży pełny tydzień.

**Progresja/regresja między tygodniami** (ten sam zakres, tydzień później):
- Sukces (zaliczone wszystkie powtórzenia serii roboczej) → dodaj 1 krok (zwykle +2,5 kg).
- Porażka (nie zaliczone) → odejmij 2 kroki (zwykle −5 kg) — „zamach młotkiem", cofnięcie poprawia technikę i pozwala nabrać pędu.

**Proporcje ciężaru docelowego względem 5RM** (przy tym samym ćwiczeniu we wszystkich trzech dniach): ciężar dnia 15 ≈ 60% ciężaru dnia 5; ciężar dnia 10 ≈ 80% ciężaru dnia 5. Wyższe proporcje prowadzą do przetrenowania.

**Dobór ćwiczeń** (rekomendacja dla początkujących, nie reguła twarda): ruchy „trudne do zepsucia" technicznie — wyciskanie wąskim chwytem / pompki na poręczach / wyciskanie hantli; ściąganie drążka podchwytem / wiosłowanie; wyciskanie hantli siedząc; przysiad do skrzyni z podwyższonymi piętami; prostowanie tułowia na ławce rzymskiej zamiast martwego ciągu.

### Metoda 6-4-2-5-3-1 (Charles Poliquin)

Periodyzacja 6-tygodniowa dla tego samego ćwiczenia (już poprawnie zamodelowana per-pozycja w presecie `poliquin642531`, patrz korekta w changelogu specu kreatora):

| Tydzień | Rampa/cel | Serie dodatkowe |
|---|---|---|
| T1 | ustal 6RM | — |
| T2 | ustal 4RM | + 80% × 5–10 („seria anaboliczna") |
| T3 | ustal 2RM | + 80% × 5–10, + 60% × 10–15 |
| T4 | rampa ciężarem bliskim 4RM z T2, 5 powt. | + 80% × 5–10, + 60% × 10–15 |
| T5 | rampa ciężarem bliskim 2RM z T3, 3 powt. (tapering — bez serii 60%) | + 80% × 5–10 |
| T6 | „Grand Finale" — test nowego 1RM | — (zredukować inne ćwiczenia w tym dniu) |

Zależność „ciężar bliski 4RM z T2" jest **odczytem z poprzedniego tygodnia** — dziś trener wpisuje to ręcznie (`LoadKg` na pozycji); pełna automatyzacja wymaga logowania wyników (patrz sekcja Zależności).

## Proponowane rozwiązanie (zakres przyszłej funkcji)

„Szablon metody" to funkcja kreatora (nie nowa encja backendowa): przycisk „Zastosuj szablon metody" na poziomie planu, który po podaniu:
- listy ćwiczeń per dzień (trener wybiera z biblioteki, jak dziś),
- liczby tygodni (domyślnie z definicji metody: 6 dla Poliquina, N dla 15-10-5),
- opcjonalnie ciężaru startowego per ćwiczenie,

generuje kompletną strukturę `days[]` (tygodnie, dni, pozycje, `prescribedSets`) zgodną z tabelami wyżej, którą trener może dalej edytować ręcznie (kreator zostaje edytowalny, szablon tylko wypełnia go wstępnie — bez nowego kontraktu API, czysto klient-side generator nad istniejącym `PlanInput`).

Nie modelujemy tego jako sztywny enum „typ metody" w backendzie — generator żyje w `apps/web/lib/methodTemplates.ts` (nowy plik, analogiczny do `planPresets.ts`, ale operujący na całym `days[]`, nie na jednej pozycji) i zwraca `PlanDayInput[]` gotowe do wstrzyknięcia w stan `PlanBuilder`.

## Zależności i granica MVP

- **Progresja/regresja między treningami** (15-10-5: +2,5 kg / −5 kg) wymaga znajomości wyniku ostatniego treningu → zależy od Spec 3 (logowanie: `WorkoutSession`/`LoggedSet`). Bez logowania generator może tylko zainicjować tydzień 1 z ciężarem podanym przez trenera; kolejne tygodnie trener koryguje ręcznie (wspiera to „Kopiuj tydzień").
- **Proporcje względem 5RM** i **ciężar bliski Nrm z poprzedniego tygodnia** (6-4-2-5-3-1) wymagają znajomości maxów klienta → zależy od Spec 2 (`ClientMax`, `%1RM`). Bez tego generator wypełnia ciężar startowy podany ręcznie przez trenera i pozostawia % tam, gdzie `PercentOf:"top"` już wystarcza (w obrębie jednej sesji — to działa już teraz, bez zależności).
- Ten spec **nie zmienia** modelu danych `Plan`/`PlanDay`/`PlanItem`/`PlanSet` — generator produkuje te same DTO co ręczne wyklikanie.

## UI (szkic, do dopracowania przy implementacji)

- Przycisk „Zastosuj szablon metody" w nagłówku kreatora (`PlanBuilder`), otwiera krok wyboru: metoda → ćwiczenia per dzień → liczba tygodni/ciężar startowy → generuje `days[]` i wstawia do istniejącego stanu (trener może dalej edytować jak dowolny inny plan).
- Ostrzeżenie w UI, gdy metoda zależy od maxów/logów, których nie ma (np. „Ciężar startowy wpisz ręcznie — automatyczne maxy będą dostępne po wdrożeniu profilu klienta").

## Fazy implementacji (przyszłe — nie rozpoczęte)

- [ ] Faza 1 — `apps/web/lib/methodTemplates.ts`: generator 15-10-5 (N tygodni FBW ×3, per dzień poprawna progresja %, bez zależności od logów w tygodniu 1).
- [ ] Faza 2 — generator 6-4-2-5-3-1 na poziomie całego planu (dziś istnieje tylko per-pozycja preset `poliquin642531`; ta faza składa go w pełny 6-tygodniowy plan dla wybranych ćwiczeń).
- [ ] Faza 3 — UI kroku wyboru szablonu w `PlanBuilder` + wstrzyknięcie wygenerowanych `days[]`.
- [ ] Faza 4 (po Spec 3) — automatyczna progresja/regresja między tygodniami na bazie zalogowanych wyników.
- [ ] Faza 5 (po Spec 2) — automatyczne wypełnianie ciężaru startowego z `ClientMax` i proporcji względem 5RM.

## Ryzyka i wpływ

- **Zbyt sztywny generator** — mitygacja: generator tylko wypełnia wstępnie, trener edytuje dalej jak zwykły plan; żadnych nowych ograniczeń w modelu danych.
- **Rozjazd między generatorem a ręcznymi presetami per-pozycja** (`planPresets.ts`) — mitygacja: generator komponuje te same budulce (`rampToWorkingSet`, `poliquin642531`) zamiast duplikować logikę procentów.
- **Użytkownik oczekuje pełnej automatyzacji progresji od razu** — mitygacja: jasny komunikat w UI o granicy MVP (Faza 1–3 działają bez logów/maxów, dalsza automatyzacja w Fazie 4–5).

## Changelog

- 2026-07-05 — utworzono spec (wydzielony z korekty błędnej interpretacji metod w `.ai/specs/implemented/2026-07-05-plan-creator-structure.md`).
