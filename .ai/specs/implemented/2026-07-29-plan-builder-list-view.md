# Kreator planu — widok „Lista” (domyślny)

## TLDR

Nowy, domyślny, minimalistyczny widok „Lista” kreatora planu (jeden dzień naraz, kompaktowe karty, inline edytor, sticky composer) wg makiety Workout Alchemist. Kolejność trybów: Lista → Tablica → Arkusz. Pole `IsWarmup` na `PlanItem` + schemat „rampa” przez istniejące `setScheme`.

## Problem

Obecny kreator oferuje Tablicę (kanban) i Arkusz (tabela). Makieta WA pokazuje trzeci, prostszy tryb — fokus na jednym dniu, szybkie dodawanie z klawiatury, superserie i rozgrzewka bez gęstej tabeli. Tablica jest druga, Arkusz najmniej ważny. Brakuje też jawnej rozgrzewki w modelu.

## Proponowane rozwiązanie

1. **Tryb `list`** w `PlanBuilder` — default (localStorage `…:v2`), SegmentedControl: Lista / Tablica / Arkusz.
2. **UI Lista**: DayTabs (D1…Dn), nagłówek dnia, karty pozycji z numeracją 0/1a/1b, sekcje Rozgrzewka / Część główna, inline `ListEntryEditor`, sticky `ListComposer` (quickEntry + ⇧↵ superseria).
3. **`PlanItem.IsWarmup`** — bool w backendzie; reset `trainer.db`.
4. **Rampa** — `setScheme = "rampa → 6RM"` (bez zmian schematu); segment Serie×powt. / Rampa w edytorze.

Numeracja: pozycja = samotne ćwiczenie lub łańcuch `linkedToNext`. Jeśli dzień ma rozgrzewkę — start od 0; inaczej od 1. Superserie: litery a/b/c.

## Model danych

`PlanItem` (+ DTO input/output):

| Pole | Typ | Default |
|---|---|---|
| `IsWarmup` / `isWarmup` | bool | `false` |

Rampa: bez nowego pola — tekst w `SetScheme`.

**Uwaga:** usunięcie `apps/api/trainer.db` wymagane (EnsureCreated).

## Kontrakt API

Bez nowych endpointów. `isWarmup` w odpowiedzi `ItemToDto` i w `PlanItemInput` (POST/PUT `/api/plans`).

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET/POST/PUT | `/api/plans…` | pole `isWarmup` na itemach |

Typy TS w `apps/web/lib/api.ts` lustrzane (`PlanItem`, `PlanItemInput`).

## UI

- `PlanBuilder`: `ViewMode = "list" | "board" | "table"`, default `list`.
- Nowe: `ListView`, `DayTabs`, `ListEntryCard`, `ListEntryEditor`, `ListComposer`, `listGroups.ts`.
- Mutatory draftu: `toggleWarmup`, `addItemAt`.
- Spójność: badge „rozgrzewka” w Tablicy/Arkuszu; sekcja Rozgrzewka w podglądzie `/plans/[id]`.
- Zero dublowania: meta dnia tylko w DayTabs (nie w WeekTabs w trybie Lista).

## Fazy implementacji

- [x] Faza 1 — backend `IsWarmup` + DTO + reset DB + testy
- [x] Faza 2 — typy web + persystencja + mutatory draftu
- [x] Faza 3 — `listGroups` + komponenty Lista + integracja PlanBuilder
- [x] Faza 4 — spójność Tablica/Arkusz/podgląd + walidacja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Reset DB kasuje dane lokalne | Świadoma decyzja; seed odtwarza przykłady |
| Stary localStorage wymusza Tablicę | Nowy klucz `:v2`, default Lista |
| Rampa vs rozpisane serie | Wzajemnie wykluczające się w edytorze |
| Prefiks `0a` / numeracja | `listGroups` + `addItemAt` jako jedyne źródło prawdy |

## Changelog

- 2026-07-29 — utworzono spec (decyzje: rozgrzewka w modelu, rampa przez setScheme).
- 2026-07-29 — wdrożono: widok Lista (default), `IsWarmup`, rampa przez `setScheme`, SegmentedControl Lista/Tablica/Arkusz; `./scripts/check.sh` zielony.
