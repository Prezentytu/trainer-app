using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class MvpRetentionTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public MvpRetentionTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Health_IsPublic()
    {
        var res = await _client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Me_ReturnsLocalTrainer_WhenAuthDisabled()
    {
        var res = await _client.GetAsync("/api/me");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("local-dev", json.GetProperty("clerkUserId").GetString());
    }

    [Fact]
    public async Task Dashboard_IncludesAttention()
    {
        var res = await _client.GetAsync("/api/dashboard");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("attention", out var attention));
        Assert.Equal(JsonValueKind.Array, attention.ValueKind);
    }

    [Fact]
    public async Task Export_ReturnsScopedPayload()
    {
        var res = await _client.GetAsync("/api/export");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("clients", out _));
        Assert.True(json.TryGetProperty("plans", out _));
        Assert.True(json.TryGetProperty("sessions", out _));
    }

    [Fact]
    public async Task PortalProgressReport_WorksForDemoToken()
    {
        var res = await _client.GetAsync("/api/portal/demo-jan-kowalski/progress-report");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("facts", out var facts));
        Assert.True(facts.GetArrayLength() >= 1);
    }
}
