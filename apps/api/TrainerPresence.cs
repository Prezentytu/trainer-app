using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Sesje w toku i ukończone poniżej celu — bez nowych pól w bazie.</summary>
public static class TrainerPresence
{
    public sealed record LiveSessionDto(int ClientId, int SessionId, DateTime StartedAt, int DoneSets, int TotalSets, string ClientName);
    public sealed record NeedsReviewDto(int SessionId, int BelowTargetCount);

    public sealed class Snapshot
    {
        public Dictionary<int, LiveSessionDto> LiveByClient { get; } = [];
        public Dictionary<int, NeedsReviewDto> ReviewByClient { get; } = [];
        public Dictionary<int, NeedsReviewDto> ReviewBySession { get; } = [];
    }

    public static async Task<Snapshot> ForTrainerAsync(AppDb db, int trainerId, CancellationToken ct = default)
    {
        var snap = new Snapshot();

        var live = await db.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.Client!.TrainerId == trainerId && s.Status == "in_progress")
            .Select(s => new
            {
                s.ClientId,
                s.Id,
                s.CreatedAt,
                ClientName = s.Client!.Name,
                DoneSets = s.Exercises.SelectMany(e => e.Sets).Count(x => x.Completed),
                TotalSets = s.Exercises.SelectMany(e => e.Sets).Count(),
            })
            .ToListAsync(ct);

        foreach (var row in live.OrderByDescending(x => x.CreatedAt))
        {
            if (snap.LiveByClient.ContainsKey(row.ClientId)) continue;
            snap.LiveByClient[row.ClientId] = new LiveSessionDto(
                row.ClientId, row.Id, row.CreatedAt, row.DoneSets, row.TotalSets, row.ClientName);
        }

        var since = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-14));
        var candidates = await db.WorkoutSessions
            .AsNoTracking()
            .Include(s => s.Exercises).ThenInclude(e => e.Sets)
            .Include(s => s.Exercises).ThenInclude(e => e.Exercise)
            .Where(s => s.Client!.TrainerId == trainerId
                        && s.Status == "completed"
                        && s.PerformedOn >= since
                        && (s.TrainerComment == null || s.TrainerComment == ""))
            .ToListAsync(ct);

        if (candidates.Count == 0) return snap;

        var dayIds = candidates
            .Where(s => s.PlanDayId is not null)
            .Select(s => s.PlanDayId!.Value)
            .Distinct()
            .ToList();
        var items = dayIds.Count == 0
            ? []
            : await db.PlanItems
                .AsNoTracking()
                .Include(i => i.Exercise)
                .Include(i => i.PrescribedSets)
                .Where(i => dayIds.Contains(i.PlanDayId))
                .ToListAsync(ct);
        var itemsByDay = items.ToLookup(i => i.PlanDayId);

        var maxesByClient = new Dictionary<int, Dictionary<int, double>>();
        foreach (var clientId in candidates.Select(s => s.ClientId).Distinct())
            maxesByClient[clientId] = await PlanLoads.LatestMaxesAsync(db, clientId);

        foreach (var session in candidates.OrderByDescending(s => s.PerformedOn).ThenByDescending(s => s.Id))
        {
            if (session.PlanDayId is not int dayId) continue;
            maxesByClient.TryGetValue(session.ClientId, out var maxes);
            var targets = Sessions.TargetsFromItems(itemsByDay[dayId], maxes ?? []);
            var below = CountBelowTarget(session, targets);
            if (below <= 0) continue;
            var dto = new NeedsReviewDto(session.Id, below);
            snap.ReviewBySession[session.Id] = dto;
            snap.ReviewByClient.TryAdd(session.ClientId, dto);
        }

        return snap;
    }

    public static object? LiveJson(LiveSessionDto? live) =>
        live is null
            ? null
            : new
            {
                sessionId = live.SessionId,
                startedAt = live.StartedAt,
                doneSets = live.DoneSets,
                totalSets = live.TotalSets,
            };

    public static object? ReviewJson(NeedsReviewDto? review) =>
        review is null
            ? null
            : new { sessionId = review.SessionId, belowTargetCount = review.BelowTargetCount };

    public static int CountBelowTarget(
        WorkoutSession session, IReadOnlyDictionary<int, Stats.ExerciseTargets> targets)
    {
        var n = 0;
        foreach (var ex in session.Exercises)
        {
            Stats.ExerciseTargets? t = null;
            if (targets.TryGetValue(ex.ExerciseId, out var byId)) t = byId;
            else if (ex.SubstitutedFromExerciseId is int from && targets.TryGetValue(from, out var byFrom))
                t = byFrom;
            if (t is null) continue;

            var isTime = string.Equals(ex.Exercise?.Type, "time", StringComparison.Ordinal);
            foreach (var set in ex.Sets)
            {
                if (!set.Completed || set.IsWarmup) continue;
                if (!t.Sets.TryGetValue(set.SetNumber, out var st)) continue;
                if (isTime)
                {
                    if (st.TargetDurationSeconds is int td && (set.DurationSeconds ?? set.Reps ?? 0) < td)
                        n++;
                    continue;
                }
                var belowReps = st.TargetReps is int tr && (set.Reps ?? 0) < tr;
                var belowKg = st.TargetWeightKg is double tw && (set.WeightKg ?? 0) < tw;
                if (belowReps || belowKg) n++;
            }
        }
        return n;
    }
}
