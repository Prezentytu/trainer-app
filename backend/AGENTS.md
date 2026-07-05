# Backend — zasady dla agentów

.NET 10 Minimal API + EF Core + SQLite. Namespace `TrainerApp.Api`. Uruchamiane `dotnet run` w `backend/` (port 5210). Zobacz też root `AGENTS.md`.

## Struktura plików

| Plik | Rola |
|---|---|
| `Program.cs` | Startup (DbContext, CORS, seed) + wszystkie endpointy Minimal API, grupowane po zasobie |
| `Models.cs` | Encje EF (`Client`, `Exercise`, `Plan`, `PlanItem`, `Assignment`) |
| `Dtos.cs` | Rekordy wejściowe (`*Input`) — kontrakt requestów |
| `AppDb.cs` | `DbContext`: `DbSet`-y + relacje/cascade w `OnModelCreating` |
| `Seed.cs` | Dane startowe (idempotentne — nadpisywać ostrożnie) |

## Always

- Grupuj endpointy po zasobie z nagłówkiem sekcji: `// ---------- Nazwa ----------`.
- Waliduj istnienie powiązanych rekordów przed zapisem; brak → `Results.NotFound()`.
- Zwracaj `Results.Created($"/api/{zasób}/{id}", ...)` po POST, `Results.NoContent()` po DELETE.
- Konflikty biznesowe zwracaj jako `Results.Conflict(new { message = "..." })` z polskim komunikatem — frontend go pokaże.
- Po dodaniu/zmianie encji uruchom `dotnet build backend/TrainerApp.Api.csproj`.

## Ask First

- Przed zmianą schematu istniejącej encji lub relacji (patrz uwaga o `EnsureCreated` niżej).
- Przed dodaniem paczki NuGet.
- Przed zmianą polityki CORS (obecnie tylko `http://localhost:3000`).

## Never

- Nigdy nie zakładaj, że EF zmigruje istniejącą bazę — `EnsureCreated()` tworzy schemat tylko, gdy `trainer.db` nie istnieje.
- Nigdy nie zwracaj encji z cyklicznymi nawigacjami wprost bez rzutowania na anonimowy/DTO kształt (ryzyko pętli serializacji) — patrz `PlanToDto`.
- Nigdy nie commituj `trainer.db`, `bin/`, `obj/`.

## Wzorzec endpointu (na bazie modułu referencyjnego `Clients`)

```csharp
// GET listy — rzutuj na anonimowy kształt (camelCase w JSON)
app.MapGet("/api/clients", async (AppDb db) =>
    await db.Clients.OrderBy(c => c.Name).Select(c => new { c.Id, c.Name /* ... */ }).ToListAsync());

// POST — DTO input -> encja -> zapis -> Created
app.MapPost("/api/clients", async (ClientInput input, AppDb db) =>
{
    var client = new Client { Name = input.Name, Email = input.Email, Note = input.Note };
    db.Clients.Add(client);
    await db.SaveChangesAsync();
    return Results.Created($"/api/clients/{client.Id}", client);
});

// PUT/DELETE — FindAsync, null -> NotFound
```

## Jak dodać nową encję (kolejność)

1. `Models.cs` — klasa encji (PK `int Id`, `CreatedAt = DateTime.UtcNow` jeśli trzeba).
2. `AppDb.cs` — `public DbSet<Nazwa> NazwaMnoga => Set<Nazwa>();` + ewentualne relacje w `OnModelCreating`.
3. `Dtos.cs` — rekord `record NazwaInput(...)`.
4. `Program.cs` — sekcja endpointów `GET/POST/PUT/DELETE /api/{zasób}` wg wzorca wyżej.
5. `Seed.cs` — opcjonalne dane startowe.
6. **Usuń `backend/trainer.db`** i zrestartuj backend, aby schemat się przebudował.
7. Dodaj test integracyjny (patrz `backend.Tests/`) na wzór `ClientsEndpointsTests`.

## Uwaga o bazie (`EnsureCreated`)

Zmiana kształtu istniejącej encji **nie** zaktualizuje `trainer.db`. Podczas dev: usuń `backend/trainer.db` i pozwól, by `EnsureCreated()` + `Seed.Run` odtworzyły bazę. Jeśli projekt urośnie, rozważ migracje EF Core (`dotnet ef migrations`) — ale to decyzja „Ask First”.

## Testowanie

Testy integracyjne żyją w `backend.Tests/` (xUnit + `WebApplicationFactory`, SQLite in-memory). `Program.cs` kończy się `public partial class Program { }`, dzięki czemu fabryka może go hostować. Wzoruj nowe testy na `ClientsEndpointsTests`.
