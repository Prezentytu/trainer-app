using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class AnalyticsAndPushTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;

    public AnalyticsAndPushTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task MuscleVolume_AggregatesWorkingSetsByPrimaryMuscle()
    {
        var (clientId, exerciseId) = await SeedLoggedSetsAsync(
            muscles: ["Klatka piersiowa", "Triceps"],
            sessions: 2,
            setsPerSession: 3,
            weight: 60,
            reps: 8);

        var res = await _client.GetAsync($"/api/clients/{clientId}/muscle-volume?weeks=4");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var groups = doc.RootElement.GetProperty("groups");
        Assert.True(groups.GetArrayLength() >= 2);

        var chest = groups.EnumerateArray().First(g => g.GetProperty("muscle").GetString() == "Klatka piersiowa");
        Assert.Equal(6, chest.GetProperty("sets").GetInt32());
        Assert.True(chest.GetProperty("volumeKg").GetDouble() > 0);

        // Portal mirror
        var token = await PortalTokenAsync(clientId);
        var portal = await _client.GetAsync($"/api/portal/{token}/muscle-volume?weeks=4");
        Assert.Equal(HttpStatusCode.OK, portal.StatusCode);
    }

    [Fact]
    public async Task PlanMuscleVolume_CountsPrescribedSets()
    {
        var plans = await _client.GetFromJsonAsync<List<PlanRow>>("/api/plans");
        var plan = plans!.First(p => !p.IsTemplate);
        var res = await _client.GetAsync($"/api/plans/{plan.Id}/muscle-volume");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("groups", out var groups));
        Assert.True(groups.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Trends_ReturnsWeeklyBuckets()
    {
        var (clientId, _) = await SeedLoggedSetsAsync(
            muscles: ["Plecy"],
            sessions: 3,
            setsPerSession: 2,
            weight: 50,
            reps: 10,
            daysApart: 7);

        var res = await _client.GetAsync($"/api/clients/{clientId}/trends?weeks=8");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var weeks = doc.RootElement.GetProperty("weeks");
        Assert.Equal(8, weeks.GetArrayLength());
        var totalSessions = weeks.EnumerateArray().Sum(w => w.GetProperty("sessions").GetInt32());
        Assert.True(totalSessions >= 3);

        var token = await PortalTokenAsync(clientId);
        var portal = await _client.GetAsync($"/api/portal/{token}/trends?weeks=8");
        Assert.Equal(HttpStatusCode.OK, portal.StatusCode);
    }

    [Fact]
    public async Task MostImproved_ReturnsTopPercentGain()
    {
        var (clientId, _) = await SeedLoggedSetsAsync(
            muscles: ["Klatka"],
            sessions: 4,
            setsPerSession: 2,
            weight: 60,
            reps: 8,
            daysApart: 7,
            flatWeight: false);

        var res = await _client.GetAsync($"/api/clients/{clientId}/most-improved?days=90");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetProperty("percentGain").GetDouble() > 0);
        Assert.True(doc.RootElement.GetProperty("sessionCount").GetInt32() >= 2);

        var token = await PortalTokenAsync(clientId);
        var portal = await _client.GetAsync($"/api/portal/{token}/most-improved?days=90");
        Assert.Equal(HttpStatusCode.OK, portal.StatusCode);
    }

    [Fact]
    public async Task MostImproved_WhenNoData_ReturnsJsonNull()
    {
        // Results.Ok(null) dawało puste body → błąd parse JSON w portalu.
        var (clientId, _) = await SeedLoggedSetsAsync(
            muscles: ["Plecy"],
            sessions: 1,
            setsPerSession: 1,
            weight: 40,
            reps: 8,
            daysApart: 1,
            flatWeight: true);

        var res = await _client.GetAsync($"/api/clients/{clientId}/most-improved?days=90");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Null, doc.RootElement.ValueKind);

        var token = await PortalTokenAsync(clientId);
        var portal = await _client.GetAsync($"/api/portal/{token}/most-improved?days=90");
        Assert.Equal(HttpStatusCode.OK, portal.StatusCode);
        var portalJson = await portal.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(portalJson));
        using var portalDoc = JsonDocument.Parse(portalJson);
        Assert.Equal(JsonValueKind.Null, portalDoc.RootElement.ValueKind);
    }

    [Fact]
    public async Task Stagnation_DetectsNoE1rmProgress()
    {
        var (clientId, _) = await SeedLoggedSetsAsync(
            muscles: ["Barki"],
            sessions: 4,
            setsPerSession: 2,
            weight: 40,
            reps: 8,
            daysApart: 3,
            flatWeight: true);

        var res = await _client.GetAsync($"/api/clients/{clientId}/stagnation");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var items = doc.RootElement.GetProperty("items");
        Assert.True(items.GetArrayLength() >= 1);
        Assert.Equal("no_e1rm_progress", items[0].GetProperty("reason").GetString());
    }

    [Fact]
    public async Task CronReminders_RequiresConfiguredKey()
    {
        // Bez Cron:Key w appsettings testowym — 503 niezależnie od nagłówka.
        var bare = await _client.PostAsync("/api/cron/reminders", null);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, bare.StatusCode);

        var req = new HttpRequestMessage(HttpMethod.Post, "/api/cron/reminders");
        req.Headers.Add("X-Cron-Key", "any-key");
        var withHeader = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, withHeader.StatusCode);
    }

    async Task<(int ClientId, int ExerciseId)> SeedLoggedSetsAsync(
        string[] muscles,
        int sessions,
        int setsPerSession,
        double weight,
        int reps,
        int daysApart = 2,
        bool flatWeight = false)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var trainer = db.Trainers.First();
        var client = new Client
        {
            TrainerId = trainer.Id,
            Name = $"Analityka {Guid.NewGuid():N}"[..20],
            Email = $"a-{Guid.NewGuid():N}@test.local",
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();

        var exercise = new Exercise
        {
            TrainerId = trainer.Id,
            Name = $"Ćw {Guid.NewGuid():N}"[..12],
            Type = "reps",
            PrimaryMuscles = muscles.ToList(),
            Category = "chest",
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        for (var s = 0; s < sessions; s++)
        {
            var w = flatWeight ? weight : weight + s * 2.5;
            var session = new WorkoutSession
            {
                ClientId = client.Id,
                PerformedOn = today.AddDays(-daysApart * (sessions - 1 - s)),
                Status = "completed",
                Exercises =
                [
                    new LoggedExercise
                    {
                        ExerciseId = exercise.Id,
                        Order = 1,
                        Sets = Enumerable.Range(1, setsPerSession).Select(n => new LoggedSet
                        {
                            SetNumber = n,
                            WeightKg = w,
                            Reps = reps,
                            IsWarmup = false,
                            Completed = true,
                        }).ToList(),
                    },
                ],
            };
            db.WorkoutSessions.Add(session);
        }

        db.ClientAccessTokens.Add(new ClientAccessToken
        {
            ClientId = client.Id,
            Token = $"tok-{client.Id}-{Guid.NewGuid():N}"[..32],
        });
        await db.SaveChangesAsync();
        return (client.Id, exercise.Id);
    }

    async Task<string> PortalTokenAsync(int clientId)
    {
        var res = await _client.GetAsync($"/api/clients/{clientId}/access-token");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("token").GetString()!;
    }

    private record PlanRow(int Id, string Name, bool IsTemplate);
}
