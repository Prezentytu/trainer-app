using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class PlanLoadsTests
{
    [Fact]
    public void PrefillFromDay_RampAndBackoff_GetComputedKg()
    {
        var item = new PlanItem
        {
            ExerciseId = 1,
            LoadKg = 100,
            PrescribedSets =
            [
                new PlanSet { Order = 1, Role = "ramp", Reps = 5, LoadPercent = 50, PercentOf = "top" },
                new PlanSet { Order = 2, Role = "ramp", Reps = 5, LoadPercent = 75, PercentOf = "top" },
                new PlanSet { Order = 3, Role = "top", Reps = 5, LoadKg = 100 },
                new PlanSet { Order = 4, Role = "backoff", Reps = 8, LoadPercent = 80, PercentOf = "top" },
            ],
        };
        var session = new WorkoutSession();
        Sessions.PrefillFromDay(session, new PlanDay { Items = [item] }, []);

        var sets = session.Exercises.Single().Sets.OrderBy(s => s.SetNumber).ToList();
        Assert.Equal(50, sets[0].WeightKg);
        Assert.Equal(75, sets[1].WeightKg);
        Assert.Equal(100, sets[2].WeightKg);
        Assert.Equal(80, sets[3].WeightKg);
    }

    [Fact]
    public void PrefillFromDay_RampWithoutKg_InheritsTopLoad()
    {
        var item = new PlanItem
        {
            ExerciseId = 1,
            LoadKg = 100,
            PrescribedSets =
            [
                new PlanSet { Order = 1, Role = "ramp", Reps = 5 },
                new PlanSet { Order = 2, Role = "top", Reps = 5 },
            ],
        };
        var session = new WorkoutSession();
        Sessions.PrefillFromDay(session, new PlanDay { Items = [item] }, []);

        var sets = session.Exercises.Single().Sets.OrderBy(s => s.SetNumber).ToList();
        Assert.Equal(100, sets[0].WeightKg);
        Assert.Equal(100, sets[1].WeightKg);
    }
}
