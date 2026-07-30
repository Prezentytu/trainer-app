using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace TrainerApp.Api;

public class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<PlanDay> PlanDays => Set<PlanDay>();
    public DbSet<PlanItem> PlanItems => Set<PlanItem>();
    public DbSet<PlanSet> PlanSets => Set<PlanSet>();
    public DbSet<Assignment> Assignments => Set<Assignment>();

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
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
