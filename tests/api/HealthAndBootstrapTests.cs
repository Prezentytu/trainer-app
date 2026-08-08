using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class HealthAndBootstrapTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public HealthAndBootstrapTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task HealthLive_IsPublic_AndDoesNotRequireDatabasePayload()
    {
        var res = await _client.GetAsync("/api/health/live");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ok", json.GetProperty("status").GetString());
        Assert.False(json.TryGetProperty("database", out _), "Liveness nie powinien raportować stanu bazy.");
    }

    [Fact]
    public async Task Root_IsPublic_ForAlwaysOnPing()
    {
        var res = await _client.GetAsync("/");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ok", json.GetProperty("status").GetString());
    }

    [Theory]
    [InlineData("Postgres", false, false)]
    [InlineData("Postgres", true, true)]
    [InlineData("Sqlite", false, false)]
    [InlineData("Sqlite", true, false)]
    public void ShouldMigrateOnStartup_OnlyPostgresWhenFlagEnabled(
        string provider, bool flag, bool expected)
    {
        Assert.Equal(expected, DatabaseBootstrap.ShouldMigrateOnStartup(provider, flag));
    }

    [Theory]
    [InlineData("Postgres", false)]
    [InlineData("Sqlite", true)]
    [InlineData(null, true)]
    public void ShouldSeedSynchronously_OnlyNonPostgres(string? provider, bool expected)
    {
        Assert.Equal(expected, DatabaseBootstrap.ShouldSeedSynchronously(provider));
    }
}
