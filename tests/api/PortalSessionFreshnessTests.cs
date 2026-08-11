using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

/// <summary>
/// Świeżość sesji portalu: stale vs fresh, auto-abandon, idempotent start, abandon, cykl planu.
/// </summary>
public class PortalSessionFreshnessTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;

    public PortalSessionFreshnessTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PortalHome_FreshSession_ReturnsInProgressNotStale()
    {
        var ctx = await SeedClientWithPlanAsync("Fresh Client");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            db.WorkoutSessions.Add(BuildInProgress(ctx, today, completedSets: 1, createdAt: DateTime.UtcNow));
            await db.SaveChangesAsync();
        }

        var home = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(JsonValueKind.Object, home.GetProperty("inProgressSession").ValueKind);
        Assert.Equal(JsonValueKind.Null, home.GetProperty("staleSession").ValueKind);
        Assert.Equal(1, home.GetProperty("inProgressSession").GetProperty("completedSets").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(
            home.GetProperty("inProgressSession").GetProperty("dayLabel").GetString()));
    }

    [Fact]
    public async Task PortalHome_EmptyStale_AutoAbandons()
    {
        var ctx = await SeedClientWithPlanAsync("Empty Stale");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);
        int sessionId;

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var session = BuildInProgress(ctx, yesterday, completedSets: 0,
                createdAt: DateTime.UtcNow.AddHours(-10));
            db.WorkoutSessions.Add(session);
            await db.SaveChangesAsync();
            sessionId = session.Id;
        }

        var home = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(JsonValueKind.Null, home.GetProperty("inProgressSession").ValueKind);
        Assert.Equal(JsonValueKind.Null, home.GetProperty("staleSession").ValueKind);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var row = await db.WorkoutSessions.FindAsync(sessionId);
            Assert.Equal("abandoned", row!.Status);
        }
    }

    [Fact]
    public async Task PortalHome_StaleWithSets_ReturnsStaleSession()
    {
        var ctx = await SeedClientWithPlanAsync("Stale With Sets");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            db.WorkoutSessions.Add(BuildInProgress(ctx, yesterday, completedSets: 2,
                createdAt: DateTime.UtcNow.AddHours(-12)));
            await db.SaveChangesAsync();
        }

        var home = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(JsonValueKind.Null, home.GetProperty("inProgressSession").ValueKind);
        Assert.Equal(JsonValueKind.Object, home.GetProperty("staleSession").ValueKind);
        Assert.Equal(2, home.GetProperty("staleSession").GetProperty("completedSets").GetInt32());
    }

    [Fact]
    public async Task PortalHome_YesterdayWithinGrace_IsFresh()
    {
        var ctx = await SeedClientWithPlanAsync("Grace Client");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            db.WorkoutSessions.Add(BuildInProgress(ctx, yesterday, completedSets: 1,
                createdAt: DateTime.UtcNow.AddHours(-1)));
            await db.SaveChangesAsync();
        }

        var home = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(JsonValueKind.Object, home.GetProperty("inProgressSession").ValueKind);
        Assert.Equal(JsonValueKind.Null, home.GetProperty("staleSession").ValueKind);
    }

    [Fact]
    public async Task PortalStart_IsIdempotent_WhenFreshInProgressExists()
    {
        var ctx = await SeedClientWithPlanAsync("Idempotent Start");
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");

        var first = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = ctx.DayId,
            performedOn = today,
        });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var firstJson = await first.Content.ReadAsStringAsync();
        using var firstDoc = JsonDocument.Parse(firstJson);
        var firstId = firstDoc.RootElement.GetProperty("id").GetInt32();

        var second = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = ctx.DayId,
            performedOn = today,
        });
        // Idempotent: zwraca istniejącą (Created lub OK — akceptujemy body z tym samym id)
        Assert.True(second.IsSuccessStatusCode);
        var secondJson = await second.Content.ReadAsStringAsync();
        using var secondDoc = JsonDocument.Parse(secondJson);
        Assert.Equal(firstId, secondDoc.RootElement.GetProperty("id").GetInt32());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var openCount = await db.WorkoutSessions
            .CountAsync(s => s.ClientId == ctx.ClientId && s.Status == "in_progress");
        Assert.Equal(1, openCount);
    }

    [Fact]
    public async Task PortalAbandon_MarksAbandoned()
    {
        var ctx = await SeedClientWithPlanAsync("Abandon Client");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        int sessionId;

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var session = BuildInProgress(ctx, today.AddDays(-2), completedSets: 3,
                createdAt: DateTime.UtcNow.AddDays(-2));
            db.WorkoutSessions.Add(session);
            await db.SaveChangesAsync();
            sessionId = session.Id;
        }

        var res = await _client.PatchAsync($"/api/portal/{ctx.Token}/sessions/{sessionId}/abandon", null);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("abandoned", doc.RootElement.GetProperty("status").GetString());

        var home = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(JsonValueKind.Null, home.GetProperty("staleSession").ValueKind);
    }

    [Fact]
    public async Task ValidatePerformedOn_AllowsLocalTomorrow()
    {
        var ctx = await SeedClientWithPlanAsync("TZ Client");
        var tomorrow = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1).ToString("yyyy-MM-dd");

        var start = await _client.PostAsJsonAsync($"/api/portal/{ctx.Token}/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = ctx.DayId,
            performedOn = tomorrow,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
    }

    [Fact]
    public async Task PortalHome_CycleLoops_ToFirstDayAfterAllCompleted()
    {
        var ctx = await SeedClientWithPlanAsync("Cycle Client", dayCount: 2);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var days = await db.PlanDays.Where(d => d.PlanId == ctx.PlanId)
                .OrderBy(d => d.Order).ToListAsync();
            Assert.Equal(2, days.Count);
            foreach (var day in days)
            {
                db.WorkoutSessions.Add(new WorkoutSession
                {
                    ClientId = ctx.ClientId,
                    AssignmentId = ctx.AssignmentId,
                    PlanId = ctx.PlanId,
                    PlanDayId = day.Id,
                    PerformedOn = today.AddDays(-3),
                    Status = "completed",
                    DurationSeconds = 1800,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                });
            }
            await db.SaveChangesAsync();
        }

        var home = await GetHomeAsync(ctx.Token, today);
        Assert.Equal(JsonValueKind.Object, home.GetProperty("today").ValueKind);
        var todayDay = home.GetProperty("today").GetProperty("day");
        Assert.Equal(ctx.DayId, todayDay.GetProperty("id").GetInt32());
        Assert.True(home.GetProperty("today").GetProperty("cycleRestart").GetBoolean());
        Assert.Equal(0, home.GetProperty("today").GetProperty("completed").GetInt32());
    }

    // ---------- helpers ----------

    async Task<JsonElement> GetHomeAsync(string token, DateOnly today)
    {
        var res = await _client.GetAsync($"/api/portal/{token}?today={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        return JsonDocument.Parse(json).RootElement.Clone();
    }

    WorkoutSession BuildInProgress(ClientPlanCtx ctx, DateOnly performedOn, int completedSets, DateTime createdAt)
    {
        var sets = new List<LoggedSet>();
        for (var i = 1; i <= Math.Max(completedSets, 1); i++)
        {
            sets.Add(new LoggedSet
            {
                SetNumber = i,
                WeightKg = 40,
                Reps = 8,
                IsWarmup = false,
                Completed = i <= completedSets,
            });
        }
        // Gdy completedSets=0 i tak jedna nieukończona seria (jak prefill).
        if (completedSets == 0 && sets.Count == 0)
        {
            sets.Add(new LoggedSet
            {
                SetNumber = 1,
                WeightKg = 40,
                Reps = 8,
                IsWarmup = false,
                Completed = false,
            });
        }

        return new WorkoutSession
        {
            ClientId = ctx.ClientId,
            AssignmentId = ctx.AssignmentId,
            PlanId = ctx.PlanId,
            PlanDayId = ctx.DayId,
            PerformedOn = performedOn,
            Status = "in_progress",
            CreatedAt = createdAt,
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = ctx.ExerciseId,
                    Order = 0,
                    Sets = sets,
                },
            ],
        };
    }

    async Task<ClientPlanCtx> SeedClientWithPlanAsync(string name, int dayCount = 1)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        // Warmup: pierwsze HTTP wymusza seed (EnsureCreated + Seed.Run).
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

        PlanDay? firstDay = null;
        for (var i = 0; i < dayCount; i++)
        {
            var day = new PlanDay
            {
                PlanId = plan.Id,
                WeekNumber = 1,
                Order = i,
                Label = i == 0 ? "Poniedziałek" : $"Dzień {i + 1}",
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
