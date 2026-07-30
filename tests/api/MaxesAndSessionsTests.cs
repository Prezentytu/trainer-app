using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class MaxesAndSessionsTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public MaxesAndSessionsTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task ClientMaxes_SeededForJan()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");

        var maxes = await _client.GetFromJsonAsync<List<MaxRow>>($"/api/clients/{jan.Id}/maxes");
        Assert.NotNull(maxes);
        Assert.Contains(maxes!, m => m.MaxKg >= 80);
    }

    [Fact]
    public async Task PlanWithClientId_ComputesPercentLoad()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");
        var plans = await _client.GetFromJsonAsync<List<PlanRow>>("/api/plans");
        var clientPlan = plans!.First(p => p.Name.Contains("Jan"));

        var res = await _client.GetAsync($"/api/plans/{clientPlan.Id}?clientId={jan.Id}");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var items = doc.RootElement.GetProperty("days")[0].GetProperty("items");
        var squat = items.EnumerateArray().First(i => i.GetProperty("exerciseName").GetString()!.Contains("Przysiad"));
        Assert.True(squat.TryGetProperty("loadPercent", out var lp) && lp.GetDouble() == 70);
        Assert.True(squat.TryGetProperty("computedLoadKg", out var ck) && ck.GetDouble() == 70);
    }

    [Fact]
    public async Task PortalHome_WithDemoToken_ReturnsToday()
    {
        var res = await _client.GetAsync("/api/portal/demo-jan-kowalski");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("Jan Kowalski", doc.RootElement.GetProperty("client").GetProperty("name").GetString());
        Assert.True(doc.RootElement.TryGetProperty("today", out var today) && today.ValueKind != JsonValueKind.Null);
    }

    [Fact]
    public async Task StartAndCompleteSession_Works()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");
        var assignments = await _client.GetFromJsonAsync<List<AssignmentRow>>("/api/assignments");
        var active = assignments!.First(a => a.ClientId == jan.Id && a.Status == "active");
        var planRes = await _client.GetAsync($"/api/plans/{active.PlanId}");
        var planJson = await planRes.Content.ReadAsStringAsync();
        using var planDoc = JsonDocument.Parse(planJson);
        var dayId = planDoc.RootElement.GetProperty("days")[0].GetProperty("id").GetInt32();

        var start = await _client.PostAsJsonAsync("/api/sessions/start", new
        {
            clientId = jan.Id,
            assignmentId = active.Id,
            planId = active.PlanId,
            planDayId = dayId,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        var session = await start.Content.ReadFromJsonAsync<SessionRow>(JsonOpts);
        Assert.NotNull(session);
        Assert.Equal("in_progress", session!.Status);
        Assert.True(session.Exercises.Count > 0);

        var complete = await _client.PatchAsync($"/api/sessions/{session.Id}/complete", null);
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);

        var progress = await _client.GetFromJsonAsync<ProgressRow>($"/api/clients/{jan.Id}/progress");
        Assert.NotNull(progress);
        Assert.True(progress!.Completed >= 1);
    }

    private record ClientRow(int Id, string Name);
    private record MaxRow(int Id, double MaxKg, string ExerciseName);
    private record PlanRow(int Id, string Name);
    private record AssignmentRow(int Id, int PlanId, int ClientId, string Status);
    private record ProgressRow(int Completed, int Total, int Percent);
    private record SessionRow(int Id, string Status, List<object> Exercises);
}
