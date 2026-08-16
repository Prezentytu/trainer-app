using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class SchedulingMathTests
{
    [Fact]
    public void ScheduledOn_FromWednesdayStart_UsesMondayAnchor()
    {
        // 2026-08-19 = środa; wtorek tyg. 1 = poniedziałek 17 + 1 = 18.08
        var on = Scheduling.ScheduledOn(1, 2, new DateOnly(2026, 8, 19), 0, 1, null);
        Assert.Equal(new DateOnly(2026, 8, 18), on);
    }

    [Fact]
    public void ScheduledOn_Week2Friday_TwoWeekPlan()
    {
        var on = Scheduling.ScheduledOn(2, 5, new DateOnly(2026, 8, 19), 0, 2, null);
        Assert.Equal(new DateOnly(2026, 8, 28), on);
    }

    [Fact]
    public void ScheduledOn_OverrideWins()
    {
        var on = Scheduling.ScheduledOn(1, 2, new DateOnly(2026, 8, 17), 0, 1, new DateOnly(2026, 8, 23));
        Assert.Equal(new DateOnly(2026, 8, 23), on);
    }

    [Fact]
    public void ScheduledOn_NullWithoutDayOfWeek()
    {
        Assert.Null(Scheduling.ScheduledOn(1, null, new DateOnly(2026, 8, 17), 0, 1, null));
    }

    [Fact]
    public void TodayScheduledDayId_PicksUncompletedOnToday()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek)>
        {
            (1, 1, 2),
            (2, 1, 4),
        };
        var start = new DateOnly(2026, 8, 17);
        var counts = new Dictionary<int, int> { [1] = 0, [2] = 0 };
        var ov = new Dictionary<int, DateOnly>();
        Assert.Equal(1, Scheduling.TodayScheduledDayId(days, start, new DateOnly(2026, 8, 18), counts, ov));
        Assert.Equal(2, Scheduling.TodayScheduledDayId(days, start, new DateOnly(2026, 8, 20), counts, ov));
        Assert.Null(Scheduling.TodayScheduledDayId(days, start, new DateOnly(2026, 8, 19), counts, ov));
    }

    [Fact]
    public void TodayScheduledDayId_SkipsCompletedInCycle()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek)> { (1, 1, 2), (2, 1, 4) };
        var start = new DateOnly(2026, 8, 17);
        var counts = new Dictionary<int, int> { [1] = 1, [2] = 0 };
        var ov = new Dictionary<int, DateOnly>();
        Assert.Null(Scheduling.TodayScheduledDayId(days, start, new DateOnly(2026, 8, 18), counts, ov));
        Assert.Equal(2, Scheduling.TodayScheduledDayId(days, start, new DateOnly(2026, 8, 20), counts, ov));
    }

    [Fact]
    public void TodayScheduledDayId_UsesOverride()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek)> { (1, 1, 2) };
        var start = new DateOnly(2026, 8, 17);
        var counts = new Dictionary<int, int> { [1] = 0 };
        var ov = new Dictionary<int, DateOnly> { [1] = new(2026, 8, 19) };
        Assert.Null(Scheduling.TodayScheduledDayId(days, start, new DateOnly(2026, 8, 18), counts, ov));
        Assert.Equal(1, Scheduling.TodayScheduledDayId(days, start, new DateOnly(2026, 8, 19), counts, ov));
    }

    [Fact]
    public void ShouldRemindToday_WithoutSchedule_AlwaysTrue()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek)> { (1, 1, null) };
        Assert.True(Scheduling.ShouldRemindToday(
            days, new DateOnly(2026, 8, 17), new DateOnly(2026, 8, 19),
            new Dictionary<int, int> { [1] = 0 },
            new Dictionary<int, DateOnly>()));
    }

    [Fact]
    public void ShouldRemindToday_WithSchedule_OnlyOnPlannedDay()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek)> { (1, 1, 2), (2, 1, 4) };
        var start = new DateOnly(2026, 8, 17);
        var counts = new Dictionary<int, int> { [1] = 0, [2] = 0 };
        var ov = new Dictionary<int, DateOnly>();
        Assert.True(Scheduling.ShouldRemindToday(days, start, new DateOnly(2026, 8, 18), counts, ov));
        Assert.False(Scheduling.ShouldRemindToday(days, start, new DateOnly(2026, 8, 19), counts, ov));
    }

    [Fact]
    public void ResolveHero_PrefersTodayOverQueue()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek, string Label)>
        {
            (1, 1, 2, "FBW A"),
            (2, 1, 4, "FBW B"),
        };
        var start = new DateOnly(2026, 8, 17);
        var counts = new Dictionary<int, int> { [1] = 0, [2] = 0 };
        var ov = new Dictionary<int, DateOnly>();
        var hero = Scheduling.ResolveHero(days, start, new DateOnly(2026, 8, 20), counts, ov, nextDueDayId: 1);
        Assert.NotNull(hero);
        Assert.Equal(2, hero!.Id);
        Assert.Equal(new DateOnly(2026, 8, 20), hero.ScheduledOn);
    }

    [Fact]
    public void ResolveHero_FallsBackToQueue_WhenNothingToday()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek, string Label)>
        {
            (1, 1, 2, "FBW A"),
            (2, 1, 4, "FBW B"),
        };
        var start = new DateOnly(2026, 8, 17);
        var counts = new Dictionary<int, int> { [1] = 0, [2] = 0 };
        var hero = Scheduling.ResolveHero(
            days, start, new DateOnly(2026, 8, 19), counts, new Dictionary<int, DateOnly>(), 1);
        Assert.NotNull(hero);
        Assert.Equal(1, hero!.Id);
        Assert.Equal(new DateOnly(2026, 8, 18), hero.ScheduledOn);
    }

    [Fact]
    public void ResolveHero_MovedFrom_WhenOverride()
    {
        var days = new List<(int Id, int WeekNumber, int? DayOfWeek, string Label)>
        {
            (1, 1, 6, "FBW B"),
        };
        var start = new DateOnly(2026, 8, 17);
        var ov = new Dictionary<int, DateOnly> { [1] = new(2026, 8, 23) };
        var hero = Scheduling.ResolveHero(
            days, start, new DateOnly(2026, 8, 23), new Dictionary<int, int> { [1] = 0 }, ov, 1);
        Assert.NotNull(hero);
        Assert.Equal("sob", hero!.MovedFrom);
        Assert.Equal(new DateOnly(2026, 8, 23), hero.ScheduledOn);
    }
}

