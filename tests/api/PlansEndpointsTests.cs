using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class PlansEndpointsTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public PlansEndpointsTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    private record CreatedPlan(int Id);

    private static object BuildPlanInput(double? targetRir, double? setTargetRir) => new
    {
        name = "Test RIR",
        description = (string?)null,
        isTemplate = true,
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
                        exerciseId = 1,
                        order = 1,
                        targetRir,
                        prescribedSets = new[]
                        {
                            new { order = 1, reps = 8, targetRir = setTargetRir },
                        },
                    },
                },
            },
        },
    };

    [Fact]
    public async Task CreatePlan_WithTargetRir_RoundTripsOnGet()
    {
        var post = await _client.PostAsJsonAsync("/api/plans", BuildPlanInput(2, 1.5));
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<CreatedPlan>();
        Assert.NotNull(created);

        var getResponse = await _client.GetAsync($"/api/plans/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        using var doc = JsonDocument.Parse(await getResponse.Content.ReadAsStringAsync());
        var item = doc.RootElement.GetProperty("days")[0].GetProperty("items")[0];

        Assert.Equal(2, item.GetProperty("targetRir").GetDouble());
        var set = item.GetProperty("prescribedSets")[0];
        Assert.Equal(1.5, set.GetProperty("targetRir").GetDouble());
    }

    [Fact]
    public async Task DuplicatePlan_CopiesTargetRir()
    {
        var post = await _client.PostAsJsonAsync("/api/plans", BuildPlanInput(3, null));
        var created = await post.Content.ReadFromJsonAsync<CreatedPlan>();
        Assert.NotNull(created);

        var duplicate = await _client.PostAsJsonAsync($"/api/plans/{created!.Id}/duplicate", new { name = (string?)null, isTemplate = (bool?)null });
        Assert.Equal(HttpStatusCode.Created, duplicate.StatusCode);
        var copy = await duplicate.Content.ReadFromJsonAsync<CreatedPlan>();
        Assert.NotNull(copy);

        var getResponse = await _client.GetAsync($"/api/plans/{copy!.Id}");
        using var doc = JsonDocument.Parse(await getResponse.Content.ReadAsStringAsync());
        var item = doc.RootElement.GetProperty("days")[0].GetProperty("items")[0];

        Assert.Equal(3, item.GetProperty("targetRir").GetDouble());
    }
}
