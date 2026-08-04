using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Agregacje analityczne: objętość mięśniowa i trendy tygodniowe.</summary>
public static class Analytics
{
    public sealed record MuscleVolumeGroup(string Muscle, int Sets, double VolumeKg);

    public sealed record WeekTrend(DateOnly WeekStart, int Sessions, double VolumeKg, int WorkingSets);

    public static async Task<object> ClientMuscleVolumeAsync(AppDb db, int clientId, int weeks)
    {
        weeks = Math.Clamp(weeks, 1, 52);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var from = today.AddDays(-(weeks * 7 - 1));

        var rows = await db.LoggedSets
            .AsNoTracking()
            .Where(s =>
                s.LoggedExercise!.Session!.ClientId == clientId
                && s.LoggedExercise.Session.Status == "completed"
                && s.LoggedExercise.Session.PerformedOn >= from
                && !s.IsWarmup
                && s.Completed)
            .Select(s => new
            {
                s.WeightKg,
                s.Reps,
                Muscles = s.LoggedExercise!.Exercise!.PrimaryMuscles,
                Category = s.LoggedExercise.Exercise.Category,
            })
            .ToListAsync();

        var groups = AggregateMuscleVolume(rows.Select(r => (
            Muscles: r.Muscles,
            Category: r.Category,
            WeightKg: r.WeightKg,
            Reps: r.Reps)));

        return new { weeks, from, to = today, groups };
    }

    public static async Task<object> PlanMuscleVolumeAsync(AppDb db, int planId)
    {
        var items = await db.PlanItems
            .AsNoTracking()
            .Where(i => i.Day!.PlanId == planId && !i.IsWarmup)
            .Select(i => new
            {
                i.Sets,
                PrescribedCount = i.PrescribedSets.Count(ps => ps.Role != "warmup"),
                Muscles = i.Exercise!.PrimaryMuscles,
                Category = i.Exercise.Category,
            })
            .ToListAsync();

        var bag = new Dictionary<string, (int Sets, double VolumeKg)>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in items)
        {
            var setCount = item.PrescribedCount > 0 ? item.PrescribedCount : Math.Max(item.Sets ?? 0, 0);
            if (setCount <= 0) continue;
            var labels = MuscleLabels(item.Muscles, item.Category);
            foreach (var m in labels)
            {
                if (!bag.TryGetValue(m, out var cur))
                    bag[m] = (setCount, 0);
                else
                    bag[m] = (cur.Sets + setCount, cur.VolumeKg);
            }
        }

        var groups = bag
            .Select(kv => new MuscleVolumeGroup(kv.Key, kv.Value.Sets, kv.Value.VolumeKg))
            .OrderByDescending(g => g.Sets)
            .ThenBy(g => g.Muscle, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new { groups };
    }

    public static async Task<object> ClientTrendsAsync(AppDb db, int clientId, int weeks)
    {
        weeks = Math.Clamp(weeks, 1, 52);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thisMonday = StartOfWeekMonday(today);
        var firstMonday = thisMonday.AddDays(-(weeks - 1) * 7);

        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(s =>
                s.ClientId == clientId
                && s.Status == "completed"
                && s.PerformedOn >= firstMonday)
            .Select(s => new
            {
                s.PerformedOn,
                Sets = s.Exercises.SelectMany(e => e.Sets)
                    .Where(x => !x.IsWarmup && x.Completed)
                    .Select(x => new { x.WeightKg, x.Reps })
                    .ToList(),
            })
            .ToListAsync();

        var weekRows = new List<WeekTrend>();
        for (var i = 0; i < weeks; i++)
        {
            var monday = firstMonday.AddDays(i * 7);
            var sunday = monday.AddDays(6);
            var inWeek = sessions.Where(s => s.PerformedOn >= monday && s.PerformedOn <= sunday).ToList();
            var allSets = inWeek.SelectMany(s => s.Sets).ToList();
            var volume = allSets
                .Where(x => x.WeightKg is not null && x.Reps is not null)
                .Sum(x => x.WeightKg!.Value * x.Reps!.Value);
            weekRows.Add(new WeekTrend(monday, inWeek.Count, Stats.RoundToHalf(volume), allSets.Count));
        }

        return new
        {
            weeks = weekRows.Select(w => new
            {
                weekStart = w.WeekStart,
                sessions = w.Sessions,
                volumeKg = w.VolumeKg,
                workingSets = w.WorkingSets,
            }),
        };
    }

    static List<MuscleVolumeGroup> AggregateMuscleVolume(
        IEnumerable<(List<string> Muscles, string? Category, double? WeightKg, int? Reps)> rows)
    {
        var bag = new Dictionary<string, (int Sets, double VolumeKg)>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            var vol = row.WeightKg is not null && row.Reps is not null
                ? row.WeightKg.Value * row.Reps.Value
                : 0;
            foreach (var m in MuscleLabels(row.Muscles, row.Category))
            {
                if (!bag.TryGetValue(m, out var cur))
                    bag[m] = (1, vol);
                else
                    bag[m] = (cur.Sets + 1, cur.VolumeKg + vol);
            }
        }

        return bag
            .Select(kv => new MuscleVolumeGroup(kv.Key, kv.Value.Sets, Stats.RoundToHalf(kv.Value.VolumeKg)))
            .OrderByDescending(g => g.Sets)
            .ThenBy(g => g.Muscle, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    static IEnumerable<string> MuscleLabels(List<string>? muscles, string? category)
    {
        if (muscles is { Count: > 0 })
            return muscles.Where(m => !string.IsNullOrWhiteSpace(m)).Select(m => m.Trim());
        if (!string.IsNullOrWhiteSpace(category))
            return [CategoryFallback(category)];
        return ["Inne"];
    }

    static string CategoryFallback(string category) => category switch
    {
        "shoulders" => "Barki",
        "chest" => "Klatka",
        "back" => "Plecy",
        "arms" => "Ramiona",
        "core" => "Core",
        "legs" => "Nogi",
        "fullbody" => "Całe ciało",
        _ => category,
    };

    static DateOnly StartOfWeekMonday(DateOnly d)
    {
        var dow = (int)d.DayOfWeek; // 0=nd
        var diff = dow == 0 ? -6 : 1 - dow;
        return d.AddDays(diff);
    }
}
