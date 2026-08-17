using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class HistoryImportLogicTests
{
    [Fact]
    public void ParseSetList_RepsTimesKg()
    {
        var sets = HistoryImport.ParseSetList("8 x 30kg, 8 x 35kg, 8 x 40kg, 5 x 50kg");
        Assert.NotNull(sets);
        Assert.Equal(4, sets!.Count);
        Assert.Equal(8, sets[0].Reps);
        Assert.Equal(30, sets[0].WeightKg);
        Assert.Equal(50, sets[3].WeightKg);
        Assert.False(sets[0].IsBodyweight);
    }

    [Fact]
    public void ParseSetList_ZeroKgIsBodyweight()
    {
        var sets = HistoryImport.ParseSetList("10 x 0kg, 8 x 0kg");
        Assert.NotNull(sets);
        Assert.All(sets!, s => Assert.True(s.IsBodyweight));
        Assert.All(sets!, s => Assert.Equal(0, s.WeightKg));
    }

    [Fact]
    public void ParseSetList_DecimalComma()
    {
        var sets = HistoryImport.ParseSetList("3 x 62,5kg, 1 x 112,5 kg");
        Assert.NotNull(sets);
        Assert.Equal(62.5, sets![0].WeightKg);
        Assert.Equal(112.5, sets[1].WeightKg);
    }

    [Fact]
    public void ParseCsv_ExerciseTitleWeightKg()
    {
        var csv = """
        title,start_time,exercise_title,weight_kg,reps
        Push,2026-07-02 18:00:00,Bench Press,80,5
        Push,2026-07-02 18:00:00,Bench Press,85,3
        """;
        var draft = HistoryImport.ParseCsv(csv);
        Assert.NotNull(draft);
        Assert.Single(draft!.Sessions!);
        Assert.Equal("2026-07-02", draft.Sessions![0].PerformedOn);
        Assert.Equal("Bench Press", draft.Sessions[0].Exercises![0].ExerciseName);
        Assert.Equal(2, draft.Sessions[0].Exercises[0].Sets!.Count);
    }

    [Fact]
    public void ClusterDays_DetectsTestAndUsesLastFull()
    {
        var volume = Session("2026-07-09", "03",
            Ex(1, "OHP", (8, 40.0), (5, 50.0), (3, 55.0)),
            Ex(2, "Face pull", (12, 15.0), (12, 15.0)));
        var test = Session("2026-07-20", "03",
            Ex(1, "OHP", (1, 65.0)));
        var clusters = HistoryImport.ClusterDays([volume, test]);
        Assert.Single(clusters);
        Assert.True(clusters[0].LastIsTest);
        Assert.Equal("2026-07-09", clusters[0].LatestFull.PerformedOn);
    }

    [Fact]
    public void BuildPlanDraft_ShiftsTopSet()
    {
        var volume = Session("2026-07-09", "01",
            Ex(10, "Ławka", (8, 80.0), (8, 87.5), (8, 70.0)));
        var clusters = HistoryImport.ClusterDays([volume]);
        var plan = HistoryImport.BuildPlanDraft(clusters, 2.5, "Ada");
        Assert.Equal("Plan — Ada — kolejny cykl", plan.Name);
        var sets = plan.Days![0].Items![0].PrescribedSets!;
        Assert.Contains(sets, s => s.Role == "top" && s.LoadKg == 90);
    }

    [Fact]
    public void NormalizeAndMatch_WarnsOnSetCountMismatch()
    {
        var draft = new HistoryImportDraft(
            [
                new HistoryImportSession(
                    "2024-05-30",
                    "A",
                    SummarySets: 4,
                    Exercises:
                    [
                        new HistoryImportExercise("Przysiad", null, 1, [new HistoryImportSet(5, 40, false)]),
                    ])
            ],
            []);
        var result = HistoryImport.NormalizeAndMatch(draft, []);
        var warning = Assert.Single(result.Warnings!);
        Assert.Contains("30 maja", warning, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("na zdjęciu 4", warning, StringComparison.Ordinal);
        Assert.DoesNotContain("odczyt", warning, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("karta", warning, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void FromWorkoutSessions_KeepsCompletedWorkingSets()
    {
        var squat = new Exercise { Id = 7, Name = "Przysiad" };
        var session = new WorkoutSession
        {
            PerformedOn = new DateOnly(2026, 7, 2),
            Note = "A",
            Status = "completed",
            Exercises =
            [
                new LoggedExercise
                {
                    ExerciseId = 7,
                    Exercise = squat,
                    Order = 1,
                    Sets =
                    [
                        new LoggedSet { SetNumber = 1, Reps = 8, WeightKg = 60, Completed = true, IsWarmup = true },
                        new LoggedSet { SetNumber = 2, Reps = 5, WeightKg = 100, Completed = true, IsWarmup = false },
                        new LoggedSet { SetNumber = 3, Reps = 5, WeightKg = 100, Completed = false, IsWarmup = false },
                    ],
                },
            ],
        };

        var mapped = HistoryImport.FromWorkoutSessions([session]);
        var ex = Assert.Single(Assert.Single(mapped).Exercises!);
        Assert.Equal(7, ex.MatchedExerciseId);
        Assert.Equal("Przysiad", ex.ExerciseName);
        var set = Assert.Single(ex.Sets!);
        Assert.Equal(5, set.Reps);
        Assert.Equal(100, set.WeightKg);
        Assert.Equal("2026-07-02", mapped[0].PerformedOn);
        Assert.Equal("A", mapped[0].Label);
    }

    [Fact]
    public void MatchExerciseId_PolishAliases()
    {
        var lib = new List<(int Id, string Name, string Type)>
        {
            (1, "OHP", "reps"),
            (2, "RDL", "reps"),
        };
        Assert.Equal(1, HistoryImport.MatchExerciseId("Wyciskanie żołnierskie sztangi stojąc", lib));
        Assert.Equal(2, HistoryImport.MatchExerciseId("Martwy ciąg na prostych nogach", lib));
    }

    static HistoryImportSession Session(string date, string label, params HistoryImportExercise[] exercises) =>
        new(date, label, Exercises: [.. exercises]);

    static HistoryImportExercise Ex(int id, string name, params (int Reps, double Kg)[] sets) =>
        new(name, id, 1, sets.Select(s => new HistoryImportSet(s.Reps, s.Kg, false)).ToList());
}

/// <summary>CSV musi działać bez klucza OpenRouter — ten sam przypadek co CI.</summary>
public class HistoryImportCsvFactory : TestWebAppFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services =>
        {
            foreach (var d in services.Where(d => d.ServiceType == typeof(IChatClient)).ToList())
                services.Remove(d);
            services.AddSingleton<IChatClient>(new UnavailableChatClient());
        });
    }
}

public class HistoryImportCsvEndpointTests : IClassFixture<HistoryImportCsvFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public HistoryImportCsvEndpointTests(HistoryImportCsvFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task HistoryImport_CsvSkipsAi_ReturnsSessions()
    {
        var csv = """
        title,start_time,exercise_title,weight_kg,reps
        Push,2026-07-02 18:00:00,Bench Press,80,5
        Push,2026-07-02 18:00:00,Bench Press,87.5,3
        """;
        var res = await _client.PostAsJsonAsync("/api/ai/history-import", new { text = csv });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var draft = await res.Content.ReadFromJsonAsync<HistoryImportDraft>(JsonOpts);
        Assert.NotNull(draft);
        Assert.Single(draft!.Sessions!);
        Assert.Equal("2026-07-02", draft.Sessions![0].PerformedOn);
        Assert.Equal(2, draft.Sessions[0].Exercises![0].Sets!.Count);
    }

    [Fact]
    public async Task Apply_CreatesCompletedSessionWithoutPlanDay()
    {
        var created = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = "Import Apply",
            email = (string?)null,
            note = (string?)null,
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var client = await created.Content.ReadFromJsonAsync<Created>(JsonOpts);
        Assert.NotNull(client);

        var exercises = await _client.GetFromJsonAsync<List<ExRow>>("/api/exercises", JsonOpts);
        Assert.NotNull(exercises);
        var ex = exercises.First(e =>
            e.Name.Contains("ławce", StringComparison.OrdinalIgnoreCase));

        var draft = new
        {
            sessions = new[]
            {
                new
                {
                    performedOn = "2026-07-02",
                    label = "03",
                    exercises = new[]
                    {
                        new
                        {
                            exerciseName = ex.Name,
                            matchedExerciseId = ex.Id,
                            order = 1,
                            sets = new[] { new { reps = 8, weightKg = 30.0, isBodyweight = false } },
                        },
                    },
                },
            },
            warnings = Array.Empty<string>(),
        };
        var pending = await _client.PostAsJsonAsync($"/api/clients/{client!.Id}/history-imports", draft);
        Assert.Equal(HttpStatusCode.Created, pending.StatusCode);
        var row = await pending.Content.ReadFromJsonAsync<Created>(JsonOpts);

        var apply = await _client.PostAsJsonAsync($"/api/clients/{client.Id}/history-imports/{row!.Id}/apply", new
        {
            saveHistory = true,
            saveMaxes = true,
            sessions = new[]
            {
                new
                {
                    clientId = client.Id,
                    performedOn = "2026-07-02",
                    planDayId = (int?)null,
                    status = "completed",
                    note = "03",
                    exercises = new[]
                    {
                        new
                        {
                            exerciseId = ex.Id,
                            order = 1,
                            sets = new[]
                            {
                                new { setNumber = 1, weightKg = 30.0, reps = 8, completed = true, isWarmup = false },
                            },
                        },
                    },
                },
            },
            maxes = new[]
            {
                new { exerciseId = ex.Id, maxKg = 30.0, measuredOn = "2026-07-02", note = "z historii" },
            },
        });
        Assert.Equal(HttpStatusCode.OK, apply.StatusCode);
        var result = await apply.Content.ReadFromJsonAsync<ApplyResult>(JsonOpts);
        Assert.NotNull(result);
        Assert.Single(result!.SessionIds);
        Assert.Single(result.MaxIds);

        var session = await _client.GetFromJsonAsync<SessionRow>($"/api/sessions/{result.SessionIds[0]}", JsonOpts);
        Assert.Equal("completed", session!.Status);
        Assert.Null(session.PlanDayId);
        Assert.Equal("2026-07-02", session.PerformedOn);
    }

    [Fact]
    public async Task PlanFromHistory_ReturnsDraft_ForCompletedSessions()
    {
        var created = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = "Plan z historii",
            email = (string?)null,
            note = (string?)null,
        });
        var client = await created.Content.ReadFromJsonAsync<Created>(JsonOpts);
        var exercises = await _client.GetFromJsonAsync<List<ExRow>>("/api/exercises", JsonOpts);
        var ex = exercises!.First(e => e.Name.Contains("ławce", StringComparison.OrdinalIgnoreCase));

        var session = await _client.PostAsJsonAsync("/api/sessions", new
        {
            clientId = client!.Id,
            performedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            status = "completed",
            exercises = new[]
            {
                new
                {
                    exerciseId = ex.Id,
                    order = 1,
                    sets = new[]
                    {
                        new { setNumber = 1, weightKg = 80.0, reps = 5, completed = true, isWarmup = false },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, session.StatusCode);

        var res = await _client.PostAsJsonAsync($"/api/clients/{client.Id}/plan-from-history", new
        {
            topKgDelta = 2.5,
            sinceDays = 120,
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.GetProperty("planDraft").GetProperty("days").GetArrayLength() >= 1);
    }

    [Fact]
    public async Task PlanFromHistory_EmptyHistory_Returns400()
    {
        var created = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = "Pusta historia",
            email = (string?)null,
            note = (string?)null,
        });
        var client = await created.Content.ReadFromJsonAsync<Created>(JsonOpts);
        var res = await _client.PostAsJsonAsync($"/api/clients/{client!.Id}/plan-from-history", new
        {
            topKgDelta = 2.5,
            sinceDays = 120,
        });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var body = await res.Content.ReadAsStringAsync();
        Assert.Contains("Brak treningów w historii", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task SaveHistoryImport_OverwritesPendingInsteadOfOrphan()
    {
        var created = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = "Pending overwrite",
            email = (string?)null,
            note = (string?)null,
        });
        var client = await created.Content.ReadFromJsonAsync<Created>(JsonOpts);
        var first = await _client.PostAsJsonAsync($"/api/clients/{client!.Id}/history-imports", new
        {
            sessions = Array.Empty<object>(),
            warnings = Array.Empty<string>(),
        });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var firstRow = await first.Content.ReadFromJsonAsync<Created>(JsonOpts);

        var second = await _client.PostAsJsonAsync($"/api/clients/{client.Id}/history-imports", new
        {
            sessions = new[]
            {
                new
                {
                    performedOn = "2026-07-02",
                    label = "A",
                    exercises = Array.Empty<object>(),
                },
            },
            warnings = Array.Empty<string>(),
        });
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var secondRow = await second.Content.ReadFromJsonAsync<Created>(JsonOpts);
        Assert.Equal(firstRow!.Id, secondRow!.Id);

        var pending = await _client.GetFromJsonAsync<PendingRow>(
            $"/api/clients/{client.Id}/history-imports/pending", JsonOpts);
        Assert.Equal(firstRow.Id, pending!.Id);
        Assert.Single(pending.Draft.Sessions ?? []);
    }

    [Fact]
    public async Task Analyze_FlagsTestWeek()
    {
        var volume = new
        {
            performedOn = "2026-07-09",
            label = "03",
            exercises = new[]
            {
                new { exerciseName = "OHP", matchedExerciseId = 1, order = 1, sets = new[] { new { reps = 8, weightKg = 40.0, isBodyweight = false } } },
                new { exerciseName = "Face pull", matchedExerciseId = 2, order = 2, sets = new[] { new { reps = 12, weightKg = 15.0, isBodyweight = false } } },
            },
        };
        var test = new
        {
            performedOn = "2026-07-20",
            label = "03",
            exercises = new[]
            {
                new { exerciseName = "OHP", matchedExerciseId = 1, order = 1, sets = new[] { new { reps = 1, weightKg = 65.0, isBodyweight = false } } },
            },
        };
        var res = await _client.PostAsJsonAsync("/api/ai/history-import/analyze", new
        {
            sessions = new[] { volume, test },
            clientName = "Ada",
            topKgDelta = 2.5,
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.GetProperty("hasTestWeek").GetBoolean());
        Assert.Contains("nie tydzień testu", doc.RootElement.GetProperty("planDraft").GetProperty("description").GetString(), StringComparison.OrdinalIgnoreCase);
    }

    private record Created(int Id);
    private record ExRow(int Id, string Name);
    private record ApplyResult(List<int> SessionIds, List<int> MaxIds);
    private record SessionRow(int Id, string Status, string PerformedOn, int? PlanDayId);
    private record PendingRow(int Id, HistoryImportDraft Draft);
}

public class HistoryImportAiEndpointTests : IClassFixture<HistoryImportWebAppFactory>
{
    private readonly HttpClient _client;

    public HistoryImportAiEndpointTests(HistoryImportWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task HistoryImport_FakeVisionJson_Day03()
    {
        var res = await _client.PostAsJsonAsync("/api/ai/history-import", new
        {
            text = "02.07.2026 dzień 03 wyciskanie żołnierskie",
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var draft = await res.Content.ReadFromJsonAsync<HistoryImportDraft>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(draft);
        Assert.Single(draft!.Sessions!);
        Assert.Equal("2026-07-02", draft.Sessions![0].PerformedOn);
        Assert.Equal("03", draft.Sessions[0].Label);
        var ohp = Assert.Single(draft.Sessions[0].Exercises!, e => e.ExerciseName.Contains("żołnierskie", StringComparison.OrdinalIgnoreCase));
        Assert.True(ohp.Sets!.Count >= 3);
        Assert.Equal(30, ohp.Sets[0].WeightKg);
    }
}

/// <summary>Stały JSON z case’u dzień 03 (02.07).</summary>
public class HistoryImportWebAppFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    private static readonly string FakeJson = """
    {
      "sessions": [
        {
          "performedOn": "02.07.2026",
          "label": "03",
          "summarySets": 7,
          "exercises": [
            {
              "exerciseName": "Wyciskanie żołnierskie sztangi stojąc",
              "matchedExerciseId": null,
              "order": 1,
              "sets": [
                { "reps": 8, "weightKg": 30 },
                { "reps": 8, "weightKg": 35 },
                { "reps": 8, "weightKg": 40 },
                { "reps": 5, "weightKg": 50 },
                { "reps": 3, "weightKg": 55 },
                { "reps": 1, "weightKg": 60 },
                { "reps": 8, "weightKg": 40 }
              ]
            }
          ]
        }
      ]
    }
    """;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDb>));
            if (descriptor is not null) services.Remove(descriptor);
            services.AddDbContext<AppDb>(options => options.UseSqlite(_connection));

            var chatDesc = services.Where(d => d.ServiceType == typeof(IChatClient)).ToList();
            foreach (var d in chatDesc) services.Remove(d);
            services.AddSingleton<IChatClient>(new FakeChatClient(FakeJson));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
