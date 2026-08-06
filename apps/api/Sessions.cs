using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Wspólna logika start / update / complete / DTO sesji (trener + portal).</summary>
public static class Sessions
{
    public static WorkoutSession BuildFromInput(WorkoutSessionInput input) => new()
    {
        ClientId = input.ClientId,
        AssignmentId = input.AssignmentId,
        PlanDayId = input.PlanDayId,
        PlanId = input.PlanId,
        PerformedOn = input.PerformedOn,
        DurationSeconds = input.DurationSeconds,
        Note = input.Note,
        Status = string.IsNullOrWhiteSpace(input.Status) ? "completed" : input.Status,
        Exercises = (input.Exercises ?? []).Select(e => new LoggedExercise
        {
            ExerciseId = e.ExerciseId,
            Order = e.Order,
            Note = e.Note,
            SubstitutedFromExerciseId = e.SubstitutedFromExerciseId,
            Sets = (e.Sets ?? []).Select(MapNewSet).ToList(),
        }).ToList(),
    };

    static LoggedSet MapNewSet(LoggedSetInput s) => new()
    {
        SetNumber = s.SetNumber,
        WeightKg = s.WeightKg,
        Reps = s.Reps,
        DurationSeconds = s.DurationSeconds,
        DistanceMeters = s.DistanceMeters,
        Rir = s.Rir,
        Rpe = s.Rpe,
        IsWarmup = s.IsWarmup,
        Completed = s.Completed,
    };

    public static async Task<(WorkoutSession? Session, IResult? Error)> StartAsync(
        AppDb db, StartSessionInput input, bool requireDayOwnedByClient = false)
    {
        if (!await db.Clients.AnyAsync(c => c.Id == input.ClientId))
            return (null, Results.NotFound());

        if (input.AssignmentId is not null)
        {
            var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == input.AssignmentId);
            if (assignment is null || assignment.ClientId != input.ClientId)
                return (null, Results.NotFound());
        }

        PlanDay? day = null;
        if (input.PlanDayId is not null)
        {
            day = await db.PlanDays
                .Include(d => d.Items).ThenInclude(i => i.Exercise)
                .Include(d => d.Items).ThenInclude(i => i.PrescribedSets)
                .FirstOrDefaultAsync(d => d.Id == input.PlanDayId);
            if (day is null) return (null, Results.NotFound());

            if (requireDayOwnedByClient)
            {
                var owns = await db.Assignments.AnyAsync(a =>
                    a.ClientId == input.ClientId && a.PlanId == day.PlanId && a.Status == "active");
                if (!owns) return (null, Results.NotFound());
            }
        }

        var performedOn = input.PerformedOn ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var dateErr = ValidatePerformedOn(performedOn);
        if (dateErr is not null) return (null, dateErr);

        var maxes = await PlanLoads.LatestMaxesAsync(db, input.ClientId);
        var session = new WorkoutSession
        {
            ClientId = input.ClientId,
            AssignmentId = input.AssignmentId,
            PlanDayId = input.PlanDayId,
            PlanId = input.PlanId ?? day?.PlanId,
            PerformedOn = performedOn,
            Status = "in_progress",
        };

