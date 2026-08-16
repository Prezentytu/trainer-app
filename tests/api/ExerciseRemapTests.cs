using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class ExerciseRemapTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ExerciseRemapTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Remap_MovesSetsAndMaxes()
    {
        var (clientId, sourceId, targetId) = await SeedClientWithSessionAndMax();

        var remap = await _client.PostAsJsonAsync(
            $"/api/clients/{clientId}/exercises/{sourceId}/remap",
            new { targetExerciseId = targetId });
        Assert.Equal(HttpStatusCode.OK, remap.StatusCode);
        using var doc = await JsonDocument.ParseAsync(await remap.Content.ReadAsStreamAsync());
        Assert.Equal(1, doc.RootElement.GetProperty("sessions").GetInt32());
        Assert.True(doc.RootElement.GetProperty("sets").GetInt32() >= 1);
        Assert.Equal(1, doc.RootElement.GetProperty("maxes").GetInt32());

        var maxes = await _client.GetFromJsonAsync<List<MaxRow>>($"/api/clients/{clientId}/maxes", JsonOpts);
        Assert.Contains(maxes!, m => m.ExerciseId == targetId);
        Assert.DoesNotContain(maxes!, m => m.ExerciseId == sourceId);

        var usage = await _client.GetFromJsonAsync<UsageRow>(
            $"/api/clients/{clientId}/exercises/{targetId}/usage", JsonOpts);
        Assert.Equal(1, usage!.Sessions);
        Assert.True(usage.Sets >= 1);
    }

    [Fact]
    public async Task Remap_SameExercise_ReturnsConflict()
    {
        var (clientId, sourceId, _) = await SeedClientWithSessionAndMax();
        var remap = await _client.PostAsJsonAsync(
            $"/api/clients/{clientId}/exercises/{sourceId}/remap",
            new { targetExerciseId = sourceId });
        Assert.Equal(HttpStatusCode.Conflict, remap.StatusCode);
        var body = await remap.Content.ReadAsStringAsync();
        Assert.Contains("to samo ćwiczenie", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Remap_ForeignClient_ReturnsNotFound()
    {
        var (_, sourceId, targetId) = await SeedClientWithSessionAndMax();
        int foreignClientId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var other = db.Trainers.FirstOrDefault(t => t.ClerkUserId == "other-trainer")
                ?? db.Trainers.Add(new Trainer
                {
                    ClerkUserId = "other-trainer",
                    Email = "other@example.com",
                    Name = "Inny Trener",
                }).Entity;
            db.SaveChanges();
            var client = db.Clients.Add(new Client { TrainerId = other.Id, Name = "Obcy remap" }).Entity;
            db.SaveChanges();
            foreignClientId = client.Id;
        }

        var remap = await _client.PostAsJsonAsync(
            $"/api/clients/{foreignClientId}/exercises/{sourceId}/remap",
            new { targetExerciseId = targetId });
        Assert.Equal(HttpStatusCode.NotFound, remap.StatusCode);
    }

    [Fact]
    public async Task UpdateMax_ChangesKgAndNote()
    {
        var (clientId, sourceId, _) = await SeedClientWithSessionAndMax();
        var maxes = await _client.GetFromJsonAsync<List<MaxRow>>($"/api/clients/{clientId}/maxes", JsonOpts);
        var max = maxes!.First(m => m.ExerciseId == sourceId);

        var put = await _client.PutAsJsonAsync($"/api/maxes/{max.Id}", new
        {
            maxKg = 92.5,
            measuredOn = "2026-08-01",
            note = "poprawione",
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var after = await _client.GetFromJsonAsync<List<MaxRow>>($"/api/clients/{clientId}/maxes", JsonOpts);
        var updated = after!.First(m => m.Id == max.Id);
        Assert.Equal(92.5, updated.MaxKg);
        Assert.Equal("2026-08-01", updated.MeasuredOn);
        Assert.Equal("poprawione", updated.Note);
    }

    async Task<(int ClientId, int SourceId, int TargetId)> SeedClientWithSessionAndMax()
    {
        var created = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = $"Remap {Guid.NewGuid():N}"[..18],
            email = (string?)null,
            note = (string?)null,
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var client = await created.Content.ReadFromJsonAsync<Created>(JsonOpts);
        var exercises = await _client.GetFromJsonAsync<List<ExRow>>("/api/exercises", JsonOpts);
        var source = exercises!.First(e => e.Name.Contains("ławce", StringComparison.OrdinalIgnoreCase));
        var target = exercises.First(e =>
            e.Id != source.Id && e.Name.Contains("martwy", StringComparison.OrdinalIgnoreCase));

        var session = await _client.PostAsJsonAsync("/api/sessions", new
        {
            clientId = client!.Id,
            performedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            status = "completed",
            exercises = new[]
            {
                new
                {
                    exerciseId = source.Id,
                    order = 1,
                    sets = new[]
                    {
                        new { setNumber = 1, weightKg = 80.0, reps = 5, completed = true, isWarmup = false },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, session.StatusCode);

        var max = await _client.PostAsJsonAsync($"/api/clients/{client.Id}/maxes", new
        {
            exerciseId = source.Id,
            maxKg = 90.0,
            measuredOn = "2026-07-02",
            note = "z historii",
        });
        Assert.Equal(HttpStatusCode.Created, max.StatusCode);

        return (client.Id, source.Id, target.Id);
    }

    private record Created(int Id);
    private record ExRow(int Id, string Name);
    private record MaxRow(int Id, int ExerciseId, double MaxKg, string MeasuredOn, string? Note);
    private record UsageRow(int Sessions, int Sets, string? FirstOn, string? LastOn);
}
