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
                        x.Rir, x.Rpe, x.IsWarmup, x.Completed,
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
}
