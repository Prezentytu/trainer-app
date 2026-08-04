using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace TrainerApp.Api;

public class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<PlanDay> PlanDays => Set<PlanDay>();
    public DbSet<PlanItem> PlanItems => Set<PlanItem>();
    public DbSet<PlanSet> PlanSets => Set<PlanSet>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<ClientMax> ClientMaxes => Set<ClientMax>();
    public DbSet<ClientMeasurement> ClientMeasurements => Set<ClientMeasurement>();
    public DbSet<ClientAccessToken> ClientAccessTokens => Set<ClientAccessToken>();
    public DbSet<ClientIntake> ClientIntakes => Set<ClientIntake>();
    public DbSet<ClientCheckIn> ClientCheckIns => Set<ClientCheckIn>();
    public DbSet<ClientPushSubscription> ClientPushSubscriptions => Set<ClientPushSubscription>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<LoggedExercise> LoggedExercises => Set<LoggedExercise>();
    public DbSet<LoggedSet> LoggedSets => Set<LoggedSet>();

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    /// <summary>
    /// SQLite zwraca DateTime z Kind=Unspecified; bez UTC System.Text.Json
    /// serializuje bez „Z”, a przeglądarka traktuje string jako czas lokalny.
    /// Na Npgsql (timestamptz) Kind jest już Utc — SpecifyKind jest no-op.
    /// </summary>
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<UtcNullableDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Trainer>()
            .HasIndex(t => t.ClerkUserId)
            .IsUnique();

        modelBuilder.Entity<Client>()
            .HasOne(c => c.Trainer)
            .WithMany()
            .HasForeignKey(c => c.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Client>()
            .HasIndex(c => c.TrainerId);

        modelBuilder.Entity<Plan>()
            .HasOne(p => p.Trainer)
            .WithMany()
            .HasForeignKey(p => p.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Plan>()
            .HasIndex(p => p.TrainerId);

        modelBuilder.Entity<Exercise>()
            .HasOne(e => e.Trainer)
            .WithMany()
            .HasForeignKey(e => e.TrainerId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PlanDay>()
            .HasOne(d => d.Plan)
            .WithMany(p => p.Days)
            .HasForeignKey(d => d.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlanItem>()
            .HasOne(i => i.Day)
            .WithMany(d => d.Items)
            .HasForeignKey(i => i.PlanDayId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlanSet>()
            .HasOne(s => s.Item)
            .WithMany(i => i.PrescribedSets)
            .HasForeignKey(s => s.PlanItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Plan)
            .WithMany(p => p.Assignments)
            .HasForeignKey(a => a.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Client)
            .WithMany(c => c.Assignments)
            .HasForeignKey(a => a.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientMax>()
            .HasOne(m => m.Client)
            .WithMany(c => c.Maxes)
            .HasForeignKey(m => m.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientMax>()
            .HasOne(m => m.Exercise)
            .WithMany()
            .HasForeignKey(m => m.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientAccessToken>()
            .HasOne(t => t.Client)
            .WithMany(c => c.AccessTokens)
            .HasForeignKey(t => t.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientAccessToken>()
            .HasIndex(t => t.Token)
            .IsUnique();

        modelBuilder.Entity<Assignment>()
            .HasIndex(a => new { a.ClientId, a.Status });

        modelBuilder.Entity<ClientMax>()
            .HasIndex(m => new { m.ClientId, m.ExerciseId });

        modelBuilder.Entity<ClientMeasurement>()
            .HasOne(m => m.Client)
            .WithMany(c => c.Measurements)
            .HasForeignKey(m => m.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientMeasurement>()
            .HasIndex(m => new { m.ClientId, m.MeasuredOn });

        modelBuilder.Entity<ClientIntake>()
            .HasOne(i => i.Client)
            .WithOne(c => c.Intake)
            .HasForeignKey<ClientIntake>(i => i.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientIntake>()
            .HasIndex(i => i.ClientId)
            .IsUnique();

        modelBuilder.Entity<WorkoutSession>()
            .HasIndex(s => new { s.ClientId, s.Status });

        modelBuilder.Entity<LoggedExercise>()
            .HasIndex(e => e.ExerciseId);

        modelBuilder.Entity<WorkoutSession>()
            .HasOne(s => s.Client)
            .WithMany(c => c.Sessions)
            .HasForeignKey(s => s.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkoutSession>()
            .HasOne(s => s.Assignment)
            .WithMany()
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<WorkoutSession>()
            .HasOne(s => s.PlanDay)
            .WithMany()
            .HasForeignKey(s => s.PlanDayId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<WorkoutSession>()
            .HasOne(s => s.Plan)
            .WithMany()
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LoggedExercise>()
            .HasOne(e => e.Session)
            .WithMany(s => s.Exercises)
            .HasForeignKey(e => e.WorkoutSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LoggedExercise>()
            .HasOne(e => e.Exercise)
            .WithMany()
            .HasForeignKey(e => e.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LoggedExercise>()
            .HasOne(e => e.SubstitutedFromExercise)
            .WithMany()
            .HasForeignKey(e => e.SubstitutedFromExerciseId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ClientCheckIn>()
            .HasOne(c => c.Client)
            .WithMany(c => c.CheckIns)
            .HasForeignKey(c => c.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientCheckIn>()
            .HasIndex(c => new { c.ClientId, c.Date });

        modelBuilder.Entity<ClientPushSubscription>()
            .HasOne(s => s.Client)
            .WithMany(c => c.PushSubscriptions)
            .HasForeignKey(s => s.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientPushSubscription>()
            .HasIndex(s => s.Endpoint)
            .IsUnique();

        modelBuilder.Entity<LoggedSet>()
            .HasOne(s => s.LoggedExercise)
            .WithMany(e => e.Sets)
            .HasForeignKey(s => s.LoggedExerciseId)
            .OnDelete(DeleteBehavior.Cascade);

        var stringListConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v ?? new List<string>(), JsonOpts),
            v => DeserializeStringList(v));

        var stringListComparer = new ValueComparer<List<string>>(
            (a, b) => (a ?? new List<string>()).SequenceEqual(b ?? new List<string>()),
            v => (v ?? new List<string>()).Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
            v => (v ?? new List<string>()).ToList());

        var mediaConverter = new ValueConverter<List<ExerciseMedia>, string>(
            v => JsonSerializer.Serialize(v ?? new List<ExerciseMedia>(), JsonOpts),
            v => DeserializeMediaList(v));

        var mediaComparer = new ValueComparer<List<ExerciseMedia>>(
            (a, b) => (a ?? new List<ExerciseMedia>()).SequenceEqual(b ?? new List<ExerciseMedia>()),
            v => (v ?? new List<ExerciseMedia>()).Aggregate(0, (h, m) => HashCode.Combine(h, m.GetHashCode())),
            v => (v ?? new List<ExerciseMedia>()).ToList());

        modelBuilder.Entity<Exercise>(e =>
        {
            e.Property(x => x.Equipment)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);
            e.Property(x => x.PrimaryMuscles)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);
            e.Property(x => x.Media)
                .HasConversion(mediaConverter)
                .Metadata.SetValueComparer(mediaComparer);
        });
    }

    private static List<string> DeserializeStringList(string? v) =>
        string.IsNullOrWhiteSpace(v)
            ? new List<string>()
            : (JsonSerializer.Deserialize<List<string>>(v, JsonOpts) ?? new List<string>());

    private static List<ExerciseMedia> DeserializeMediaList(string? v) =>
        string.IsNullOrWhiteSpace(v)
            ? new List<ExerciseMedia>()
            : (JsonSerializer.Deserialize<List<ExerciseMedia>>(v, JsonOpts) ?? new List<ExerciseMedia>());
}

/// <summary>Oznacza DateTime jako UTC przy odczycie z bazy (tożsamościowy zapis).</summary>
sealed class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
    v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

sealed class UtcNullableDateTimeConverter() : ValueConverter<DateTime?, DateTime?>(
    v => v.HasValue
        ? (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc))
        : v,
    v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);
