using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

/// <summary>
/// API działa jako lokalny trener (auth wyłączony). Dane drugiego trenera
/// seedujemy bezpośrednio w DbContext — każde odwołanie musi dać 404.
/// </summary>
public class TenantIsolationTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    private readonly HttpClient _client;

    public TenantIsolationTests(TestWebAppFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private sealed class ForeignIds
    {
        public int ClientId { get; init; }
        public int MaxId { get; init; }
        public int MeasurementId { get; init; }
        public int SessionId { get; init; }
        public int AssignmentId { get; init; }
        public int ExerciseId { get; init; }
        public int PlanId { get; init; }
    }

    private ForeignIds SeedForeignTrainer()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();

        var other = db.Trainers.FirstOrDefault(t => t.ClerkUserId == "other-trainer");
        if (other is null)
        {
            other = new Trainer
            {
                ClerkUserId = "other-trainer",
                Email = "other@example.com",
                Name = "Inny Trener",
            };
            db.Trainers.Add(other);
            db.SaveChanges();
        }

        var client = db.Clients.FirstOrDefault(c => c.TrainerId == other.Id && c.Name == "Obcy Klient");
        if (client is null)
        {
            client = new Client { TrainerId = other.Id, Name = "Obcy Klient", Email = "obcy@example.com" };
            db.Clients.Add(client);
            db.SaveChanges();
        }

        var exercise = db.Exercises.FirstOrDefault(e => e.TrainerId == other.Id && e.Name == "Obce Ćwiczenie");
        if (exercise is null)
        {
            exercise = new Exercise { TrainerId = other.Id, Name = "Obce Ćwiczenie", Type = "reps" };
            db.Exercises.Add(exercise);
            db.SaveChanges();
        }

        var plan = db.Plans.FirstOrDefault(p => p.TrainerId == other.Id && p.Name == "Obcy Plan");
        if (plan is null)
        {
            plan = new Plan { TrainerId = other.Id, Name = "Obcy Plan", IsTemplate = false };
            db.Plans.Add(plan);
            db.SaveChanges();
        }

        var max = db.ClientMaxes.FirstOrDefault(m => m.ClientId == client.Id);
        if (max is null)
        {
            max = new ClientMax
            {
                ClientId = client.Id,
                ExerciseId = exercise.Id,
                MaxKg = 100,
                MeasuredOn = DateOnly.FromDateTime(DateTime.UtcNow),
            };
            db.ClientMaxes.Add(max);
            db.SaveChanges();
        }

        var assignment = db.Assignments.FirstOrDefault(a => a.ClientId == client.Id && a.PlanId == plan.Id);
        if (assignment is null)
        {
            assignment = new Assignment
            {
                ClientId = client.Id,
                PlanId = plan.Id,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Status = "active",
            };
            db.Assignments.Add(assignment);
            db.SaveChanges();
        }

        var session = db.WorkoutSessions.FirstOrDefault(s => s.ClientId == client.Id);
        if (session is null)
        {
            session = new WorkoutSession
            {
                ClientId = client.Id,
                AssignmentId = assignment.Id,
                PlanId = plan.Id,
                PerformedOn = DateOnly.FromDateTime(DateTime.UtcNow),
                Status = "completed",
            };
            db.WorkoutSessions.Add(session);
            db.SaveChanges();
        }

        var measurement = db.ClientMeasurements.FirstOrDefault(m => m.ClientId == client.Id);
        if (measurement is null)
        {
            measurement = new ClientMeasurement
            {
                ClientId = client.Id,
                MeasuredOn = DateOnly.FromDateTime(DateTime.UtcNow),
                WeightKg = 90,
            };
            db.ClientMeasurements.Add(measurement);
            db.SaveChanges();
        }

        return new ForeignIds
        {
            ClientId = client.Id,
            MaxId = max.Id,
            MeasurementId = measurement.Id,
            SessionId = session.Id,
            AssignmentId = assignment.Id,
            ExerciseId = exercise.Id,
            PlanId = plan.Id,
        };
    }

    [Fact]
    public async Task ForeignClient_ResourcesReturnNotFound()
    {
        var ids = SeedForeignTrainer();

        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/maxes")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/measurements")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/sessions")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/records")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/muscle-volume")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/trends")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/stagnation")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/plans/{ids.PlanId}/muscle-volume")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/clients/{ids.ClientId}/access-token")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/sessions/{ids.SessionId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.DeleteAsync($"/api/maxes/{ids.MaxId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.DeleteAsync($"/api/measurements/{ids.MeasurementId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.DeleteAsync($"/api/assignments/{ids.AssignmentId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/exercises/{ids.ExerciseId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.DeleteAsync($"/api/exercises/{ids.ExerciseId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/plans/{ids.PlanId}")).StatusCode);
    }

    [Fact]
    public async Task AssignmentsList_ExcludesForeignClients()
    {
        var ids = SeedForeignTrainer();
        var rows = await _client.GetFromJsonAsync<List<AssignmentRow>>("/api/assignments");
        Assert.NotNull(rows);
        Assert.DoesNotContain(rows!, a => a.Id == ids.AssignmentId);
        Assert.DoesNotContain(rows!, a => a.ClientId == ids.ClientId);
    }

    [Fact]
    public async Task SharedExercise_CannotBeEditedOrDeleted()
    {
        var exercises = await _client.GetFromJsonAsync<List<ExerciseRow>>("/api/exercises");
        var shared = exercises!.First(e => e.Name.Contains("Przysiad", StringComparison.OrdinalIgnoreCase));

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            var entity = await db.Exercises.FindAsync(shared.Id);
            Assert.NotNull(entity);
            Assert.Null(entity!.TrainerId);
        }

        var put = await _client.PutAsJsonAsync(
            $"/api/exercises/{shared.Id}",
            new
            {
                name = shared.Name,
                description = (string?)null,
                type = "reps",
                defaultSets = 3,
                defaultReps = 10,
                defaultRepDurationSeconds = (int?)null,
                defaultDistanceMeters = (int?)null,
                defaultRestBetweenSetsSeconds = 60,
                defaultLoadKg = (double?)null,
                category = (string?)null,
                pattern = (string?)null,
                isUnilateral = false,
                equipment = Array.Empty<string>(),
                primaryMuscles = Array.Empty<string>(),
                instructions = (string?)null,
                media = Array.Empty<object>(),
            });
        Assert.Equal(HttpStatusCode.Conflict, put.StatusCode);

        var del = await _client.DeleteAsync($"/api/exercises/{shared.Id}");
        Assert.Equal(HttpStatusCode.Conflict, del.StatusCode);
    }

    private record AssignmentRow(int Id, int ClientId, int PlanId);
    private record ExerciseRow(int Id, string Name);
}
