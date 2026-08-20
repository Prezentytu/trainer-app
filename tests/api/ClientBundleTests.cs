using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class ClientBundleTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ClientBundleTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    private record ClientRow(int Id, string Name, string? Email);
    private record SessionRow(int Id, int? PlanId, int? PlanDayId, int? AssignmentId, string? Note, string Status);
    private record MaxRow(int ExerciseId, string ExerciseName, double MaxKg);
    private record ImportResult(int ClientId, string Name, int CreatedPlans, int CreatedExercises, int SessionCount, List<string> Warnings);
    private record TokenRow(string Token);

    [Fact]
    public async Task Bundle_ExportImport_RoundTripsSeededClient()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");

        var export = await _client.GetAsync($"/api/clients/{jan.Id}/bundle");
        Assert.Equal(HttpStatusCode.OK, export.StatusCode);
        using var doc = JsonDocument.Parse(await export.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        Assert.Equal("repmaxer.client-bundle", root.GetProperty("kind").GetString());
        Assert.Equal(1, root.GetProperty("version").GetInt32());
        Assert.True(root.GetProperty("plans").GetArrayLength() >= 1);
        Assert.True(root.GetProperty("sessions").GetArrayLength() >= 1);
        Assert.True(root.GetProperty("exercises").GetArrayLength() >= 1);
        Assert.False(root.TryGetProperty("tokens", out _));
        Assert.True(root.GetProperty("meta").GetProperty("skippedPortalLinks").GetInt32() >= 1);

        var import = await _client.PostAsJsonAsync("/api/clients/bundle", root);
        Assert.Equal(HttpStatusCode.Created, import.StatusCode);
        var result = await import.Content.ReadFromJsonAsync<ImportResult>(JsonOpts);
        Assert.NotNull(result);
        Assert.NotEqual(jan.Id, result!.ClientId);
        Assert.Equal("Jan Kowalski", result.Name);
        Assert.True(result.CreatedPlans >= 1);
        Assert.True(result.SessionCount >= 1);
        Assert.Contains(result.Warnings, w => w.Contains("Link do portalu", StringComparison.Ordinal));

        var copy = await _client.GetFromJsonAsync<JsonElement>($"/api/clients/{result.ClientId}");
        Assert.Equal("Jan Kowalski", copy.GetProperty("name").GetString());
        Assert.True(copy.GetProperty("assignments").GetArrayLength() >= 1);

        var sessions = await _client.GetFromJsonAsync<List<SessionRow>>($"/api/clients/{result.ClientId}/sessions");
        Assert.Contains(sessions!, s => s.Note == "Dobry dzień" && s.Status == "completed" && s.PlanId != null && s.PlanDayId != null);

        var maxes = await _client.GetFromJsonAsync<List<MaxRow>>($"/api/clients/{result.ClientId}/maxes");
        Assert.Contains(maxes!, m => m.MaxKg >= 80);

        var tokenRes = await _client.GetAsync($"/api/clients/{result.ClientId}/access-token");
        tokenRes.EnsureSuccessStatusCode();
        var token = await tokenRes.Content.ReadFromJsonAsync<TokenRow>(JsonOpts);
        Assert.NotEqual("demo-jan-kowalski", token!.Token);

        var originalToken = await _client.GetAsync("/api/portal/demo-jan-kowalski");
        Assert.Equal(HttpStatusCode.OK, originalToken.StatusCode);
    }

    [Fact]
    public async Task Bundle_Export_Missing_ReturnsNotFound()
    {
        var res = await _client.GetAsync("/api/clients/999999/bundle");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Bundle_Import_InvalidKind_ReturnsBadRequest()
    {
        var res = await _client.PostAsJsonAsync("/api/clients/bundle", new
        {
            kind = "repmaxer.export",
            version = 1,
            client = new { name = "X" },
        });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("kopia osoby", json.GetProperty("message").GetString(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Bundle_Import_CreatesTrainerExercise_WhenMissingFromLibrary()
    {
        var unique = $"Bundle Curl {Guid.NewGuid():N}"[..28];
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var bundle = new
        {
            kind = "repmaxer.client-bundle",
            version = 1,
            exportedAt = DateTime.UtcNow,
            client = new { name = "Bundle Target", email = (string?)null, note = (string?)null },
            meta = new { skippedFormChecks = 0, skippedPortalLinks = 0, hadPortalPin = false },
            exercises = new[]
            {
                new { id = 91001, name = unique, type = "reps", defaultSets = 3, defaultReps = 8 },
            },
            plans = new[]
            {
                new
                {
                    id = 92001,
                    name = "Bundle plan",
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
            assignments = new[]
            {
                new { id = 94001, planId = 92001, startDate = today, status = "active" },
            },
            sessions = new[]
            {
                new
                {
                    assignmentId = 94001,
                    planId = 92001,
                    planDayId = 93001,
                    performedOn = today,
                    status = "completed",
                    note = "z kopii",
                    exercises = new[]
                    {
                        new
                        {
                            exerciseId = 91001,
                            order = 0,
                            sets = new[] { new { setNumber = 1, weightKg = 12.0, reps = 8, completed = true } },
                        },
                    },
                },
            },
        };

        var import = await _client.PostAsJsonAsync("/api/clients/bundle", bundle);
        Assert.Equal(HttpStatusCode.Created, import.StatusCode);
        var result = await import.Content.ReadFromJsonAsync<ImportResult>(JsonOpts);
        Assert.NotNull(result);
        Assert.Equal(1, result!.CreatedExercises);
        Assert.Equal(1, result.CreatedPlans);
        Assert.Equal(1, result.SessionCount);

        var exercises = await _client.GetFromJsonAsync<JsonElement>("/api/exercises");
        Assert.Contains(exercises.EnumerateArray(), e => e.GetProperty("name").GetString() == unique);

        var second = await _client.PostAsJsonAsync("/api/clients/bundle", bundle);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);
        var again = await second.Content.ReadFromJsonAsync<ImportResult>(JsonOpts);
        Assert.Equal(0, again!.CreatedExercises);
    }
}
