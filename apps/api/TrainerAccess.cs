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
}
