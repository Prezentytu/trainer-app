using Microsoft.EntityFrameworkCore;

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
    }
}
