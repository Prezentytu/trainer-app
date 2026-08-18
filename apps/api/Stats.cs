using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Wzory i agregacje progresu (Epley, wolumen, PR).</summary>
public static class Stats
{
    /// <summary>
    /// Powyżej tej liczby powtórzeń e1RM jest zbyt niedokładny (odcinamy przy 12).
    /// Serie wykończeniowe nie mogą blokować prawdziwych rekordów.
    /// </summary>
    public const int MaxRepsFor1Rm = 12;

    /// <summary>Surowy e1RM Epleya — do porównań PR. Null gdy reps &gt; <see cref="MaxRepsFor1Rm"/>.</summary>
    public static double? Epley1Rm(double? weightKg, int? reps)
    {
        if (weightKg is null || reps is null || reps < 1) return null;
        if (reps > MaxRepsFor1Rm) return null;
        if (reps == 1) return weightKg.Value;
        return weightKg.Value * (1.0 + reps.Value / 30.0);
    }

    /// <summary>e1RM zaokrąglony do 0,5 kg — wyłącznie do serializacji / UI.</summary>
    public static double? Epley1RmDisplay(double? weightKg, int? reps)
    {
        var raw = Epley1Rm(weightKg, reps);
        return raw is null ? null : RoundToHalf(raw.Value);
    }

