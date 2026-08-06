using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Wzory i agregacje progresu (Epley, wolumen, PR).</summary>
public static class Stats
{
    public static double? Epley1Rm(double? weightKg, int? reps)
    {
        if (weightKg is null || reps is null || reps < 1) return null;
        if (reps == 1) return RoundToHalf(weightKg.Value);
        return RoundToHalf(weightKg.Value * (1.0 + reps.Value / 30.0));
    }

    public static async Task<object> ExerciseStatsAsync(AppDb db, int clientId, int exerciseId)
    {
        var sets = await db.LoggedSets
            .Include(s => s.LoggedExercise).ThenInclude(e => e!.Session)
            .Where(s => s.LoggedExercise!.Session!.ClientId == clientId
                        && s.LoggedExercise.ExerciseId == exerciseId
                        && s.LoggedExercise.Session.Status == "completed"
                        && !s.IsWarmup)
            .ToListAsync();

        var with1Rm = sets
            .Select(s => new
            {
                s,
                E1 = Epley1Rm(s.WeightKg, s.Reps),
                Date = s.LoggedExercise!.Session!.PerformedOn,
            })
            .Where(x => x.E1 is not null)
            .OrderBy(x => x.Date)
            .ToList();

        var estimated1Rm = with1Rm.Select(x => x.E1!.Value).DefaultIfEmpty(0).Max();
        var maxWeight = sets.Where(s => s.WeightKg is not null).OrderByDescending(s => s.WeightKg).FirstOrDefault();
        var bySession = sets.GroupBy(s => s.LoggedExercise!.WorkoutSessionId)
            .Select(g => new
            {
                Date = g.First().LoggedExercise!.Session!.PerformedOn,
                Volume = VolumeKg(g),
            })
            .OrderByDescending(x => x.Volume)
            .FirstOrDefault();

        var repMaxes = sets
            .Where(s => s.Reps is not null && s.WeightKg is not null)
            .GroupBy(s => s.Reps!.Value)
            .Select(g => new { reps = g.Key, weightKg = g.Max(x => x.WeightKg!.Value) })
            .OrderBy(x => x.reps)
            .ToList();

        var trend = with1Rm
            .GroupBy(x => x.Date)
            .Select(g => new { date = g.Key, estimated1Rm = g.Max(x => x.E1!.Value) })
            .OrderBy(x => x.date)
            .ToList();

        return new
        {
            clientId,
            exerciseId,
            estimated1Rm = estimated1Rm > 0 ? estimated1Rm : (double?)null,
            maxWeightKg = maxWeight?.WeightKg,
            maxWeightDate = maxWeight?.LoggedExercise?.Session?.PerformedOn,
            maxVolumeKg = bySession?.Volume,
            maxVolumeDate = bySession?.Date,
            repMaxes,
            trend,
        };
    }

    public static double RoundToHalf(double kg) =>
        Math.Round(kg * 2, MidpointRounding.AwayFromZero) / 2;

    /// <summary>
    /// Tonaż tylko z ukończonych serii roboczych.
    /// Prefill planu (kg×reps bez checkmarka) nie wlicza się — inaczej „0/6 serii" pokazuje tony.
    /// </summary>
    public static double VolumeKg(IEnumerable<LoggedSet> sets) =>
        sets.Where(s => !s.IsWarmup && s.Completed && s.WeightKg is not null && s.Reps is not null)
            .Sum(s => s.WeightKg!.Value * s.Reps!.Value);

    public static int WorkingSetCount(IEnumerable<LoggedSet> sets) =>
        sets.Count(s => !s.IsWarmup);

    /// <summary>Czy ta seria ustanawia nowy rekord e1RM względem wcześniejszej historii.</summary>
    public static bool IsEpleyPr(double? candidate1Rm, IEnumerable<double> previousBest1Rms)
    {
        if (candidate1Rm is null) return false;
        var best = previousBest1Rms.DefaultIfEmpty(0).Max();
        return candidate1Rm.Value > best + 0.01;
    }

    public static object SessionSummary(WorkoutSession s)
    {
        var allSets = s.Exercises.SelectMany(e => e.Sets).ToList();
        return new
        {
            s.Id,
            s.ClientId,
            s.AssignmentId,
            s.PlanDayId,
            s.PlanId,
            PlanName = s.Plan?.Name,
            DayLabel = s.PlanDay?.Label,
            s.PerformedOn,
            s.DurationSeconds,
            s.Note,
            s.FeelingScore,
            s.SleepScore,
            s.EnergyScore,
            s.TrainerComment,
            s.TrainerCommentAt,
            s.ClientReply,
            s.ClientReplyAt,
            HasUnreadClientReply = s.ClientReply is not null && s.ClientReplyReadAt is null,
            s.Status,
            s.CreatedAt,
            TotalSets = WorkingSetCount(allSets),
            TotalVolumeKg = VolumeKg(allSets),
            ExerciseCount = s.Exercises.Count,
        };
    }

    public sealed record SetTargets(
        double? TargetWeightKg,
        int? TargetReps,
        int? TargetRepsMax,
        int? TargetDurationSeconds);

    public sealed record ExerciseTargets(
        double? TargetRir,
        string? Tempo,
        string? PlanNote,
        IReadOnlyDictionary<int, SetTargets> Sets);

