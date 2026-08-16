using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TrainerApp.Api;
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
    public async Task PlansList_IsLightweight_WithoutDays()
    {
        var res = await _client.GetAsync("/api/plans");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement[0];
        Assert.True(first.TryGetProperty("daysCount", out _));
        Assert.True(first.TryGetProperty("exerciseCount", out _));
        Assert.False(first.TryGetProperty("days", out _));
    }

    [Fact]
    public async Task Dashboard_ReturnsAggregates()
    {
        var res = await _client.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.GetProperty("clients").GetInt32() >= 1);
        Assert.True(doc.RootElement.TryGetProperty("recentSessions", out _));
        Assert.True(doc.RootElement.TryGetProperty("recentPrs", out _));
        Assert.True(doc.RootElement.TryGetProperty("clientActivity", out _));
        Assert.True(doc.RootElement.TryGetProperty("prsLast7Days", out _));
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
        Assert.True(doc.RootElement.TryGetProperty("week", out var week) && week.ValueKind == JsonValueKind.Array);
        Assert.True(week.GetArrayLength() == 0 || week[0].TryGetProperty("scheduledOn", out _));
        if (today.ValueKind == JsonValueKind.Object)
            Assert.True(today.TryGetProperty("scheduledOn", out _));
    }

    [Fact]
    public async Task PortalStart_RejectsForeignPlanDay()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");
        // Drugi klient (utwórz jeśli seed ma tylko Jana)
        var other = clients!.FirstOrDefault(c => c.Id != jan.Id);
        if (other is null)
        {
            var created = await _client.PostAsJsonAsync("/api/clients", new { name = "Test Ownership", email = (string?)null, note = (string?)null });
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var createdBody = await created.Content.ReadFromJsonAsync<ClientRow>(JsonOpts);
            other = createdBody!;
        }

        var assignments = await _client.GetFromJsonAsync<List<AssignmentRow>>("/api/assignments");
        var janAssignment = assignments!.First(a => a.ClientId == jan.Id && a.Status == "active");
        var planRes = await _client.GetAsync($"/api/plans/{janAssignment.PlanId}");
        var planJson = await planRes.Content.ReadAsStringAsync();
        using var planDoc = JsonDocument.Parse(planJson);
        var dayId = planDoc.RootElement.GetProperty("days")[0].GetProperty("id").GetInt32();

        var tokenRes = await _client.GetAsync($"/api/clients/{other.Id}/access-token");
        var tokenJson = await tokenRes.Content.ReadAsStringAsync();
        using var tokenDoc = JsonDocument.Parse(tokenJson);
        var token = tokenDoc.RootElement.GetProperty("token").GetString()!;

        var start = await _client.PostAsJsonAsync($"/api/portal/{token}/sessions/start", new
        {
            clientId = other.Id,
            planDayId = dayId,
        });
        Assert.Equal(HttpStatusCode.NotFound, start.StatusCode);
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
        var sessionJson = await start.Content.ReadAsStringAsync();
        using var sessionDoc = JsonDocument.Parse(sessionJson);
        var sessionId = sessionDoc.RootElement.GetProperty("id").GetInt32();
        Assert.Equal("in_progress", sessionDoc.RootElement.GetProperty("status").GetString());
        Assert.True(sessionDoc.RootElement.GetProperty("exercises").GetArrayLength() > 0);
        var firstEx = sessionDoc.RootElement.GetProperty("exercises")[0];
        Assert.True(firstEx.TryGetProperty("prevSets", out _));
        Assert.True(firstEx.TryGetProperty("restSeconds", out _));
        Assert.True(firstEx.TryGetProperty("targetRir", out _) || firstEx.TryGetProperty("planNote", out _) || firstEx.TryGetProperty("tempo", out _));
        var firstSet = firstEx.GetProperty("sets")[0];
        Assert.True(firstSet.TryGetProperty("targetWeightKg", out _) || firstSet.TryGetProperty("targetReps", out _) || firstSet.TryGetProperty("targetDurationSeconds", out _));
        var firstSetId = firstSet.GetProperty("id").GetInt32();

        // PUT z tym samym Id serii — stabilność ID
        var exercises = sessionDoc.RootElement.GetProperty("exercises").EnumerateArray().Select(e => new
        {
            id = e.GetProperty("id").GetInt32(),
            exerciseId = e.GetProperty("exerciseId").GetInt32(),
            order = e.GetProperty("order").GetInt32(),
            note = e.TryGetProperty("note", out var n) && n.ValueKind != JsonValueKind.Null ? n.GetString() : null,
            sets = e.GetProperty("sets").EnumerateArray().Select(s => new
            {
                id = s.GetProperty("id").GetInt32(),
                setNumber = s.GetProperty("setNumber").GetInt32(),
                weightKg = s.TryGetProperty("weightKg", out var w) && w.ValueKind != JsonValueKind.Null ? w.GetDouble() : (double?)null,
                reps = s.TryGetProperty("reps", out var r) && r.ValueKind != JsonValueKind.Null ? r.GetInt32() : (int?)null,
                durationSeconds = (int?)null,
                distanceMeters = (int?)null,
                rir = (double?)null,
                rpe = (double?)null,
                isWarmup = s.GetProperty("isWarmup").GetBoolean(),
                completed = true,
            }).ToList(),
        }).ToList();

        var put = await _client.PutAsJsonAsync($"/api/sessions/{sessionId}", new
        {
            clientId = jan.Id,
            performedOn = sessionDoc.RootElement.GetProperty("performedOn").GetString(),
            assignmentId = active.Id,
            planId = active.PlanId,
            planDayId = dayId,
            status = "in_progress",
            exercises,
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var putJson = await put.Content.ReadAsStringAsync();
        using var putDoc = JsonDocument.Parse(putJson);
        var putSetId = putDoc.RootElement.GetProperty("exercises")[0].GetProperty("sets")[0].GetProperty("id").GetInt32();
        Assert.Equal(firstSetId, putSetId);
        Assert.True(putDoc.RootElement.GetProperty("exercises")[0].GetProperty("sets")[0].GetProperty("completed").GetBoolean());

        var complete = await _client.PatchAsync($"/api/sessions/{sessionId}/complete", null);
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);

        var progress = await _client.GetFromJsonAsync<ProgressRow>($"/api/clients/{jan.Id}/progress");
        Assert.NotNull(progress);
        Assert.True(progress!.Completed >= 1);
    }

    [Fact]
    public async Task SessionCreatedAt_SerializesWithUtcZ()
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
        var json = await start.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var createdAt = doc.RootElement.GetProperty("createdAt").GetString();
        Assert.NotNull(createdAt);
        Assert.EndsWith("Z", createdAt!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteSession_RespectsClientDurationSeconds()
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
        var sessionJson = await start.Content.ReadAsStringAsync();
        using var sessionDoc = JsonDocument.Parse(sessionJson);
        var sessionId = sessionDoc.RootElement.GetProperty("id").GetInt32();

        var exercises = sessionDoc.RootElement.GetProperty("exercises").EnumerateArray().Select(e => new
        {
            id = e.GetProperty("id").GetInt32(),
            exerciseId = e.GetProperty("exerciseId").GetInt32(),
            order = e.GetProperty("order").GetInt32(),
            note = (string?)null,
            sets = e.GetProperty("sets").EnumerateArray().Select(s => new
            {
                id = s.GetProperty("id").GetInt32(),
                setNumber = s.GetProperty("setNumber").GetInt32(),
                weightKg = (double?)40,
                reps = (int?)8,
                durationSeconds = (int?)null,
                distanceMeters = (int?)null,
                rir = (double?)null,
                rpe = (double?)null,
                isWarmup = false,
                completed = true,
            }).ToList(),
        }).ToList();

        var put = await _client.PutAsJsonAsync($"/api/sessions/{sessionId}", new
        {
            clientId = jan.Id,
            performedOn = sessionDoc.RootElement.GetProperty("performedOn").GetString(),
            assignmentId = active.Id,
            planId = active.PlanId,
            planDayId = dayId,
            durationSeconds = 420,
            status = "in_progress",
            exercises,
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var complete = await _client.PatchAsync($"/api/sessions/{sessionId}/complete", null);
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);
        var completeJson = await complete.Content.ReadAsStringAsync();
        using var completeDoc = JsonDocument.Parse(completeJson);
        Assert.Equal(420, completeDoc.RootElement.GetProperty("durationSeconds").GetInt32());
    }

    [Fact]
    public async Task UpdateSession_RejectsFuturePerformedOn()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");
        var create = await _client.PostAsJsonAsync("/api/sessions", new
        {
            clientId = jan.Id,
            performedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            status = "in_progress",
            exercises = Array.Empty<object>(),
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var json = await create.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var sessionId = doc.RootElement.GetProperty("id").GetInt32();

        var future = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(3).ToString("yyyy-MM-dd");
        var put = await _client.PutAsJsonAsync($"/api/sessions/{sessionId}", new
        {
            clientId = jan.Id,
            performedOn = future,
            status = "in_progress",
            exercises = Array.Empty<object>(),
        });
        Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
        var err = await put.Content.ReadAsStringAsync();
        Assert.Contains("przyszłą datą", err, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SessionWithoutPlanDay_HasNullTargets()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");
        var exercises = await _client.GetFromJsonAsync<List<ExerciseRow>>("/api/exercises");
        var first = exercises!.First();

        var create = await _client.PostAsJsonAsync("/api/sessions", new
        {
            clientId = jan.Id,
            performedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            status = "in_progress",
            exercises = new[]
            {
                new
                {
                    exerciseId = first.Id,
                    order = 0,
                    note = (string?)null,
                    sets = new[]
                    {
                        new
                        {
                            setNumber = 1,
                            weightKg = (double?)40,
                            reps = (int?)8,
                            durationSeconds = (int?)null,
                            distanceMeters = (int?)null,
                            rir = (double?)null,
                            rpe = (double?)null,
                            isWarmup = false,
                            completed = false,
                        },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var json = await create.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var ex = doc.RootElement.GetProperty("exercises")[0];
        Assert.True(!ex.TryGetProperty("targetRir", out var tr) || tr.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined);
        var set = ex.GetProperty("sets")[0];
        Assert.True(!set.TryGetProperty("targetWeightKg", out var tw) || tw.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined);
        Assert.True(!set.TryGetProperty("targetReps", out var treps) || treps.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined);
    }

    [Fact]
    public void VolumeKg_IgnoresIncompletePrefill()
    {
        var sets = new LoggedSet[]
        {
            new() { WeightKg = 100, Reps = 10, Completed = false, IsWarmup = false },
            new() { WeightKg = 80, Reps = 8, Completed = true, IsWarmup = false },
            new() { WeightKg = 60, Reps = 10, Completed = true, IsWarmup = true },
        };
        Assert.Equal(640, Stats.VolumeKg(sets));
    }

    [Fact]
    public async Task StartSession_CopiesSupersetGroupAndSharedRest()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");
        var assignments = await _client.GetFromJsonAsync<List<AssignmentRow>>("/api/assignments");
        var active = assignments!.First(a => a.ClientId == jan.Id && a.Status == "active");
        var planRes = await _client.GetAsync($"/api/plans/{active.PlanId}");
        var planJson = await planRes.Content.ReadAsStringAsync();
        using var planDoc = JsonDocument.Parse(planJson);
        var day = planDoc.RootElement.GetProperty("days")[0];
        var dayId = day.GetProperty("id").GetInt32();
        var grouped = day.GetProperty("items").EnumerateArray()
            .Where(i => i.TryGetProperty("supersetGroup", out var g) && g.ValueKind == JsonValueKind.Number)
            .ToList();
        Assert.True(grouped.Count >= 2);

        var start = await _client.PostAsJsonAsync("/api/sessions/start", new
        {
            clientId = jan.Id,
            assignmentId = active.Id,
            planId = active.PlanId,
            planDayId = dayId,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        using var sessionDoc = JsonDocument.Parse(await start.Content.ReadAsStringAsync());
        var exercises = sessionDoc.RootElement.GetProperty("exercises").EnumerateArray().ToList();
        var super = exercises
            .Where(e => e.TryGetProperty("supersetGroup", out var g) && g.ValueKind == JsonValueKind.Number)
            .ToList();
        Assert.True(super.Count >= 2);
        var groupId = super[0].GetProperty("supersetGroup").GetInt32();
        Assert.All(super, e => Assert.Equal(groupId, e.GetProperty("supersetGroup").GetInt32()));
        var labels = super.Select(e => e.GetProperty("supersetLabel").GetString()).ToList();
        Assert.Contains(labels, l => l != null && l.EndsWith("a"));
        Assert.Contains(labels, l => l != null && l.EndsWith("b"));
        var rests = super.Select(e => e.GetProperty("restSeconds").GetInt32()).Distinct().ToList();
        Assert.Single(rests);
        Assert.Equal(90, rests[0]);
    }

    [Fact]
    public void SupersetLabels_PairGetsPositionLetters()
    {
        var ordered = new List<LoggedExercise>
        {
            new() { Order = 0, SupersetGroup = null },
            new() { Order = 1, SupersetGroup = 1 },
            new() { Order = 2, SupersetGroup = 1 },
            new() { Order = 3, SupersetGroup = null },
        };
        var labels = Sessions.SupersetLabels(ordered);
        Assert.Null(labels[0]);
        Assert.Equal("2a", labels[1]);
        Assert.Equal("2b", labels[2]);
        Assert.Null(labels[3]);
    }

    private record ClientRow(int Id, string Name);
    private record ExerciseRow(int Id, string Name);
    private record MaxRow(int Id, double MaxKg, string ExerciseName);
    private record PlanRow(int Id, string Name);
    private record AssignmentRow(int Id, int PlanId, int ClientId, string Status);
    private record ProgressRow(int Completed, int Total, int Percent);
}
