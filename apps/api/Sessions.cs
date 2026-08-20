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
        Note = string.IsNullOrWhiteSpace(s.Note) ? null : s.Note.Trim(),
        Side = NormalizeSide(s.Side),
    };

    static string? NormalizeSide(string? side)
    {
        if (string.IsNullOrWhiteSpace(side)) return null;
        var s = side.Trim().ToLowerInvariant();
        return s is "left" or "right" ? s : null;
    }

    /// <summary>Grace przez północ — spójne z MaxDurationSeconds.</summary>
    public static readonly TimeSpan FreshGrace = TimeSpan.FromHours(4);

    public static bool IsFreshInProgress(WorkoutSession session, DateOnly clientToday, DateTime utcNow)
    {
        if (session.Status != "in_progress") return false;
        if (session.PerformedOn == clientToday) return true;
        // Trening rozpoczęty wczoraj i wciąż w oknie 4 h od CreatedAt.
        if (session.PerformedOn == clientToday.AddDays(-1)
            && utcNow - session.CreatedAt < FreshGrace)
            return true;
        return false;
    }

    public static int CountCompletedSets(WorkoutSession session) =>
        session.Exercises.SelectMany(e => e.Sets).Count(s => s.Completed && !s.IsWarmup);

    public static int CountTotalSets(WorkoutSession session) =>
        session.Exercises.SelectMany(e => e.Sets).Count(s => !s.IsWarmup);

    /// <summary>
    /// Rozstrzyga sesje in_progress klienta względem lokalnego „dziś”:
    /// świeża → zwróć; zalegająca pusta → auto-abandon; zalegająca z seriami → stale.
    /// </summary>
    public static async Task<(WorkoutSession? Fresh, WorkoutSession? Stale)> ResolveInProgressAsync(
        AppDb db, int clientId, DateOnly clientToday, DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var open = await db.WorkoutSessions
            .Include(s => s.PlanDay)
            .Include(s => s.Exercises).ThenInclude(e => e.Sets)
            .Where(s => s.ClientId == clientId && s.Status == "in_progress")
            .OrderByDescending(s => s.Id)
            .ToListAsync();

        WorkoutSession? fresh = null;
        WorkoutSession? stale = null;
        var dirty = false;

        foreach (var s in open)
        {
            if (IsFreshInProgress(s, clientToday, now))
            {
                fresh ??= s;
                continue;
            }

            if (CountCompletedSets(s) == 0)
            {
                s.Status = "abandoned";
                dirty = true;
                continue;
            }

            stale ??= s;
        }

        // Starsze świeże/zalegające poza wybranymi — porzuć puste, zostaw jedną stale.
        foreach (var s in open)
        {
            if (s.Status != "in_progress") continue;
            if (ReferenceEquals(s, fresh) || ReferenceEquals(s, stale)) continue;
            if (CountCompletedSets(s) == 0)
            {
                s.Status = "abandoned";
                dirty = true;
            }
            else if (stale is null)
            {
                stale = s;
            }
            // Wiele zalegających z seriami: zostaw najnowszą (OrderByDescending Id), starsze też jako stale nie pokazujemy.
            else if (s.Id < stale.Id)
            {
                // zostaw jako in_progress — klient zobaczy tylko najnowszą; po jej rozstrzygnięciu home weźmie kolejną
            }
        }

        if (dirty) await db.SaveChangesAsync();
        return (fresh, stale);
    }

    public static async Task<(WorkoutSession? Session, IResult? Error)> AbandonAsync(
        AppDb db, WorkoutSession session)
    {
        if (session.Status != "in_progress")
            return (null, Results.Conflict(new { message = "Można odrzucić tylko sesję w toku." }));
        session.Status = "abandoned";
        await db.SaveChangesAsync();
        return (session, null);
    }

    /// <summary>
    /// Następny dzień planu w cyklu ukończeń: pierwszy w kolejności (WeekNumber, Order)
    /// z najmniejszą liczbą ukończonych sesji w danym przypisaniu.
    /// </summary>
    public static async Task<(int? DayId, Dictionary<int, int> CompletionCounts)> NextDueDayAsync(
        AppDb db, int clientId, int assignmentId, int planId)
    {
        var days = await db.PlanDays
            .Where(d => d.PlanId == planId)
            .OrderBy(d => d.WeekNumber)
            .ThenBy(d => d.Order)
            .Select(d => new { d.Id })
            .ToListAsync();

        var completionCounts = days.Count == 0
            ? new Dictionary<int, int>()
            : (await db.WorkoutSessions
                .Where(s => s.ClientId == clientId && s.AssignmentId == assignmentId
                            && s.Status == "completed" && s.PlanDayId != null)
                .GroupBy(s => s.PlanDayId!.Value)
                .Select(g => new { DayId = g.Key, Count = g.Count() })
                .ToListAsync())
                .ToDictionary(x => x.DayId, x => x.Count);

        if (days.Count == 0) return (null, completionCounts);

        var minCompletions = days.Min(d => completionCounts.GetValueOrDefault(d.Id));
        var next = days.FirstOrDefault(d =>
            completionCounts.GetValueOrDefault(d.Id) == minCompletions);
        return (next?.Id, completionCounts);
    }

    public static async Task<(WorkoutSession? Session, IResult? Error)> StartAsync(
        AppDb db, StartSessionInput input, bool requireDayOwnedByClient = false)
    {
        if (!await db.Clients.AnyAsync(c => c.Id == input.ClientId))
            return (null, Results.NotFound());

        var clientToday = input.PerformedOn ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var (fresh, _) = await ResolveInProgressAsync(db, input.ClientId, clientToday);
        if (fresh is not null)
        {
            // Idempotentny powrót — chyba że to pusta sesja-zombie, a prosimy o dzień z prefillem.
            var sameDay = input.PlanDayId is null || input.PlanDayId == fresh.PlanDayId;
            var hasWork = CountTotalSets(fresh) > 0;
            if (sameDay || hasWork)
                return (fresh, null);
            fresh.Status = "abandoned";
            await db.SaveChangesAsync();
        }

        if (input.AssignmentId is not null)
        {
            var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == input.AssignmentId);
            if (assignment is null || assignment.ClientId != input.ClientId)
                return (null, Results.NotFound());
        }

        // Powtórka = osobna sesja bez PlanDayId (nie zalicza dnia w cyklu).
        var isRepeat = input.RepeatSessionId is not null;
        var planDayId = isRepeat ? null : input.PlanDayId;

        PlanDay? day = null;
        if (planDayId is not null)
        {
            day = await db.PlanDays
                .Include(d => d.Items).ThenInclude(i => i.Exercise)
                .Include(d => d.Items).ThenInclude(i => i.PrescribedSets)
                .FirstOrDefaultAsync(d => d.Id == planDayId);
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

        var outOfOrder = false;
        if (!isRepeat && planDayId is int startedDayId && input.AssignmentId is int asgId)
        {
            var assignment = await db.Assignments.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == asgId);
            if (assignment is not null)
            {
                var (dueDayId, _) = await NextDueDayAsync(
                    db, input.ClientId, asgId, assignment.PlanId);
                if (dueDayId is int due && due != startedDayId)
                    outOfOrder = true;
            }
        }

        var maxes = await PlanLoads.LatestMaxesAsync(db, input.ClientId);
        var session = new WorkoutSession
        {
            ClientId = input.ClientId,
            AssignmentId = input.AssignmentId,
            PlanDayId = planDayId,
            PlanId = input.PlanId ?? day?.PlanId,
            PerformedOn = performedOn,
            Status = "in_progress",
            OutOfOrder = outOfOrder,
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
            if (session.AssignmentId is null)
                session.AssignmentId = source.AssignmentId;
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
                SupersetGroup = ex.SupersetGroup,
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
                    Side = s.Side,
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
                SupersetGroup = item.SupersetGroup,
                // Wskazówka trenera żyje w planNote (enrichment) — nie duplikuj do notatki klienta
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
    /// <summary>
    /// Nie zapisujemy dalekiej przyszłości. Tolerancja +1 dzień względem UTC
    /// (wieczór w PL może być już „jutro” lokalnie przy UTC still „dziś”).
    /// </summary>
    public static IResult? ValidatePerformedOn(DateOnly performedOn)
    {
        var utcToday = DateOnly.FromDateTime(DateTime.UtcNow);
        if (performedOn > utcToday.AddDays(1))
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
                set.Note = string.IsNullOrWhiteSpace(sInput.Note) ? null : sInput.Note.Trim();
                set.Side = NormalizeSide(sInput.Side);
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
        if (session.AssignmentId is int aid && session.PlanDayId is int did)
        {
            var overrides = await db.AssignmentDayOverrides
                .Where(o => o.AssignmentId == aid && o.PlanDayId == did)
                .ToListAsync();
            if (overrides.Count > 0)
                db.AssignmentDayOverrides.RemoveRange(overrides);
        }
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
            .Include(s => s.Client).ThenInclude(c => c!.Trainer)
            .Include(s => s.Plan)
            .Include(s => s.PlanDay)
            .Include(s => s.Exercises).ThenInclude(e => e.Exercise)
            .Include(s => s.Exercises).ThenInclude(e => e.SubstitutedFromExercise)
            .Include(s => s.Exercises).ThenInclude(e => e.FormCheck)
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
                            && s.Completed
                            && !s.IsWarmup
                            && exerciseIds.Contains(s.LoggedExercise.ExerciseId)
                            && s.LoggedExercise.Session.Id != session.Id
                            && (s.LoggedExercise.Session.PerformedOn < session.PerformedOn
                                || (s.LoggedExercise.Session.PerformedOn == session.PerformedOn
                                    && s.LoggedExercise.Session.Id < session.Id)))
                .ToListAsync();

        var prs = Stats.FindPrSets(session, historical);
        var (prevSets, prevDates) = await LoadPrevSetsAsync(db, session, exerciseIds);
        var restSeconds = await LoadRestSecondsAsync(db, session);
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
        return TargetsFromItems(items, maxes);
    }

    public static Dictionary<int, Stats.ExerciseTargets> TargetsFromItems(
        IEnumerable<PlanItem> items, IReadOnlyDictionary<int, double> maxes)
    {
        var result = new Dictionary<int, Stats.ExerciseTargets>();
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
                        s.DurationSeconds,
                        s.RestSeconds);
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

    /// <summary>Etykiety 1a/1b dla kolejnych grup; solo = null. Orphan (grupa 1-osobowa) jak solo.</summary>
    public static string?[] SupersetLabels(IReadOnlyList<LoggedExercise> ordered)
    {
        var labels = new string?[ordered.Count];
        var position = 1;
        var i = 0;
        while (i < ordered.Count)
        {
            var g = ordered[i].SupersetGroup;
            if (g is null)
            {
                labels[i] = null;
                position++;
                i++;
                continue;
            }

            var start = i;
            while (i + 1 < ordered.Count && ordered[i + 1].SupersetGroup == g) i++;
            var count = i - start + 1;
            if (count == 1)
            {
                labels[start] = null;
                position++;
                i++;
                continue;
            }

            for (var j = 0; j < count; j++)
                labels[start + j] = $"{position}{(char)('a' + j)}";
            position++;
            i++;
        }
        return labels;
    }

    /// <summary>Klucz = LoggedExercise.Id. W grupie — wspólna przerwa po superserii (max z członków planu).</summary>
    static async Task<Dictionary<int, int?>> LoadRestSecondsAsync(AppDb db, WorkoutSession session)
    {
        var result = new Dictionary<int, int?>();
        var logged = session.Exercises.OrderBy(e => e.Order).ToList();
        foreach (var ex in logged)
            result[ex.Id] = 90;

        if (session.PlanDayId is null || logged.Count == 0) return result;

        var items = await db.PlanItems
            .Include(i => i.Exercise)
            .Where(i => i.PlanDayId == session.PlanDayId)
            .OrderBy(i => i.Order)
            .ToListAsync();

        var groupRest = new Dictionary<int, int>();
        foreach (var grp in items.Where(i => i.SupersetGroup != null).GroupBy(i => i.SupersetGroup!.Value))
        {
            var rests = grp
                .Select(i => i.RestBetweenSetsSeconds ?? i.Exercise?.DefaultRestBetweenSetsSeconds)
                .Where(r => r != null)
                .Select(r => r!.Value)
                .ToList();
            groupRest[grp.Key] = rests.Count > 0 ? rests.Max() : 90;
        }

        for (var i = 0; i < logged.Count; i++)
        {
            var ex = logged[i];
            if (ex.SupersetGroup is int sg && groupRest.TryGetValue(sg, out var gr))
            {
                result[ex.Id] = gr;
                continue;
            }

            var item = i < items.Count
                ? items[i]
                : items.FirstOrDefault(it => it.ExerciseId == ex.ExerciseId);
            result[ex.Id] = item?.RestBetweenSetsSeconds
                ?? item?.Exercise?.DefaultRestBetweenSetsSeconds
                ?? 90;
        }

        return result;
    }

    public static async Task<IReadOnlyList<object>> LoadLastPrescriptionsAsync(
        AppDb db, int clientId, IReadOnlyList<int> exerciseIds)
    {
        if (exerciseIds.Count == 0) return [];

        var logged = await db.LoggedExercises
            .AsNoTracking()
            .Include(e => e.Sets)
            .Include(e => e.Session)
            .Where(e => e.Session!.ClientId == clientId
                        && e.Session.Status == "completed"
                        && exerciseIds.Contains(e.ExerciseId))
            .ToListAsync();

        var byExercise = new Dictionary<int, object>();
        foreach (var group in logged.GroupBy(e => e.ExerciseId))
        {
            var latest = group
                .OrderByDescending(e => e.Session!.PerformedOn)
                .ThenByDescending(e => e.Session!.Id)
                .First();
            var sets = latest.Sets
                .Where(s => s.Completed && !s.IsWarmup)
                .OrderBy(s => s.SetNumber)
                .Select(s => (s.Reps, (int?)null, s.WeightKg))
                .ToList();
            if (sets.Count == 0) continue;
            byExercise[group.Key] = LastPrescriptionDto(
                group.Key, latest.Session!.PerformedOn, "logged", sets);
        }

        var missing = exerciseIds.Where(id => !byExercise.ContainsKey(id)).ToList();
        if (missing.Count == 0) return exerciseIds.Where(byExercise.ContainsKey).Select(id => byExercise[id]).ToList();

        var planned = await db.PlanItems
            .AsNoTracking()
            .Include(i => i.PrescribedSets)
            .Where(i => missing.Contains(i.ExerciseId)
                        && i.Day!.Plan!.Assignments.Any(a => a.ClientId == clientId && a.Status == "active"))
            .ToListAsync();

        foreach (var group in planned.GroupBy(i => i.ExerciseId))
        {
            var item = group.OrderByDescending(i => i.Id).First();
            List<(int? Reps, int? RepsMax, double? LoadKg)> sets;
            if (item.PrescribedSets.Count > 0)
            {
                sets = item.PrescribedSets
                    .OrderBy(s => s.Order)
                    .Select(s => (s.Reps, s.RepsMax, s.LoadKg))
                    .ToList();
            }
            else
            {
                var n = Math.Max(1, item.Sets ?? 3);
                sets = Enumerable.Range(0, n)
                    .Select(_ => (item.Reps, item.RepsMax, item.LoadKg))
                    .ToList();
            }
            if (sets.Count == 0) continue;
            byExercise[group.Key] = LastPrescriptionDto(group.Key, null, "planned", sets);
        }

        return exerciseIds.Where(byExercise.ContainsKey).Select(id => byExercise[id]).ToList();
    }

    static object LastPrescriptionDto(
        int exerciseId,
        DateOnly? performedOn,
        string source,
        IReadOnlyList<(int? Reps, int? RepsMax, double? LoadKg)> sets)
    {
        var label = CompactPrescriptionLabel(sets);
        return new
        {
            exerciseId,
            performedOn,
            source,
            label,
            sets = sets.Select(s => new { reps = s.Reps, repsMax = s.RepsMax, loadKg = s.LoadKg }).ToList(),
        };
    }

    static string CompactPrescriptionLabel(IReadOnlyList<(int? Reps, int? RepsMax, double? LoadKg)> sets)
    {
        if (sets.Count == 0) return "";
        var reps = sets.Select(s => s.Reps).ToList();
        var loads = sets.Select(s => s.LoadKg).ToList();
        var sameReps = reps.All(r => r == reps[0]);
        var sameLoad = loads.All(l => l == loads[0]);
        var measure = sameReps
            ? (reps[0] is null ? "—" : reps[0]!.Value.ToString())
            : string.Join("/", reps.Select(r => r?.ToString() ?? "—"));
        if (sameReps && sameLoad)
        {
            var load = loads[0] is null ? "" : $" · {loads[0]} kg";
            return $"{sets.Count} × {measure}{load}";
        }
        if (sameReps && loads.All(l => l != null))
        {
            var min = loads.Min();
            var max = loads.Max();
            return $"{sets.Count} × {measure} · {min}–{max} kg";
        }
        return $"{sets.Count} × {measure}";
    }
}
