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

public class PlanImportLogicTests
{
    [Fact]
    public void MatchExerciseId_ExactAndContains()
    {
        var lib = new List<(int Id, string Name, string Type)>
        {
            (1, "High Bar Squat", "reps"),
            (2, "Front Squat", "reps"),
            (3, "RDL", "reps"),
        };

        Assert.Equal(1, PlanImport.MatchExerciseId("high bar squat", lib));
        Assert.Equal(2, PlanImport.MatchExerciseId("Front", lib));
        Assert.Null(PlanImport.MatchExerciseId("bench press", lib));
    }

    [Fact]
    public void DeserializeAndNormalize_BuildsBackoffFromScheme()
    {
        var json = """
        {
          "name": "Tydzień 5–6",
          "days": [
            {
              "weekNumber": 5,
              "order": 1,
              "label": "Trening A",
              "items": [
                {
                  "exerciseName": "High bar squat",
                  "matchedExerciseId": null,
                  "order": 2,
                  "setScheme": "rampa → 3RM + BO 80%",
                  "loadKg": 47.5,
                  "prescribedSets": []
                }
              ]
            }
          ]
        }
        """;

        var draft = PlanImport.DeserializeDraft(json);
        Assert.NotNull(draft);
        var lib = new List<(int Id, string Name, string Type)> { (10, "High Bar Squat", "reps") };
        var normalized = PlanImport.NormalizeAndMatch(draft!, lib);
        var item = normalized.Days![0].Items![0];
        Assert.Equal(10, item.MatchedExerciseId);
        Assert.Equal(2, item.PrescribedSets!.Count);
        Assert.Equal("ramp", item.PrescribedSets[0].Role);
        Assert.Equal("backoff", item.PrescribedSets[1].Role);
        Assert.Equal(80, item.PrescribedSets[1].LoadPercent);
        Assert.Equal("top", item.PrescribedSets[1].PercentOf);
    }

    [Fact]
    public void StripJsonFences_RemovesMarkdown()
    {
        var raw = "```json\n{\"name\":\"X\",\"days\":[]}\n```";
        var stripped = PlanImport.StripJsonFences(raw);
        Assert.Contains("\"name\"", stripped);
        var draft = PlanImport.DeserializeDraft(raw);
        Assert.NotNull(draft);
        Assert.Equal("X", draft!.Name);
    }

    [Fact]
    public void SplitWeeks_NoHeaders_ReturnsSingleChunk()
    {
        var text = "Trening A\n* 1. Squat 3x5";
        var chunks = PlanImport.SplitWeeks(text);
        Assert.Single(chunks);
        Assert.Null(chunks[0].WeekNumber);
        Assert.Contains("Squat", chunks[0].Text);
    }

    [Fact]
    public void SplitWeeks_SixWeeks_WithPreambleAndVariants()
    {
        var text = """
        Plan siłowy — notatki
        TYDZIEŃ 1
        Trening A
        * 1. Squat 3x5
        * TYDZIEŃ 2
        Trening A
        * 1. Squat 3x5
        # TYDZIEŃ 3
        Trening A
        Tydzien 4
        Trening A
        TYDZIEŃ 5
        Trening A
        TYDZIEŃ 6
        Trening A
        """;

        var chunks = PlanImport.SplitWeeks(text);
        Assert.Equal(6, chunks.Count);
        Assert.Equal(new[] { 1, 2, 3, 4, 5, 6 }, chunks.Select(c => c.WeekNumber!.Value));
        Assert.StartsWith("Plan siłowy", chunks[0].Text);
        Assert.Contains("TYDZIEŃ 1", chunks[0].Text);
        Assert.DoesNotContain("TYDZIEŃ 2", chunks[0].Text);
        Assert.Contains("TYDZIEŃ 6", chunks[5].Text);
    }

    [Fact]
    public void SplitWeeks_SingleWeek_OneChunk()
    {
        var text = """
        TYDZIEŃ 5
        Trening A
        * 1. High bar squat: Rampa 3
        """;
        var chunks = PlanImport.SplitWeeks(text);
        Assert.Single(chunks);
        Assert.Equal(5, chunks[0].WeekNumber);
    }

