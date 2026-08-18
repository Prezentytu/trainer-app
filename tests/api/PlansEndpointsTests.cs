using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class PlansEndpointsTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public PlansEndpointsTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

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

    [Fact]
    public async Task CreatePlan_WithMeasureType_RoundTripsAndDefaultsRespectMeasure()
    {
        // exerciseId 1 = Przysiad (reps); override na time nie dziedziczy DefaultRepDurationSeconds z reps
        var postTime = await _client.PostAsJsonAsync("/api/plans", new
        {
            name = "Test measure time",
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
                            measureType = "time",
                            sets = 3,
                            repDurationSeconds = 30,
                        },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, postTime.StatusCode);
        var createdTime = await postTime.Content.ReadFromJsonAsync<CreatedPlan>();
        Assert.NotNull(createdTime);

        var getTime = await _client.GetAsync($"/api/plans/{createdTime!.Id}");
        using var docTime = JsonDocument.Parse(await getTime.Content.ReadAsStringAsync());
        var itemTime = docTime.RootElement.GetProperty("days")[0].GetProperty("items")[0];
        Assert.Equal("time", itemTime.GetProperty("measureType").GetString());
        Assert.Equal("reps", itemTime.GetProperty("exerciseType").GetString());
        Assert.Equal(30, itemTime.GetProperty("repDurationSeconds").GetInt32());
        Assert.Equal("time", itemTime.GetProperty("overrides").GetProperty("measureType").GetString());

        // null measureType → dziedziczy Exercise.Type; pozycja reps nie dostaje defaultRepDurationSeconds
        var postInherit = await _client.PostAsJsonAsync("/api/plans", new
        {
            name = "Test measure inherit",
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
                        new { exerciseId = 1, order = 1 },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, postInherit.StatusCode);
        var createdInherit = await postInherit.Content.ReadFromJsonAsync<CreatedPlan>();
        Assert.NotNull(createdInherit);

        var getInherit = await _client.GetAsync($"/api/plans/{createdInherit!.Id}");
        using var docInherit = JsonDocument.Parse(await getInherit.Content.ReadAsStringAsync());
        var itemInherit = docInherit.RootElement.GetProperty("days")[0].GetProperty("items")[0];
        Assert.Equal("reps", itemInherit.GetProperty("measureType").GetString());
        Assert.Equal(JsonValueKind.Null, itemInherit.GetProperty("repDurationSeconds").ValueKind);
        Assert.Equal(JsonValueKind.Null, itemInherit.GetProperty("overrides").GetProperty("measureType").ValueKind);
    }

    [Fact]
    public async Task UpdatePlan_MergesDaysById_KeepsSessionAndOverride()
    {
        var post = await _client.PostAsJsonAsync("/api/plans", new
        {
            name = "Merge PUT",
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
                        new { exerciseId = 1, order = 1, sets = 3, reps = 8, setScheme = "normal" },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<CreatedPlan>();
        Assert.NotNull(created);

        var get = await _client.GetAsync($"/api/plans/{created!.Id}");
        using var getDoc = JsonDocument.Parse(await get.Content.ReadAsStringAsync());
        var dayEl = getDoc.RootElement.GetProperty("days")[0];
        var dayId = dayEl.GetProperty("id").GetInt32();
        var itemEl = dayEl.GetProperty("items")[0];
        var itemId = itemEl.GetProperty("id").GetInt32();
        Assert.Equal(JsonValueKind.Null, itemEl.GetProperty("setScheme").ValueKind);

        var clientRes = await _client.PostAsJsonAsync("/api/clients", new
        {
            name = "Klient merge",
            email = (string?)null,
            note = (string?)null,
        });
        Assert.Equal(HttpStatusCode.Created, clientRes.StatusCode);
        var clientId = (await clientRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts))
            .GetProperty("id").GetInt32();

        var assignRes = await _client.PostAsJsonAsync("/api/assignments", new
        {
            planId = created.Id,
            clientId,
            startDate = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            note = (string?)null,
        });
        Assert.Equal(HttpStatusCode.Created, assignRes.StatusCode);
        var assignmentId = (await assignRes.Content.ReadFromJsonAsync<JsonElement>(JsonOpts))
            .GetProperty("id").GetInt32();

        var start = await _client.PostAsJsonAsync("/api/sessions/start", new
        {
            clientId,
            assignmentId,
            planId = created.Id,
            planDayId = dayId,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        var sessionId = (await start.Content.ReadFromJsonAsync<JsonElement>(JsonOpts))
            .GetProperty("id").GetInt32();

        var overrideDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(2);
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            db.AssignmentDayOverrides.Add(new AssignmentDayOverride
            {
                AssignmentId = assignmentId,
                PlanDayId = dayId,
                Date = overrideDate,
            });
            await db.SaveChangesAsync();
        }

        var put = await _client.PutAsJsonAsync($"/api/plans/{created.Id}", new
        {
            name = "Merge PUT — edycja",
            description = (string?)null,
            isTemplate = false,
            days = new[]
            {
                new
                {
                    id = dayId,
                    weekNumber = 1,
                    order = 1,
                    label = "Zmieniony dzień",
                    notes = (string?)null,
                    items = new[]
                    {
                        new
                        {
                            id = itemId,
                            exerciseId = 1,
                            order = 1,
                            sets = 4,
                            reps = 6,
                        },
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        using var putDoc = JsonDocument.Parse(await put.Content.ReadAsStringAsync());
        Assert.Equal(dayId, putDoc.RootElement.GetProperty("days")[0].GetProperty("id").GetInt32());
        Assert.Equal(itemId, putDoc.RootElement.GetProperty("days")[0].GetProperty("items")[0].GetProperty("id").GetInt32());

        var after = await _client.GetAsync($"/api/plans/{created.Id}");
        using var afterDoc = JsonDocument.Parse(await after.Content.ReadAsStringAsync());
        var afterDay = afterDoc.RootElement.GetProperty("days")[0];
        Assert.Equal(dayId, afterDay.GetProperty("id").GetInt32());
        Assert.Equal("Zmieniony dzień", afterDay.GetProperty("label").GetString());
        Assert.Equal(4, afterDay.GetProperty("items")[0].GetProperty("sets").GetInt32());

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var session = await db.WorkoutSessions.AsNoTracking().FirstAsync(s => s.Id == sessionId);
            Assert.Equal(dayId, session.PlanDayId);
            Assert.True(await db.AssignmentDayOverrides.AnyAsync(o =>
                o.AssignmentId == assignmentId && o.PlanDayId == dayId && o.Date == overrideDate));
        }
    }
}
