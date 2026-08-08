using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>
/// Agregacja notatek zostawionych przez klienta w treningach
/// (sesja / ćwiczenie / seria) — widok dla trenera.
/// </summary>
public static class ClientNotes
{
    public sealed record Item(
        int ExerciseId,
        string ExerciseName,
        int? SetNumber,
        double? WeightKg,
        int? Reps,
        double? Rpe,
        string Note);

    public sealed record Group(
        int SessionId,
        DateOnly PerformedOn,
        string? PlanName,
        string? DayLabel,
        string? SessionNote,
        List<Item> Items);

    public static async Task<List<Group>> ForClientAsync(AppDb db, int clientId, int limit = 30)
    {
        limit = Math.Clamp(limit, 1, 100);

        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.ClientId == clientId)
            .Where(s =>
                (s.Note != null && s.Note != "")
                || s.Exercises.Any(e =>
                    (e.Note != null && e.Note != "")
                    || e.Sets.Any(x => x.Note != null && x.Note != "")))
            .OrderByDescending(s => s.PerformedOn)
            .ThenByDescending(s => s.Id)
            .Take(limit)
            .Select(s => new
            {
                s.Id,
                s.PerformedOn,
                PlanName = s.Plan != null ? s.Plan.Name : null,
                DayLabel = s.PlanDay != null ? s.PlanDay.Label : null,
                s.Note,
                Exercises = s.Exercises
                    .OrderBy(e => e.Order)
                    .Select(e => new
                    {
                        e.ExerciseId,
                        ExerciseName = e.Exercise!.Name,
                        e.Note,
                        e.Order,
                        Sets = e.Sets
                            .Where(x => x.Note != null && x.Note != "")
                            .OrderBy(x => x.SetNumber)
                            .Select(x => new
                            {
                                x.SetNumber,
                                x.WeightKg,
                                x.Reps,
                                x.Rpe,
                                x.Note,
                            })
                            .ToList(),
                    })
                    .ToList(),
            })
            .ToListAsync();

        var groups = new List<Group>(sessions.Count);
        foreach (var s in sessions)
        {
            var items = new List<Item>();
            foreach (var e in s.Exercises)
            {
                if (!string.IsNullOrWhiteSpace(e.Note))
                {
                    items.Add(new Item(
                        e.ExerciseId,
                        e.ExerciseName,
                        SetNumber: null,
                        WeightKg: null,
                        Reps: null,
                        Rpe: null,
                        e.Note.Trim()));
                }

                foreach (var set in e.Sets)
                {
                    if (string.IsNullOrWhiteSpace(set.Note)) continue;
                    items.Add(new Item(
                        e.ExerciseId,
                        e.ExerciseName,
                        set.SetNumber,
                        set.WeightKg,
                        set.Reps,
                        set.Rpe,
                        set.Note.Trim()));
                }
            }

            var sessionNote = string.IsNullOrWhiteSpace(s.Note) ? null : s.Note.Trim();
            if (sessionNote is null && items.Count == 0) continue;

            groups.Add(new Group(
                s.Id,
                s.PerformedOn,
                s.PlanName,
                s.DayLabel,
                sessionNote,
                items));
        }

        return groups;
    }

    public static async Task<object> ForClientDtoAsync(AppDb db, int clientId, int limit = 30)
    {
        var groups = await ForClientAsync(db, clientId, limit);
        return groups.Select(g => new
        {
            sessionId = g.SessionId,
            performedOn = g.PerformedOn,
            planName = g.PlanName,
            dayLabel = g.DayLabel,
            sessionNote = g.SessionNote,
            items = g.Items.Select(i => new
            {
                exerciseId = i.ExerciseId,
                exerciseName = i.ExerciseName,
                setNumber = i.SetNumber,
                weightKg = i.WeightKg,
                reps = i.Reps,
                rpe = i.Rpe,
                note = i.Note,
            }),
        });
    }
}
