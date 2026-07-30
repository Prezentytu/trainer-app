using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class ExercisesEndpointsTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ExercisesEndpointsTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    private record ExerciseDto(
        int Id,
        string Name,
        string? Description,
        string Type,
        int DefaultSets,
        int DefaultReps,
        int? DefaultRepDurationSeconds,
        int? DefaultDistanceMeters,
        int DefaultRestBetweenSetsSeconds,
        double? DefaultLoadKg);

    private record ErrorBody(string Message);

    [Fact]
    public async Task CreateExercise_MinimalName_Returns201WithDefaults()
    {
        var post = await _client.PostAsJsonAsync("/api/exercises", new { name = "Glute bridge unique" });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var created = await post.Content.ReadFromJsonAsync<ExerciseDto>(JsonOpts);
        Assert.NotNull(created);
        Assert.True(created!.Id > 0);
        Assert.Equal("Glute bridge unique", created.Name);
        Assert.Equal("reps", created.Type);
        Assert.Equal(3, created.DefaultSets);
        Assert.Equal(10, created.DefaultReps);
        Assert.Equal(60, created.DefaultRestBetweenSetsSeconds);
    }

    [Fact]
    public async Task CreateExercise_EmptyName_Returns400()
    {
        var post = await _client.PostAsJsonAsync("/api/exercises", new { name = "   " });
        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);

        var body = await post.Content.ReadFromJsonAsync<ErrorBody>(JsonOpts);
        Assert.NotNull(body);
        Assert.Contains("nazwę", body!.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateExercise_DuplicateName_Returns409()
    {
        var post = await _client.PostAsJsonAsync("/api/exercises", new { name = "przysiad ze sztangą" });
        Assert.Equal(HttpStatusCode.Conflict, post.StatusCode);

        var body = await post.Content.ReadFromJsonAsync<ErrorBody>(JsonOpts);
        Assert.NotNull(body);
        Assert.Contains("już jest w bibliotece", body!.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateExercise_SameNameOnSelf_Returns200()
    {
        var create = await _client.PostAsJsonAsync(
            "/api/exercises",
            new { name = "Ćwiczenie do edycji", type = "reps", defaultSets = 3, defaultReps = 10, defaultRestBetweenSetsSeconds = 60 });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<ExerciseDto>(JsonOpts);
        Assert.NotNull(created);

        var put = await _client.PutAsJsonAsync(
            $"/api/exercises/{created!.Id}",
            new
            {
                name = "Ćwiczenie do edycji",
                description = (string?)null,
                type = "reps",
                defaultSets = 4,
                defaultReps = 8,
                defaultRepDurationSeconds = (int?)null,
                defaultDistanceMeters = (int?)null,
                defaultRestBetweenSetsSeconds = 90,
                defaultLoadKg = (double?)null,
            });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var updated = await put.Content.ReadFromJsonAsync<ExerciseDto>(JsonOpts);
        Assert.NotNull(updated);
        Assert.Equal(4, updated!.DefaultSets);
        Assert.Equal(8, updated.DefaultReps);
    }
}
