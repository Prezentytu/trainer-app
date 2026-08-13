using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

public sealed class DigestService(AppDb db, EmailService email, IConfiguration config)
{
    public async Task<(int Sent, int Skipped)> SendDailyUnreadAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
        var inboxUrl = $"{origin}/inbox";
        var trainers = await db.Trainers
            .Where(t => t.NotifyDailySummary && t.LastActivityEmailOn != today)
            .ToListAsync(ct);

        var sent = 0;
        var skipped = 0;
        foreach (var trainer in trainers)
        {
            if (!CanEmail(trainer.Email))
            {
                skipped++;
                continue;
            }

            var unread = await TrainerNotifications.UnreadCountAsync(db, trainer.Id, ct);
            if (unread == 0)
            {
                skipped++;
                continue;
            }

            var items = await db.TrainerNotifications
                .Where(n => n.TrainerId == trainer.Id && n.ReadAt == null)
                .OrderByDescending(n => n.CreatedAt)
                .Take(3)
                .Select(n => new { n.Client!.Name, n.Preview })
                .ToListAsync(ct);

            var (ok, _) = await email.SendAsync(
                trainer.Email,
                unread == 1 ? "1 nieprzeczytany sygnał od klientów" : $"{unread} nieprzeczytanych od klientów",
                EmailService.TrainerDailySummaryHtml(
                    unread,
                    items.Select(i => (i.Name, i.Preview)).ToList(),
                    inboxUrl),
                ct);
            if (ok)
            {
                trainer.LastActivityEmailOn = today;
                sent++;
            }
            else skipped++;
        }

        await db.SaveChangesAsync(ct);
        return (sent, skipped);
    }

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
            if (!CanEmail(trainer.Email))
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

    static bool CanEmail(string? addr) =>
        !string.IsNullOrWhiteSpace(addr) && addr.Contains('@') && !addr.EndsWith("@localhost", StringComparison.OrdinalIgnoreCase);
}
