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

    public static double RoundToHalf(double kg) =>
        Math.Round(kg * 2, MidpointRounding.AwayFromZero) / 2;

    public static double VolumeKg(IEnumerable<LoggedSet> sets) =>
        sets.Where(s => !s.IsWarmup && s.WeightKg is not null && s.Reps is not null)
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
            s.Status,
            s.CreatedAt,
            TotalSets = WorkingSetCount(allSets),
            TotalVolumeKg = VolumeKg(allSets),
            ExerciseCount = s.Exercises.Count,
        };
    }

    public static object SessionDetail(
        WorkoutSession s,
        HashSet<(int ExerciseId, int SetId)> prSetIds,
        IReadOnlyDictionary<int, List<object>>? prevSetsByExercise = null,
        IReadOnlyDictionary<int, int?>? restSecondsByExercise = null)
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
            s.PerformedOn,
            s.DurationSeconds,
            s.Note,
            s.FeelingScore,
            s.SleepScore,
            s.EnergyScore,
            s.Status,
            s.CreatedAt,
            TotalSets = WorkingSetCount(allSets),
            TotalVolumeKg = VolumeKg(allSets),
            Prs = prs,
            Exercises = s.Exercises.OrderBy(e => e.Order).Select(e => new
            {
                e.Id,
                e.ExerciseId,
                ExerciseName = e.Exercise?.Name ?? "",
                ExerciseType = e.Exercise?.Type ?? "reps",
                Category = e.Exercise?.Category,
                Media = e.Exercise?.Media ?? [],
                e.Order,
                e.Note,
                RestSeconds = restSecondsByExercise is not null
                    && restSecondsByExercise.TryGetValue(e.ExerciseId, out var rest)
                    ? rest
                    : 90,
                PrevSets = prevSetsByExercise is not null
                    && prevSetsByExercise.TryGetValue(e.ExerciseId, out var prev)
                    ? prev
                    : [],
                Sets = e.Sets.OrderBy(x => x.SetNumber).Select(x => new
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
                    Estimated1Rm = Epley1Rm(x.WeightKg, x.Reps),
                    IsPr = prSetIds.Contains((e.ExerciseId, x.Id)),
                }),
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