public class SchedulingApiTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public SchedulingApiTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PortalHome_HybridToday_UsesScheduledDay()
    {
        var ctx = await SeedScheduledPlanAsync();
        var homeThu = await GetHomeAsync(ctx.Token, ctx.Thursday);
        Assert.Equal(ctx.ThuDayId, homeThu.GetProperty("today").GetProperty("day").GetProperty("id").GetInt32());
        Assert.Equal(ctx.Thursday.ToString("yyyy-MM-dd"), homeThu.GetProperty("today").GetProperty("scheduledOn").GetString());

        var homeWed = await GetHomeAsync(ctx.Token, ctx.Wednesday);
        Assert.Equal(ctx.TueDayId, homeWed.GetProperty("today").GetProperty("day").GetProperty("id").GetInt32());
        Assert.Equal(ctx.Tuesday.ToString("yyyy-MM-dd"), homeWed.GetProperty("today").GetProperty("scheduledOn").GetString());

        var week = homeThu.GetProperty("week");
        Assert.Contains(week.EnumerateArray(), d =>
            d.GetProperty("id").GetInt32() == ctx.TueDayId
            && d.GetProperty("scheduledOn").GetString() == ctx.Tuesday.ToString("yyyy-MM-dd"));
    }

    [Fact]
    public async Task Reschedule_UpsertsAndShowsOnNewDate()
    {
        var ctx = await SeedScheduledPlanAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var first = today.AddDays(8);
        var second = today.AddDays(9);
        var res = await _client.PostAsJsonAsync(
            $"/api/portal/{ctx.Token}/days/{ctx.TueDayId}/reschedule",
            new { date = first.ToString("yyyy-MM-dd") });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var home = await GetHomeAsync(ctx.Token, first);
        Assert.Equal(ctx.TueDayId, home.GetProperty("today").GetProperty("day").GetProperty("id").GetInt32());
        Assert.Equal(first.ToString("yyyy-MM-dd"), home.GetProperty("today").GetProperty("scheduledOn").GetString());
        Assert.Equal("wt", home.GetProperty("today").GetProperty("movedFrom").GetString());

        var again = await _client.PostAsJsonAsync(
            $"/api/portal/{ctx.Token}/days/{ctx.TueDayId}/reschedule",
            new { date = second.ToString("yyyy-MM-dd") });
        Assert.Equal(HttpStatusCode.OK, again.StatusCode);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var count = await db.AssignmentDayOverrides.CountAsync(o =>
            o.AssignmentId == ctx.AssignmentId && o.PlanDayId == ctx.TueDayId);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task Reschedule_PastDate_Returns400()
    {
        var ctx = await SeedScheduledPlanAsync();
        var past = ctx.Monday.AddDays(-1).ToString("yyyy-MM-dd");
        var res = await _client.PostAsJsonAsync(
            $"/api/portal/{ctx.Token}/days/{ctx.TueDayId}/reschedule",
            new { date = past });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Complete_RemovesOverride()
    {
        var ctx = await SeedScheduledPlanAsync();
        var when = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        var reschedule = await _client.PostAsJsonAsync(
            $"/api/portal/{ctx.Token}/days/{ctx.TueDayId}/reschedule",
            new { date = when.ToString("yyyy-MM-dd") });
        Assert.Equal(HttpStatusCode.OK, reschedule.StatusCode);

        var start = await _client.PostAsJsonAsync("/api/sessions/start", new
        {
            clientId = ctx.ClientId,
            assignmentId = ctx.AssignmentId,
            planId = ctx.PlanId,
            planDayId = ctx.TueDayId,
        });
        Assert.Equal(HttpStatusCode.Created, start.StatusCode);
        var sessionId = (await start.Content.ReadFromJsonAsync<JsonElement>(JsonOpts)).GetProperty("id").GetInt32();
        var complete = await _client.PatchAsync($"/api/sessions/{sessionId}/complete", null);
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        Assert.False(await db.AssignmentDayOverrides.AnyAsync(o =>
            o.AssignmentId == ctx.AssignmentId && o.PlanDayId == ctx.TueDayId));
    }

    [Fact]
    public async Task Progress_ReturnsNextDay()
    {
        var ctx = await SeedScheduledPlanAsync();
        var res = await _client.GetAsync($"/api/clients/{ctx.ClientId}/progress");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        var next = doc.RootElement.GetProperty("nextDay");
        Assert.Equal(JsonValueKind.Object, next.ValueKind);
        Assert.True(next.TryGetProperty("id", out _));
        Assert.True(next.TryGetProperty("label", out _));
        Assert.True(next.TryGetProperty("scheduledOn", out _));
    }

    [Fact]
    public async Task PlanSave_PersistsDayOfWeek()
    {
        var ctx = await SeedScheduledPlanAsync();
        var planRes = await _client.GetAsync($"/api/plans/{ctx.PlanId}");
        using var planDoc = JsonDocument.Parse(await planRes.Content.ReadAsStringAsync());
        var tue = planDoc.RootElement.GetProperty("days").EnumerateArray()
            .First(d => d.GetProperty("id").GetInt32() == ctx.TueDayId);
        Assert.Equal(2, tue.GetProperty("dayOfWeek").GetInt32());
    }

    async Task<JsonElement> GetHomeAsync(string token, DateOnly today)
    {
        var res = await _client.GetAsync($"/api/portal/{token}?today={today:yyyy-MM-dd}");
        res.EnsureSuccessStatusCode();
        return JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.Clone();
    }

    async Task<ScheduledCtx> SeedScheduledPlanAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        _ = await _client.GetAsync("/api/clients");

        var monday = Scheduling.MondayOf(DateOnly.FromDateTime(DateTime.UtcNow));
        var trainer = await db.Trainers.FirstAsync();
        var exercise = new Exercise
        {
            TrainerId = trainer.Id,
            Name = $"Ćw {Guid.NewGuid():N}"[..12],
            Type = "reps",
            Category = "legs",
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        var client = new Client
        {
            TrainerId = trainer.Id,
            Name = $"Harmonogram {Guid.NewGuid():N}"[..18],
            Email = $"{Guid.NewGuid():N}@test.local",
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();

        var plan = new Plan
        {
            TrainerId = trainer.Id,
            Name = $"Plan {client.Name}",
            IsTemplate = false,
        };
        db.Plans.Add(plan);
        await db.SaveChangesAsync();

        var tue = new PlanDay
        {
            PlanId = plan.Id,
            WeekNumber = 1,
            Order = 0,
            Label = "FBW A",
            DayOfWeek = 2,
            Items = [new PlanItem { ExerciseId = exercise.Id, Order = 0, Sets = 3, Reps = 8, LoadKg = 40 }],
        };
        var thu = new PlanDay
        {
            PlanId = plan.Id,
            WeekNumber = 1,
            Order = 1,
            Label = "FBW B",
            DayOfWeek = 4,
            Items = [new PlanItem { ExerciseId = exercise.Id, Order = 0, Sets = 3, Reps = 8, LoadKg = 40 }],
        };
        db.PlanDays.AddRange(tue, thu);
        await db.SaveChangesAsync();

        var assignment = new Assignment
        {
            ClientId = client.Id,
            PlanId = plan.Id,
            Status = "active",
            StartDate = monday,
        };
        db.Assignments.Add(assignment);
        var token = $"tok-{client.Id}-{Guid.NewGuid():N}"[..32];
        db.ClientAccessTokens.Add(new ClientAccessToken { ClientId = client.Id, Token = token });
        await db.SaveChangesAsync();

        return new ScheduledCtx(
            client.Id, plan.Id, assignment.Id, tue.Id, thu.Id, token,
            monday, monday.AddDays(1), monday.AddDays(2), monday.AddDays(3));
    }

    private record ScheduledCtx(
        int ClientId,
        int PlanId,
        int AssignmentId,
        int TueDayId,
        int ThuDayId,
        string Token,
        DateOnly Monday,
        DateOnly Tuesday,
        DateOnly Wednesday,
        DateOnly Thursday);
}
