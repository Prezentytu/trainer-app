using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class ClientIntakeTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public ClientIntakeTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    private record ClientRow(int Id, string Name);
    private record IntakeDto(
        int ClientId,
        string? GoalType,
        string? GoalDetails,
        string? Injuries,
        string? Pains,
        string? ChronicConditions,
        string? Medications,
        string? WorkType,
        int? StressLevel,
        string? SleepHours,
        string? FreeTimeActivity,
        string? ExperienceLevel,
        string? PastActivities,
        string? TrainingHistoryNotes,
        int? SessionsPerWeek,
        string? Availability,
        string? Equipment,
        DateTime? UpdatedAt);

    [Fact]
    public async Task GetIntake_Empty_ReturnsNulls()
    {
        var post = await _client.PostAsJsonAsync(
            "/api/clients",
            new { name = "Intake Empty", email = (string?)null, note = (string?)null });
        var created = await post.Content.ReadFromJsonAsync<ClientRow>();
        Assert.NotNull(created);

        var res = await _client.GetAsync($"/api/clients/{created!.Id}/intake");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var intake = await res.Content.ReadFromJsonAsync<IntakeDto>();
        Assert.NotNull(intake);
        Assert.Equal(created.Id, intake!.ClientId);
        Assert.Null(intake.GoalType);
        Assert.Null(intake.Injuries);
        Assert.Null(intake.UpdatedAt);
    }

    [Fact]
    public async Task PutIntake_Partial_ThenGet_ReturnsSavedFields()
    {
        var post = await _client.PostAsJsonAsync(
            "/api/clients",
            new { name = "Intake Partial", email = (string?)null, note = (string?)null });
        var created = await post.Content.ReadFromJsonAsync<ClientRow>();
        Assert.NotNull(created);

        var put = await _client.PutAsJsonAsync($"/api/clients/{created!.Id}/intake", new
        {
            goalType = "Redukcja",
            goalDetails = "-8 kg do wakacji",
            injuries = "kolano prawe 2023",
            stressLevel = 3,
            experienceLevel = "początkujący",
            sessionsPerWeek = 3,
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var saved = await put.Content.ReadFromJsonAsync<IntakeDto>();
        Assert.NotNull(saved);
        Assert.Equal("Redukcja", saved!.GoalType);
        Assert.Equal("-8 kg do wakacji", saved.GoalDetails);
        Assert.Equal("kolano prawe 2023", saved.Injuries);
        Assert.Equal(3, saved.StressLevel);
        Assert.Equal("początkujący", saved.ExperienceLevel);
        Assert.Equal(3, saved.SessionsPerWeek);
        Assert.Null(saved.WorkType);
        Assert.NotNull(saved.UpdatedAt);

        var get = await _client.GetFromJsonAsync<IntakeDto>($"/api/clients/{created.Id}/intake");
        Assert.Equal("Redukcja", get!.GoalType);
        Assert.Equal(3, get.SessionsPerWeek);
    }

    [Fact]
    public async Task PutIntake_ClampsStressAndSessions()
    {
        var post = await _client.PostAsJsonAsync(
            "/api/clients",
            new { name = "Intake Clamp", email = (string?)null, note = (string?)null });
        var created = await post.Content.ReadFromJsonAsync<ClientRow>();
        Assert.NotNull(created);

        var put = await _client.PutAsJsonAsync($"/api/clients/{created!.Id}/intake", new
        {
            stressLevel = 99,
            sessionsPerWeek = 0,
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var saved = await put.Content.ReadFromJsonAsync<IntakeDto>();
        Assert.Equal(5, saved!.StressLevel);
        Assert.Equal(1, saved.SessionsPerWeek);
    }

    [Fact]
    public async Task GetIntake_MissingClient_ReturnsNotFound()
    {
        var res = await _client.GetAsync("/api/clients/999999/intake");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task PortalIntake_GetAndPut_ForDemoToken()
    {
        var get = await _client.GetAsync("/api/portal/demo-jan-kowalski/intake");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);

        var put = await _client.PutAsJsonAsync("/api/portal/demo-jan-kowalski/intake", new
        {
            goalType = "Siła",
            workType = "siedząca",
            sleepHours = "6–7h",
        });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var saved = await put.Content.ReadFromJsonAsync<IntakeDto>();
        Assert.Equal("Siła", saved!.GoalType);
        Assert.Equal("siedząca", saved.WorkType);

        var again = await _client.GetFromJsonAsync<IntakeDto>("/api/portal/demo-jan-kowalski/intake");
        Assert.Equal("Siła", again!.GoalType);
    }

    [Fact]
    public async Task PortalIntake_InvalidToken_ReturnsNotFound()
    {
        var res = await _client.GetAsync("/api/portal/nieistniejacy-token-xyz/intake");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
