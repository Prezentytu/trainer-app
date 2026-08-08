using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class TrainerNotesTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public TrainerNotesTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private record ClientRow(int Id, string Name);
    private record NoteRow(int Id, int ClientId, string Body, bool Pinned, DateTime? PinnedAt, DateTime CreatedAt);

    private async Task<int> CreateClientAsync(string name)
    {
        var post = await _client.PostAsJsonAsync(
            "/api/clients",
            new { name, email = (string?)null, note = (string?)null });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<ClientRow>(JsonOpts);
        Assert.NotNull(created);
        return created!.Id;
    }

    [Fact]
    public async Task Notes_Crud_Pin_AndEmptyBodyRejected()
    {
        var clientId = await CreateClientAsync("Notes CRUD");

        var empty = await _client.PostAsJsonAsync($"/api/clients/{clientId}/notes", new { body = "   " });
        Assert.Equal(HttpStatusCode.BadRequest, empty.StatusCode);

        var post = await _client.PostAsJsonAsync(
            $"/api/clients/{clientId}/notes",
            new { body = "Kontuzja barku — unikamy wyciskania", pinned = false });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<NoteRow>(JsonOpts);
        Assert.NotNull(created);
        Assert.Equal("Kontuzja barku — unikamy wyciskania", created!.Body);
        Assert.False(created.Pinned);

        var pinnedPost = await _client.PostAsJsonAsync(
            $"/api/clients/{clientId}/notes",
            new { body = "Płatność do 10-tego", pinned = true });
        Assert.Equal(HttpStatusCode.Created, pinnedPost.StatusCode);

        var list = await _client.GetFromJsonAsync<List<NoteRow>>($"/api/clients/{clientId}/notes", JsonOpts);
        Assert.NotNull(list);
        Assert.Equal(2, list!.Count);
        Assert.True(list[0].Pinned);
        Assert.Equal("Płatność do 10-tego", list[0].Body);

        var put = await _client.PutAsJsonAsync(
            $"/api/clients/{clientId}/notes/{created.Id}",
            new { body = "Kontuzja barku — OK lekkie wyciskanie", pinned = true });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var updated = await put.Content.ReadFromJsonAsync<NoteRow>(JsonOpts);
        Assert.True(updated!.Pinned);
        Assert.Equal("Kontuzja barku — OK lekkie wyciskanie", updated.Body);

        var del = await _client.DeleteAsync($"/api/clients/{clientId}/notes/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        var after = await _client.GetFromJsonAsync<List<NoteRow>>($"/api/clients/{clientId}/notes", JsonOpts);
        Assert.Single(after!);
        Assert.DoesNotContain(after!, n => n.Id == created.Id);
    }

    [Fact]
    public async Task Notes_ForeignClient_ReturnsNotFound()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        var other = db.Trainers.FirstOrDefault(t => t.ClerkUserId == "other-trainer-notes");
        if (other is null)
        {
            other = new Trainer
            {
                ClerkUserId = "other-trainer-notes",
                Email = "other-notes@example.com",
                Name = "Inny Trener Notes",
            };
            db.Trainers.Add(other);
            db.SaveChanges();
        }

        var foreign = db.Clients.FirstOrDefault(c => c.TrainerId == other.Id && c.Name == "Obcy Notes");
        if (foreign is null)
        {
            foreign = new Client { TrainerId = other.Id, Name = "Obcy Notes" };
            db.Clients.Add(foreign);
            db.SaveChanges();
        }

        var note = new TrainerNote { ClientId = foreign.Id, Body = "sekret obcego" };
        db.TrainerNotes.Add(note);
        db.SaveChanges();
        var noteId = note.Id;
        var foreignId = foreign.Id;

        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{foreignId}/notes")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{foreignId}/client-notes")).StatusCode);
        Assert.Equal(
            HttpStatusCode.NotFound,
            (await _client.PostAsJsonAsync($"/api/clients/{foreignId}/notes", new { body = "x" })).StatusCode);
        Assert.Equal(
            HttpStatusCode.NotFound,
            (await _client.PutAsJsonAsync($"/api/clients/{foreignId}/notes/{noteId}", new { body = "y" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.DeleteAsync($"/api/clients/{foreignId}/notes/{noteId}")).StatusCode);
    }

    [Fact]
    public async Task TrainerNotes_DoNotLeakToPortal()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients", JsonOpts);
        var jan = clients!.First(c => c.Name == "Jan Kowalski");
        const string secret = "SEKRET-TRENERA-NIGDY-W-PORTALU-9f3a";

        var post = await _client.PostAsJsonAsync(
            $"/api/clients/{jan.Id}/notes",
            new { body = secret });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var portalHome = await _client.GetAsync("/api/portal/demo-jan-kowalski");
        Assert.Equal(HttpStatusCode.OK, portalHome.StatusCode);
        var homeJson = await portalHome.Content.ReadAsStringAsync();
        Assert.DoesNotContain(secret, homeJson, StringComparison.Ordinal);

        var portalSessions = await _client.GetAsync("/api/portal/demo-jan-kowalski/sessions");
        Assert.Equal(HttpStatusCode.OK, portalSessions.StatusCode);
        var sessionsJson = await portalSessions.Content.ReadAsStringAsync();
        Assert.DoesNotContain(secret, sessionsJson, StringComparison.Ordinal);

        var portalProfile = await _client.GetAsync("/api/portal/demo-jan-kowalski/records");
        Assert.Equal(HttpStatusCode.OK, portalProfile.StatusCode);
        var recordsJson = await portalProfile.Content.ReadAsStringAsync();
        Assert.DoesNotContain(secret, recordsJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ClientNotes_AggregatesSessionExerciseAndSetNotes()
    {
        var clientId = await CreateClientAsync("Client Notes Agg");
        var exercises = await _client.GetFromJsonAsync<List<ExerciseRow>>("/api/exercises", JsonOpts);
        var squat = exercises!.First(e => e.Name.Contains("Przysiad", StringComparison.OrdinalIgnoreCase));

        var create = await _client.PostAsJsonAsync("/api/sessions", new
        {
            clientId,
            performedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            status = "completed",
            note = "Biodra ciasne przy przysiadzie.",
            exercises = new object[]
            {
                new
                {
                    exerciseId = squat.Id,
                    order = 0,
                    note = "bolało kolano",
                    sets = new object[]
                    {
                        new
                        {
                            setNumber = 1,
                            weightKg = 60.0,
                            reps = 8,
                            rpe = (double?)null,
                            isWarmup = false,
                            completed = true,
                            note = (string?)null,
                        },
                        new
                        {
                            setNumber = 3,
                            weightKg = 80.0,
                            reps = 8,
                            rpe = (double?)9.0,
                            isWarmup = false,
                            completed = true,
                            note = (string?)"ostatnie powt. na siłę",
                        },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var sessionJson = await create.Content.ReadAsStringAsync();
        using var sessionDoc = JsonDocument.Parse(sessionJson);
        var sessionId = sessionDoc.RootElement.GetProperty("id").GetInt32();

        // Sesja bez notatek — nie powinna się pojawić
        var silent = await _client.PostAsJsonAsync("/api/sessions", new
        {
            clientId,
            performedOn = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)).ToString("yyyy-MM-dd"),
            status = "completed",
            note = (string?)null,
            exercises = new object[]
            {
                new
                {
                    exerciseId = squat.Id,
                    order = 0,
                    note = (string?)null,
                    sets = new object[]
                    {
                        new
                        {
                            setNumber = 1,
                            weightKg = 40.0,
                            reps = 10,
                            isWarmup = false,
                            completed = true,
                            note = (string?)null,
                        },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, silent.StatusCode);

        var res = await _client.GetAsync($"/api/clients/{clientId}/client-notes");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(1, doc.RootElement.GetArrayLength());

        var group = doc.RootElement[0];
        Assert.Equal(sessionId, group.GetProperty("sessionId").GetInt32());
        Assert.Equal("Biodra ciasne przy przysiadzie.", group.GetProperty("sessionNote").GetString());

        var items = group.GetProperty("items");
        Assert.Equal(2, items.GetArrayLength());

        var exNote = items.EnumerateArray().First(i => i.GetProperty("setNumber").ValueKind == JsonValueKind.Null);
        Assert.Equal("bolało kolano", exNote.GetProperty("note").GetString());
        Assert.Equal(squat.Id, exNote.GetProperty("exerciseId").GetInt32());

        var setNote = items.EnumerateArray().First(i =>
            i.GetProperty("setNumber").ValueKind == JsonValueKind.Number
            && i.GetProperty("setNumber").GetInt32() == 3);
        Assert.Equal("ostatnie powt. na siłę", setNote.GetProperty("note").GetString());
        Assert.Equal(80.0, setNote.GetProperty("weightKg").GetDouble());
        Assert.Equal(8, setNote.GetProperty("reps").GetInt32());
        Assert.Equal(9.0, setNote.GetProperty("rpe").GetDouble());
    }

    private record ExerciseRow(int Id, string Name);
}
