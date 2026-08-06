using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

public static class ProgressReports
{
    public static async Task<object> BuildForClientAsync(AppDb db, int clientId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var weekAgo = today.AddDays(-7);
        var monthAgo = today.AddDays(-30);
        var fourWeeksAgo = today.AddDays(-28);

        var sessions30 = await db.WorkoutSessions
            .Where(s => s.ClientId == clientId && s.Status == "completed" && s.PerformedOn >= monthAgo)
            .OrderByDescending(s => s.PerformedOn)
            .Select(s => new { s.Id, s.PerformedOn })
            .ToListAsync();

        var sessionsWeek = sessions30.Count(s => s.PerformedOn >= weekAgo);
        var lastSession = sessions30.FirstOrDefault()?.PerformedOn;

        var prs = await CountRecentPrsAsync(db, clientId, monthAgo);

        var strengthFacts = await BuildStrengthDeltasAsync(db, clientId, fourWeeksAgo);

        var facts = new List<object>();
        if (sessionsWeek > 0)
            facts.Add(new { kind = "compliance", text = $"{sessionsWeek} trening{(sessionsWeek == 1 ? "" : sessionsWeek < 5 ? "i" : "ów")} w tym tygodniu" });
        else if (sessions30.Count > 0)
            facts.Add(new { kind = "compliance", text = $"{sessions30.Count} trening{(sessions30.Count == 1 ? "" : sessions30.Count < 5 ? "i" : "ów")} w ostatnich 30 dniach" });
        else
            facts.Add(new { kind = "compliance", text = "Brak ukończonych treningów w ostatnich 30 dniach" });

        if (prs > 0)
            facts.Add(new { kind = "pr", text = $"{prs} now{(prs == 1 ? "y" : "e")} PR w ostatnich 30 dniach" });

        foreach (var f in strengthFacts.Take(3))
            facts.Add(f);

        return new
        {
            clientId,
            lastSessionOn = lastSession,
            sessionsLast7Days = sessionsWeek,
            sessionsLast30Days = sessions30.Count,
            newPrsLast30Days = prs,
            facts,
        };
    }

    private static async Task<int> CountRecentPrsAsync(AppDb db, int clientId, DateOnly since)
    {
        var sets = await db.LoggedSets
            .Where(s => !s.IsWarmup
                        && s.WeightKg != null
                        && s.Reps != null
                        && s.LoggedExercise!.Session!.ClientId == clientId
                        && s.LoggedExercise.Session.Status == "completed")
            .OrderBy(s => s.LoggedExercise!.Session!.PerformedOn)
            .ThenBy(s => s.Id)
            .Select(s => new
            {
                ExerciseId = s.LoggedExercise!.ExerciseId,
                s.WeightKg,
                s.Reps,
                PerformedOn = s.LoggedExercise.Session!.PerformedOn,
            })
            .ToListAsync();

        var best = new Dictionary<int, double>();
        var count = 0;
        foreach (var row in sets)
        {
            var e1 = Stats.Epley1Rm(row.WeightKg, row.Reps);
            if (e1 is null) continue;
            if (!best.TryGetValue(row.ExerciseId, out var prev) || e1.Value > prev + 0.01)
            {
                best[row.ExerciseId] = e1.Value;
                if (row.PerformedOn >= since) count++;
            }
        }
        return count;
    }