    public static object SessionDetail(
        WorkoutSession s,
        HashSet<(int ExerciseId, int SetId)> prSetIds,
        IReadOnlyDictionary<int, List<object>>? prevSetsByExercise = null,
        IReadOnlyDictionary<int, int?>? restSecondsByExercise = null,
        IReadOnlyDictionary<int, ExerciseTargets>? targetsByExercise = null,
        IReadOnlyDictionary<int, DateOnly>? prevPerformedOnByExercise = null)
    {
        var allSets = s.Exercises.SelectMany(e => e.Sets).ToList();
        var prs = s.Exercises
            .SelectMany(e => e.Sets.Select(set => new { Exercise = e, Set = set }))
            .Where(x => prSetIds.Contains((x.Exercise.ExerciseId, x.Set.Id)))
            .Select(x => new
            {
                exerciseId = x.Exercise.ExerciseId,
                exerciseName = x.Exercise.Exercise?.Name ?? "",
                setNumber = x.Set.SetNumber,
                weightKg = x.Set.WeightKg,
                reps = x.Set.Reps,
                estimated1Rm = Epley1Rm(x.Set.WeightKg, x.Set.Reps),
            })
            .ToList();

        return new
        {
            s.Id,
            s.ClientId,
            s.AssignmentId,
            s.PlanDayId,
            s.PlanId,
            PlanName = s.Plan?.Name,
            DayLabel = s.PlanDay?.Label,
            ClientName = s.Client?.Name,
            TrainerName = s.Client?.Trainer?.Name,
            s.PerformedOn,
            s.DurationSeconds,
            s.Note,
            s.FeelingScore,
            s.SleepScore,
            s.EnergyScore,
            s.TrainerComment,
            s.TrainerCommentAt,
            s.ClientReply,
            s.ClientReplyAt,
            HasUnreadClientReply = s.ClientReply is not null && s.ClientReplyReadAt is null,
            s.Status,
            s.CreatedAt,
            TotalSets = WorkingSetCount(allSets),
            TotalVolumeKg = VolumeKg(allSets),
            Prs = prs,
            Exercises = s.Exercises.OrderBy(e => e.Order).Select(e =>
            {
                ExerciseTargets? targets = null;
                if (targetsByExercise is not null)
                    targetsByExercise.TryGetValue(e.ExerciseId, out targets);
                return new
                {
                    e.Id,
                    e.ExerciseId,
                    ExerciseName = e.Exercise?.Name ?? "",
                    ExerciseType = e.Exercise?.Type ?? "reps",
                    Category = e.Exercise?.Category,
                    Equipment = e.Exercise?.Equipment ?? new List<string>(),
                    IsUnilateral = e.Exercise?.IsUnilateral ?? false,
                    Media = e.Exercise?.Media ?? [],
                    e.SubstitutedFromExerciseId,
                    SubstitutedFromName = e.SubstitutedFromExercise?.Name,
                    e.Order,
                    e.Note,
                    TargetRir = targets?.TargetRir,
                    Tempo = targets?.Tempo,
                    PlanNote = targets?.PlanNote,
                    RestSeconds = restSecondsByExercise is not null
                        && restSecondsByExercise.TryGetValue(e.ExerciseId, out var rest)
                        ? rest
                        : 90,
                    PrevPerformedOn = prevPerformedOnByExercise is not null
                        && prevPerformedOnByExercise.TryGetValue(e.ExerciseId, out var prevOn)
                        ? prevOn
                        : (DateOnly?)null,
                    PrevSets = prevSetsByExercise is not null
                        && prevSetsByExercise.TryGetValue(e.ExerciseId, out var prev)
                        ? prev
                        : [],
                    Sets = e.Sets.OrderBy(x => x.SetNumber).Select(x =>
                    {
                        SetTargets? setTarget = null;
                        if (targets?.Sets is not null)
                            targets.Sets.TryGetValue(x.SetNumber, out setTarget);
                        return new
                        {
                            x.Id,
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
                            Estimated1Rm = Epley1Rm(x.WeightKg, x.Reps),
                            IsPr = prSetIds.Contains((e.ExerciseId, x.Id)),
                            TargetWeightKg = setTarget?.TargetWeightKg,
                            TargetReps = setTarget?.TargetReps,
                            TargetDurationSeconds = setTarget?.TargetDurationSeconds,
                        };
                    }),
                };
            }),
        };
    }

    /// <summary>
    /// PR e1RM względem historii + wcześniejszych ukończonych serii w tej sesji.
    /// Tylko serie z <see cref="LoggedSet.Completed"/> = true (nagroda po checkmarku, jak Gravitus).
    /// </summary>
    public static HashSet<(int ExerciseId, int SetId)> FindPrSets(
        WorkoutSession session,
        IReadOnlyList<LoggedSet> historicalWorkingSets)
    {
        var bestByExercise = new Dictionary<int, double>();
        foreach (var group in historicalWorkingSets
            .Where(s => !s.IsWarmup && s.WeightKg is not null && s.Reps is not null)
            .GroupBy(s => s.LoggedExercise!.ExerciseId))
        {
            var best = group
                .Select(s => Epley1Rm(s.WeightKg, s.Reps) ?? 0)
                .DefaultIfEmpty(0)
                .Max();
            bestByExercise[group.Key] = best;
        }

        var prs = new HashSet<(int, int)>();
        foreach (var ex in session.Exercises.OrderBy(e => e.Order))
        {
            if (!bestByExercise.TryGetValue(ex.ExerciseId, out var best))
                best = 0;
            foreach (var set in ex.Sets.OrderBy(s => s.SetNumber))
            {
                // Prefill / niezrobione serie nie są PR — dopiero checkmark.
                if (set.IsWarmup || !set.Completed) continue;
                var e1 = Epley1Rm(set.WeightKg, set.Reps);
                if (e1 is not null && e1.Value > best + 0.01)
                {
                    prs.Add((ex.ExerciseId, set.Id));
                    best = e1.Value;
                }
            }
            bestByExercise[ex.ExerciseId] = best;
        }
        return prs;
    }
}
