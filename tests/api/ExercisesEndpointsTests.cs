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

    private record ExerciseMediaDto(string YoutubeId, string Title, int? Seconds, string Kind);

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
        double? DefaultLoadKg,
        string? Category,
        string? Pattern,
        bool IsUnilateral,
        List<string>? Equipment,
        List<string>? PrimaryMuscles,
        string? Instructions,
        List<ExerciseMediaDto>? Media);

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
        Assert.Null(created.Category);
        Assert.False(created.IsUnilateral);
        Assert.Empty(created.Equipment ?? []);
        Assert.Empty(created.Media ?? []);
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

    [Fact]
    public async Task CreateExercise_WithMediaAndTaxonomy_RoundTrips()
    {
        var payload = new
        {
            name = "Test military press media",
            type = "reps",
            defaultSets = 4,
            defaultReps = 6,
            defaultRestBetweenSetsSeconds = 120,
            category = "shoulders",
            pattern = "vertical-push",
            isUnilateral = false,
            equipment = new[] { "barbell" },
            primaryMuscles = new[] { "Przedni akton barku", "Triceps" },
            instructions = "Napięty core, sztanga nad barkami.",
            media = new[]
            {
                new { youtubeId = "1fwmBAKzW4g", title = "Military press", seconds = 38, kind = "demo" },
            },
        };

        var post = await _client.PostAsJsonAsync("/api/exercises", payload);
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<ExerciseDto>(JsonOpts);
        Assert.NotNull(created);
        Assert.Equal("shoulders", created!.Category);
        Assert.Equal("vertical-push", created.Pattern);
        Assert.Equal(new[] { "barbell" }, created.Equipment);
        Assert.Equal(new[] { "Przedni akton barku", "Triceps" }, created.PrimaryMuscles);
        Assert.NotNull(created.Media);
        Assert.Single(created.Media!);
        Assert.Equal("1fwmBAKzW4g", created.Media[0].YoutubeId);
        Assert.Equal("demo", created.Media[0].Kind);

        var get = await _client.GetAsync($"/api/exercises/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var fetched = await get.Content.ReadFromJsonAsync<ExerciseDto>(JsonOpts);
        Assert.NotNull(fetched);
        Assert.Equal("1fwmBAKzW4g", fetched!.Media![0].YoutubeId);
        Assert.Equal("shoulders", fetched.Category);
    }

    [Fact]
    public async Task GetExercise_UnknownId_Returns404()
    {
        var get = await _client.GetAsync("/api/exercises/999999");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task Seed_HasEnrichedLibraryExercises()
    {
        var list = await _client.GetFromJsonAsync<List<ExerciseDto>>("/api/exercises", JsonOpts);
        Assert.NotNull(list);
        Assert.True(list!.Count >= 100, $"Oczekiwano ≥100 ćwiczeń z biblioteki, jest {list.Count}");

        var withMedia = list.Where(e => e.Media is { Count: > 0 }).ToList();
        Assert.True(withMedia.Count >= 50, "Seed powinien zawierać ćwiczenia z filmami YouTube");

        var military = list.FirstOrDefault(e => e.Name.Contains("military press", StringComparison.OrdinalIgnoreCase));
        Assert.NotNull(military);
        Assert.Equal("shoulders", military!.Category);
        Assert.NotEmpty(military.Media!);
    }
}
