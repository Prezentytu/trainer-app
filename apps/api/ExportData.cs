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
                c.Id, c.Name, c.Email, c.Note, c.GoalWeightKg, c.CreatedAt,
                Maxes = c.Maxes.Select(m => new
                {
                    m.ExerciseId,
                    ExerciseName = m.Exercise!.Name,
                    m.MaxKg,
                    m.MeasuredOn,
                    m.Note,
                }),
                Measurements = c.Measurements
                    .OrderByDescending(m => m.MeasuredOn)
                    .Select(m => new
                    {
                        m.Id, m.MeasuredOn, m.WeightKg, m.WaistCm, m.ChestCm, m.HipsCm, m.Note, m.CreatedAt,
                    }),
                Intake = c.Intake == null ? null : new
                {
                    c.Intake.GoalType,
                    c.Intake.GoalDetails,
                    c.Intake.Injuries,
                    c.Intake.Pains,
                    c.Intake.ChronicConditions,
                    c.Intake.Medications,
                    c.Intake.WorkType,
                    c.Intake.StressLevel,
                    c.Intake.SleepHours,
                    c.Intake.FreeTimeActivity,
                    c.Intake.ExperienceLevel,
                    c.Intake.PastActivities,
                    c.Intake.TrainingHistoryNotes,
                    c.Intake.SessionsPerWeek,
                    c.Intake.Availability,
                    c.Intake.Equipment,
                    c.Intake.UpdatedAt,
                },
                CheckIns = c.CheckIns
                    .OrderByDescending(x => x.Date)
                    .Select(x => new
                    {
                        x.Id, x.Date, x.MoodScore, x.SleepScore, x.Note, x.CreatedAt,
                    }),
                // Świadomie bez surowych tokenów portalu — rotacja w UI, nie w eksporcie.
                PortalLinkCount = c.AccessTokens.Count,
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
                s.FeelingScore,
                s.SleepScore,
                s.EnergyScore,
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

        // Wiersze serii — jedna linia na set (Styrka-style CSV).
        sb.AppendLine();
        sb.AppendLine("section,sessionId,client,date,exercise,setNumber,weightKg,reps,durationSeconds,distanceMeters,rir,rpe,warmup,completed,note,side");
        var sets = await db.LoggedSets
            .AsNoTracking()
            .Where(x => x.LoggedExercise!.Session!.Client!.TrainerId == trainerId
                        && x.LoggedExercise.Session.Status == "completed")
            .OrderByDescending(x => x.LoggedExercise!.Session!.PerformedOn)
            .ThenBy(x => x.LoggedExercise!.WorkoutSessionId)
            .ThenBy(x => x.LoggedExercise!.Order)
            .ThenBy(x => x.SetNumber)
            .Select(x => new
            {
                SessionId = x.LoggedExercise!.WorkoutSessionId,
                ClientName = x.LoggedExercise.Session!.Client!.Name,
                Date = x.LoggedExercise.Session.PerformedOn,
                ExerciseName = x.LoggedExercise.Exercise!.Name,
                x.SetNumber,
                x.WeightKg,
                x.Reps,
                x.DurationSeconds,
                x.DistanceMeters,
                x.Rir,
                x.Rpe,
                x.IsWarmup,
                x.Completed,
                x.Note,
                x.Side,
            })
            .ToListAsync();
        foreach (var x in sets)
        {
            sb.AppendLine(string.Join(',',
                "set",
                x.SessionId,
                Csv(x.ClientName),
                x.Date.ToString("yyyy-MM-dd"),
                Csv(x.ExerciseName),
                x.SetNumber,
                x.WeightKg?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "",
                x.Reps?.ToString() ?? "",
                x.DurationSeconds?.ToString() ?? "",
                x.DistanceMeters?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "",
                x.Rir?.ToString() ?? "",
                x.Rpe?.ToString() ?? "",
                x.IsWarmup ? "1" : "0",
                x.Completed ? "1" : "0",
                Csv(x.Note),
                Csv(x.Side)));
        }

        return sb.ToString();
    }

    public static async Task<string> BuildClientCsvAsync(AppDb db, int clientId)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("section,sessionId,date,exercise,setNumber,weightKg,reps,durationSeconds,rir,warmup,completed,note");
        var sets = await db.LoggedSets
            .AsNoTracking()
            .Where(x => x.LoggedExercise!.Session!.ClientId == clientId
                        && x.LoggedExercise.Session.Status == "completed")
            .OrderByDescending(x => x.LoggedExercise!.Session!.PerformedOn)
            .ThenBy(x => x.LoggedExercise!.WorkoutSessionId)
            .ThenBy(x => x.LoggedExercise!.Order)
            .ThenBy(x => x.SetNumber)
            .Select(x => new
            {
                SessionId = x.LoggedExercise!.WorkoutSessionId,
                Date = x.LoggedExercise.Session!.PerformedOn,
                ExerciseName = x.LoggedExercise.Exercise!.Name,
                x.SetNumber,
                x.WeightKg,
                x.Reps,
                x.DurationSeconds,
                x.Rir,
                x.IsWarmup,
                x.Completed,
                x.Note,
            })
            .ToListAsync();
        foreach (var x in sets)
        {
            sb.AppendLine(string.Join(',',
                "set",
                x.SessionId,
                x.Date.ToString("yyyy-MM-dd"),
                Csv(x.ExerciseName),
                x.SetNumber,
                x.WeightKg?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "",
                x.Reps?.ToString() ?? "",
                x.DurationSeconds?.ToString() ?? "",
                x.Rir?.ToString() ?? "",
                x.IsWarmup ? "1" : "0",
                x.Completed ? "1" : "0",
                Csv(x.Note)));
        }
        return sb.ToString();
    }

    static string Csv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }
}