    [Fact]
    public void MergeWeekDrafts_MergesTwoWeeks_AndForcesWeekNumber()
    {
        var chunks = new List<WeekChunk>
        {
            new(1, "TYDZIEŃ 1\nTrening A"),
            new(2, "TYDZIEŃ 2\nTrening A"),
        };
        var d1 = PlanImport.DeserializeDraft("""
        {"name":"T1","days":[{"weekNumber":99,"order":1,"label":"Trening A","items":[{"exerciseName":"Squat","order":1,"sets":3,"reps":5}]}]}
        """);
        var d2 = PlanImport.DeserializeDraft("""
        {"days":[{"weekNumber":2,"order":1,"label":"Trening A","items":[{"exerciseName":"Bench","order":1,"sets":3,"reps":8}]}]}
        """);
        var parts = new List<(WeekChunk, PlanImportDraft?, string?)>
        {
            (chunks[0], d1, null),
            (chunks[1], d2, null),
        };
        var lib = new List<(int Id, string Name, string Type)>();
        var merged = PlanImport.MergeWeekDrafts(chunks, parts, lib);

        Assert.Equal(2, merged.Days!.Count);
        Assert.Equal(1, merged.Days[0].WeekNumber);
        Assert.Equal(2, merged.Days[1].WeekNumber);
        Assert.Null(merged.Warnings);
        Assert.Contains("1", merged.Name);
        Assert.Contains("2", merged.Name);
    }

    [Fact]
    public void MergeWeekDrafts_MissingWeek_AddsWarningAndFailedWeeks()
    {
        var chunks = new List<WeekChunk>
        {
            new(1, "TYDZIEŃ 1"),
            new(2, "TYDZIEŃ 2"),
        };
        var d1 = PlanImport.DeserializeDraft("""
        {"days":[{"weekNumber":1,"order":1,"label":"A","items":[{"exerciseName":"Squat","order":1,"sets":3,"reps":5}]}]}
        """);
        var parts = new List<(WeekChunk, PlanImportDraft?, string?)>
        {
            (chunks[0], d1, null),
            (chunks[1], null, "Nie udało się odczytać tygodnia 2."),
        };
        var merged = PlanImport.MergeWeekDrafts(chunks, parts, []);

        Assert.Single(merged.Days!);
        Assert.NotNull(merged.Warnings);
        Assert.Contains(merged.Warnings!, w => w.Contains("tygodnia 2", StringComparison.Ordinal));
        Assert.Equal(new[] { 2 }, merged.FailedWeeks);
    }

    [Fact]
    public void DeserializeDraft_ToleratesTrailingCommas()
    {
        var json = """
        {
          "name": "T5",
          "days": [
            {
              "weekNumber": 5,
              "order": 1,
              "label": "Trening A",
              "items": [
                { "exerciseName": "Squat", "order": 1, "sets": 3, },
              ],
            },
          ],
        }
        """;
        var draft = PlanImport.DeserializeDraft(json);
        Assert.NotNull(draft);
        Assert.Equal("T5", draft!.Name);
        Assert.Single(draft.Days!);
        Assert.Equal("Squat", draft.Days![0].Items![0].ExerciseName);
    }

    [Fact]
    public void ResponseSchema_IsValidObject()
    {
        Assert.Equal(JsonValueKind.Object, PlanImport.ResponseSchema.ValueKind);
        Assert.True(PlanImport.ResponseSchema.TryGetProperty("properties", out _));
    }
}

public class PlanImportEndpointTests : IClassFixture<PlanImportWebAppFactory>
{
    private readonly HttpClient _client;

