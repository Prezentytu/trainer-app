using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class RetentionLoopTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;

    public RetentionLoopTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Me_IncludesPlanAndNotificationFlags()
    {
        var res = await _client.GetAsync("/api/me");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        Assert.Equal("dev", doc.RootElement.GetProperty("planKey").GetString());
        Assert.True(doc.RootElement.GetProperty("notifyDailySummary").GetBoolean());
        Assert.True(doc.RootElement.GetProperty("notifyClientReply").GetBoolean());
        Assert.True(doc.RootElement.GetProperty("notifyWeeklyDigest").GetBoolean());
        Assert.False(doc.RootElement.TryGetProperty("notifySessionComplete", out _));
    }

    [Fact]
    public async Task Preferences_CanDisableDailySummary()
    {
        var put = await _client.PutAsJsonAsync("/api/me/preferences", new { notifyDailySummary = false });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var me = await _client.GetAsync("/api/me");
        using var doc = JsonDocument.Parse(await me.Content.ReadAsStringAsync());
        Assert.False(doc.RootElement.GetProperty("notifyDailySummary").GetBoolean());
        await _client.PutAsJsonAsync("/api/me/preferences", new { notifyDailySummary = true });
    }

    [Fact]
    public async Task FreePlan_RejectsSixthClient()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var trainer = db.Trainers.First(t => t.ClerkUserId == TrainerAccess.LocalClerkUserId);
        trainer.PlanKey = BillingPlans.Free;
        db.SaveChanges();

        try
        {
            while (db.Clients.Count(c => c.TrainerId == trainer.Id) < 5)
            {
                var n = db.Clients.Count(c => c.TrainerId == trainer.Id);
                var post = await _client.PostAsJsonAsync("/api/clients", new
                {
                    name = $"Limit {n}",
                    email = (string?)null,
                    note = (string?)null,
                });
                Assert.Equal(HttpStatusCode.Created, post.StatusCode);
            }

            var blocked = await _client.PostAsJsonAsync("/api/clients", new
            {
                name = "Ponad limit",
                email = (string?)null,
                note = (string?)null,
            });
            Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);
            var body = await blocked.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("client_limit", body.GetProperty("code").GetString());
        }
        finally
        {
            trainer.PlanKey = BillingPlans.Dev;
            db.SaveChanges();
        }
    }

    [Fact]
    public async Task ImportCsv_CreatesClients()
    {
        var res = await _client.PostAsJsonAsync("/api/clients/import", new
        {
            csv = "name,email\nImport Anna,anna-import@example.com\nImport Piotr,",
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetProperty("created").GetInt32() >= 2);
    }

    [Fact]
    public async Task PortalPin_BlocksUntilHeaderMatches()
    {
        var jan = (await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients"))!
            .First(c => c.Name == "Jan Kowalski");
        var set = await _client.PostAsJsonAsync($"/api/clients/{jan.Id}/portal-pin", new { pin = "1234" });
        Assert.Equal(HttpStatusCode.OK, set.StatusCode);

        var blocked = await _client.GetAsync("/api/portal/demo-jan-kowalski");
        Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/portal/demo-jan-kowalski");
        req.Headers.Add("X-Portal-Pin", "1234");
        var ok = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);

        await _client.PostAsJsonAsync($"/api/clients/{jan.Id}/portal-pin", new { pin = (string?)null });
    }

    [Fact]
    public async Task ProgressPhoto_UploadAndList()
    {
        var jan = (await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients"))!
            .First(c => c.Name == "Jan Kowalski");
        const string png =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        var post = await _client.PostAsJsonAsync($"/api/clients/{jan.Id}/photos", new
        {
            imageBase64 = png,
            contentType = "image/png",
            takenOn = "2026-08-13",
            view = "front",
        });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var list = await _client.GetAsync($"/api/clients/{jan.Id}/photos");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        using var doc = JsonDocument.Parse(await list.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Inbox_ReturnsArray()
    {
        var res = await _client.GetAsync("/api/inbox");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var rows = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, rows.ValueKind);
        Assert.True(rows.GetArrayLength() >= 1);
        var first = rows[0];
        Assert.True(first.TryGetProperty("id", out _));
        Assert.True(first.TryGetProperty("kind", out _));
        Assert.True(first.TryGetProperty("unread", out _));
    }

    [Fact]
    public async Task PortalNote_CreatesInboxItem_AndMarkRead()
    {
        const string token = "demo-jan-kowalski";
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var checkin = await _client.PostAsJsonAsync($"/api/portal/{token}/check-ins", new
        {
            moodScore = 1,
            note = "Słabo spałem",
            date = today.ToString("yyyy-MM-dd"),
        });
        Assert.Equal(HttpStatusCode.OK, checkin.StatusCode);

        var inbox = await _client.GetAsync("/api/inbox?kind=low_checkin&unreadOnly=true");
        Assert.Equal(HttpStatusCode.OK, inbox.StatusCode);
        using var doc = JsonDocument.Parse(await inbox.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetArrayLength() >= 1);
        var item = doc.RootElement.EnumerateArray()
            .First(r => r.GetProperty("preview").GetString()!.Contains("Samopoczucie 1/5"));
        Assert.True(item.GetProperty("unread").GetBoolean());
        var id = item.GetProperty("id").GetInt32();

        var read = await _client.PostAsync($"/api/inbox/{id}/read", null);
        Assert.Equal(HttpStatusCode.NoContent, read.StatusCode);

        var after = await _client.GetAsync("/api/inbox?kind=low_checkin&unreadOnly=true");
        using var afterDoc = JsonDocument.Parse(await after.Content.ReadAsStringAsync());
        Assert.DoesNotContain(
            afterDoc.RootElement.EnumerateArray(),
            r => r.GetProperty("id").GetInt32() == id);
    }

    [Fact]
    public async Task Inbox_MarkAllRead_ClearsUnreadCount()
    {
        const string token = "demo-jan-kowalski";
        var photoNote = await _client.PostAsJsonAsync($"/api/portal/{token}/measurements", new
        {
            measuredOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            weightKg = 82.5,
        });
        Assert.Equal(HttpStatusCode.Created, photoNote.StatusCode);

        var countsBefore = await _client.GetAsync("/api/counts");
        using var beforeDoc = JsonDocument.Parse(await countsBefore.Content.ReadAsStringAsync());
        Assert.True(beforeDoc.RootElement.GetProperty("inboxUnread").GetInt32() >= 1);

        var all = await _client.PostAsync("/api/inbox/read-all", null);
        Assert.Equal(HttpStatusCode.OK, all.StatusCode);

        var countsAfter = await _client.GetAsync("/api/counts");
        using var afterDoc = JsonDocument.Parse(await countsAfter.Content.ReadAsStringAsync());
        Assert.Equal(0, afterDoc.RootElement.GetProperty("inboxUnread").GetInt32());
    }

    [Fact]
    public async Task SessionCommentRead_MarksSessionNotifications()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var trainer = db.Trainers.First(t => t.ClerkUserId == TrainerAccess.LocalClerkUserId);
        var jan = db.Clients.First(c => c.Name == "Jan Kowalski");
        var session = db.WorkoutSessions.First(s => s.ClientId == jan.Id);
        var row = new TrainerNotification
        {
            TrainerId = trainer.Id,
            ClientId = jan.Id,
            Kind = TrainerNotifications.SessionNote,
            SessionId = session.Id,
            Preview = "Ból w lędźwiach",
        };
        db.TrainerNotifications.Add(row);
        await db.SaveChangesAsync();
        var id = row.Id;

        var res = await _client.PostAsync($"/api/sessions/{session.Id}/comment/read", null);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        await db.Entry(row).ReloadAsync();
        Assert.NotNull(row.ReadAt);
        Assert.Equal(id, row.Id);
    }

    [Fact]
    public async Task DigestCron_UnauthorizedWithoutKey()
    {
        var res = await _client.PostAsync("/api/cron/digest", null);
        Assert.True(
            res.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task BillingCheckout_ConflictsWhenStripeMissing()
    {
        var res = await _client.PostAsJsonAsync("/api/billing/checkout", new { planKey = "starter" });
        Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
    }

    private record ClientRow(int Id, string Name);
}