        if (input.RepeatSessionId is int repeatId)
        {
            var source = await db.WorkoutSessions
                .Include(s => s.Exercises).ThenInclude(e => e.Sets)
                .FirstOrDefaultAsync(s => s.Id == repeatId && s.ClientId == input.ClientId);
            if (source is null || source.Status != "completed")
                return (null, Results.BadRequest(new { message = "Nie można powtórzyć tej sesji." }));
            PrefillFromSession(session, source);
            if (session.PlanId is null)
                session.PlanId = source.PlanId;
        }
        else if (day is not null)
            PrefillFromDay(session, day, maxes);

        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync();
        return (session, null);
    }

    /// <summary>Kopia ćwiczeń/serii z poprzedniej sesji — bez completed, z wagami z ostatniego razu.</summary>
    public static void PrefillFromSession(WorkoutSession session, WorkoutSession source)
    {
        var order = 0;
        foreach (var ex in source.Exercises.OrderBy(e => e.Order))
        {
            var logged = new LoggedExercise
            {
                ExerciseId = ex.ExerciseId,
                Order = order++,
                Note = ex.Note,
            };
            foreach (var s in ex.Sets.OrderBy(x => x.SetNumber))
            {
                logged.Sets.Add(new LoggedSet
                {
                    SetNumber = s.SetNumber,
                    WeightKg = s.WeightKg,
                    Reps = s.Reps,
                    DurationSeconds = s.DurationSeconds,
                    DistanceMeters = s.DistanceMeters,
                    Rir = s.Rir,
                    Rpe = s.Rpe,
                    IsWarmup = s.IsWarmup,
                    Completed = false,
                });
            }
            session.Exercises.Add(logged);
        }
    }

    public static void PrefillFromDay(WorkoutSession session, PlanDay day, Dictionary<int, double> maxes)
    {
        var order = 0;
        foreach (var item in day.Items.OrderBy(i => i.Order))
        {
            maxes.TryGetValue(item.ExerciseId, out var oneRm);
            var topKg = PlanLoads.TopLoadKg(item);
            var logged = new LoggedExercise
            {
                ExerciseId = item.ExerciseId,
                Order = order++,
                Note = item.Notes,
            };
            if (item.PrescribedSets.Count > 0)
            {
                foreach (var s in item.PrescribedSets.OrderBy(x => x.Order))
                {
                    logged.Sets.Add(new LoggedSet
                    {
                        SetNumber = s.Order,
                        WeightKg = PlanLoads.ComputedSetLoad(s, topKg, oneRm > 0 ? oneRm : null) ?? s.LoadKg,
                        Reps = s.Reps,
                        DurationSeconds = s.DurationSeconds,
                        DistanceMeters = s.DistanceMeters,
                        Rir = s.TargetRir,
                        Rpe = s.TargetRpe,
                        IsWarmup = s.Role == "warmup" || item.IsWarmup,
                    });
                }
            }
            else
            {
                var sets = item.Sets ?? item.Exercise?.DefaultSets ?? 3;
                var load = item.LoadKg
                    ?? (item.LoadPercent is not null && oneRm > 0
                        ? PlanLoads.RoundToHalf(oneRm * item.LoadPercent.Value / 100.0)
                        : item.Exercise?.DefaultLoadKg);
                var measure = item.MeasureType ?? item.Exercise?.Type ?? "reps";
                for (var n = 1; n <= sets; n++)
                {
                    logged.Sets.Add(new LoggedSet
                    {
                        SetNumber = n,
                        WeightKg = measure == "reps" ? load : null,
                        Reps = measure == "reps" ? (item.Reps ?? item.Exercise?.DefaultReps) : null,
                        DurationSeconds = measure == "time"
                            ? (item.RepDurationSeconds ?? item.Exercise?.DefaultRepDurationSeconds)
                            : null,
                        DistanceMeters = measure == "distance"
                            ? (item.DistanceMeters ?? item.Exercise?.DefaultDistanceMeters)
                            : null,
                        Rir = item.TargetRir,
                        Rpe = item.TargetRpe,
                        IsWarmup = item.IsWarmup,
                    });
                }
            }
            session.Exercises.Add(logged);
        }
    }

    /// <summary>Upsert ćwiczeń/serii po Id — stabilne klucze UI.</summary>
    /// <summary>TrueCoach: nie zapisujemy wyników na przyszłą datę.</summary>
    public static IResult? ValidatePerformedOn(DateOnly performedOn)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (performedOn > today)
            return Results.BadRequest(new { message = "Nie można zapisać treningu z przyszłą datą." });
        return null;
    }

    public static void ApplyUpdate(AppDb db, WorkoutSession session, WorkoutSessionInput input)
    {
        session.ClientId = input.ClientId;
        session.AssignmentId = input.AssignmentId;
        session.PlanDayId = input.PlanDayId;
        session.PlanId = input.PlanId;
        session.PerformedOn = input.PerformedOn;
        session.DurationSeconds = input.DurationSeconds;
        session.Note = input.Note;
        if (!string.IsNullOrWhiteSpace(input.Status))
            session.Status = input.Status;

        var existingExercises = session.Exercises.ToDictionary(e => e.Id);
        var keepExerciseIds = new HashSet<int>();

        foreach (var eInput in input.Exercises ?? [])
        {
            LoggedExercise logged;
            if (eInput.Id is int eid && eid > 0 && existingExercises.TryGetValue(eid, out var existing))
            {
                logged = existing;
                keepExerciseIds.Add(eid);
            }
            else
            {
                logged = new LoggedExercise();
                session.Exercises.Add(logged);
            }

            logged.ExerciseId = eInput.ExerciseId;
            logged.Order = eInput.Order;
            logged.Note = eInput.Note;
            logged.SubstitutedFromExerciseId = eInput.SubstitutedFromExerciseId;

            var existingSets = logged.Sets.ToDictionary(s => s.Id);
            var keepSetIds = new HashSet<int>();
            foreach (var sInput in eInput.Sets ?? [])
            {
                LoggedSet set;
                if (sInput.Id is int sid && sid > 0 && existingSets.TryGetValue(sid, out var es))
                {
                    set = es;
                    keepSetIds.Add(sid);
                }
                else
                {
                    set = new LoggedSet();
                    logged.Sets.Add(set);
                }

                set.SetNumber = sInput.SetNumber;
                set.WeightKg = sInput.WeightKg;
                set.Reps = sInput.Reps;
                set.DurationSeconds = sInput.DurationSeconds;
                set.DistanceMeters = sInput.DistanceMeters;
                set.Rir = sInput.Rir;
                set.Rpe = sInput.Rpe;
                set.IsWarmup = sInput.IsWarmup;
                set.Completed = sInput.Completed;
            }

            var removeSets = logged.Sets.Where(s => s.Id > 0 && !keepSetIds.Contains(s.Id)).ToList();
            if (removeSets.Count > 0)
                db.LoggedSets.RemoveRange(removeSets);
        }

        var removeExercises = session.Exercises.Where(e => e.Id > 0 && !keepExerciseIds.Contains(e.Id)).ToList();
        if (removeExercises.Count > 0)
            db.LoggedExercises.RemoveRange(removeExercises);
    }

    /// <summary>Styrka: cap 4 h — zapomniane treningi nie zawyżają czasu.</summary>
    public const int MaxDurationSeconds = 4 * 60 * 60;

    public static async Task CompleteAsync(AppDb db, WorkoutSession session)
    {
        session.Status = "completed";
        if (session.DurationSeconds is null)
        {
            var elapsed = (int)(DateTime.UtcNow - session.CreatedAt).TotalSeconds;
            session.DurationSeconds = Math.Clamp(elapsed, 60, MaxDurationSeconds);
        }
        else if (session.DurationSeconds > MaxDurationSeconds)
        {
            session.DurationSeconds = MaxDurationSeconds;
        }
        await db.SaveChangesAsync();
    }

    public static IResult? ValidateCheckinScores(SessionCheckinInput input)
    {
        foreach (var (score, label) in new[] { (input.FeelingScore, "Samopoczucie"), (input.SleepScore, "Sen"), (input.EnergyScore, "Energia") })
        {
            if (score is int v && (v < 1 || v > 5))
                return Results.BadRequest(new { message = $"{label} musi być w skali 1–5." });
        }
        return null;
    }

    public static async Task CheckinAsync(AppDb db, WorkoutSession session, SessionCheckinInput input)
    {
        session.FeelingScore = input.FeelingScore;
        session.SleepScore = input.SleepScore;
        session.EnergyScore = input.EnergyScore;
        await db.SaveChangesAsync();
    }

    public static async Task<object?> LoadDto(AppDb db, int id)
    {
        var session = await db.WorkoutSessions
            .Include(s => s.Plan)
            .Include(s => s.PlanDay)
            .Include(s => s.Exercises).ThenInclude(e => e.Exercise)
            .Include(s => s.Exercises).ThenInclude(e => e.SubstitutedFromExercise)
            .Include(s => s.Exercises).ThenInclude(e => e.Sets)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (session is null) return null;

        var exerciseIds = session.Exercises.Select(e => e.ExerciseId).Distinct().ToList();

        var historical = exerciseIds.Count == 0
            ? []
            : await db.LoggedSets
                .Include(s => s.LoggedExercise).ThenInclude(e => e!.Session)
                .Where(s => s.LoggedExercise!.Session!.ClientId == session.ClientId
                            && s.LoggedExercise.Session.Status == "completed"
                            && exerciseIds.Contains(s.LoggedExercise.ExerciseId)
                            && s.LoggedExercise.Session.Id != session.Id
                            && (s.LoggedExercise.Session.PerformedOn < session.PerformedOn
                                || (s.LoggedExercise.Session.PerformedOn == session.PerformedOn
                                    && s.LoggedExercise.Session.Id < session.Id)))
                .ToListAsync();

        var prs = Stats.FindPrSets(session, historical);
        var (prevSets, prevDates) = await LoadPrevSetsAsync(db, session, exerciseIds);
        var restSeconds = await LoadRestSecondsAsync(db, session, exerciseIds);
        var targets = await LoadTargetsAsync(db, session, exerciseIds);
        return Stats.SessionDetail(session, prs, prevSets, restSeconds, targets, prevDates);
    }

    /// <summary>
    /// Cele z planu (kg/powt./RIR/tempo/notatka) — bez zmiany schematu LoggedSet.
    /// Match po ExerciseId + SetNumber.
    /// </summary>
    public static async Task<Dictionary<int, Stats.ExerciseTargets>> LoadTargetsAsync(
        AppDb db, WorkoutSession session, List<int> exerciseIds)
    {
        var result = new Dictionary<int, Stats.ExerciseTargets>();
        if (session.PlanDayId is null || exerciseIds.Count == 0) return result;

        var items = await db.PlanItems
            .Include(i => i.Exercise)
            .Include(i => i.PrescribedSets)
            .Where(i => i.PlanDayId == session.PlanDayId && exerciseIds.Contains(i.ExerciseId))
            .ToListAsync();

        var maxes = await PlanLoads.LatestMaxesAsync(db, session.ClientId);

        foreach (var item in items)
        {
            if (result.ContainsKey(item.ExerciseId)) continue;

            maxes.TryGetValue(item.ExerciseId, out var oneRm);
            var topKg = PlanLoads.TopLoadKg(item);
            var sets = new Dictionary<int, Stats.SetTargets>();

            if (item.PrescribedSets.Count > 0)
            {
                foreach (var s in item.PrescribedSets.OrderBy(x => x.Order))
                {
                    sets[s.Order] = new Stats.SetTargets(
                        PlanLoads.ComputedSetLoad(s, topKg, oneRm > 0 ? oneRm : null) ?? s.LoadKg,
                        s.Reps,
                        s.RepsMax,
                        s.DurationSeconds);
                }
            }
            else
            {
                var setCount = item.Sets ?? item.Exercise?.DefaultSets ?? 3;
                var measure = item.MeasureType ?? item.Exercise?.Type ?? "reps";
                var load = item.LoadKg
                    ?? (item.LoadPercent is not null && oneRm > 0
                        ? PlanLoads.RoundToHalf(oneRm * item.LoadPercent.Value / 100.0)
                        : item.Exercise?.DefaultLoadKg);
                var reps = measure == "reps" ? (item.Reps ?? item.Exercise?.DefaultReps) : null;
                var duration = measure == "time"
                    ? (item.RepDurationSeconds ?? item.Exercise?.DefaultRepDurationSeconds)
                    : null;
                for (var n = 1; n <= setCount; n++)
                {
                    sets[n] = new Stats.SetTargets(
                        measure == "reps" ? load : null,
                        reps,
                        item.RepsMax,
                        duration);
                }
            }

            result[item.ExerciseId] = new Stats.ExerciseTargets(
                item.TargetRir,
                item.Tempo,
                item.Notes,
                sets);
        }

        return result;
    }

    static async Task<(Dictionary<int, List<object>> Sets, Dictionary<int, DateOnly> Dates)> LoadPrevSetsAsync(
        AppDb db, WorkoutSession session, List<int> exerciseIds)
    {
        var result = new Dictionary<int, List<object>>();
        var dates = new Dictionary<int, DateOnly>();
        if (exerciseIds.Count == 0) return (result, dates);

        var prevExercises = await db.LoggedExercises
            .Include(e => e.Sets)
            .Include(e => e.Session)
            .Where(e => exerciseIds.Contains(e.ExerciseId)
                        && e.Session!.ClientId == session.ClientId
                        && e.Session.Status == "completed"
                        && e.Session.Id != session.Id
                        && (e.Session.PerformedOn < session.PerformedOn
                            || (e.Session.PerformedOn == session.PerformedOn
                                && e.Session.Id < session.Id)))
            .ToListAsync();

        foreach (var group in prevExercises.GroupBy(e => e.ExerciseId))
        {
            var latest = group
                .OrderByDescending(e => e.Session!.PerformedOn)
                .ThenByDescending(e => e.Session!.Id)
                .First();
            dates[group.Key] = latest.Session!.PerformedOn;
            result[group.Key] = latest.Sets
                .OrderBy(s => s.SetNumber)
                .Select(s => (object)new
                {
                    s.SetNumber,
                    s.WeightKg,
                    s.Reps,
                    s.DurationSeconds,
                    s.DistanceMeters,
                    s.Rir,
                    s.Rpe,
                    s.IsWarmup,
                })
                .ToList();
        }
        return (result, dates);
    }

    static async Task<Dictionary<int, int?>> LoadRestSecondsAsync(
        AppDb db, WorkoutSession session, List<int> exerciseIds)
    {
        var result = new Dictionary<int, int?>();
        if (session.PlanDayId is null || exerciseIds.Count == 0) return result;

        var items = await db.PlanItems
            .Include(i => i.Exercise)
            .Where(i => i.PlanDayId == session.PlanDayId && exerciseIds.Contains(i.ExerciseId))
            .ToListAsync();

        foreach (var item in items)
        {
            if (!result.ContainsKey(item.ExerciseId))
            {
                result[item.ExerciseId] = item.RestBetweenSetsSeconds
                    ?? item.Exercise?.DefaultRestBetweenSetsSeconds
                    ?? 90;
            }
        }
        return result;
    }
}
