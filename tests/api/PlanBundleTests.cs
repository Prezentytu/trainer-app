using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class PlanBundleTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public PlanBundleTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    private record PlanRow(int Id, string Name);
    private record ImportResult(List<int> PlanIds, List<string> Names, int CreatedExercises, List<string> Warnings);

    [Fact]
    public async Task PlanBundle_ExportImport_RoundTripsSeededPlan()
    {
        var plans = await _client.GetFromJsonAsync<List<PlanRow>>("/api/plans");
        Assert.NotEmpty(plans!);
        var source = plans![0];

        var export = await _client.GetAsync($"/api/plans/{source.Id}/bundle");
        Assert.Equal(HttpStatusCode.OK, export.StatusCode);
        using var doc = JsonDocument.Parse(await export.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        Assert.Equal("repmaxer.plan-bundle", root.GetProperty("kind").GetString());
        Assert.Equal(1, root.GetProperty("version").GetInt32());
        Assert.True(root.GetProperty("exercises").GetArrayLength() >= 1);
        Assert.Equal(source.Name, root.GetProperty("plan").GetProperty("name").GetString());

        var import = await _client.PostAsJsonAsync("/api/plans/bundle", root);
        Assert.Equal(HttpStatusCode.Created, import.StatusCode);
        var result = await import.Content.ReadFromJsonAsync<ImportResult>(JsonOpts);
        Assert.NotNull(result);
        var newId = Assert.Single(result!.PlanIds);
        Assert.NotEqual(source.Id, newId);
        Assert.Equal(source.Name, Assert.Single(result.Names));

        var copy = await _client.GetFromJsonAsync<JsonElement>($"/api/plans/{newId}");
        Assert.Equal(source.Name, copy.GetProperty("name").GetString());
        Assert.True(copy.GetProperty("days").GetArrayLength() >= 1);
    }

    [Fact]
    public async Task PlanBundle_Export_Missing_ReturnsNotFound()
    {
        var res = await _client.GetAsync("/api/plans/999999/bundle");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task PlanBundle_Import_InvalidKind_ReturnsBadRequest()
    {
        var res = await _client.PostAsJsonAsync("/api/plans/bundle", new { kind = "repmaxer.export", version = 1 });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("plan", json.GetProperty("message").GetString(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PlanBundle_Import_StripsDurationNoiseOnRepsSets()
    {
        var unique = $"Plan Noise {Guid.NewGuid():N}"[..24];
        var bundle = new
        {
            kind = "repmaxer.plan-bundle",
            version = 1,
            exportedAt = DateTime.UtcNow,
            exercises = new[]
            {
                new { id = 81001, name = unique, type = "reps", defaultSets = 3, defaultReps = 15 },
            },
            plan = new
            {
                id = 82001,
                name = "Szum 1s",
                isTemplate = false,
                days = new[]
                {
                    new
                    {
                        id = 83001,
                        weekNumber = 1,
                        order = 1,
                        label = "A",
                        items = new[]
                        {
                            new
                            {
                                exerciseId = 81001,
                                order = 1,
                                sets = 3,
                                reps = 15,
                                repDurationSeconds = 1,
                                distanceMeters = 1,
                                loadKg = 47.5,
                                prescribedSets = new[]
                                {
                                    new { order = 1, reps = 15, durationSeconds = 1, distanceMeters = 1, loadKg = 25.0 },
                                    new { order = 2, reps = 15, durationSeconds = 1, distanceMeters = 1, loadKg = 35.0 },
                                    new { order = 3, reps = 15, durationSeconds = 1, distanceMeters = 1, loadKg = 47.5 },
                                },
                            },
                        },
                    },
                },
            },
        };

        var import = await _client.PostAsJsonAsync("/api/plans/bundle", bundle);
        Assert.Equal(HttpStatusCode.Created, import.StatusCode);
        var result = await import.Content.ReadFromJsonAsync<ImportResult>(JsonOpts);
        var planId = Assert.Single(result!.PlanIds);

        var plan = await _client.GetFromJsonAsync<JsonElement>($"/api/plans/{planId}");
        var item = plan.GetProperty("days")[0].GetProperty("items")[0];
        Assert.Equal(15, item.GetProperty("reps").GetInt32());
        Assert.True(IsNullOrMissing(item, "repDurationSeconds"));
        Assert.True(IsNullOrMissing(item, "distanceMeters"));
        var set = item.GetProperty("prescribedSets")[0];
        Assert.Equal(15, set.GetProperty("reps").GetInt32());
        Assert.True(IsNullOrMissing(set, "durationSeconds"));
        Assert.Equal(25, set.GetProperty("loadKg").GetDouble());
    }

    static bool IsNullOrMissing(JsonElement obj, string name) =>
        !obj.TryGetProperty(name, out var el) || el.ValueKind is JsonValueKind.Null;

    [Fact]
    public async Task PlanBundle_Import_AcceptsClientBundlePlansOnly()
    {
        var unique = $"Client Plan {Guid.NewGuid():N}"[..24];
        var bundle = new
        {
            kind = "repmaxer.client-bundle",
            version = 1,
            exportedAt = DateTime.UtcNow,
            client = new { name = "Nie twórz karty" },
            exercises = new[] { new { id = 91001, name = unique, type = "reps", defaultSets = 3, defaultReps = 8 } },
            plans = new[]
            {
                new
                {
                    id = 92001,
                    name = "Sam plan z kopii osoby",
                    isTemplate = false,
                    days = new[]
                    {
                        new
                        {
                            id = 93001,
                            weekNumber = 1,
                            order = 1,
                            label = "A",
                            items = new[] { new { exerciseId = 91001, order = 1, sets = 3, reps = 8 } },
                        },
                    },
                },
            },
            assignments = Array.Empty<object>(),
            sessions = Array.Empty<object>(),
        };

        var before = await _client.GetFromJsonAsync<List<JsonElement>>("/api/clients");
        var import = await _client.PostAsJsonAsync("/api/plans/bundle", bundle);
        Assert.Equal(HttpStatusCode.Created, import.StatusCode);
        var result = await import.Content.ReadFromJsonAsync<ImportResult>(JsonOpts);
        Assert.Equal("Sam plan z kopii osoby", Assert.Single(result!.Names));

        var after = await _client.GetFromJsonAsync<List<JsonElement>>("/api/clients");
        Assert.Equal(before!.Count, after!.Count);
        Assert.DoesNotContain(after, c => c.GetProperty("name").GetString() == "Nie twórz karty");
    }
}
