using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

public sealed class DigestService(AppDb db, EmailService email, IConfiguration config)
{
    public async Task<(int Sent, int Skipped)> SendWeeklyAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (DateTime.UtcNow.DayOfWeek != DayOfWeek.Monday)
            return (0, 0);

        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
        var trainers = await db.Trainers
            .Where(t => t.NotifyWeeklyDigest && t.LastDigestSentOn != today)
            .ToListAsync(ct);

        var sent = 0;
        var skipped = 0;
        var weekStart = today.AddDays(-7);

        foreach (var trainer in trainers)
        {
            if (string.IsNullOrWhiteSpace(trainer.Email) || !trainer.Email.Contains('@')
                || trainer.Email.EndsWith("@localhost", StringComparison.OrdinalIgnoreCase))
            {
                skipped++;
                continue;
            }

            var trained = await db.WorkoutSessions
                .Where(s => s.Client!.TrainerId == trainer.Id && s.Status == "completed" && s.PerformedOn >= weekStart)
                .Select(s => s.ClientId)
                .Distinct()
                .CountAsync(ct);
            var sessions = await db.WorkoutSessions.CountAsync(
                s => s.Client!.TrainerId == trainer.Id && s.Status == "completed" && s.PerformedOn >= weekStart, ct);
            var silent = (await ChurnRadar.BuildAttentionAsync(db, trainer.Id))
                .Count;
            var prs = await CountRecentPrsAsync(trainer.Id, weekStart, today, ct);

            var (ok, _) = await email.SendAsync(
                trainer.Email,
                "Tydzień u Twoich klientów",
                EmailService.TrainerDigestHtml(trained, sessions, silent, prs, origin),
                ct);
            if (ok)
            {
                trainer.LastDigestSentOn = today;
                sent++;
            }
            else skipped++;
        }

        await db.SaveChangesAsync(ct);
        return (sent, skipped);
    }

    async Task<int> CountRecentPrsAsync(int trainerId, DateOnly from, DateOnly to, CancellationToken ct)
    {
        var rows = await db.LoggedSets
            .Where(s =>
                s.LoggedExercise!.Session!.Client!.TrainerId == trainerId
                && s.LoggedExercise.Session.Status == "completed"
                && s.Completed && !s.IsWarmup
                && s.LoggedExercise.Session.PerformedOn >= from
                && s.LoggedExercise.Session.PerformedOn <= to)
            .Select(s => new { s.LoggedExercise!.Session!.ClientId, s.LoggedExercise.ExerciseId })
            .Distinct()
            .CountAsync(ct);
        return rows;
    }
}
