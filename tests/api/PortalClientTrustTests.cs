using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class PortalClientTrustTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebAppFactory _factory;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public PortalClientTrustTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PortalExport_ReturnsCsvHeader()
    {
        var res = await _client.GetAsync("/api/portal/demo-jan-kowalski/export");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var csv = await res.Content.ReadAsStringAsync();
        Assert.Contains("section,sessionId,date,exercise", csv);
    }

    [Fact]
    public async Task PortalMaxes_MatchTrainerList()
    {
        var clients = await _client.GetFromJsonAsync<List<JsonElement>>("/api/clients", JsonOpts);
        var jan = clients!.Single(c => c.GetProperty("name").GetString() == "Jan Kowalski");
        var trainer = await _client.GetFromJsonAsync<List<JsonElement>>(
            $"/api/clients/{jan.GetProperty("id").GetInt32()}/maxes", JsonOpts);
        var portal = await _client.GetFromJsonAsync<List<JsonElement>>(
            "/api/portal/demo-jan-kowalski/maxes", JsonOpts);
        Assert.NotNull(trainer);
        Assert.NotNull(portal);
        Assert.Equal(trainer!.Count, portal!.Count);
        Assert.Contains(portal, m => m.GetProperty("maxKg").GetDouble() >= 80);
    }

    [Fact]
    public async Task PortalHistoryImportPending_ThenShowsDraft()
    {
        var emptyRes = await _client.GetAsync("/api/portal/demo-jan-kowalski/history-import/pending");
        Assert.Equal(HttpStatusCode.OK, emptyRes.StatusCode);
        var emptyBody = (await emptyRes.Content.ReadAsStringAsync()).Trim();
        Assert.True(emptyBody is "" or "null");

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var jan = db.Clients.Single(c => c.Name == "Jan Kowalski");
            db.ClientHistoryImports.Add(new ClientHistoryImport
            {
                ClientId = jan.Id,
                Status = "pending",
                DraftJson = "[]",
            });
            await db.SaveChangesAsync();
        }

        var pending = await _client.GetFromJsonAsync<JsonElement>(
            "/api/portal/demo-jan-kowalski/history-import/pending", JsonOpts);
        Assert.Equal("pending", pending.GetProperty("status").GetString());
    }

    [Fact]
    public async Task PortalFormCheck_UploadAndRead()
    {
        var exercises = await _client.GetFromJsonAsync<List<JsonElement>>("/api/exercises", JsonOpts);
        var exerciseId = exercises![0].GetProperty("id").GetInt32();
        var planRes = await _client.PostAsJsonAsync("/api/plans", new
        {
            name = $"FormCheck {Guid.NewGuid():N}",
            description = (string?)null,
            isTemplate = false,
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
                        new { exerciseId, order = 1, prescribedSets = new[] { new { order = 1, reps = 5, loadKg = 40 } } },
                    },
                },
            },
        });
        var planId = (await planRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("id").GetInt32();
        var planDoc = await (await _client.GetAsync($"/api/plans/{planId}")).Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        var dayId = planDoc.GetProperty("days")[0].GetProperty("id").GetInt32();

        var clientRes = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = $"Form {Guid.NewGuid():N}",
            email = (string?)null,
            note = (string?)null,
        });
        var clientId = (await clientRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("id").GetInt32();
        var assignRes = await _client.PostAsJsonAsync("/api/assignments", new
        {
            planId,
            clientId,
            startDate = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            note = (string?)null,
        });
        var assignmentId = (await assignRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("id").GetInt32();
        var tokenRes = await _client.GetAsync($"/api/clients/{clientId}/access-token");
        var token = (await tokenRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("token").GetString()!;

        var start = await _client.PostAsJsonAsync($"/api/portal/{token}/sessions/start", new
        {
            clientId,
            assignmentId,
            planId,
            planDayId = dayId,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        var session = await start.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        var sessionId = session.GetProperty("id").GetInt32();
        var exId = session.GetProperty("exercises")[0].GetProperty("id").GetInt32();

        const string png =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        var upload = await _client.PostAsJsonAsync(
            $"/api/portal/{token}/sessions/{sessionId}/exercises/{exId}/form-check",
            new { fileBase64 = png, contentType = "image/png", fileName = "form.png" });
        Assert.Equal(HttpStatusCode.Created, upload.StatusCode);

        var blob = await _client.GetAsync($"/api/portal/{token}/sessions/{sessionId}/exercises/{exId}/form-check");
        Assert.Equal(HttpStatusCode.OK, blob.StatusCode);
        Assert.Equal("image/png", blob.Content.Headers.ContentType?.MediaType);

        var dto = await _client.GetFromJsonAsync<JsonElement>($"/api/sessions/{sessionId}", JsonOpts);
        Assert.Equal(JsonValueKind.Object, dto.GetProperty("exercises")[0].GetProperty("formCheck").ValueKind);
    }
}
