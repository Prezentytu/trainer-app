using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>
/// Detektor zastoju: brak progresu e1RM w 3+ kolejnych sesjach
/// lub spadek tonażu dwa tygodnie z rzędu.
/// </summary>
public static class Stagnation
{
    public const int MinSessionsWithoutProgress = 3;
    public const int VolumeDropWeeks = 2;

    public sealed record Item(
        int ExerciseId,
        string ExerciseName,
        string Reason,
        int? SessionsWithoutProgress,
        int? VolumeDropWeeksCount);

    public static async Task<List<Item>> ForClientAsync(AppDb db, int clientId)
    {
        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.ClientId == clientId && s.Status == "completed")
            .OrderBy(s => s.PerformedOn)
            .ThenBy(s => s.Id)
            .Select(s => new
            {
                s.PerformedOn,
                Exercises = s.Exercises.Select(e => new
                {
                    e.ExerciseId,
                    Name = e.Exercise!.Name,
                    BestE1Rm = e.Sets
                        .Where(x => !x.IsWarmup && x.Completed && x.WeightKg != null && x.Reps != null)
                        .Select(x => (double?)(x.WeightKg!.Value * (1.0 + x.Reps!.Value / 30.0)))
                        .Max(),
                    Volume = e.Sets
                        .Where(x => !x.IsWarmup && x.Completed && x.WeightKg != null && x.Reps != null)
                        .Sum(x => x.WeightKg!.Value * x.Reps!.Value),
                }).ToList(),
            })
            .ToListAsync();

        var byExercise = new Dictionary<int, List<(DateOnly Date, double E1Rm, double Volume, string Name)>>();
        foreach (var s in sessions)
        {
            foreach (var e in s.Exercises)
            {
                if (e.BestE1Rm is null) continue;
                var e1 = Stats.RoundToHalf(e.BestE1Rm.Value);
                if (!byExercise.TryGetValue(e.ExerciseId, out var list))
                {
                    list = [];
                    byExercise[e.ExerciseId] = list;
                }
                list.Add((s.PerformedOn, e1, e.Volume, e.Name));
            }
        }

        var items = new List<Item>();

        foreach (var (exerciseId, history) in byExercise)
        {
            if (history.Count < MinSessionsWithoutProgress) continue;
            var name = history[^1].Name;

            // Brak progresu e1RM w ostatnich N sesjach (żadna nie bije best sprzed okna)
            var window = history.TakeLast(MinSessionsWithoutProgress).ToList();
            var before = history.Take(history.Count - MinSessionsWithoutProgress).ToList();
            var priorBest = before.Count > 0 ? before.Max(h => h.E1Rm) : window[0].E1Rm;
            var improved = window.Any(h => h.E1Rm > priorBest + 0.01);
            // Alternatywnie: w oknie żadna sesja nie poprawia maxa z poprzednich w oknie
            var noProgressInWindow = true;
            var running = window[0].E1Rm;
            for (var i = 1; i < window.Count; i++)
            {
                if (window[i].E1Rm > running + 0.01)
                {
                    noProgressInWindow = false;
                    break;
                }
                running = Math.Max(running, window[i].E1Rm);
            }
            // Zastój: ostatnie N sesji bez poprawy względem best przed oknem LUB bez poprawy wewnątrz
            if (!improved && noProgressInWindow && before.Count > 0)
            {
                items.Add(new Item(
                    exerciseId, name, "no_e1rm_progress",
                    MinSessionsWithoutProgress, null));
                continue;
            }

            // Spadek tonażu 2 tygodnie z rzędu (per ćwiczenie)
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var thisMonday = StartOfWeekMonday(today);
            var w0 = SumVolume(history, thisMonday.AddDays(-14), thisMonday.AddDays(-8));
            var w1 = SumVolume(history, thisMonday.AddDays(-7), thisMonday.AddDays(-1));
            var w2 = SumVolume(history, thisMonday, today);
            // Porównaj ostatnie pełne tygodnie: w0 → w1 → (opcjonalnie bieżący)
            if (w0 > 0 && w1 > 0 && w1 < w0 * 0.95)
            {
                var dropWeeks = 1;
                // Jeśli poprzedni tydzień też spadł względem jeszcze wcześniejszego
                var wPrev = SumVolume(history, thisMonday.AddDays(-21), thisMonday.AddDays(-15));
                if (wPrev > 0 && w0 < wPrev * 0.95)
                    dropWeeks = 2;
                else if (w2 > 0 && w2 < w1 * 0.95)
                    dropWeeks = 2;

                if (dropWeeks >= VolumeDropWeeks)
                {
                    items.Add(new Item(
                        exerciseId, name, "volume_drop",
                        null, dropWeeks));
                }
            }
        }

        return items
            .OrderByDescending(i => i.SessionsWithoutProgress ?? 0)
            .ThenBy(i => i.ExerciseName)
            .Take(10)
            .ToList();
    }

    public static async Task<object> ForClientDtoAsync(AppDb db, int clientId)
    {
        var items = await ForClientAsync(db, clientId);
        return new
        {
            items = items.Select(i => new
            {
                exerciseId = i.ExerciseId,
                exerciseName = i.ExerciseName,
                reason = i.Reason,
                sessionsWithoutProgress = i.SessionsWithoutProgress,
                volumeDropWeeks = i.VolumeDropWeeksCount,
                message = i.Reason == "volume_drop"
                    ? $"{i.ExerciseName}: spadek tonażu {i.VolumeDropWeeksCount} tyg. z rzędu"
                    : $"{i.ExerciseName}: brak progresu e1RM przez {i.SessionsWithoutProgress} sesje",
            }),
        };
    }

    static double SumVolume(
        List<(DateOnly Date, double E1Rm, double Volume, string Name)> history,
        DateOnly from,
        DateOnly to) =>
        history.Where(h => h.Date >= from && h.Date <= to).Sum(h => h.Volume);

    static DateOnly StartOfWeekMonday(DateOnly d)
    {
        var dow = (int)d.DayOfWeek;
        var diff = dow == 0 ? -6 : 1 - dow;
        return d.AddDays(diff);
    }
}
