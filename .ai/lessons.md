# Lekcje

Powtarzające się wzorce i błędy, których należy unikać. Przejrzyj na starcie sesji.

Po każdej korekcie od użytkownika dopisz tu wpis w formacie:

```
## {Krótki tytuł zasady}

**Kontekst**: {co się działo}
**Problem**: {co poszło nie tak}
**Zasada**: {reguła zapobiegająca powtórce}
**Dotyczy**: {pliki/obszary}
```

---

## Notatka dnia nie może konkurować z composerem

**Kontekst**: W widoku Lista puste pole „Notatka / rozgrzewka dnia” było pełnym `inputClass` tuż nad composerem.
**Problem**: W F-pattern wyglądało jak główne miejsce na treść — trenerzy wpisywali nazwę ćwiczenia w notatkę zamiast w composer.
**Zasada**: Notatka dnia jest drugorzędna. Pusta = cichy link „+ Notatka…”, nie pełne pole. Otwarte pole ma label + dashed/muted border (nie hero `inputClass`). Wzorzec jak w `DayColumn` (progressive disclosure).
**Dotyczy**: `ListView.tsx`, `TableDay.tsx`, `DayColumn.tsx`.

## Podpowiedzi composera domyślnie zwinięte

**Kontekst**: Widok Lista kreatora pokazywał zawsze 6 chipów skrótów + 3-liniową legendę tempo/RIR/rampa pod polem wpisywania.
**Problem**: Ściana tekstu utrudniała fokus na dodawaniu ćwiczeń; power-userzy i tak znają skróty, a nowi potrzebują ściągawki na żądanie.
**Zasada**: Hinty i legenda w composerze żyją w `ComposerHelp` (trigger `?`, localStorage `trainer-app:composer-help:v1`). Pod polem zostaje jedna kontekstowa linia (`↵ dodaj jako N`). Nie wracaj do zawsze widocznego bloku legendy.
**Dotyczy**: `apps/web/components/plan-builder/ListComposer.tsx`, `ComposerHelp.tsx`, `QuickComposer.tsx`.

## Dev web na Webpacku, nie Turbopacku, dopóki Next < 16.3

