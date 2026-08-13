using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class EpleyPrTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;

    public EpleyPrTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public void Epley1Rm_ReturnsNull_AboveMaxReps()
    {
        Assert.Equal(12, Stats.MaxRepsFor1Rm);
        Assert.NotNull(Stats.Epley1Rm(40, 12));
        Assert.Null(Stats.Epley1Rm(40, 13));
        Assert.Null(Stats.Epley1Rm(40, 15));
        Assert.Null(Stats.Epley1RmDisplay(40, 15));
    }

    [Fact]
    public void Epley1Rm_True1Rm_EqualsWeight()
    {
        Assert.Equal(100, Stats.Epley1Rm(100, 1));
        Assert.Equal(100, Stats.Epley1RmDisplay(100, 1));
    }

    [Fact]
    public void Epley1Rm_42_5x8_IsPrOver_40x10()
    {
        // Epley: 40×10 → 53⅓, 42.5×8 → 53⅚ — marginalny PR na surowych wartościach
        var prev = Stats.Epley1Rm(40, 10)!.Value;
        var next = Stats.Epley1Rm(42.5, 8)!.Value;
        Assert.True(next > prev);
        Assert.True(Stats.IsEpleyPr(next, prev));
        Assert.Equal(53.5, Stats.Epley1RmDisplay(40, 10));
        Assert.Equal(54, Stats.Epley1RmDisplay(42.5, 8));
    }

    [Fact]
    public void Epley1Rm_ComparesRaw_NotRounded()
    {
        // Dwie wartości, które po RoundToHalf dają ten sam wynik, ale surowe różnią się o >0.01
        // 30×5 = 35.0 dokładnie; 30.1×5 = 35.116… → display też 35
        var a = Stats.Epley1Rm(30, 5)!.Value;
        var b = Stats.Epley1Rm(30.1, 5)!.Value;
        Assert.Equal(Stats.RoundToHalf(a), Stats.RoundToHalf(b));
        Assert.True(Stats.IsEpleyPr(b, a));
    }

    [Fact]
    public void FindPrSets_RampInOneSession_EmitsSinglePeakPr()
    {
        var session = new WorkoutSession
        {
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = 7,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet { Id = 1, SetNumber = 1, WeightKg = 10, Reps = 5, Completed = true },
                        new LoggedSet { Id = 2, SetNumber = 2, WeightKg = 20, Reps = 5, Completed = true },
                        new LoggedSet { Id = 3, SetNumber = 3, WeightKg = 30, Reps = 5, Completed = true },
                        new LoggedSet { Id = 4, SetNumber = 4, WeightKg = 40, Reps = 5, Completed = true },
                        new LoggedSet { Id = 5, SetNumber = 5, WeightKg = 50, Reps = 5, Completed = true },
                    ],
                },
            ],
        };

        var prs = Stats.FindPrSets(session, []);

        var pr = Assert.Single(prs);
        Assert.Equal(7, pr.ExerciseId);
        Assert.Equal(5, pr.SetId);
        Assert.Equal(Stats.Epley1Rm(50, 5), pr.Estimated1Rm);
        Assert.Null(pr.PreviousBest1Rm);
    }

    [Fact]
    public void FindPrSets_Ramp_PreviousBestIsHistoryNotEarlierSet()
    {
        var histEx = new LoggedExercise { ExerciseId = 7 };
        var historical = new List<LoggedSet>
        {
            new()
            {
                WeightKg = 40,
                Reps = 5,
                Completed = true,
                IsWarmup = false,
                LoggedExercise = histEx,
            },
        };
        var session = new WorkoutSession
        {
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = 7,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet { Id = 11, SetNumber = 1, WeightKg = 42, Reps = 5, Completed = true },
                        new LoggedSet { Id = 12, SetNumber = 2, WeightKg = 45, Reps = 5, Completed = true },
                        new LoggedSet { Id = 13, SetNumber = 3, WeightKg = 48, Reps = 5, Completed = true },
                    ],
                },
            ],
        };

        var prs = Stats.FindPrSets(session, historical);

        var pr = Assert.Single(prs);
        Assert.Equal(13, pr.SetId);
        Assert.Equal(Stats.Epley1Rm(48, 5), pr.Estimated1Rm);
        Assert.Equal(Stats.Epley1Rm(40, 5), pr.PreviousBest1Rm);
    }

    [Fact]
    public void FindPrSets_RampBelowHistory_EmitsNothing()
    {
        var histEx = new LoggedExercise { ExerciseId = 7 };
        var historical = new List<LoggedSet>
        {
            new()
            {
                WeightKg = 100,
                Reps = 5,
                Completed = true,
                LoggedExercise = histEx,
            },
        };
        var session = new WorkoutSession
        {
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = 7,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet { Id = 1, SetNumber = 1, WeightKg = 10, Reps = 5, Completed = true },
                        new LoggedSet { Id = 2, SetNumber = 2, WeightKg = 50, Reps = 5, Completed = true },
                    ],
                },
            ],
        };

        Assert.Empty(Stats.FindPrSets(session, historical));
    }

    [Fact]
    public async Task HighRepSet_DoesNotCreateEstimated1RmOrPr()
    {
        var (clientId, exerciseId, sessionId) = await SeedSessionAsync(
            weightKg: 40, reps: 15, completed: true);

        var statsRes = await _client.GetAsync($"/api/clients/{clientId}/exercises/{exerciseId}/stats");
        Assert.Equal(HttpStatusCode.OK, statsRes.StatusCode);
        using var statsDoc = JsonDocument.Parse(await statsRes.Content.ReadAsStringAsync());
        Assert.Equal(JsonValueKind.Null, statsDoc.RootElement.GetProperty("estimated1Rm").ValueKind);

        var recordsRes = await _client.GetAsync($"/api/clients/{clientId}/records");
        Assert.Equal(HttpStatusCode.OK, recordsRes.StatusCode);
        using var recordsDoc = JsonDocument.Parse(await recordsRes.Content.ReadAsStringAsync());
        Assert.DoesNotContain(
            recordsDoc.RootElement.EnumerateArray(),
            r => r.GetProperty("exerciseId").GetInt32() == exerciseId);

        var sessionRes = await _client.GetAsync($"/api/sessions/{sessionId}");
        Assert.Equal(HttpStatusCode.OK, sessionRes.StatusCode);
        using var sessionDoc = JsonDocument.Parse(await sessionRes.Content.ReadAsStringAsync());
        Assert.Equal(0, sessionDoc.RootElement.GetProperty("prs").GetArrayLength());
        var set = sessionDoc.RootElement.GetProperty("exercises")[0].GetProperty("sets")[0];
        Assert.Equal(JsonValueKind.Null, set.GetProperty("estimated1Rm").ValueKind);
        Assert.False(set.GetProperty("isPr").GetBoolean());
    }

    [Fact]
    public async Task PrefillWithoutCompleted_DoesNotEnterRecordsOrDashboard()
    {
        var (clientId, exerciseId, _) = await SeedSessionAsync(
            weightKg: 120, reps: 5, completed: false, sessionStatus: "completed");

        var recordsRes = await _client.GetAsync($"/api/clients/{clientId}/records");
        using var recordsDoc = JsonDocument.Parse(await recordsRes.Content.ReadAsStringAsync());
        Assert.DoesNotContain(
            recordsDoc.RootElement.EnumerateArray(),
            r => r.GetProperty("exerciseId").GetInt32() == exerciseId);

        var statsRes = await _client.GetAsync($"/api/clients/{clientId}/exercises/{exerciseId}/stats");
        using var statsDoc = JsonDocument.Parse(await statsRes.Content.ReadAsStringAsync());
        Assert.Equal(JsonValueKind.Null, statsDoc.RootElement.GetProperty("estimated1Rm").ValueKind);

        var dashRes = await _client.GetAsync("/api/dashboard");
        using var dashDoc = JsonDocument.Parse(await dashRes.Content.ReadAsStringAsync());
        var recent = dashDoc.RootElement.GetProperty("recentPrs");
        Assert.DoesNotContain(
            recent.EnumerateArray(),
            r => r.GetProperty("exerciseId").GetInt32() == exerciseId);
    }

    [Fact]
    public async Task FortyTwoFiveByEight_AfterFortyByTen_IsPrWithPreviousBest()
    {
        var trainerId = await GetTrainerIdAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        var client = new Client
        {
            TrainerId = trainerId,
            Name = $"PR {Guid.NewGuid():N}"[..16],
            Email = $"pr-{Guid.NewGuid():N}@test.local",
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();

        var exercise = new Exercise
        {
            TrainerId = trainerId,
            Name = $"Przysiad {Guid.NewGuid():N}"[..16],
            Type = "reps",
            PrimaryMuscles = ["Nogi"],
            Category = "legs",
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        db.WorkoutSessions.Add(new WorkoutSession
        {
            ClientId = client.Id,
            PerformedOn = today.AddDays(-3),
            Status = "completed",
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = exercise.Id,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet
                        {
                            SetNumber = 1,
                            WeightKg = 40,
                            Reps = 10,
                            IsWarmup = false,
                            Completed = true,
                        },
                    ],
                },
            ],
        });
        await db.SaveChangesAsync();

        var second = new WorkoutSession
        {
            ClientId = client.Id,
            PerformedOn = today,
            Status = "completed",
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = exercise.Id,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet
                        {
                            SetNumber = 1,
                            WeightKg = 42.5,
                            Reps = 8,
                            IsWarmup = false,
                            Completed = true,
                        },
                    ],
                },
            ],
        };
        db.WorkoutSessions.Add(second);
        await db.SaveChangesAsync();
        var sessionId = second.Id;

        var sessionRes = await _client.GetAsync($"/api/sessions/{sessionId}");
        Assert.Equal(HttpStatusCode.OK, sessionRes.StatusCode);
        using var doc = JsonDocument.Parse(await sessionRes.Content.ReadAsStringAsync());

        var prs = doc.RootElement.GetProperty("prs");
        Assert.Equal(1, prs.GetArrayLength());
        var pr = prs[0];
        Assert.Equal(42.5, pr.GetProperty("weightKg").GetDouble());
        Assert.Equal(8, pr.GetProperty("reps").GetInt32());
        Assert.Equal(54, pr.GetProperty("estimated1Rm").GetDouble());
        Assert.Equal(53.5, pr.GetProperty("previousBest1Rm").GetDouble());

        var set = doc.RootElement.GetProperty("exercises")[0].GetProperty("sets")[0];
        Assert.True(set.GetProperty("isPr").GetBoolean());
        Assert.Equal(53.5, set.GetProperty("previousBest1Rm").GetDouble());
    }

    [Fact]
    public async Task RampInOneSession_SessionDetailHasSinglePrOnPeakSet()
    {
        var trainerId = await GetTrainerIdAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        var client = new Client
        {
            TrainerId = trainerId,
            Name = $"Ramp {Guid.NewGuid():N}"[..16],
            Email = $"ramp-{Guid.NewGuid():N}@test.local",
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();

        var exercise = new Exercise
        {
            TrainerId = trainerId,
            Name = $"Wycisk {Guid.NewGuid():N}"[..16],
            Type = "reps",
            PrimaryMuscles = ["Klatka piersiowa"],
            Category = "chest",
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        var session = new WorkoutSession
        {
            ClientId = client.Id,
            PerformedOn = DateOnly.FromDateTime(DateTime.UtcNow),
            Status = "completed",
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = exercise.Id,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet { SetNumber = 1, WeightKg = 10, Reps = 5, Completed = true },
                        new LoggedSet { SetNumber = 2, WeightKg = 20, Reps = 5, Completed = true },
                        new LoggedSet { SetNumber = 3, WeightKg = 30, Reps = 5, Completed = true },
                        new LoggedSet { SetNumber = 4, WeightKg = 40, Reps = 5, Completed = true },
                        new LoggedSet { SetNumber = 5, WeightKg = 50, Reps = 5, Completed = true },
                    ],
                },
            ],
        };
        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync();
        var sessionId = session.Id;

        var sessionRes = await _client.GetAsync($"/api/sessions/{sessionId}");
        Assert.Equal(HttpStatusCode.OK, sessionRes.StatusCode);
        using var doc = JsonDocument.Parse(await sessionRes.Content.ReadAsStringAsync());

        var prs = doc.RootElement.GetProperty("prs");
        Assert.Equal(1, prs.GetArrayLength());
        Assert.Equal(50, prs[0].GetProperty("weightKg").GetDouble());
        Assert.Equal(5, prs[0].GetProperty("setNumber").GetInt32());
        Assert.Equal(JsonValueKind.Null, prs[0].GetProperty("previousBest1Rm").ValueKind);

        var sets = doc.RootElement.GetProperty("exercises")[0].GetProperty("sets");
        Assert.Equal(5, sets.GetArrayLength());
        for (var i = 0; i < 4; i++)
            Assert.False(sets[i].GetProperty("isPr").GetBoolean());
        Assert.True(sets[4].GetProperty("isPr").GetBoolean());
    }

    async Task<(int ClientId, int ExerciseId, int SessionId)> SeedSessionAsync(
        double weightKg,
        int reps,
        bool completed,
        string sessionStatus = "completed")
    {
        var trainerId = await GetTrainerIdAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        var client = new Client
        {
            TrainerId = trainerId,
            Name = $"E1 {Guid.NewGuid():N}"[..16],
            Email = $"e1-{Guid.NewGuid():N}@test.local",
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();

        var exercise = new Exercise
        {
            TrainerId = trainerId,
            Name = $"Ćw {Guid.NewGuid():N}"[..12],
            Type = "reps",
            PrimaryMuscles = ["Klatka piersiowa"],
            Category = "chest",
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        var session = new WorkoutSession
        {
            ClientId = client.Id,
            PerformedOn = DateOnly.FromDateTime(DateTime.UtcNow),
            Status = sessionStatus,
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = exercise.Id,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet
                        {
                            SetNumber = 1,
                            WeightKg = weightKg,
                            Reps = reps,
                            IsWarmup = false,
                            Completed = completed,
                        },
                    ],
                },
            ],
        };
        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync();
        return (client.Id, exercise.Id, session.Id);
    }

    async Task<int> GetTrainerIdAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        return db.Trainers.Select(t => t.Id).First();
    }
}
