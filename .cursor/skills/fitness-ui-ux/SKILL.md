---
name: fitness-ui-ux
description: Wytyczne UI/UX dla portalu trenera i aplikacji treningowej (kreator planów, tabele serii, periodyzacja, logowanie, statystyki). Użyj przy projektowaniu lub zmianie ekranów planów, ćwiczeń, sesji i wykresów progresu w Trainer App. Czytaj razem z `design-system`, `ux-writing`, `senior-ux-cro`.
---

# UI/UX aplikacji treningowej

Wiedza zebrana z analizy najlepszych narzędzi (FitFocus, Flynn OS, TeamBuildr BUILD, Gravitus, **Styrka**) oraz rekomendacji projektantów (Dezyn, Sleek „Forge", badania UX logowania: PUMP UP, Sweatlog). Stosuj w Trainer App z tokenami Acid (`design-system`) i prymitywami z `apps/web/components/ui.tsx`. Benchmark minimalizmu: `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md`.

## Naczelna zasada: dwa różne tryby myślenia

Aplikacje treningowe obsługują dwa odrębne stany — **oba minimalistyczne**:

- **Planowanie / przegląd** (trener buduje plan, analizuje postęp) — nagradza **gęstość informacji**, nie gęstość UI. Kreator i statystyki: dużo danych, mało chrome'u, progressive disclosure.
- **Wykonanie / logowanie** (podczas treningu) — wymaga **wielkiej typografii, minimum interakcji, zero obciążenia poznawczego**.

Różnica między trybami to ilość **danych** na ekranie, nie ilość dekoracji. Największy błąd to jeden layout dla obu *albo* „gęsty = zabałaganiony". Projektuj tryby osobno; minimalizm obowiązuje też w panelu trenera.

## Kreator planów (tryb planowania)

- **Hierarchia widoczna wprost**: Plan → Tydzień → Dzień → Pozycja → Serie. Nie ukrywaj struktury.
- **Progression View**: możliwość zestawienia tych samych dni z różnych tygodni obok siebie (np. wszystkie „Poniedziałki"), żeby widać było progresję objętości/ciężaru.
- **Superserie jednym kliknięciem**: grupowanie pozycji (A1/A2, 3a/3b) ze wspólnym oznaczeniem i wspólną przerwą. Renderuj literę wg kolejności w grupie.
- **Smart defaults i presety**: nie zmuszaj do ręcznego klikania każdej serii. Oferuj gotowe schematy (6-4-2-5-3-1, 15-10-5, rampa + back-off) generujące serie automatycznie.
- **Klonowanie**: „Kopiuj tydzień", „Duplikuj plan", „Użyj szablonu → plan klienta". Metodyka żyje w szablonie; personalizujesz tylko ~10%.
- **Tabela serii jak arkusz**: kolumny set / powtórzenia / % / ciężar / RPE / tempo. Zwięzła, skanowalna, edytowalna w miejscu.
- **Pola miękkie jako tekst**: tempo (3110, 20X1), schemat serii („Rampa 8-11 serii"), notatki progresji („+2,5 kg") — trenerzy zapisują je różnie; nie wtłaczaj w sztywne enumy.

## Logowanie sesji (tryb wykonania)

- **Jeden ekran, minimum tapnięć**: dodanie serii ≤ 2 tapnięcia, inaczej użytkownik rezygnuje.
- **Częstotliwość steruje priorytetem** (jak kodowanie Huffmana): ciężar i powtórzenia = najszybszy input; RPE, tempo, notatki = „nieco dalej".
- **Prefill z poprzedniej wartości**: nowa seria dziedziczy ciężar/powtórzenia z ostatniej; jeśli bez zmian — jedno tapnięcie „zaloguj".
- **Historia w kontekście**: pokaż wynik z ostatniego razu obok pola wpisywania (bez opuszczania ekranu).
- **Rozróżniaj plan od wykonania**: plan mówi „3×8 @135", log zapisuje faktyczne „8, 8, 6 @135". Oba potrzebne do śledzenia adherencji.
- **Rest timer**: duży, czytelny, nie do zgubienia; (mobilnie) haptyka + jedno tapnięcie „przedłuż". Opcja auto-start po odhaczeniu serii (wzorzec Styrka).
- **„Powtórz ostatni trening"**: najszybszy start z listy ostatnich unikalnych rutyn (nie duplikatów).
- **Typo-guard**: przy zapisie / finish — confirm gdy ciężar lub powtórzenia mocno odstają od historii ćwiczenia (łapanie literówek na siłowni).
- **Puste serie**: ostrzeżenie przed zapisem, gdy ćwiczenie ma puste wiersze.
- **Bodyweight**: w podpowiedziach i historii pokazuj „BW", nie „0 kg".
- **Dziesiętne**: akceptuj przecinek i kropkę w kg / dystansie / pomiarach (lokalizacje PL i EN).

## Statystyki i progres (retencja)

- Wizualizacja postępu to mechanizm retencji, nie ozdoba: rekordy (PR), trend objętości, trend 1RM, porównania „przed/po".
- Zakresy czasu: 1M / 3M / 1R / całość.
- Na ekranie głównym pokaż najbardziej motywującą metrykę dla danego użytkownika, nie generyczny przegląd.
- **Streak kroczący 7 dni** (od ostatniego treningu) — nie reset kalendarzowy w poniedziałek; semantyka uzgodnić z obecnym StatBlock.
- **Największy progres** (analog Styrka „Most Improved"): ćwiczenie z największym % wzrostem ciężaru w oknie ~90 dni.
- **Średnia długość sesji** i volume week-over-week — obok objętości mięśniowej, bez ściany KPI.

## Dostępność i jakość

- Cele dotykowe ≥ 44×44 px; kontrast tekstu ≥ 4,5:1.
- Optymistyczny UI: efekt akcji < 100 ms, synchronizacja w tle.
- Undo dla usunięć (przypadkowe tapnięcia się zdarzają).
- Puste stany prowadzą użytkownika do pierwszej akcji (`EmptyState`).

## Reguły projektu (twarde)

- Tylko tokeny semantyczne Acid (`design-system`) + prymitywy `components/ui.tsx` — zero surowych `zinc-*`/`yellow-*`.
- Żadnego surowego `fetch` w komponentach — wyłącznie `api` z `lib/api.ts`.
- Wszystkie teksty po polsku — skill `ux-writing` (test na głos, zero kalek i telegrafu).
- Nowe zależności (np. biblioteka wykresów) wymagają zgody — domyślnie wykres jako inline SVG.
- Zmiany minimalne i skupione; prostota przede wszystkim — test odejmowania z `design-system`.

## Powiązane

- Tokeny/typografia/spacing: skill `design-system`.
- Responsywność: skill `responsive-ui`.
- Psychologia konwersji, hierarchia uwagi, empty states, gotchas (poziom "10/10"): skill `senior-ux-cro` — czytaj przy każdej implementacji UI.
- Interakcje, materiały, craft (Apple): skill `apple-design`.

## Źródła

FitFocus (program builder, block periodisation), Flynn OS (drag-and-drop, split view, per-exercise history), TeamBuildr BUILD (progression view, multi-select, custom % 1RM/tempo/superserie), Gravitus (zakładki Stats/History, rep maxes, muscle engagement), **Styrka / Feji Studios** (minimalizm, log in seconds, typo-guard, streak kroczący, Most Improved, BW, decimal locale — bez kopiowania Watch/widgetów), Dezyn i Sleek „Forge" (rozdzielenie trybów, typografia, rest timer), badania UX logowania PUMP UP i Sweatlog (priorytetyzacja inputów, prefill).
