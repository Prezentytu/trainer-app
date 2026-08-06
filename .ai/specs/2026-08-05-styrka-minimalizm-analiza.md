# Styrka — analiza minimalizmu i kurs produktu

## TLDR

Styrka (Feji Studios) to B2C gym tracker zbudowany na odejmowaniu: brak konta, reklam, subskrypcji i zbędnych funkcji; UI true-black + biały tekst; logowanie serii w sekundy. Trainer App bierze ten kurs minimalizmu **w całej aplikacji** (portal klienta i panel trenera), zachowując przewagę: trener w pętli plan → log → reakcja. Ten spec to benchmark + zweryfikowana inwentaryzacja różnic (audyt kodu 2026-08-06).

Źródła: [fejistudios.vercel.app](https://fejistudios.vercel.app/), [App Store — Styrka](https://apps.apple.com/pl/app/styrka-gym-tracker/id6761281378?l=pl) (historia 1.2–3.7).

Implementacja Fali 0–1: `.ai/specs/2026-08-06-styrka-parity-fale-0-1.md`. Lock Screen / Live Activity: `.ai/specs/2026-08-06-rest-loop-lock-screen.md`.

## Problem

Chcemy wyglądu i odczucia „czystości" Styrki, ale:

1. Jesteśmy produktem **trener ↔ klient**, nie solo-lifterem — gęstość danych w kreatorze i analityce jest konieczna.
2. Ryzyko: kopiowanie natywnych ficzerów iOS (Watch, Live Activities, widgety) albo rozdmuchanie panelu „gęstością UI" zamiast gęstości informacji.
3. Część „wdrożonych" quick-wins była martwa (BW czytał `category === "bodyweight"`, a bodyweight żyje w `equipment`).

## Pozycjonowanie

| Styrka | Trainer App |
|---|---|
| No account | Portal klienta bez konta (token) |
| No ads / no subs (one-time) | Klient bezpłatnie; płaci trener |
| Offline logging | PWA + offline + rest keep-alive na Lock Screen |
| Solo lift | Trener reaguje pierwszy (plan → log → progres) |
| Monochrom B&W | Mono v2: invert chrome, kolor tylko na danych |

## Zweryfikowana inwentaryzacja (2026-08-06)

Status: **Mamy** / **Częściowo** / **Brak** / **Nie kopiować**. Dowody w kodzie z audytu.

### Logger sesji

| Ficzer Styrki | Status | Dowód / uwagi |
|---|---|---|
| Prefill z planu / poprzedniej sesji (kolumna Poprz.) | Mamy | `SessionLogger` + `Stats.LoadPrevSets` |
| Checkmark ukończenia serii | Mamy | `toggleComplete` |
| Auto-start rest + Lock Screen | Mamy | `useRestTimer` + `restKeepAlive` (spec rest-loop) |
| Undo usuniętej serii | Mamy | `useUndoToast` przywraca `completed` |
| Typo-guard / empty-set warning | Mamy | `isUnusualSetValue`, `hasEmptyCompletedSets` |
| Notatka per ćwiczenie | Mamy | `LoggedExercise.Note` |
| PR w trakcie sesji | Mamy | badge + toast |
| Kalkulator talerzy | Mamy | `PlateCalculator` (przewaga) |
| Podmiana ćwiczenia | Mamy | `swapExercise` (przewaga) |
| Seria rozgrzewkowa | Mamy | `isWarmup` |
| „BW" zamiast „0 kg" | **Mamy** (Fala 0) | `equipment.includes("bodyweight")` |
| RPE/RIR per seria w UI | **Mamy** (Fala 0) | Kolumna za przełącznikiem `readLogRir` |
| Tap-to-dismiss keyboard | **Mamy** (Fala 0) | pointerdown → blur |
| Reorder ćwiczeń mid-workout | **Mamy** (Fala 0) | W górę / W dół w menu |
| Notatka per seria | Brak (backlog) | Brak `LoggedSet.Note` — migracja |
| Notatka sesji w trakcie | Częściowo | Tylko po zakończeniu |
| Edycja daty sesji po fakcie | Brak (backlog) | Backend przyjmuje; brak UI |
| Cap 4 h na czas treningu | **Mamy** (Fala 0) | `MaxDurationSeconds` |
| Typ weight+distance (Farmer's Walk) | Brak (backlog) | Typy: `reps`/`time`/`distance` |
| Logowanie L/R unilateral | Brak (backlog) | `IsUnilateral` na Exercise, brak side na LoggedSet |

### Szybki start

| Ficzer Styrki | Status | Uwagi |
|---|---|---|
| Powtórz ostatni trening | **Mamy** (Fala 1) | `RepeatSessionId` + `PrefillFromSession` |
| Ostatnio używane w pickerze | **Mamy** (Fala 1) | `lastPerformedOn` |
| Data ostatniego wykonania w pickerze | **Mamy** (Fala 1) | |
| Prefill z dowolnej sesji (nie tylko szablonu) | **Mamy** (Fala 1) | |

### Statystyki / retencja

| Ficzer Styrki | Status | Uwagi |
|---|---|---|
| Streak 7-dniowy kroczący | **Mamy** (Fala 1) | Okna 7 dni od dziś |
| Wykres e1RM per ćwiczenie | **Mamy** (Fala 2) | Portal: expand rekordu → `TrendSparkline` |
| Volume / muscle volume | Mamy | `MuscleVolumeBars`, trendy |
| Most Improved 90 dni | **Mamy** (Fala 2) | `GET …/most-improved` + karta na `/progress` |
| Waga docelowa | Brak (backlog) | |
| Wykres masy ciała | **Mamy** (Fala 2) | Portal `/measurements`: `WeightTrendSparkline` |
| Kalendarz miesiąca | **Mamy** (Fala 2) | Siatka miesiąca na `/progress` |
| Śr. długość treningu | **Mamy** (Fala 2) | StatBlock z `durationSeconds` (30 dni) |
| Cardio totals (czas/dystans) | Brak (backlog) | |
| Avg RPE | Brak (backlog) | |
| Kalkulator %1RM + strefy | Brak (Fala 3) | |
| Share card | Brak (Fala 3) | |
| CSV z seriami / import | Częściowo | CSV bez serii; brak importu backupu |
| Detektor zastoju | Mamy (trener) | Portal nie widzi |

### Czego NIE kopiować

- Apple Watch, Live Activities natywne, Dynamic Island, home-screen widgets.
- Własne profile progresji per ćwiczenie u klienta — u nas programuje trener.
- lbs / imperial jako domyślne.
- Pełny monochrom (rezygnacja z tokenów danych).

### Nasza przewaga (Styrka nie ma)

Kreator planów z %1RM / rampami / superseriami, import planu AI, portal bez konta, komentarze trener↔klient, check-in wellness, churn radar, detektor zastoju, kalkulator talerzy, podmiana ćwiczenia, YouTube w bibliotece.

## Fale (kurs)

| Fala | Zakres | Spec |
|---|---|---|
| Rest Lock Screen | Keep-alive + Media Session | `2026-08-06-rest-loop-lock-screen.md` |
| **0** | BW fix, RIR toggle, craft loggera, 4 h | `2026-08-06-styrka-parity-fale-0-1.md` |
| **1** | Powtórz ostatni, ostatnio używane, streak kroczący | j.w. |
| **2** | Most Improved, e1RM/waga w portalu, kalendarz, śr. czas | `2026-08-06-styrka-parity-fala-2.md` |
| 3+ | share, %1RM UI, CSV, migracje… | backlog poniżej |

### Backlog (po Fali 2)

Notatka per seria (migracja), L/R, weight+distance, drill-down mięśni, waga docelowa, cardio totals, avg RPE, kalkulator %1RM ze strefami, share card, CSV z seriami + import, licznik wykonań per ćwiczenie, edycja daty sesji.

## Wynik audytu Fali D (2026-08-05) — historyczny

P0–P2 wdrożone. P3 „BW" było **fałszywie odhaczone** — naprawa w Fali 0. Auto-nazwa sesji po mięśniach: wdrożona.

## Lekcja procesowa

Styrka wypuszcza często z „based on user feedback". U nas: changelog po shipach; przed odhaczeniem „mamy" — weryfikacja ścieżki danych end-to-end (nie tylko obecność stringa w UI).

## Changelog

- 2026-08-05 — utworzono spec; audyt Fali D; wdrożono P0–P2 (+ fałszywe P3 BW).
- 2026-08-06 — audyt kodu: zweryfikowana inwentaryzacja; BW oznaczony jako martwy; Fale 0–1 wydzielone do `2026-08-06-styrka-parity-fale-0-1.md`.
- 2026-08-06 — Fale 0–1 wdrożone (patrz changelog w `2026-08-06-styrka-parity-fale-0-1.md`).
- 2026-08-06 — Fala 2 wdrożona (Most Improved, e1RM/waga w portalu, kalendarz, śr. czas) — `2026-08-06-styrka-parity-fala-2.md`.