    public static async Task<object> ExerciseStatsAsync(AppDb db, int clientId, int exerciseId)
    {
        var sets = await db.LoggedSets
            .Include(s => s.LoggedExercise).ThenInclude(e => e!.Session)
            .Where(s => s.LoggedExercise!.Session!.ClientId == clientId
                        && s.LoggedExercise.ExerciseId == exerciseId
                        && s.LoggedExercise.Session.Status == "completed"
                        && !s.IsWarmup
                        && s.Completed)
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

        var estimated1RmRaw = with1Rm.Select(x => x.E1!.Value).DefaultIfEmpty(0).Max();
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
            .Select(g => new { date = g.Key, estimated1Rm = RoundToHalf(g.Max(x => x.E1!.Value)) })
            .OrderBy(x => x.date)
            .ToList();

        return new
        {
            clientId,
            exerciseId,
            estimated1Rm = estimated1RmRaw > 0 ? RoundToHalf(estimated1RmRaw) : (double?)null,
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

    /// <summary>Czy ta seria ustanawia nowy rekord e1RM względem wcześniejszego besta.</summary>
    public static bool IsEpleyPr(double? candidate1Rm, double previousBest1Rm = 0)
    {
        if (candidate1Rm is null) return false;
        return candidate1Rm.Value > previousBest1Rm + 0.01;
    }

    public static bool IsEpleyPr(double? candidate1Rm, IEnumerable<double> previousBest1Rms) =>
        IsEpleyPr(candidate1Rm, previousBest1Rms.DefaultIfEmpty(0).Max());

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
            s.OutOfOrder,
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

    public sealed record PrHit(
        int ExerciseId,
        int SetId,
        double Estimated1Rm,
        double? PreviousBest1Rm);

    public static object SessionDetail(
        WorkoutSession s,
        IReadOnlyList<PrHit> prHits,
        IReadOnlyDictionary<int, List<object>>? prevSetsByExercise = null,
        IReadOnlyDictionary<int, int?>? restSecondsByLoggedId = null,
        IReadOnlyDictionary<int, ExerciseTargets>? targetsByExercise = null,
        IReadOnlyDictionary<int, DateOnly>? prevPerformedOnByExercise = null)
    {
        var allSets = s.Exercises.SelectMany(e => e.Sets).ToList();
        var prBySet = prHits.ToDictionary(p => (p.ExerciseId, p.SetId));
        var prs = s.Exercises
            .SelectMany(e => e.Sets.Select(set => new { Exercise = e, Set = set }))
            .Where(x => prBySet.ContainsKey((x.Exercise.ExerciseId, x.Set.Id)))
            .Select(x =>
            {
                var hit = prBySet[(x.Exercise.ExerciseId, x.Set.Id)];
                return new
                {
                    exerciseId = x.Exercise.ExerciseId,
                    exerciseName = x.Exercise.Exercise?.Name ?? "",
                    setNumber = x.Set.SetNumber,
                    weightKg = x.Set.WeightKg,
                    reps = x.Set.Reps,
                    estimated1Rm = RoundToHalf(hit.Estimated1Rm),
                    previousBest1Rm = hit.PreviousBest1Rm is null
                        ? (double?)null
                        : RoundToHalf(hit.PreviousBest1Rm.Value),
                };
            })
            .ToList();

        var orderedExercises = s.Exercises.OrderBy(e => e.Order).ToList();
        var labels = Sessions.SupersetLabels(orderedExercises);

        return new
        {
            s.Id,
            s.ClientId,
            s.AssignmentId,
            s.PlanDayId,
            s.PlanId,
            PlanName = s.Plan?.Name,
            DayLabel = s.PlanDay?.Label,
            s.OutOfOrder,
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
            Exercises = orderedExercises.Select((e, idx) =>
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
                    e.SupersetGroup,
                    SupersetLabel = labels[idx],
                    e.Note,
                    FormCheck = e.FormCheck == null
                        ? null
                        : new
                        {
                            e.FormCheck.Id,
                            e.FormCheck.ContentType,
                            e.FormCheck.FileName,
                            e.FormCheck.CreatedAt,
                        },
                    TargetRir = targets?.TargetRir,
                    Tempo = targets?.Tempo,
                    PlanNote = targets?.PlanNote,
                    RestSeconds = restSecondsByLoggedId is not null
                        && restSecondsByLoggedId.TryGetValue(e.Id, out var rest)
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
                        var pr = prBySet.TryGetValue((e.ExerciseId, x.Id), out var hit) ? hit : null;
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
                            Estimated1Rm = Epley1RmDisplay(x.WeightKg, x.Reps),
                            IsPr = pr is not null,
                            PreviousBest1Rm = pr?.PreviousBest1Rm is null
                                ? (double?)null
                                : RoundToHalf(pr.PreviousBest1Rm.Value),
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
    /// Najwyższe e1RM na parę (sesja, ćwiczenie). Wiersze bez e1RM odpadają.
    /// </summary>
    public static List<T> PeakPerSessionExercise<T>(
        IEnumerable<T> rows,
        Func<T, int> sessionId,
        Func<T, int> exerciseId,
        Func<T, double?> estimated1Rm)
    {
        return rows
            .Select(r => (Row: r, E1: estimated1Rm(r)))
            .Where(x => x.E1 is not null)
            .GroupBy(x => (sessionId(x.Row), exerciseId(x.Row)))
            .Select(g => g.MaxBy(x => x.E1!.Value)!.Row)
            .ToList();
    }

    /// <summary>
    /// Skan peaków (już 1 wiersz na sesję×ćwiczenie) w kolejności chronologicznej.
    /// PR tylko gdy peak bije best sprzed tej sesji — maks. 1 na ćwiczenie na sesję.
    /// </summary>
    public static IEnumerable<(T Row, double PreviousBest)> ScanPeakPrs<T, TKey>(
        IEnumerable<T> orderedPeaks,
        Func<T, TKey> exerciseKey,
        Func<T, double> estimated1Rm)
        where TKey : notnull
    {
        var best = new Dictionary<TKey, double>();
        foreach (var row in orderedPeaks)
        {
            var e1 = estimated1Rm(row);
            best.TryGetValue(exerciseKey(row), out var prev);
            if (!IsEpleyPr(e1, prev)) continue;
            best[exerciseKey(row)] = e1;
            yield return (row, prev);
        }
    }

    /// <summary>
    /// PR e1RM względem historii sprzed sesji. Maks. jeden hit na ćwiczenie —
    /// seria z najwyższym e1RM, o ile bije best historyczny (nie każda rampa w sesji).
    /// Tylko serie z <see cref="LoggedSet.Completed"/> = true.
    /// </summary>
    public static List<PrHit> FindPrSets(
        WorkoutSession session,
        IReadOnlyList<LoggedSet> historicalWorkingSets)
    {
        var bestByExercise = new Dictionary<int, double>();
        foreach (var group in historicalWorkingSets
            .Where(s => !s.IsWarmup && s.Completed && s.WeightKg is not null && s.Reps is not null)
            .GroupBy(s => s.LoggedExercise!.ExerciseId))
        {
            var best = group
                .Select(s => Epley1Rm(s.WeightKg, s.Reps))
                .Where(v => v is not null)
                .Select(v => v!.Value)
                .DefaultIfEmpty(0)
                .Max();
            bestByExercise[group.Key] = best;
        }

        var prs = new List<PrHit>();
        foreach (var group in session.Exercises.GroupBy(e => e.ExerciseId))
        {
            if (!bestByExercise.TryGetValue(group.Key, out var historicalBest))
                historicalBest = 0;

            LoggedSet? peakSet = null;
            double peakE1 = 0;
            foreach (var set in group
                .OrderBy(e => e.Order)
                .SelectMany(e => e.Sets.OrderBy(s => s.SetNumber)))
            {
                if (set.IsWarmup || !set.Completed) continue;
                var e1 = Epley1Rm(set.WeightKg, set.Reps);
                if (e1 is null) continue;
                if (peakSet is null || e1.Value > peakE1)
                {
                    peakSet = set;
                    peakE1 = e1.Value;
                }
            }

            if (peakSet is not null && IsEpleyPr(peakE1, historicalBest))
            {
                double? previous = historicalBest > 0 ? historicalBest : null;
                prs.Add(new PrHit(group.Key, peakSet.Id, peakE1, previous));
            }
        }
        return prs;
    }
}