    private static async Task<List<object>> BuildStrengthDeltasAsync(AppDb db, int clientId, DateOnly since)
    {
        var sets = await db.LoggedSets
            .Where(s => !s.IsWarmup
                        && s.WeightKg != null
                        && s.Reps != null
                        && s.LoggedExercise!.Session!.ClientId == clientId
                        && s.LoggedExercise.Session.Status == "completed")
            .Select(s => new
            {
                ExerciseId = s.LoggedExercise!.ExerciseId,
                ExerciseName = s.LoggedExercise.Exercise!.Name,
                s.WeightKg,
                s.Reps,
                PerformedOn = s.LoggedExercise.Session!.PerformedOn,
            })
            .ToListAsync();

        var byEx = sets.GroupBy(s => new { s.ExerciseId, s.ExerciseName });
        var ranked = new List<(double AbsDelta, object Fact)>();
        foreach (var g in byEx)
        {
            double? bestOld = null;
            double? bestNew = null;
            foreach (var row in g)
            {
                var e1 = Stats.Epley1Rm(row.WeightKg, row.Reps);
                if (e1 is null) continue;
                if (row.PerformedOn < since)
                    bestOld = bestOld is null ? e1 : Math.Max(bestOld.Value, e1.Value);
                else
                    bestNew = bestNew is null ? e1 : Math.Max(bestNew.Value, e1.Value);
            }
            if (bestOld is null || bestNew is null) continue;
            var delta = bestNew.Value - bestOld.Value;
            if (Math.Abs(delta) < 0.5) continue;
            var sign = delta > 0 ? "+" : "";
            ranked.Add((Math.Abs(delta), new
            {
                kind = "strength",
                text = $"{g.Key.ExerciseName}: {sign}{delta:0.#} kg e1RM vs 4 tyg. temu",
                exerciseId = g.Key.ExerciseId,
                deltaKg = delta,
            }));
        }

        return ranked.OrderByDescending(x => x.AbsDelta).Select(x => x.Fact).ToList();
    }

    /// <summary>
    /// Styrka 3.1 Most Improved: największy % przyrost e1RM w oknie (domyślnie 90 dni).
    /// Wymaga min. 2 sesji z danymi siłowymi w oknie. Null gdy brak kandydata.
    /// </summary>
    public static async Task<object?> MostImprovedAsync(AppDb db, int clientId, int days = 90)
    {
        if (days < 7) days = 7;
        if (days > 365) days = 365;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var since = today.AddDays(-days);

        var sets = await db.LoggedSets
            .AsNoTracking()
            .Where(s => !s.IsWarmup
                        && s.WeightKg != null
                        && s.Reps != null
                        && s.LoggedExercise!.Session!.ClientId == clientId
                        && s.LoggedExercise.Session.Status == "completed"
                        && s.LoggedExercise.Session.PerformedOn >= since)
            .Select(s => new
            {
                ExerciseId = s.LoggedExercise!.ExerciseId,
                ExerciseName = s.LoggedExercise.Exercise!.Name,
                s.WeightKg,
                s.Reps,
                PerformedOn = s.LoggedExercise.Session!.PerformedOn,
            })
            .ToListAsync();

        object? best = null;
        var bestPct = double.NegativeInfinity;

        foreach (var g in sets.GroupBy(s => new { s.ExerciseId, s.ExerciseName }))
        {
            var bySession = g
                .GroupBy(x => x.PerformedOn)
                .Select(sg => new
                {
                    Date = sg.Key,
                    E1 = sg.Select(x => Stats.Epley1Rm(x.WeightKg, x.Reps))
                        .Where(v => v is not null)
                        .Select(v => v!.Value)
                        .DefaultIfEmpty(0)
                        .Max(),
                })
                .Where(x => x.E1 > 0)
                .OrderBy(x => x.Date)
                .ToList();

            if (bySession.Count < 2) continue;

            var start = bySession.First().E1;
            var end = bySession.Last().E1;
            if (start < 0.5) continue;
            var pct = (end - start) / start * 100.0;
            if (pct <= bestPct) continue;

            bestPct = pct;
            best = new
            {
                exerciseId = g.Key.ExerciseId,
                exerciseName = g.Key.ExerciseName,
                percentGain = Math.Round(pct, 1),
                startE1Rm = Stats.RoundToHalf(start),
                endE1Rm = Stats.RoundToHalf(end),
                deltaKg = Stats.RoundToHalf(end - start),
                days,
                sessionCount = bySession.Count,
            };
        }

        return best;
    }
}
