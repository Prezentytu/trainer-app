# Trainer App — zasady dla agentów

Portal trenera personalnego: biblioteka ćwiczeń, plany treningowe (szablony + plany klientów), przypisywanie planów klientom.

Ten plik jest punktem startowym dla każdego agenta. Zanim zaczniesz kodować, dopasuj zadanie do tabeli **Task Router** i przeczytaj wskazane przewodniki.

## Stos technologiczny

| Warstwa | Technologia | Port | Wejście |
|---|---|---|---|
| Backend | .NET 10 Minimal API + EF Core + SQLite (`trainer.db`) | 5210 | `backend/Program.cs` |
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind 4 | 3000 | `web/app/` |
| Klient API | typowany wrapper `fetch` | — | `web/lib/api.ts` |

- Namespace backendu: `TrainerApp.Api`. Baza SQLite tworzona przez `EnsureCreated()` (brak migracji).
- UI jest w całości po polsku, ciemny motyw (paleta `zinc` + akcent `yellow`).
- Repo jest monorepo: `backend/` i `web/` w jednym drzewie git.

## Always

- Sprawdź `.ai/specs/` przed nietrywialną zmianą; przy zadaniach 3+ kroków lub decyzjach architektonicznych napisz spec (patrz `.ai/specs/AGENTS.md`).
- Przy dodawaniu nowego zasobu CRUD **wzoruj się na module referencyjnym `Clients`** — to najprostszy, kompletny przykład end-to-end (backend + frontend). Zobacz skill `add-crud-feature`.
- Trzymaj typy TypeScript w `web/lib/api.ts` **lustrzane** do DTO/encji w `backend/` (camelCase po stronie JSON).
- Wszystkie teksty UI pisz po polsku.
- Uruchom bramkę walidacyjną (`Validation Commands`) przed uznaniem zadania za skończone.
- Po korekcie od użytkownika dopisz lekcję do `.ai/lessons.md`, tak aby zapobiec powtórce tego samego błędu.
- Zmiany rób minimalne i skupione — dotykaj tylko tego, co konieczne.

## Ask First

- Przed dodaniem nowej zależności produkcyjnej (NuGet lub npm).
- Przed zmianą kontraktu API używanego już przez istniejące strony (sygnatury endpointów, kształt odpowiedzi, typy w `web/lib/api.ts`).
- Przed zmianą schematu bazy (pola encji, relacje). `EnsureCreated()` **nie migruje** istniejącej bazy — zmiana schematu wymaga usunięcia `backend/trainer.db`, co kasuje dane.
- Przed zmianą architektury lub dotknięciem wielu obszarów naraz w sposób nieopisany w istniejącym specu.

## Never

- Nigdy nie wywołuj surowego `fetch` w komponentach/stronach — używaj wyłącznie obiektu `api` z `web/lib/api.ts` (jedyny dozwolony `fetch` to centralny wrapper `request<T>()` w tym pliku).
- Nigdy nie hardkoduj kolorów spoza palety `zinc`/`yellow`/statusowych tonów `Badge` — używaj prymitywów z `web/components/ui.tsx`.
- Nigdy nie dodawaj endpointów bez prefiksu `/api`.
- Nigdy nie edytuj ręcznie `backend/trainer.db` ani plików w `backend/bin`/`backend/obj`.
- Nigdy nie commituj sekretów, `.env`, kluczy.

## Validation Commands

Wybierz najmniejszy potrzebny zestaw. Pełna bramka jednym poleceniem:

```bash
./scripts/check.sh
```

Pojedyncze kroki:

```bash
dotnet build backend/TrainerApp.Api.csproj     # kompilacja backendu
dotnet test                                     # testy backendu (xUnit)
npm run lint --prefix web                       # ESLint (Next.js)
npm run typecheck --prefix web                  # tsc --noEmit
npm run build --prefix web                      # produkcyjny build frontu
```

## Task Router — gdzie szukać szczegółów

Dopasuj zadanie do wiersza i przeczytaj wskazany przewodnik. Jedno zadanie może pasować do wielu wierszy — przeczytaj wszystkie.

| Zadanie | Przewodnik |
|---|---|
| Nowy zasób CRUD end-to-end (encja + API + strony) | skill `add-crud-feature` (`.cursor/skills/add-crud-feature/SKILL.md`) |
| Praca po stronie backendu (endpointy, encje, DTO, EF) | `backend/AGENTS.md` |
| Praca po stronie frontendu (strony, komponenty, klient API) | `web/AGENTS.md` |
| Pisanie/aktualizacja specyfikacji | `.ai/specs/AGENTS.md` + skill `spec-writing` |
| Review własnych/cudzych zmian | skill `code-review` |
| Walidacja + commit | skill `check-and-commit` |
| Powtarzające się błędy / wnioski | `.ai/lessons.md` |

## Konwencje

- **Nazewnictwo C#**: PascalCase dla typów i właściwości; encje w `backend/Models.cs`; rekordy wejściowe (input DTO) w `backend/Dtos.cs`.
- **JSON API**: camelCase (domyślna serializacja ASP.NET). Typy TS w `web/lib/api.ts` muszą się zgadzać.
- **Endpointy**: grupowane po zasobie w `backend/Program.cs`, prefiks `/api/{zasób}`, komentarz-nagłówek sekcji (`// ---------- Nazwa ----------`).
- **Frontend**: strony to komponenty klienckie (`"use client"`), dane pobierane przez `api.*` w `useEffect`; wspólne prymitywy UI w `web/components/ui.tsx` (`PageHeader`, `Card`, `Button`, `Field`, `ErrorBanner`, `EmptyState`, `Badge`, `inputClass`, `formatRest`).
- **Błędy API**: backend zwraca `{ message }` przy konfliktach; wrapper `request<T>()` wyciąga `message` i rzuca `Error` — strony pokazują go przez `ErrorBanner`.
- **Nawigacja**: nowy dział dopisz do tablicy `NAV` w `web/app/layout.tsx`.

## Zasady przewodnie

- **Prostota przede wszystkim** — najprostsza możliwa zmiana o minimalnym zasięgu.
- **Bez prowizorek** — szukaj przyczyny źródłowej, nie łataj objawów.
- **Weryfikacja** — po zmianie uruchom bramkę i zapytaj siebie: „czy senior by to zaakceptował?”.
