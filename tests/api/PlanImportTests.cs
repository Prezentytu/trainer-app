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

/// <summary>Fabryka z FakeChatClient zamiast OpenRouter.</summary>
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
