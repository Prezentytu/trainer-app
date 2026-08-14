# Import playlisty TRENING DÓŁ

## TLDR

Kuratorski import playlisty YouTube „TRENING DÓŁ” do wspólnej biblioteki (ten sam pipeline co GÓRA). Seed dopisuje brakujące ćwiczenia na istniejącej bazie i scala filmy w ruchy core o tej samej nazwie (przysiad, martwy, wykroki, hip thrust, wall sit).

## Problem

Biblioteka startowa ma 10 ćwiczeń core + 124 z TRENING GÓRA. Nogi to tylko 5 pozycji core bez wideo. `Seed.Run` wychodzi przy niepustej tabeli, więc nowy JSON nic nie doda na istniejącej bazie (lokal + produkcja). Przy świeżym seedzie core wygrywa po nazwie i gubi filmy z katalogu.

## Proponowane rozwiązanie

1. Dump playlisty → kuratorski JSON `apps/api/Data/exercises/trening-dol.json` (1 ruch = 1 ćwiczenie).
2. Incremental seed: brakująca nazwa wspólna → INSERT; istniejąca → unia `Media` po `YoutubeId`.
3. Kolizje z core używają **tych samych nazw**, żeby scalić filmy zamiast dublować karty.

## Model danych

Bez zmian. `Exercise` + `ExerciseMedia` jak w [2026-07-30-exercise-library-youtube.md](2026-07-30-exercise-library-youtube.md).

## Kontrakt API

Bez zmian. `GET /api/exercises` zwraca całą listę (w tym nowe nogi).

## UI

Bez zmian. Filtr „Nogi” na `/exercises` pokaże nowy katalog.

## Pipeline importu

```
YouTube playlist → scripts/yt-playlist-dump.mjs → .ai/data/yt/{listId}.json
  → scripts/build-trening-dol-exercises.mjs → apps/api/Data/exercises/trening-dol.json
  → Seed.Run (świeży + incremental)
```

Źródło: `https://www.youtube.com/playlist?list=PLmhudurbOPnfm2_5sItEtzCV-iPH5ULtt`.

### Reguły kuracji

- 1 ruch = 1 ćwiczenie; kilka filmów w `media` (`demo` | `tip` | `mistakes`).
- Nazwa: polska + angielski żargon w nawiasie — **wyjątek:** kolizje z core bez nawiasu, 1:1:
  - `Przysiad ze sztangą`
  - `Martwy ciąg`
  - `Wykroki z hantlami`
  - `Wall sit`
  - `Hip thrust`
- `category`: zwykle `legs`; `core` / `fullbody` tylko gdy film nie jest nogami.
- Wzorce ze słownika: `squat`, `hinge`, `isolation`, `carry`.
- Pomijać teorię, duplikaty, nie-ćwiczenia.
- Warianty (front squat, RDL, bułgarski…) to osobne karty.

### Seed

- **Pusta tabela** — core + JSON + demo klient/plany; przy kolizji nazwy `MergeMedia` zamiast pominięcia.
- **Niepusta tabela** — `SyncLibrary`: match tylko `TrainerId == null`; INSERT brakujących; unia mediów; nie ruszać ćwiczeń trenera, planów, logów.
- `MergeMedia` — dopisać `youtubeId`, których jeszcze nie ma; nie nadpisywać `kind`/`title` już zapisanych.

## Fazy implementacji

- [x] Faza 1 — spec + dump playlisty
- [x] Faza 2 — skrypt kuracji + `trening-dol.json`
- [x] Faza 3 — `Seed.cs`: `SyncLibrary` + `MergeMedia`
- [x] Faza 4 — testy + `./scripts/check.sh`

## Ryzyka i wpływ

- Filmy osób trzecich mogą zniknąć / mieć wyłączony embed — jak przy GÓRZE: fallback miniatury + link.
- Zła nazwa przy kolizji z core → druga karta zamiast scalenia. Mitygacja: twarde nazwy core w specu i skrypcie.
- Incremental seed na produkcji przez `WarmupService` — przy błędzie JSON seed loguje i pomija plik, nie wywraca hosta.

## Changelog

- 2026-08-14 — utworzono spec.
- 2026-08-14 — dump 100 filmów; kuracja 73 ćwiczeń (98 mediów, 2 pominięte); incremental seed + merge mediów w core.
