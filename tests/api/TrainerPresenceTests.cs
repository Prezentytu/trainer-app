using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class TrainerPresenceTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public TrainerPresenceTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task ClientsList_ShowsLiveSession()
    {
        var (clientId, sessionId, _) = await StartFreshSession(55, 4);

        var list = await _client.GetFromJsonAsync<List<JsonElement>>("/api/clients", JsonOpts);
        var row = list!.Single(c => c.GetProperty("id").GetInt32() == clientId);
        Assert.Equal(JsonValueKind.Object, row.GetProperty("liveSession").ValueKind);
        Assert.Equal(sessionId, row.GetProperty("liveSession").GetProperty("sessionId").GetInt32());

        var dash = await _client.GetFromJsonAsync<JsonElement>("/api/dashboard", JsonOpts);
        var live = dash.GetProperty("liveSessions").EnumerateArray()
            .Single(x => x.GetProperty("clientId").GetInt32() == clientId);
        Assert.Equal(sessionId, live.GetProperty("sessionId").GetInt32());
    }

    [Fact]
    public async Task ClientsList_ShowsNeedsReview_WhenBelowTarget()
    {
        var (clientId, sessionId, startDoc) = await StartFreshSession(55, 4);
        await LogAndComplete(clientId, sessionId, startDoc, weightKg: 15, reps: 4);

        var list = await _client.GetFromJsonAsync<List<JsonElement>>("/api/clients", JsonOpts);
        var row = list!.Single(c => c.GetProperty("id").GetInt32() == clientId);
        Assert.Equal(JsonValueKind.Null, row.GetProperty("liveSession").ValueKind);
        Assert.Equal(JsonValueKind.Object, row.GetProperty("needsReview").ValueKind);
        Assert.Equal(sessionId, row.GetProperty("needsReview").GetProperty("sessionId").GetInt32());
        Assert.True(row.GetProperty("needsReview").GetProperty("belowTargetCount").GetInt32() >= 1);
    }

    async Task<(int ClientId, int SessionId, JsonElement StartDoc)> StartFreshSession(double loadKg, int reps)
    {
        var exercises = await _client.GetFromJsonAsync<List<JsonElement>>("/api/exercises", JsonOpts);
        var exerciseId = exercises![0].GetProperty("id").GetInt32();

        var planRes = await _client.PostAsJsonAsync("/api/plans", new
        {
            name = $"Presence {Guid.NewGuid():N}",
            description = (string?)null,
            isTemplate = false,
            days = new[]
            {
                new
                {
                    weekNumber = 1,
                    order = 1,
                    label = "Dzień 1",
                    notes = (string?)null,
                    items = new[]
                    {
                        new
                        {
                            exerciseId,
                            order = 1,
                            prescribedSets = new[]
                            {
                                new { order = 1, reps, loadKg },
                            },
                        },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, planRes.StatusCode);
        var planId = (await planRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("id").GetInt32();
        var planDoc = await (await _client.GetAsync($"/api/plans/{planId}")).Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        var dayId = planDoc.GetProperty("days")[0].GetProperty("id").GetInt32();

        var clientRes = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = $"Live {Guid.NewGuid():N}",
            email = (string?)null,
            note = (string?)null,
        });
        var clientId = (await clientRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("id").GetInt32();

        var assignRes = await _client.PostAsJsonAsync("/api/assignments", new
        {
            planId,
            clientId,
            startDate = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            note = (string?)null,
        });
        var assignmentId = (await assignRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("id").GetInt32();

        var start = await _client.PostAsJsonAsync("/api/sessions/start", new
        {
            clientId,
            assignmentId,
            planId,
            planDayId = dayId,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        var startDoc = await start.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        return (clientId, startDoc.GetProperty("id").GetInt32(), startDoc);
    }

    async Task LogAndComplete(int clientId, int sessionId, JsonElement startDoc, double weightKg, int reps)
    {
        var exercises = startDoc.GetProperty("exercises").EnumerateArray().Select(e => new
        {
            id = e.GetProperty("id").GetInt32(),
            exerciseId = e.GetProperty("exerciseId").GetInt32(),
            order = e.GetProperty("order").GetInt32(),
            note = (string?)null,
            sets = e.GetProperty("sets").EnumerateArray().Select(s => new
            {
                id = s.GetProperty("id").GetInt32(),
                setNumber = s.GetProperty("setNumber").GetInt32(),
                weightKg,
                reps,
                durationSeconds = (int?)null,
                distanceMeters = (int?)null,
                rir = (double?)null,
                rpe = (double?)null,
                isWarmup = false,
                completed = true,
            }).ToList(),
        }).ToList();

        var put = await _client.PutAsJsonAsync($"/api/sessions/{sessionId}", new
        {
            clientId,
            performedOn = startDoc.GetProperty("performedOn").GetString(),
            assignmentId = startDoc.GetProperty("assignmentId").ValueKind == JsonValueKind.Null
                ? (int?)null
                : startDoc.GetProperty("assignmentId").GetInt32(),
            planId = startDoc.GetProperty("planId").ValueKind == JsonValueKind.Null
                ? (int?)null
                : startDoc.GetProperty("planId").GetInt32(),
            planDayId = startDoc.GetProperty("planDayId").ValueKind == JsonValueKind.Null
                ? (int?)null
                : startDoc.GetProperty("planDayId").GetInt32(),
            status = "in_progress",
            exercises,
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var complete = await _client.PatchAsync($"/api/sessions/{sessionId}/complete", null);
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);
    }
}