**Kontekst**: Next 16.2 na Apple Silicon (arm64) używa Turbopacka jako domyślnego bundlera `next dev`. Binarka `@next/swc-darwin-arm64` alokuje pamięć `IOAccelerator`/`MAP_JIT` (Cranelift JIT), która rośnie monotonicznie i nie jest zwalniana — `ps` zaniża footprint, a systemowy kompresor + swap zamrażają cały macOS. Dodatkowo antywirus skanujący `.next` (często >1 GB) podbija CPU.
**Problem**: Długa sesja `npm run dev` (Turbopack) + Kaspersky bez wykluczeń → zamrożenie komputera „po pewnym czasie”, bez czytelnego błędu w terminalu.
**Zasada**:
1. `apps/web`: `npm run dev` = `next dev --webpack` z `NODE_OPTIONS=--max-old-space-size=4096` (twardy sufit V8 — pada proces, nie system). `next build` zostaje na Turbopacku.
2. Orkiestracja: `./scripts/dev.sh` (trap `kill 0`, `MSBUILDDISABLENODEREUSE=1`), diagnostyka `./scripts/dev-doctor.sh`, czyszczenie `./scripts/clean.sh`.
3. Wykluczenia AV dla `node_modules`, `.next`, `bin`/`obj`, cache NuGet/npm — opis w `README.md`.
4. **Warunek cofnięcia**: gdy Next **16.3+** wyjdzie jako stabilny `latest` (z `turbopackMemoryEviction`), wrócić `dev` na `next dev` (Turbopack), usunąć skrypt `dev:turbo` i zaktualizować ten wpis. Do tego czasu nie „naprawiać” limitu przez Turbopack — `--max-old-space-size` i `turbopackMemoryLimit` w 16.2 **nie limitują** IOAccelerator.
**Źródła**: [vercel/next.js#91585](https://github.com/vercel/next.js/issues/91585), [vercel/next.js#92055](https://github.com/vercel/next.js/issues/92055), [Next 16.3 Turbopack](https://nextjs.org/blog/next-16-3-turbopack).
**Dotyczy**: `apps/web/package.json`, `apps/web/next.config.ts`, `scripts/dev.sh`, `scripts/dev-doctor.sh`, `scripts/clean.sh`, `README.md`.

## Trzymaj typy `apps/web/lib/api.ts` zsynchronizowane z backendem

**Kontekst**: Backend serializuje JSON w camelCase; frontend czyta te pola przez typy w `apps/web/lib/api.ts`.
**Problem**: Rozjazd nazw/kształtu między encją C# a typem TS powoduje ciche `undefined` w UI.
**Zasada**: Każda zmiana encji/DTO w `apps/api/` musi mieć lustrzaną aktualizację typu i metody w `apps/web/lib/api.ts` w tej samej zmianie.
**Dotyczy**: `apps/api/Models.cs`, `apps/api/Dtos.cs`, `apps/web/lib/api.ts`.

## `EnsureCreated()` nie migruje istniejącej bazy

**Kontekst**: Schemat tworzy `db.Database.EnsureCreated()` w `apps/api/Program.cs`.
**Problem**: Zmiana pól/relacji istniejącej encji nie zaktualizuje `trainer.db` — nowe kolumny nie powstaną, aplikacja rzuci błędem SQLite.
**Zasada**: Po zmianie schematu usuń `apps/api/trainer.db` i pozwól odtworzyć bazę (dev). Utratę danych zgłoś użytkownikowi z góry.
**Dotyczy**: `apps/api/Models.cs`, `apps/api/AppDb.cs`, `apps/api/Program.cs`.

## Każdy endpoint trenera musi przejść przez `TrainerAccess`

**Kontekst**: Clients/Plans/Dashboard były scoped po `TrainerId`, ale sessions, maxes, assignments, exercises GET/PUT/DELETE i access-token były otwarte po samym ID.
**Problem**: W produkcji z Clerkiem to IDOR — trener A mógł czytać/edytować zasoby trenera B.
**Zasada**: Nowy endpoint pod `/api/*` (poza portalem tokenowym) zawsze: `TrainerIdAsync` + filtr własności (`OwnsClientAsync` / `TrainerId ==`). Wspólna biblioteka ćwiczeń (`TrainerId == null`) jest tylko do odczytu. Isolację pokrywaj testem w `TenantIsolationTests`.
**Dotyczy**: `apps/api/Program.cs`, `apps/api/TrainerAccess.cs`, `tests/api/TenantIsolationTests.cs`.

## Npgsql nie parsuje URI PostgreSQL — normalizuj przez `DbConnectionString`

**Kontekst**: Neon podaje connection string jako URI (`postgresql://user:pass@host/db?sslmode=require`). Trafiał on wprost do `UseNpgsql` i do `efbundle --connection` w `deploy-api.yml`.
**Problem**: Npgsql przyjmuje **wyłącznie** format ADO.NET `klucz=wartość` — URI rozbija na pierwszym `=` (tym z `sslmode=require`), całą resztę traktuje jako nazwę parametru i pada na `Couldn't set …/neondb?sslmode`. Wcześniejsza diagnoza w `docs/deploy.md` i guard w workflow twierdziły odwrotnie (że URI jest wymagany), co utrwaliło błąd. Wsparcia URI nie będzie: [npgsql#6576](https://github.com/npgsql/npgsql/pull/6576) zamknięty przez maintainera w 2026-05.
**Zasada**: Każdy connection string do Postgresa przechodzi przez `DbConnectionString.Normalize` (`apps/api/DbConnectionString.cs`) — jedno źródło prawdy dla runtime'u (`Program.cs`) i bundle'a migracji (`DesignTimeDbContextFactory`, czyta `DB_CONNECTION_STRING`). Nie duplikuj parsowania w bashu i nie dodawaj `--connection` do `efbundle`, bo omija normalizację.
**Dotyczy**: `apps/api/DbConnectionString.cs`, `apps/api/Program.cs`, `apps/api/DesignTimeDbContextFactory.cs`, `.github/workflows/deploy-api.yml`, `docs/deploy.md`.
