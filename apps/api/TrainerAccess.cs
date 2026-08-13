using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>
/// Rozwiązuje bieżącego trenera z JWT Clerk albo zwraca seedowego (Id=1) gdy auth wyłączony.
/// </summary>
public static class TrainerAccess
{
    public const string LocalClerkUserId = "local-dev";

    public static bool AuthEnabled(IConfiguration config) =>
        !string.IsNullOrWhiteSpace(config["Clerk:Authority"]);

    public static async Task<int> LocalTrainerIdAsync(AppDb db)
    {
        var local = await db.Trainers.AsNoTracking()
            .FirstOrDefaultAsync(t => t.ClerkUserId == LocalClerkUserId);
        if (local is not null) return local.Id;
        throw new InvalidOperationException("Brak trenera lokalnego (seed).");
    }

    public static async Task<Trainer> RequireTrainerAsync(HttpContext http, AppDb db, IConfiguration config)
    {
        if (!AuthEnabled(config))
        {
            var local = await db.Trainers.FirstOrDefaultAsync(t => t.ClerkUserId == LocalClerkUserId);
            if (local is not null) return local;
            local = new Trainer
            {
                ClerkUserId = LocalClerkUserId,
                Email = "trener@localhost",
                Name = "Trener lokalny",
                PlanKey = "dev",
            };
            db.Trainers.Add(local);
            await db.SaveChangesAsync();
            return local;
        }

        var sub = http.User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? http.User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(sub))
            throw new UnauthorizedAccessException("Brak identyfikatora użytkownika w tokenie.");

        var trainer = await db.Trainers.FirstOrDefaultAsync(t => t.ClerkUserId == sub);
        if (trainer is not null) return trainer;

        var email = http.User.FindFirstValue(ClaimTypes.Email)
                    ?? http.User.FindFirstValue("email")
                    ?? "";
        var name = http.User.FindFirstValue("name")
                   ?? http.User.FindFirstValue(ClaimTypes.Name)
                   ?? (email.Contains('@') ? email.Split('@')[0] : "Trener");

        trainer = new Trainer
        {
            ClerkUserId = sub,
            Email = email,
            Name = name,
        };
        db.Trainers.Add(trainer);
        await db.SaveChangesAsync();

        // Onboarding: skopiuj szablony startowe od trenera demo (Id=1), jeśli istnieją.
        await Onboarding.EnsureStarterTemplatesAsync(db, trainer.Id);
        return trainer;
    }

    public static async Task<int> TrainerIdAsync(HttpContext http, AppDb db, IConfiguration config) =>
        (await RequireTrainerAsync(http, db, config)).Id;

    public static Task<bool> OwnsClientAsync(AppDb db, int trainerId, int clientId) =>
        db.Clients.AnyAsync(c => c.Id == clientId && c.TrainerId == trainerId);

    public static Task<Client?> OwnedClientAsync(AppDb db, int trainerId, int clientId) =>
        db.Clients.FirstOrDefaultAsync(c => c.Id == clientId && c.TrainerId == trainerId);

    /// <summary>Sesja należy do klienta tego trenera (NotFound gdy brak / cudza).</summary>
    public static async Task<WorkoutSession?> OwnedSessionAsync(AppDb db, int trainerId, int sessionId) =>
        await db.WorkoutSessions
            .Include(s => s.Client)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.Client!.TrainerId == trainerId);

    /// <summary>Max należy do klienta tego trenera.</summary>
    public static async Task<ClientMax?> OwnedMaxAsync(AppDb db, int trainerId, int maxId) =>
        await db.ClientMaxes
            .Include(m => m.Client)
            .FirstOrDefaultAsync(m => m.Id == maxId && m.Client!.TrainerId == trainerId);

    /// <summary>Przypisanie do klienta tego trenera.</summary>
    public static async Task<Assignment?> OwnedAssignmentAsync(AppDb db, int trainerId, int assignmentId) =>
        await db.Assignments
            .Include(a => a.Client)
            .FirstOrDefaultAsync(a => a.Id == assignmentId && a.Client!.TrainerId == trainerId);

    /// <summary>Pomiar należy do klienta tego trenera.</summary>
    public static async Task<ClientMeasurement?> OwnedMeasurementAsync(AppDb db, int trainerId, int measurementId) =>
        await db.ClientMeasurements
            .Include(m => m.Client)
            .FirstOrDefaultAsync(m => m.Id == measurementId && m.Client!.TrainerId == trainerId);
}
