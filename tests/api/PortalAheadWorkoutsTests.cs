using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

/// <summary>
/// Treningi do przodu / poza kolejką, podgląd dnia, powtórki w portalu.
/// </summary>
public class PortalAheadWorkoutsTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;

    public PortalAheadWorkoutsTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PortalDay_ReturnsItems_ForOwnedDay()
    {
        var ctx = await SeedClientWithPlanAsync("Day Preview", dayCount: 2);
        var day2Id = await SecondDayIdAsync(ctx.PlanId);

        var res = await _client.GetAsync($"/api/portal/{ctx.Token}/days/{day2Id}");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        Assert.Equal(day2Id, root.GetProperty("day").GetProperty("id").GetInt32());
        Assert.True(root.GetProperty("day").GetProperty("items").GetArrayLength() > 0);
        Assert.False(root.GetProperty("isDue").GetBoolean());
        Assert.Equal(ctx.AssignmentId, root.GetProperty("assignmentId").GetInt32());
    }

    [Fact]
    public async Task PortalDay_Returns404_ForForeignDay()
    {
        var a = await SeedClientWithPlanAsync("Owner A");
        var b = await SeedClientWithPlanAsync("Owner B");

        var res = await _client.GetAsync($"/api/portal/{a.Token}/days/{b.DayId}");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task StartAhead_SetsOutOfOrder_DueDayDoesNot()
    {
        var ctx = await SeedClientWithPlanAsync("Ahead Flag", dayCount: 2);
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var day2Id = await SecondDayIdAsync(ctx.PlanId);

        var dueStart = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = ctx.DayId,
            performedOn = today,
        });
        Assert.Equal(HttpStatusCode.Created, dueStart.StatusCode);
        using var dueDoc = JsonDocument.Parse(await dueStart.Content.ReadAsStringAsync());
        Assert.False(dueDoc.RootElement.GetProperty("outOfOrder").GetBoolean());

        // Ukończ należny dzień, żeby móc wystartować kolejny bez konfliktu fresh session.
        var dueId = dueDoc.RootElement.GetProperty("id").GetInt32();
        await CompleteSessionAsync(ctx.Token, dueId);

        var aheadStart = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = day2Id,
            performedOn = today,
        });
        // day2 jest teraz due (day1 ukończony) — outOfOrder = false
        Assert.Equal(HttpStatusCode.Created, aheadStart.StatusCode);
        using var aheadDoc = JsonDocument.Parse(await aheadStart.Content.ReadAsStringAsync());
        Assert.False(aheadDoc.RootElement.GetProperty("outOfOrder").GetBoolean());
        await CompleteSessionAsync(ctx.Token, aheadDoc.RootElement.GetProperty("id").GetInt32());

        // Nowy cykl: due = day1. Start day2 → OutOfOrder.
        var oooStart = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = day2Id,
            performedOn = today,
        });
        Assert.Equal(HttpStatusCode.Created, oooStart.StatusCode);
        using var oooDoc = JsonDocument.Parse(await oooStart.Content.ReadAsStringAsync());
        Assert.True(oooDoc.RootElement.GetProperty("outOfOrder").GetBoolean());
        Assert.Equal(day2Id, oooDoc.RootElement.GetProperty("planDayId").GetInt32());
    }

    [Fact]
    public async Task StartAhead_KeepsSkippedDayAsNextDue()
    {
        var ctx = await SeedClientWithPlanAsync("Queue Intact", dayCount: 3);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayIso = today.ToString("yyyy-MM-dd");
        var days = await DayIdsAsync(ctx.PlanId);
        Assert.Equal(3, days.Count);

        // Zrób dzień 2 (index 1) poza kolejką — dzień 0 zostaje należny.
        var start = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = days[1],
            performedOn = todayIso,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        using var startDoc = JsonDocument.Parse(await start.Content.ReadAsStringAsync());
        Assert.True(startDoc.RootElement.GetProperty("outOfOrder").GetBoolean());
        await CompleteSessionAsync(ctx.Token, startDoc.RootElement.GetProperty("id").GetInt32());

        var home = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(days[0], home.GetProperty("today").GetProperty("day").GetProperty("id").GetInt32());

        var week = home.GetProperty("week");
        Assert.Equal(JsonValueKind.Array, week.ValueKind);
        foreach (var d in week.EnumerateArray())
        {
            if (d.GetProperty("id").GetInt32() == days[1])
            {
                Assert.True(d.GetProperty("completed").GetBoolean());
                Assert.True(d.TryGetProperty("lastCompletedSessionId", out var sid));
                Assert.Equal(JsonValueKind.Number, sid.ValueKind);
            }
            if (d.GetProperty("id").GetInt32() == days[0])
            {
                Assert.True(d.GetProperty("isToday").GetBoolean());
                Assert.False(d.GetProperty("completed").GetBoolean());
            }
        }
    }

    [Fact]
    public async Task Repeat_CreatesSeparateSession_WithoutPlanDay_AndDoesNotAdvanceQueue()
    {
        var ctx = await SeedClientWithPlanAsync("Repeat Queue", dayCount: 2);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayIso = today.ToString("yyyy-MM-dd");

        var start = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = ctx.DayId,
            performedOn = todayIso,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        using var startDoc = JsonDocument.Parse(await start.Content.ReadAsStringAsync());
        var sourceId = startDoc.RootElement.GetProperty("id").GetInt32();
        await CompleteSessionAsync(ctx.Token, sourceId);

        var homeAfter = await GetHomeAsync(ctx.Token, today);
        var nextDue = homeAfter.GetProperty("today").GetProperty("day").GetProperty("id").GetInt32();
        Assert.NotEqual(ctx.DayId, nextDue);

        var repeat = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = ctx.DayId, // celowo — backend ma zignorować przy repeat
            repeatSessionId = sourceId,
            performedOn = todayIso,
        });
        Assert.Equal(HttpStatusCode.Created, repeat.StatusCode);
        using var repeatDoc = JsonDocument.Parse(await repeat.Content.ReadAsStringAsync());
        var repeatEl = repeatDoc.RootElement;
        Assert.NotEqual(sourceId, repeatEl.GetProperty("id").GetInt32());
        Assert.Equal(JsonValueKind.Null, repeatEl.GetProperty("planDayId").ValueKind);
        Assert.False(repeatEl.GetProperty("outOfOrder").GetBoolean());

        await CompleteSessionAsync(ctx.Token, repeatEl.GetProperty("id").GetInt32());

        var homeFinal = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(nextDue, homeFinal.GetProperty("today").GetProperty("day").GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task OutOfOrder_VisibleOnTrainerClientSessions()
    {
        var ctx = await SeedClientWithPlanAsync("Trainer Sees OOO", dayCount: 2);
        var todayIso = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var day2Id = await SecondDayIdAsync(ctx.PlanId);

        var start = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = day2Id,
            performedOn = todayIso,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        using var startDoc = JsonDocument.Parse(await start.Content.ReadAsStringAsync());
        Assert.True(startDoc.RootElement.GetProperty("outOfOrder").GetBoolean());
        var sessionId = startDoc.RootElement.GetProperty("id").GetInt32();
        await CompleteSessionAsync(ctx.Token, sessionId);

        var list = await _client.GetAsync($"/api/clients/{ctx.ClientId}/sessions");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        using var listDoc = JsonDocument.Parse(await list.Content.ReadAsStringAsync());
        var row = listDoc.RootElement.EnumerateArray().First(s => s.GetProperty("id").GetInt32() == sessionId);
        Assert.True(row.GetProperty("outOfOrder").GetBoolean());
    }

    // ---------- helpers ----------

    async Task CompleteSessionAsync(string token, int sessionId)
    {
        var res = await _client.PatchAsync($"/api/portal/{token}/sessions/{sessionId}/complete", null);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    async Task<JsonElement> GetHomeAsync(string token, DateOnly today)
    {
        var res = await _client.GetAsync($"/api/portal/{token}?today={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        return JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.Clone();
    }

    async Task<int> SecondDayIdAsync(int planId)
    {
        var days = await DayIdsAsync(planId);
        Assert.True(days.Count >= 2);
        return days[1];
    }

    async Task<List<int>> DayIdsAsync(int planId)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        return await db.PlanDays
            .Where(d => d.PlanId == planId)
            .OrderBy(d => d.WeekNumber)
            .ThenBy(d => d.Order)
            .Select(d => d.Id)
            .ToListAsync();
    }

    async Task<ClientPlanCtx> SeedClientWithPlanAsync(string name, int dayCount = 1)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        _ = await _client.GetAsync("/api/clients");

        var trainer = await db.Trainers.FirstAsync();
        var exercise = new Exercise
        {
            TrainerId = trainer.Id,
            Name = $"Ćw {Guid.NewGuid():N}"[..12],
            Type = "reps",
            Category = "legs",
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        var client = new Client
        {
            TrainerId = trainer.Id,
            Name = name,
            Email = $"{Guid.NewGuid():N}@test.local",
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();

        var plan = new Plan
        {
            TrainerId = trainer.Id,
            Name = $"Plan {name}",
            IsTemplate = false,
        };
        db.Plans.Add(plan);
        await db.SaveChangesAsync();

        var labels = new[] { "Poniedziałek", "Wtorek", "Czwartek", "Piątek", "Sobota", "Niedziela" };
        PlanDay? firstDay = null;
        for (var i = 0; i < dayCount; i++)
        {
            var day = new PlanDay
            {
                PlanId = plan.Id,
                WeekNumber = 1,
                Order = i,
                Label = i < labels.Length ? labels[i] : $"Dzień {i + 1}",
                Items =
                [
                    new PlanItem
                    {
                        ExerciseId = exercise.Id,
                        Order = 0,
                        Sets = 3,
                        Reps = 8,
                        LoadKg = 40,
                    },
                ],
            };
            db.PlanDays.Add(day);
            if (i == 0) firstDay = day;
        }
        await db.SaveChangesAsync();

        var assignment = new Assignment
        {
            ClientId = client.Id,
            PlanId = plan.Id,
            Status = "active",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
        };
        db.Assignments.Add(assignment);

        var token = $"tok-{client.Id}-{Guid.NewGuid():N}"[..32];
        db.ClientAccessTokens.Add(new ClientAccessToken
        {
            ClientId = client.Id,
            Token = token,
        });
        await db.SaveChangesAsync();

        return new ClientPlanCtx(
            client.Id,
            plan.Id,
            assignment.Id,
            firstDay!.Id,
            exercise.Id,
            token);
    }

    private record ClientPlanCtx(
        int ClientId,
        int PlanId,
        int AssignmentId,
        int DayId,
        int ExerciseId,
        string Token);
}