    public PlanImportEndpointTests(PlanImportWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task PlanImport_WithFakeAi_ReturnsMatchedDraft()
    {
        var res = await _client.PostAsJsonAsync("/api/ai/plan-import", new
        {
            text = """
            TYDZIEŃ 5
            Trening A
            * 1. High bar squat: Rampa 3 (47,5 kg) + BO 80%: 38 kg (5-10 powt.)
            * 2. Push press: 4x5 (25 kg)
            """,
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var draft = await res.Content.ReadFromJsonAsync<PlanImportDraft>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(draft);
        Assert.NotEmpty(draft!.Days!);
        Assert.Contains(draft.Days![0].Items!, i =>
            i.ExerciseName.Contains("squat", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PlanImport_TooShort_Returns400()
    {
        var res = await _client.PostAsJsonAsync("/api/ai/plan-import", new { text = "krótko" });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}

public class PlanImportMultiWeekEndpointTests : IClassFixture<PlanImportMultiWeekWebAppFactory>
{
    private readonly HttpClient _client;
    private readonly PlanImportMultiWeekWebAppFactory _factory;

    public PlanImportMultiWeekEndpointTests(PlanImportMultiWeekWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PlanImport_TwoWeeks_MergesDaysFromBothCalls()
    {
        var res = await _client.PostAsJsonAsync("/api/ai/plan-import", new
        {
            text = """
            TYDZIEŃ 1
            Trening A
            * 1. Squat 3x5
            TYDZIEŃ 2
            Trening A
            * 1. Bench 3x8
            """,
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var draft = await res.Content.ReadFromJsonAsync<PlanImportDraft>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(draft);
        Assert.Equal(2, draft!.Days!.Count);
        Assert.Equal(new[] { 1, 2 }, draft.Days.Select(d => d.WeekNumber).OrderBy(w => w));
        Assert.True(_factory.Fake.CallCount >= 2);
        Assert.True(draft.Warnings is null || draft.Warnings.Count == 0);
    }
}

public class PlanImportPartialWeekEndpointTests : IClassFixture<PlanImportPartialWeekWebAppFactory>
{
    private readonly HttpClient _client;
    private readonly PlanImportPartialWeekWebAppFactory _factory;

    public PlanImportPartialWeekEndpointTests(PlanImportPartialWeekWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PlanImport_SecondWeekFails_ReturnsWarningAndFailedWeeks()
    {
        var res = await _client.PostAsJsonAsync("/api/ai/plan-import", new
        {
            text = """
            TYDZIEŃ 1
            Trening A
            * 1. Squat 3x5
            TYDZIEŃ 2
            Trening A
            * 1. Bench 3x8
            """,
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var draft = await res.Content.ReadFromJsonAsync<PlanImportDraft>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(draft);
        Assert.Single(draft!.Days!);
        Assert.Equal(1, draft.Days![0].WeekNumber);
        Assert.NotNull(draft.Warnings);
        Assert.Contains(draft.Warnings!, w => w.Contains("tygodnia 2", StringComparison.Ordinal));
        Assert.Equal(new[] { 2 }, draft.FailedWeeks);
        // Tydzień 2: 3 próby (retry z feedbackiem); tydzień 1: 1 → łącznie ≥ 4
        Assert.True(_factory.Fake.CallCount >= 4);
    }
}

public class PlanImportRetryEndpointTests : IClassFixture<PlanImportRetryWebAppFactory>
{
    private readonly HttpClient _client;
    private readonly PlanImportRetryWebAppFactory _factory;

    public PlanImportRetryEndpointTests(PlanImportRetryWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PlanImport_RetriesOnBadJson_ThenSucceeds()
    {
        var res = await _client.PostAsJsonAsync("/api/ai/plan-import", new
        {
            text = """
            TYDZIEŃ 5
            Trening A
            * 1. Squat 3x5
            """,
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var draft = await res.Content.ReadFromJsonAsync<PlanImportDraft>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(draft);
        Assert.NotEmpty(draft!.Days!);
        Assert.True(draft.Warnings is null || draft.Warnings.Count == 0);
        Assert.Null(draft.FailedWeeks);
        Assert.Equal(2, _factory.Fake.CallCount);
    }
}

public class PlanImportWeeksFilterEndpointTests : IClassFixture<PlanImportWeeksFilterWebAppFactory>
{
    private readonly HttpClient _client;
    private readonly PlanImportWeeksFilterWebAppFactory _factory;

    public PlanImportWeeksFilterEndpointTests(PlanImportWeeksFilterWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PlanImport_WeeksFilter_OnlyRequestedWeek()
    {
        var res = await _client.PostAsJsonAsync("/api/ai/plan-import", new
        {
            text = """
            TYDZIEŃ 1
            Trening A
            * 1. Squat 3x5
            TYDZIEŃ 2
            Trening A
            * 1. Bench 3x8
            """,
            weeks = new[] { 2 },
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var draft = await res.Content.ReadFromJsonAsync<PlanImportDraft>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(draft);
        Assert.Single(draft!.Days!);
        Assert.Equal(2, draft.Days![0].WeekNumber);
        Assert.Equal(1, _factory.Fake.CallCount);
    }
}

/// <summary>Fabryka z FakeChatClient zamiast OpenRouter (jeden tydzień).</summary>
public class PlanImportWebAppFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    private static readonly string FakeJson = """
    {
      "name": "Tydzień 5",
      "description": null,
      "days": [
        {
          "weekNumber": 5,
          "order": 1,
          "label": "Trening A",
          "notes": null,
          "items": [
            {
              "exerciseName": "High bar squat",
              "matchedExerciseId": null,
              "order": 1,
              "supersetGroup": null,
              "isWarmup": false,
              "measureType": "reps",
              "sets": 2,
              "reps": null,
              "repsMax": null,
              "setScheme": "rampa → 3RM + BO 80%",
              "loadKg": 47.5,
              "prescribedSets": [
                { "order": 1, "reps": 3, "loadKg": 47.5, "role": "ramp" },
                { "order": 2, "reps": 5, "repsMax": 10, "loadPercent": 80, "percentOf": "top", "role": "backoff" }
              ]
            },
            {
              "exerciseName": "Push press",
              "matchedExerciseId": null,
              "order": 2,
              "sets": 4,
              "reps": 5,
              "loadKg": 25,
              "prescribedSets": []
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

/// <summary>Dwa tygodnie → odpowiedzi per tydzień (bezpieczne przy równoległości).</summary>
public class PlanImportMultiWeekWebAppFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    public FakeChatClient Fake { get; } = new FakeChatClient(new Dictionary<int, string>
    {
        [1] = """{"name":"T1","days":[{"weekNumber":1,"order":1,"label":"Trening A","items":[{"exerciseName":"Squat","order":1,"sets":3,"reps":5}]}]}""",
        [2] = """{"name":"T2","days":[{"weekNumber":2,"order":1,"label":"Trening A","items":[{"exerciseName":"Bench","order":1,"sets":3,"reps":8}]}]}""",
    });

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
            services.AddSingleton<IChatClient>(Fake);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}

/// <summary>Drugi tydzień zawsze zwraca nieczytelny JSON → ostrzeżenie + failedWeeks.</summary>
public class PlanImportPartialWeekWebAppFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    public FakeChatClient Fake { get; } = new FakeChatClient(new Dictionary<int, string>
    {
        [1] = """{"days":[{"weekNumber":1,"order":1,"label":"Trening A","items":[{"exerciseName":"Squat","order":1,"sets":3,"reps":5}]}]}""",
        [2] = "to nie jest json",
    });

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
            services.AddSingleton<IChatClient>(Fake);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}

/// <summary>Pierwsza odpowiedź śmieci, druga poprawna → retry z feedbackiem.</summary>
public class PlanImportRetryWebAppFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    public FakeChatClient Fake { get; } = new FakeChatClient(
    [
        "to nie jest json",
        """{"name":"T5","days":[{"weekNumber":5,"order":1,"label":"Trening A","items":[{"exerciseName":"Squat","order":1,"sets":3,"reps":5}]}]}""",
    ]);

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
            services.AddSingleton<IChatClient>(Fake);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}

/// <summary>Filtr weeks=[2] — tylko tydzień 2 trafia do LLM.</summary>
public class PlanImportWeeksFilterWebAppFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    public FakeChatClient Fake { get; } = new FakeChatClient(new Dictionary<int, string>
    {
        [1] = """{"days":[{"weekNumber":1,"order":1,"label":"Trening A","items":[{"exerciseName":"Squat","order":1,"sets":3,"reps":5}]}]}""",
        [2] = """{"days":[{"weekNumber":2,"order":1,"label":"Trening A","items":[{"exerciseName":"Bench","order":1,"sets":3,"reps":8}]}]}""",
    });

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
            services.AddSingleton<IChatClient>(Fake);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
