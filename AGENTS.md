# Trainer App — zasady dla agentów

Portal trenera personalnego: biblioteka ćwiczeń, plany treningowe (szablony + plany klientów), przypisywanie planów klientom.

Ten plik jest punktem startowym dla każdego agenta. Zanim zaczniesz kodować, dopasuj zadanie do tabeli **Task Router** i przeczytaj wskazane przewodniki.

## Stos technologiczny

| Warstwa | Technologia | Port | Wejście |
|---|---|---|---|
| Backend (API) | .NET 10 Minimal API + EF Core (Sqlite lokalnie / Postgres Neon w prod) | 5210 | `apps/api/Program.cs` |
| Frontend (web) | Next.js 16 (App Router) + React 19 + Tailwind 4 | 3000 | `apps/web/app/` |
| Klient API | typowany wrapper `fetch` | — | `apps/web/lib/api.ts` |
| Testy API | xUnit + `WebApplicationFactory` | — | `tests/api/` |

- Namespace backendu: `TrainerApp.Api`. Lokalnie (SQLite) schemat powstaje przez `EnsureCreated()`; na produkcji (Postgres) przez migracje EF z `apps/api/Migrations/`. Zmiana encji wymaga **obu**: nowej migracji i usunięcia `apps/api/trainer.db`.
- UI jest w całości po polsku, ciemny motyw RepMaxer **mono v2** (invert fill zamiast hue w chrome; gold/green/red tylko na danych). Kolory wyłącznie przez tokeny z `apps/web/app/globals.css` — skill `design-system`. Landing marketingowy też na mono v2 (`components/landing/`).
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
├── .agents/     # skille agentów (.cursor/skills to symlink)
├── scripts/     # check.sh — bramka walidacyjna
└── TrainerApp.slnx  # solucja .NET (api + testy)
```

## Always

- Sprawdź `.ai/specs/` przed nietrywialną zmianą; przy zadaniach 3+ kroków lub decyzjach architektonicznych napisz spec (patrz `.ai/specs/AGENTS.md`), bo tam leżą już podjęte decyzje i plan, który ktoś zatwierdził.
- Przy dodawaniu nowego zasobu CRUD **wzoruj się na module referencyjnym `Clients`** — to najprostszy, kompletny przykład end-to-end (API + web). Zobacz skill `add-crud-feature`.
- Przy zmianie UI przeczytaj skille adekwatne do zmiany według wiersza UI w **Task Router**, nie wszystkie naraz: razem mają ~7,5 tys. słów, a każdy wnosi coś innego (tokeny, domena, mobile, copy, ruch, konwersja).
- Trzymaj typy TypeScript w `apps/web/lib/api.ts` **lustrzane** do DTO/encji w `apps/api/` (camelCase po stronie JSON), bo nie ma generatora typów i rozjazd wychodzi dopiero w przeglądarce.
- Wszystkie teksty UI pisz po polsku, bo aplikacja deklaruje `lang="pl"` (`apps/web/app/layout.tsx`) i nie ma warstwy tłumaczeń.
- Zanim uznasz zadanie za skończone, zweryfikuj je według `Validation Commands`.
- Po korekcie od użytkownika dopisz lekcję do `.ai/lessons.md` jako „Jeśli X, to Y”; szukaj w lekcjach grepem, nie czytaj całości (stare wpisy w `.ai/lessons-archiwum.md`), a lekcję, która wraca, zamień na check.
- Zmiany rób minimalne i skupione — dotykaj tylko tego, co konieczne, żeby diff dało się przejrzeć i cofnąć.

## Ask First

- Przed dodaniem nowej zależności produkcyjnej (NuGet lub npm), bo każda wchodzi do bramek podatności w CI (`npm audit`, NuGet `--vulnerable`) i do bundla.
- Przed zmianą kontraktu API używanego już przez istniejące strony (sygnatury endpointów, kształt odpowiedzi, typy w `apps/web/lib/api.ts`).
- Przed zmianą schematu bazy (pola encji, relacje). Lokalnie `EnsureCreated()` **nie migruje** istniejącej bazy — zmiana schematu wymaga usunięcia `apps/api/trainer.db`, co kasuje dane. Na produkcji potrzebna jest dodatkowo migracja EF.
- Przed zmianą architektury, układu katalogów lub dotknięciem wielu obszarów naraz w sposób nieopisany w istniejącym specu.

## Never

- Nigdy nie wywołuj surowego `fetch` w komponentach/stronach — używaj wyłącznie obiektu `api` z `apps/web/lib/api.ts`, bo `request<T>()` mapuje błędy na polski `message` i ponawia GET. Pilnuje ESLint (`no-restricted-globals`, wyjątki opisane w `apps/web/eslint.config.mjs`).
- Nigdy nie używaj surowych klas `zinc-*`/`lime-*`/`yellow-*`/`teal-*`/`red-*`/`emerald-*` ani hexów w komponentach — wyłącznie tokeny z `apps/web/app/globals.css`, prymitywy z `ui.tsx` i `Icon` (Phosphor), bo motyw mono v2 zmienia się w jednym miejscu. W `className` pilnuje ESLint (`no-restricted-syntax`). Zobacz skill `design-system`.
- Nigdy nie dodawaj endpointów bez prefiksu `/api`, bo strażnik PIN portalu w `apps/api/Program.cs` łapie ścieżki `/api/portal/…`, a smoke i warmup (`docs/ci-cd.md`, `docs/deploy.md`) zakładają `/api/health…`.
- Nigdy nie edytuj ręcznie `apps/api/trainer.db` ani plików w `bin`/`obj` — generują je `EnsureCreated()` i build.
- Nigdy nie commituj sekretów, `.env`, kluczy — repo jest publiczne. CI skanuje historię gitleaksem (fałszywe trafienia: `.gitleaksignore`).

## Validation Commands

Weryfikuj proporcjonalnie do zmiany i napisz, co uruchomiłeś. W trakcie pracy wystarczy wariant na zmienione pliki; pełna bramka przed PR (tę samą robi CI):

```bash
./scripts/check.sh --zmienione   # tylko pakiety dotknięte zmianą względem origin/main
./scripts/check.sh               # pełna: api build + testy, web lint + typecheck + build, limity słów
```

Pojedyncze kroki:

```bash
dotnet build apps/api/TrainerApp.Api.csproj      # kompilacja backendu
dotnet test                                       # testy backendu (xUnit, cała solucja)
npm run lint --prefix apps/web                    # ESLint (Next.js)
npm run typecheck --prefix apps/web               # tsc --noEmit
npm run build --prefix apps/web                   # produkcyjny build frontu
./scripts/check-word-limits.sh                    # AGENTS.md i aktywne lekcje mieszczą się w limicie słów
```

Limity słów (`scripts/word-limits.txt`) wolno tylko obniżać: te pliki agent czyta w każdej sesji.

### Lokalne dev (pamięć / zamrożenia macOS)

```bash
./scripts/dev.sh          # API + web, jeden Ctrl+C ubija wszystko
./scripts/dev-doctor.sh   # footprint, swap, cache, porty, sieroty
./scripts/clean.sh        # czyści .next + bin/obj
```

`npm run dev` w `apps/web` używa Webpacka z limitem 4 GB (nie Turbopacka) — szczegóły i warunek powrotu na Turbopack w `.ai/lessons-archiwum.md` (grep: `Turbopack`).

## Task Router — gdzie szukać szczegółów

Dopasuj zadanie do wiersza i przeczytaj wskazany przewodnik. Jedno zadanie może pasować do wielu wierszy — przeczytaj wszystkie.

| Zadanie | Przewodnik |
|---|---|
| UI/UX: nowy ekran, redesign, komponent, formularz, empty state, audyt jakości | Wybierz skille do zmiany: `design-system` — kolory, tokeny, typografia (każda zmiana wyglądu); `responsive-ui` — układ, mobile, overflow; `fitness-ui-ux` — kreator planów, sesja, logowanie; `ux-writing` — każdy nowy lub zmieniony tekst; `apple-design` — ruch, press, materiały, gesty; `senior-ux-cro` — nowy ekran, formularz, onboarding, konwersja (jego „Senior Excellence Checklist” przy nowym ekranie i redesignie) |
| Landing, mockup, brief do Claude Designera, audyt „za dużo tekstu” | skill `odejmowanie` (locked brief; wygrywa przy dodaj vs usuń) + `design-system` + `ux-writing` |
| Nowy zasób CRUD end-to-end (encja + API + strony) | skill `add-crud-feature` (`.agents/skills/add-crud-feature/SKILL.md`) |
| Praca po stronie API (endpointy, encje, DTO, EF) | `apps/api/AGENTS.md` |
| Praca po stronie web (strony, komponenty, klient API) | `apps/web/AGENTS.md` |
| Pisanie/aktualizacja specyfikacji | `.ai/specs/AGENTS.md` + skill `spec-writing` |
| Review własnych/cudzych zmian | skill `code-review` |
| Walidacja + commit | skill `check-and-commit` |
| CI/CD, deploy, Environments, rollback | `docs/ci-cd.md` + `docs/deploy.md` |
| Powtarzające się błędy / wnioski | grep w `.ai/lessons.md` + `.ai/lessons-archiwum.md` |

## Konwencje

- **Nazewnictwo C#**: PascalCase dla typów i właściwości; encje w `apps/api/Models.cs`; rekordy wejściowe (input DTO) w `apps/api/Dtos.cs`.
- **JSON API**: camelCase (domyślna serializacja ASP.NET). Typy TS w `apps/web/lib/api.ts` muszą się zgadzać.
- **Endpointy**: grupowane po zasobie w `apps/api/Program.cs`, prefiks `/api/{zasób}`, komentarz-nagłówek sekcji (`// ---------- Nazwa ----------`).
- **Frontend**: strony to komponenty klienckie (`"use client"`), dane pobierane przez `api.*` w `useEffect`; wspólne prymitywy UI w `apps/web/components/ui.tsx` (`PageHeader`, `Card`, `Button`, `Field`, `ErrorBanner`, `EmptyState`, `Badge`, `inputClass`, `formatRest`).
- **Błędy API**: backend zwraca `{ message }` przy konfliktach; wrapper `request<T>()` wyciąga `message` i rzuca `Error` — strony pokazują go przez `ErrorBanner`.
- **Nawigacja**: nowy dział dopisz do tablicy `NAV` w `apps/web/app/layout.tsx`.
- **Git**: `main` jest jedyną długowieczną gałęzią (trunk). Praca na `feat/*` / `fix/*`, PR, zielone CI, auto-merge. Nie zakładamy gałęzi `dev` — środowiska to `dev` / `prod` (patrz `docs/ci-cd.md`).

## Zasady przewodnie

- **Prostota przede wszystkim** — najprostsza możliwa zmiana o minimalnym zasięgu.
- **Bez prowizorek** — szukaj przyczyny źródłowej, nie łataj objawów.
- **Weryfikacja** — po zmianie uruchom bramkę i zapytaj siebie: „czy senior by to zaakceptował?".
