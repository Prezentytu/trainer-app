using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class ExerciseLibrarySeedTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDb _db;

    public ExerciseLibrarySeedTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDb>().UseSqlite(_connection).Options;
        _db = new AppDb(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
        GC.SuppressFinalize(this);
    }

    [Fact]
    public void SecondRun_DoesNotDuplicateSharedNames()
    {
        Seed.Run(_db);
        var first = SharedNames();
        Assert.True(first.Count >= 100, $"Oczekiwano ≥100 ćwiczeń wspólnych, jest {first.Count}");

        Seed.Run(_db);
        var second = SharedNames();
        Assert.Equal(first.Count, second.Count);
        Assert.Equal(first.Count, first.Distinct(StringComparer.OrdinalIgnoreCase).Count());
    }

    [Fact]
    public void Incremental_AddsMissingLibraryExercise()
    {
        _db.Trainers.Add(new Trainer
        {
            ClerkUserId = TrainerAccess.LocalClerkUserId,
            Email = "trener@localhost",
            Name = "Trener lokalny",
            PlanKey = "dev",
        });
        _db.Exercises.Add(new Exercise
        {
            Name = "Przysiad ze sztangą",
            Type = "reps",
            Category = "legs",
            Pattern = "squat",
        });
        _db.SaveChanges();

        Seed.Run(_db);

        Assert.Contains(_db.Exercises, e =>
            e.TrainerId == null &&
            e.Name.Equals("Hack squat", StringComparison.OrdinalIgnoreCase));
        Assert.True(_db.Exercises.Count(e => e.TrainerId == null) >= 100);
    }

    [Fact]
    public void Incremental_MergesMediaIntoExistingShared_NoSecondCard()
    {
        _db.Trainers.Add(new Trainer
        {
            ClerkUserId = TrainerAccess.LocalClerkUserId,
            Email = "trener@localhost",
            Name = "Trener lokalny",
            PlanKey = "dev",
        });
        _db.Exercises.Add(new Exercise
        {
            Name = "Przysiad ze sztangą",
            Type = "reps",
            Category = "legs",
            Pattern = "squat",
            Media = [new ExerciseMedia("already-there", "stary film", 10, "demo")],
        });
        _db.SaveChanges();

        Seed.Run(_db);

        var squats = _db.Exercises
            .Where(e => e.TrainerId == null && e.Name.ToLower() == "przysiad ze sztangą")
            .ToList();
        Assert.Single(squats);
        var ids = squats[0].Media.Select(m => m.YoutubeId).ToList();
        Assert.Contains("already-there", ids);
        Assert.Contains("zxjNtj-Lc1U", ids);
        Assert.Equal("demo", squats[0].Media.First(m => m.YoutubeId == "already-there").Kind);
        Assert.Equal("stary film", squats[0].Media.First(m => m.YoutubeId == "already-there").Title);
    }

    [Fact]
    public void Incremental_DoesNotOverwriteTrainerOwnedSameName()
    {
        var trainer = new Trainer
        {
            ClerkUserId = TrainerAccess.LocalClerkUserId,
            Email = "trener@localhost",
            Name = "Trener lokalny",
            PlanKey = "dev",
        };
        _db.Trainers.Add(trainer);
        _db.SaveChanges();

        _db.Exercises.Add(new Exercise
        {
            TrainerId = trainer.Id,
            Name = "Hip thrust",
            Type = "reps",
            Media = [new ExerciseMedia("trainer-owned", "własne", 5, "demo")],
        });
        _db.SaveChanges();

        Seed.Run(_db);

        var owned = _db.Exercises.Single(e => e.TrainerId == trainer.Id && e.Name == "Hip thrust");
        Assert.Single(owned.Media);
        Assert.Equal("trainer-owned", owned.Media[0].YoutubeId);

        var shared = _db.Exercises.Single(e => e.TrainerId == null && e.Name == "Hip thrust");
        Assert.Contains(shared.Media, m => m.YoutubeId == "crdbXcSkr9A");
    }

    [Fact]
    public void FreshSeed_MergesCoreMediaFromLibrary()
    {
        Seed.Run(_db);

        var squat = _db.Exercises.Single(e => e.TrainerId == null && e.Name == "Przysiad ze sztangą");
        Assert.Contains(squat.Media, m => m.YoutubeId == "zxjNtj-Lc1U");
        Assert.Equal("Klatka wyprostowana, kolana w linii stóp.", squat.Description);

        var deadlift = _db.Exercises.Single(e => e.TrainerId == null && e.Name == "Martwy ciąg");
        Assert.Contains(deadlift.Media, m => m.YoutubeId == "BxRiQUd2BGk");

        var hip = _db.Exercises.Single(e => e.TrainerId == null && e.Name == "Hip thrust");
        Assert.Contains(hip.Media, m => m.YoutubeId == "crdbXcSkr9A");
    }

    private List<string> SharedNames() =>
        _db.Exercises.Where(e => e.TrainerId == null).Select(e => e.Name).ToList();
}
