using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

/// <summary>
/// Osobna fabryka — DELETE /api/account kasuje seed; nie wolno dzielić DB z innymi klasami.
/// </summary>
public class AccountDeletionTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public AccountDeletionTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task DeleteAccount_ReturnsNoContent_AndRecreatesLocalTrainerOnNextMe()
    {
        var before = await _client.GetAsync("/api/me");
        before.EnsureSuccessStatusCode();
        var beforeJson = await before.Content.ReadFromJsonAsync<JsonElement>();
        var beforeId = beforeJson.GetProperty("id").GetInt32();

        var del = await _client.DeleteAsync("/api/account");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        // Auth wyłączony: RequireTrainerAsync tworzy nowego local-dev, jeśli brak.
        var after = await _client.GetAsync("/api/me");
        after.EnsureSuccessStatusCode();
        var afterJson = await after.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("local-dev", afterJson.GetProperty("clerkUserId").GetString());
        Assert.NotEqual(beforeId, afterJson.GetProperty("id").GetInt32());
    }
}
