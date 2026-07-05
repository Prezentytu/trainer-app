# Trainer App — zasady dla agentów

Portal trenera personalnego: biblioteka ćwiczeń, plany treningowe (szablony + plany klientów), przypisywanie planów klientom.

Ten plik jest punktem startowym dla każdego agenta. Zanim zaczniesz kodować, dopasuj zadanie do tabeli **Task Router** i przeczytaj wskazane przewodniki.

## Stos technologiczny

| Warstwa | Technologia | Port | Wejście |
|---|---|---|---|
| Backend (API) | .NET 10 Minimal API + EF Core + SQLite (`trainer.db`) | 5210 | `apps/api/Program.cs` |
| Frontend (web) | Next.js 16 (App Router) + React 19 + Tailwind 4 | 3000 | `apps/web/app/` |
| Klient API | typowany wrapper `fetch` | — | `apps/web/lib/api.ts` |
| Testy API | xUnit + `WebApplicationFactory` | — | `tests/api/` |

- Namespace backendu: `TrainerApp.Api`. Baza SQLite tworzona przez `EnsureCreated()` (brak migracji).
- UI jest w całości po polsku, ciemny motyw (paleta `zinc` + akcent `yellow`).
- Monorepo, jeden git w root: deployowalne aplikacje pod `apps/`, testy pod `tests/`.

## Układ repo

```
trainer-app/
├── apps/
│   ├── api/     # .NET 10 Minimal API  (backend)
│   └── web/     # Next.js 16           (frontend)
├── tests/
│   └── api/     # testy integracyjne API (xUnit)
├── .ai/         # spec-first + lessons (pamięć projektu)
├── .cursor/     # skille agentów
├── scripts/     # check.sh — bramka walidacyjna
└── TrainerApp.slnx  # solucja .NET (api + testy)
```

## Always

- Sprawdź `.ai/specs/` przed nietrywialną zmianą; przy zadaniach 3+ kroków lub decyzjach architektonicznych napisz spec (patrz `.ai/specs/AGENTS.md`).
- Przy dodawaniu nowego zasobu CRUD **wzoruj się na module referencyjnym `Clients`** — to najprostszy, kompletny przykład end-to-end (API + web). Zobacz skill `add-crud-feature`.
- Trzymaj typy TypeScript w `apps/web/lib/api.ts` **lustrzane** do DTO/encji w `apps/api/` (camelCase po stronie JSON).
- Wszystkie teksty UI pisz po polsku.
- Uruchom bramkę walidacyjną (`Validation Commands`) przed uznaniem zadania za skończone.
- Po korekcie od użytkownika dopisz lekcję do `.ai/lessons.md`, tak aby zapobiec powtórce tego samego błędu.
- Zmiany rób minimalne i skupione — dotykaj tylko tego, co konieczne.

## Ask First

- Przed dodaniem nowej zależności produkcyjnej (NuGet lub npm).
- Przed zmianą kontraktu API używanego już przez istniejące strony (sygnatury endpointów, kształt odpowiedzi, typy w `apps/web/lib/api.ts`).
- Przed zmianą schematu bazy (pola encji, relacje). `EnsureCreated()` **nie migruje** istniejącej bazy — zmiana schematu wymaga usunięcia `apps/api/trainer.db`, co kasuje dane.
- Przed zmianą architektury, układu katalogów lub dotknięciem wielu obszarów naraz w sposób nieopisany w istniejącym specu.

## Never

- Nigdy nie wywołuj surowego `fetch` w komponentach/stronach — używaj wyłącznie obiektu `api` z `apps/web/lib/api.ts` (jedyny dozwolony `fetch` to centralny wrapper `request<T>()` w tym pliku).
- Nigdy nie hardkoduj kolorów spoza palety `zinc`/`yellow`/statusowych tonów `Badge` — używaj prymitywów z `apps/web/components/ui.tsx`.
- Nigdy nie dodawaj endpointów bez prefiksu `/api`.
- Nigdy nie edytuj ręcznie `apps/api/trainer.db` ani plików w `bin`/`obj`.
- Nigdy nie commituj sekretów, `.env`, kluczy.

## Validation Commands

Wybierz najmniejszy potrzebny zestaw. Pełna bramka jednym poleceniem:

```bash
./scripts/check.sh
```

Pojedyncze kroki:

```bash
dotnet build apps/api/TrainerApp.Api.csproj      # kompilacja backendu
dotnet test                                       # testy backendu (xUnit, cała solucja)
npm run lint --prefix apps/web                    # ESLint (Next.js)
npm run typecheck --prefix apps/web               # tsc --noEmit
npm run build --prefix apps/web                   # produkcyjny build frontu
```

## Task Router — gdzie szukać szczegółów

Dopasuj zadanie do wiersza i przeczytaj wskazany przewodnik. Jedno zadanie może pasować do wielu wierszy — przeczytaj wszystkie.

| Zadanie | Przewodnik |
|---|---|
| Nowy zasób CRUD end-to-end (encja + API + strony) | skill `add-crud-feature` (`.cursor/skills/add-crud-feature/SKILL.md`) |
| Praca po stronie API (endpointy, encje, DTO, EF) | `apps/api/AGENTS.md` |
| Praca po stronie web (strony, komponenty, klient API) | `apps/web/AGENTS.md` |
| Pisanie/aktualizacja specyfikacji | `.ai/specs/AGENTS.md` + skill `spec-writing` |
| Review własnych/cudzych zmian | skill `code-review` |
| Walidacja + commit | skill `check-and-commit` |
| Powtarzające się błędy / wnioski | `.ai/lessons.md` |

## Konwencje

- **Nazewnictwo C#**: PascalCase dla typów i właściwości; encje w `apps/api/Models.cs`; rekordy wejściowe (input DTO) w `apps/api/Dtos.cs`.
- **JSON API**: camelCase (domyślna serializacja ASP.NET). Typy TS w `apps/web/lib/api.ts` muszą się zgadzać.
- **Endpointy**: grupowane po zasobie w `apps/api/Program.cs`, prefiks `/api/{zasób}`, komentarz-nagłówek sekcji (`// ---------- Nazwa ----------`).
- **Frontend**: strony to komponenty klienckie (`"use client"`), dane pobierane przez `api.*` w `useEffect`; wspólne prymitywy UI w `apps/web/components/ui.tsx` (`PageHeader`, `Card`, `Button`, `Field`, `ErrorBanner`, `EmptyState`, `Badge`, `inputClass`, `formatRest`).
- **Błędy API**: backend zwraca `{ message }` przy konfliktach; wrapper `request<T>()` wyciąga `message` i rzuca `Error` — strony pokazują go przez `ErrorBanner`.
- **Nawigacja**: nowy dział dopisz do tablicy `NAV` w `apps/web/app/layout.tsx`.

## Zasady przewodnie

- **Prostota przede wszystkim** — najprostsza możliwa zmiana o minimalnym zasięgu.
- **Bez prowizorek** — szukaj przyczyny źródłowej, nie łataj objawów.
- **Weryfikacja** — po zmianie uruchom bramkę i zapytaj siebie: „czy senior by to zaakceptował?".
