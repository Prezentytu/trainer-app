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
