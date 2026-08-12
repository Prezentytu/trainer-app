# Edytor ćwiczenia — jedna prawda

## TLDR

Jeden szkielet edytora pozycji w kreatorze listy: 4 sloty o stałej geometrii, jeden prymityw wiersza serii (`SetRow`) dla rozpisu i backoffu. Trzy wypełnienia (jednolite / rozpis / rampa) bez kart-w-karcie i bez dublowania pól. Bez zmian API.

## Problem

Edytor w `ListEntryEditor` + `SetSchemeEditor` pokazywał dwie prawdy naraz (globalne SERIE/POWT/KG i arkusz 8 kolumn), chował ciężar w „Więcej”, a ramę BO owinął zagnieżdżoną kartą. Benchmark Hevy/Strong: wiersz = seria, `SET | KG | REPS`. Skargi TrueCoach/Trainerize/WeStrive: wolny tekst, za dużo przycisków, poziomy scroll.

## Proponowane rozwiązanie

Stała ramka:

1. Segmented `[Serie × wartość] [Rampa]` (+ chipy xRM przy rampie).
2. Siatka 4 slotów — slot C zawsze obciążenie, nigdy tempo.
3. RIR (te same chipy co xRM).
4. Lista `SetRow` albo pusta.
5. Więcej (tempo, miara, % 1RM, RPE, notatka, po ćwiczeniu, rozgrzewka).
6. Ghost stopka: Duplikuj / Usuń / Superseria.

Wypełnienie slotów:

| Tryb | A | B | C | D |
|---|---|---|---|---|
| Jednolite | serie | powt (czas/dystans) | kg | przerwa |
| Rozpis | ukryte | ukryte | ukryte | przerwa |
| Rampa | cel xRM | serie (opcjonalne) | — | przerwa |

Mutex: rozpis = `prescribedSets` (seed z 4×8 @ kg); rampa = `setScheme` + BO w `prescribedSets`; jednolite = pola itemu. Tempo w Więcej.

`SetRow`: `#` / `BO n` · powt od–do · kg **albo** % · ✕. Rola przez tap na `#`. Chipy 60/70/80/90 jedna linia pod listą (focus).

## Model danych

Bez zmian encji/DTO. Istniejące `PlanItem.sets` (nullable), `prescribedSets.role/loadPercent/percentOf`.

## Kontrakt API

Bez zmian.

## UI

- [`apps/web/components/plan-builder/ListEntryEditor.tsx`](apps/web/components/plan-builder/ListEntryEditor.tsx)
- [`apps/web/components/plan-builder/SetRow.tsx`](apps/web/components/plan-builder/SetRow.tsx) (nowy)
- [`apps/web/components/plan-builder/SetSchemeEditor.tsx`](apps/web/components/plan-builder/SetSchemeEditor.tsx)

Tokeny mono v2, `Field` / `NumInput` / `SegmentedControl` / `Switch`. Chipy: `h-[30px]` `rounded-[10px]`, active = invert.

## Fazy implementacji

- [x] Faza 1 — spec
- [x] Faza 2 — `SetRow` + szkielet edytora + mutex trybów
- [x] Faza 3 — `SetSchemeEditor` na `SetRow`, walidacja

## Ryzyka i wpływ

- Widok Tabela nadal używa `SetSchemeEditor` — zmiana prymitywu poprawia też tabelę (akceptowalne; layout TableExerciseRow poza zakresem).
- Seed rozpisu nadpisuje puste `prescribedSets`; istniejący rozpis zostaje.
- Wyłączenie rozpisu czyści `prescribedSets` (jak dziś) — trener może stracić per-set kg; mitygacja: link „Zwiń rozpis” jest świadomą akcją, nie ukrytym switchem.

## Changelog

- 2026-08-12 — utworzono spec (szkielet 4 slotów, SetRow, research Hevy/TrueCoach/Trainerize).
- 2026-08-12 — wdrożono: SetRow, szkielet 4 slotów, mutex trybów, ciężar na wierzchu, tempo w Więcej.
