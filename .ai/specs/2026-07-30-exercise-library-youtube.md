# Biblioteka ćwiczeń z YouTube + redesign zakładki Ćwiczenia

## TLDR

Kuratorski import playlisty YouTube „TRENING GÓRA" (~185 filmów → ~130 ćwiczeń) z miniaturkami i taksonomią (partia, sprzęt, mięśnie, wzorzec ruchu). Redesign `/exercises`: wyszukiwanie, filtry fasetowe, siatka miniatur, podgląd wideo jednym kliknięciem, strona szczegółów z zamiennikami. Zastępuje [2026-07-05-exercise-library-enrichment.md](2026-07-05-exercise-library-enrichment.md).

## Problem

Ćwiczenie ma dziś tylko nazwę, opis, typ i domyślne parametry. Brak mediów, taksonomii i wyszukiwania — przy 10 seedach uchodzi, przy bibliotece ze źródła YT to blokada. Istniejący spec enrichment proponował `Difficulty`/`Mechanics`/`ImageUrls` bez źródła danych; playlista YouTube daje realne filmy i strukturę partii, ale surowe tytuły nie nadają się jako nazwy (hashtagi, mieszanka języków, duplikaty, filmy teoretyczne).

## Proponowane rozwiązanie

1. **ID filmu, nie URL-e** — miniaturka `i.ytimg.com/vi/{id}/hqdefault.jpg` i embed `youtube-nocookie.com` są deterministyczne.
2. **Import jako dane w repo** — skrypt deweloperski zrzuca playlistę; kuratorski JSON w `apps/api/Data/exercises/` jest źródłem prawdy; `Seed.cs` go czyta. Kolejne playlisty = kolejne pliki JSON.
3. **Filtrowanie po stronie klienta** — `GET /api/exercises` zwraca wszystko; facety i liczniki w przeglądarce (mały dataset).
4. **Kuracja 1 ruch = 1 ćwiczenie**, lista `Media` z `kind`: `demo` | `tip` | `mistakes`.

## Model danych

`Exercise` — nowe pola (opcjonalne; ćwiczenie z samą nazwą działa jak dotąd):

```csharp
public record ExerciseMedia(string YoutubeId, string Title, int? Seconds, string Kind);

public string? Category { get; set; }   // shoulders|chest|back|arms|core|legs|fullbody
public string? Pattern { get; set; }    // vertical-push|horizontal-push|vertical-pull|horizontal-pull|
                                        // isolation|scapular|rotation|anti-rotation|anti-extension|carry|squat|hinge
public bool IsUnilateral { get; set; }
public List<string> Equipment { get; set; } = [];
public List<string> PrimaryMuscles { get; set; } = [];
public string? Instructions { get; set; }
public List<ExerciseMedia> Media { get; set; } = [];
```

`AppDb.cs`: value converter `List<string>` / `List<ExerciseMedia>` ↔ JSON (`System.Text.Json`).

Świadomie pominięte względem poprzedniego specu: `Difficulty`, `Mechanics`, `SecondaryMuscles`, `ImageUrls`.

Zmiana schematu → reset `trainer.db`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/exercises` | — | lista (bez filtrów serwerowych) |
| GET | `/api/exercises/{id}` | — | jedno ćwiczenie / 404 |
| POST/PUT | `/api/exercises[/{id}]` | `ExerciseInput` + nowe pola | jak dotąd |

Typy i słowniki etykiet w `apps/web/lib/api.ts` (`CATEGORY_LABELS`, `PATTERN_LABELS`, `EQUIPMENT_LABELS`, …). `api.exercises.get(id)`.

## UI

- `/exercises` — sticky search, pigułki faset (partia, sprzęt, więcej), siatka kart z `ExerciseThumb`, modal wideo (`YoutubeLite`), formularz w `Dialog`, undo przy usuwaniu.
- `/exercises/[id]` — galeria filmów, `StatBlock` parametrów, badge partii/sprzętu, zamienniki (ta sama `category` + `pattern`).
- Kreator: miniatury + filtr partii w `ExerciseDrawer` / `ExercisePicker`.
- `next.config.ts`: `images.remotePatterns` dla `i.ytimg.com`.

## Pipeline importu

```
YouTube playlist → scripts/yt-playlist-dump.mjs → .ai/data/yt/{listId}.json
  → kuracja → apps/api/Data/exercises/*.json → Seed.Run
```

Nazwy: **polska nazwa + angielski żargon w nawiasie**. Seed deduplikuje po nazwie; plany seeda odwołują się do ćwiczeń po nazwie (nie indeksie).

## Fazy implementacji

- [x] Faza 1 — spec + dump tool + kuratorski JSON
- [x] Faza 2 — backend: model, converter, DTO, endpointy, seed, testy + reset db
- [x] Faza 3 — frontend: typy, youtube helpers, thumb/lite, redesign listy, detail, builder
- [x] Faza 4 — `./scripts/check.sh`

## Ryzyka i wpływ

- Filmy osób trzecich mogą zniknąć / mieć wyłączony embed → fallback miniatury, link „Otwórz w YouTube".
- Jakość kuracji → JSON przeglądany w PR; poprawka = edycja linii + reset db.
- Rozjazd string-enumów → etykiety tylko w `api.ts`; test spójności seeda.
- Reset `trainer.db` — dane dev odtwarzalne z seeda.

## Changelog

- 2026-07-30 — utworzono spec; zastępuje `2026-07-05-exercise-library-enrichment.md`.
- 2026-07-30 — wdrożono: 124 ćwiczenia z playlisty TRENING GÓRA, redesign `/exercises` + `/exercises/[id]`, miniatury w kreatorze.
