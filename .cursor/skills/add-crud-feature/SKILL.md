---
name: add-crud-feature
description: Scaffold a new CRUD resource end-to-end in Trainer App (backend .NET entity + API + frontend Next.js pages), mirroring the reference Clients module. Use when adding a new resource/section such as "add measurements", "nowy zasób", "dodaj dział", "new entity with pages", "CRUD for X".
---

# Add CRUD feature (end-to-end)

Dodaje nowy zasób w Trainer App według sprawdzonego wzorca modułu referencyjnego **`Clients`**. Kopiuj wzorzec zamiast wymyślać architekturę. Zawsze najpierw przeczytaj root `AGENTS.md`, `apps/api/AGENTS.md`, `apps/web/AGENTS.md`.

## Kiedy najpierw spec

Jeśli zasób jest nietrywialny (relacje, wiele endpointów, nieoczywisty model) — najpierw napisz spec przez skill `spec-writing`. Dla prostego CRUD (jak Clients) możesz działać od razu.

## Kroki (kolejność ma znaczenie)

### Backend (`apps/api/`)
1. `Models.cs` — dodaj encję: `public int Id { get; set; }`, pola, ewentualnie `CreatedAt = DateTime.UtcNow`.
2. `AppDb.cs` — `public DbSet<Nazwa> NazwaMnoga => Set<Nazwa>();` + relacje w `OnModelCreating` (cascade jak przy `Assignment`), jeśli są FK.
3. `Dtos.cs` — `public record NazwaInput(...);` (pola wejściowe requestu).
4. `Program.cs` — nowa sekcja `// ---------- Nazwa ----------` z endpointami wg wzorca `Clients`:
   - `GET /api/{zasób}` — `.Select(x => new { ... })` (camelCase w JSON),
   - `GET /api/{zasób}/{id:int}` — `null → Results.NotFound()`,
   - `POST` — input → encja → `SaveChangesAsync` → `Results.Created(...)`,
   - `PUT /{id:int}` — `FindAsync`, null → NotFound, aktualizuj pola,
   - `DELETE /{id:int}` — `Results.NoContent()`. Konflikty → `Results.Conflict(new { message })`.
5. `Seed.cs` — opcjonalne dane startowe (idempotentnie).
6. Usuń `apps/api/trainer.db` i zrestartuj backend, by schemat się przebudował.

### Frontend (`apps/web/`)
7. `lib/api.ts` — dodaj typy TS **lustrzane** do encji/DTO (camelCase) oraz `api.{zasób}` z metodami (`list`, `get`, `create`, `update`, `remove`).
8. `app/{zasób}/page.tsx` — strona listy: `"use client"`, `useCallback`+`load()`+`useEffect`, `PageHeader`, `ErrorBanner`, `EmptyState`, `Card`, `Button`, formularz z `Field`+`inputClass`.
9. `app/{zasób}/[id]/page.tsx` — szczegóły (jeśli potrzebne).
10. `app/layout.tsx` — dopisz pozycję do tablicy `NAV`.

### Test i walidacja
11. `tests/api/` — dodaj test integracyjny na wzór `ClientsEndpointsTests` (CRUD happy path + 404).
12. Uruchom bramkę: `./scripts/check.sh` (lub kroki z root `AGENTS.md` → Validation Commands).

## Definicja ukończenia

- Backend kompiluje się i testy przechodzą.
- Frontend: `lint`, `typecheck`, `build` zielone.
- Nowy dział widoczny w nawigacji, lista/formularz działają przez `api.*`.
- Teksty UI po polsku, brak surowego `fetch` w stronach.
