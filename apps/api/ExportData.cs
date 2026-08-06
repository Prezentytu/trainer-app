using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

public static class ExportData
{
    public static async Task<object> BuildAsync(AppDb db, int trainerId)
    {
        var clients = await db.Clients
            .Where(c => c.TrainerId == trainerId)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id, c.Name, c.Email, c.Note, c.CreatedAt,
                Maxes = c.Maxes.Select(m => new
                {
                    m.ExerciseId,
                    ExerciseName = m.Exercise!.Name,
                    m.MaxKg,
                    m.MeasuredOn,
                    m.Note,
                }),
                Tokens = c.AccessTokens.Select(t => new { t.Token, t.CreatedAt, t.ExpiresAt }),
            })
            .ToListAsync();

        var plans = await db.Plans
            .Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id, p.Name, p.Description, p.IsTemplate, p.CreatedAt,
                Days = p.Days.OrderBy(d => d.WeekNumber).ThenBy(d => d.Order).Select(d => new
                {
                    d.WeekNumber, d.Order, d.Label, d.Notes,
                    Items = d.Items.OrderBy(i => i.Order).Select(i => new
                    {
                        i.ExerciseId,
                        ExerciseName = i.Exercise!.Name,
                        i.Sets, i.Reps, i.LoadKg, i.LoadPercent, i.TargetRir, i.TargetRpe, i.Notes,
                    }),
                }),
            })
            .ToListAsync();

        var sessions = await db.WorkoutSessions
            .Where(s => s.Client!.TrainerId == trainerId)
            .OrderByDescending(s => s.PerformedOn)
            .Select(s => new
            {
                s.Id,
                s.ClientId,
                ClientName = s.Client!.Name,
                s.PlanId,
                PlanName = s.Plan != null ? s.Plan.Name : null,
                s.PerformedOn,
                s.DurationSeconds,
                s.Status,
                s.Note,
                Exercises = s.Exercises.OrderBy(e => e.Order).Select(e => new
                {
                    e.ExerciseId,
                    ExerciseName = e.Exercise!.Name,
                    Sets = e.Sets.OrderBy(x => x.SetNumber).Select(x => new
                    {
                        x.SetNumber, x.WeightKg, x.Reps, x.DurationSeconds, x.DistanceMeters,
                        x.Rir, x.Rpe, x.IsWarmup, x.Completed, x.Note, x.Side,
                    }),
                }),
            })
            .ToListAsync();

        return new
        {
            exportedAt = DateTime.UtcNow,
            trainerId,
            clients,
            plans,
            sessions,
        };
    }

    public static async Task<string> BuildCsvAsync(AppDb db, int trainerId)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("section,id,name,email,extra");

        var clients = await db.Clients
            .Where(c => c.TrainerId == trainerId)
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.Name, c.Email, c.Note })
            .ToListAsync();
        foreach (var c in clients)
            sb.AppendLine($"client,{c.Id},{Csv(c.Name)},{Csv(c.Email)},{Csv(c.Note)}");

        var plans = await db.Plans
            .Where(p => p.TrainerId == trainerId)
            .OrderBy(p => p.Name)
            .Select(p => new { p.Id, p.Name, p.IsTemplate, DayCount = p.Days.Count })
            .ToListAsync();
        foreach (var p in plans)
            sb.AppendLine($"plan,{p.Id},{Csv(p.Name)},,{Csv(p.IsTemplate ? "template" : "client_plan")} days={p.DayCount}");

        var sessions = await db.WorkoutSessions
            .Where(s => s.Client!.TrainerId == trainerId && s.Status == "completed")
            .OrderByDescending(s => s.PerformedOn)
            .Select(s => new { s.Id, ClientName = s.Client!.Name, s.PerformedOn, PlanName = s.Plan != null ? s.Plan.Name : null })
            .ToListAsync();
        foreach (var s in sessions)
            sb.AppendLine($"session,{s.Id},{Csv(s.ClientName)},{s.PerformedOn:yyyy-MM-dd},{Csv(s.PlanName)}");

        return sb.ToString();
    }

    static string Csv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }
}
