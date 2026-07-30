using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Szablony startowe dla nowego trenera (TTV &lt; 15 min).</summary>
public static class Onboarding
{
    public static async Task EnsureStarterTemplatesAsync(AppDb db, int trainerId)
    {
        if (await db.Plans.AnyAsync(p => p.TrainerId == trainerId)) return;

        var sourceTrainerId = await db.Trainers.AsNoTracking()
            .Where(t => t.ClerkUserId == TrainerAccess.LocalClerkUserId)
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync();
        if (sourceTrainerId is null || sourceTrainerId == trainerId) return;

        var source = await db.Plans
            .AsNoTracking()
            .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
            .Where(p => p.TrainerId == sourceTrainerId && p.IsTemplate)
            .Take(2)
            .ToListAsync();

        if (source.Count == 0) return;

        foreach (var src in source)
        {
            var copy = new Plan
            {
                TrainerId = trainerId,
                Name = src.Name,
                Description = src.Description,
                IsTemplate = true,
                Days = src.Days.Select(d => new PlanDay
                {
                    WeekNumber = d.WeekNumber,
                    Order = d.Order,
                    Label = d.Label,
                    Notes = d.Notes,
                    Items = d.Items.Select(i => new PlanItem
                    {
                        ExerciseId = i.ExerciseId,
                        Order = i.Order,
                        SupersetGroup = i.SupersetGroup,
                        IsWarmup = i.IsWarmup,
                        MeasureType = i.MeasureType,
                        Sets = i.Sets,
                        Reps = i.Reps,
                        RepsMax = i.RepsMax,
                        RepDurationSeconds = i.RepDurationSeconds,
                        RepDurationSecondsMax = i.RepDurationSecondsMax,
                        DistanceMeters = i.DistanceMeters,
                        Tempo = i.Tempo,
                        TargetRpe = i.TargetRpe,
                        TargetRir = i.TargetRir,
                        SetScheme = i.SetScheme,
                        RestBetweenSetsSeconds = i.RestBetweenSetsSeconds,
                        RestAfterExerciseSeconds = i.RestAfterExerciseSeconds,
                        LoadKg = i.LoadKg,
                        LoadPercent = i.LoadPercent,
                        Notes = i.Notes,
                        PrescribedSets = i.PrescribedSets.Select(s => new PlanSet
                        {
                            Order = s.Order,
                            Reps = s.Reps,
                            RepsMax = s.RepsMax,
                            DurationSeconds = s.DurationSeconds,
                            DistanceMeters = s.DistanceMeters,
                            LoadKg = s.LoadKg,
                            LoadPercent = s.LoadPercent,
                            PercentOf = s.PercentOf,
                            TargetRpe = s.TargetRpe,
                            TargetRir = s.TargetRir,
                            Tempo = s.Tempo,
                            Role = s.Role,
                            Note = s.Note,
                        }).ToList(),
                    }).ToList(),
                }).ToList(),
            };
            db.Plans.Add(copy);
        }

        await db.SaveChangesAsync();
    }
}
