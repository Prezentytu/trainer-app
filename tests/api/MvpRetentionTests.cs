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
    public async Task Dashboard_IncludesFromClients()
    {
        var res = await _client.GetAsync("/api/dashboard");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("fromClients", out var fromClients));
        Assert.Equal(JsonValueKind.Array, fromClients.ValueKind);
    }

    [Fact]
    public async Task Dashboard_IncludesClientActivityAndWeeklyStats()
    {
        var res = await _client.GetAsync("/api/dashboard");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("clientActivity", out var activity));
        Assert.Equal(JsonValueKind.Array, activity.ValueKind);
        Assert.True(activity.GetArrayLength() >= 1);
        var first = activity[0];
        Assert.True(first.TryGetProperty("clientId", out _));
        Assert.True(first.TryGetProperty("clientName", out _));
        Assert.True(first.TryGetProperty("sessions7d", out _));
        Assert.True(first.TryGetProperty("activePlans", out _));
        Assert.True(json.TryGetProperty("sessionsLast7Days", out var s7));
        Assert.Equal(JsonValueKind.Number, s7.ValueKind);
        Assert.True(json.TryGetProperty("sessionsPrev7Days", out var sPrev));
        Assert.Equal(JsonValueKind.Number, sPrev.ValueKind);
        Assert.True(json.TryGetProperty("prsLast7Days", out var prs));
        Assert.Equal(JsonValueKind.Number, prs.ValueKind);
        Assert.False(json.TryGetProperty("complianceDates", out _));
        Assert.True(json.TryGetProperty("activation", out var activation));
        Assert.True(activation.TryGetProperty("hasCompletedSession", out _));
        Assert.True(activation.TryGetProperty("clientsWithSessionLast14Days", out _));
        Assert.True(activation.TryGetProperty("trainerCreatedAt", out _));
    }

    [Fact]
    public async Task Export_ReturnsScopedPayload()
    {
        var res = await _client.GetAsync("/api/export");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("clients", out var clients));
        Assert.True(json.TryGetProperty("plans", out _));
        Assert.True(json.TryGetProperty("sessions", out _));
        Assert.True(clients.GetArrayLength() >= 1);
        var first = clients[0];
        Assert.True(first.TryGetProperty("measurements", out _));
        Assert.True(first.TryGetProperty("checkIns", out _));
        Assert.False(first.TryGetProperty("tokens", out _), "Eksport nie może zawierać surowych tokenów portalu.");
        Assert.True(first.TryGetProperty("portalLinkCount", out _));
    }

    [Fact]
    public async Task ExportCsv_IncludesSetRows()
    {
        var res = await _client.GetAsync("/api/export/csv");
        res.EnsureSuccessStatusCode();
        var csv = await res.Content.ReadAsStringAsync();
        Assert.Contains("section,sessionId,client,date,exercise,setNumber", csv);
    }


    [Fact]
    public async Task PortalProgressReport_WorksForDemoToken()
    {
        var res = await _client.GetAsync("/api/portal/demo-jan-kowalski/progress-report");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("facts", out var facts));
        Assert.True(facts.GetArrayLength() <= 3);
        foreach (var fact in facts.EnumerateArray())
        {
            var text = fact.GetProperty("text").GetString() ?? "";
            Assert.DoesNotContain("Brak ukończonych", text, StringComparison.Ordinal);
        }
    }

    [Fact]
    public async Task TrainerProgressReport_WorksForDemoClient()
    {
        var clients = await _client.GetAsync("/api/clients");
        clients.EnsureSuccessStatusCode();
        var list = await clients.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(list.GetArrayLength() >= 1);
        var clientId = list[0].GetProperty("id").GetInt32();

        var res = await _client.GetAsync($"/api/clients/{clientId}/progress-report");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("facts", out var facts));
        Assert.True(facts.GetArrayLength() <= 3);
        foreach (var fact in facts.EnumerateArray())
        {
            var text = fact.GetProperty("text").GetString() ?? "";
            Assert.DoesNotContain("Brak ukończonych", text, StringComparison.Ordinal);
        }
    }

    [Fact]
    public async Task FoundingApply_Whiteglove_ReturnsOk()
    {
        var res = await _client.PostAsJsonAsync("/api/founding/apply", new
        {
            name = "Anna Test",
            email = "anna@example.com",
            preferredSlot = "Środa 18:00",
            track = "whiteglove",
        });
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("ok").GetBoolean());
        Assert.False(string.IsNullOrWhiteSpace(json.GetProperty("message").GetString()));
        Assert.True(json.TryGetProperty("emailSent", out var sent));
        Assert.False(sent.GetBoolean());
        Assert.Contains("kontakt@repmaxer.pl", json.GetProperty("message").GetString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task FoundingApply_PaidTrack_ReturnsOkWithoutCheckoutWhenStripeOff()
    {
        var res = await _client.PostAsJsonAsync("/api/founding/apply", new
        {
            name = "Bartek Test",
            email = "bartek@example.com",
            preferredSlot = "Czwartek 10:00",
            track = "founding",
        });
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("ok").GetBoolean());
        Assert.False(json.TryGetProperty("checkoutUrl", out var url) && url.ValueKind == JsonValueKind.String && url.GetString()?.Length > 0);
        Assert.Contains("390", json.GetProperty("message").GetString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task FoundingApply_RejectsEmptyName()
    {
        var res = await _client.PostAsJsonAsync("/api/founding/apply", new
        {
            name = "A",
            email = "a@b.c",
            track = "whiteglove",
        });
        Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
    }
}
