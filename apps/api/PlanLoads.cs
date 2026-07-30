using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Wyliczanie ciężarów planu (% top / % 1RM) i najnowszych maxów klienta.</summary>
public static class PlanLoads
{
    public static double RoundToHalf(double kg) =>
        Math.Round(kg * 2, MidpointRounding.AwayFromZero) / 2;

    public static double? TopLoadKg(PlanItem item)
    {
        var byRole = item.PrescribedSets.FirstOrDefault(s => s.Role is "top" or "ramp" && s.LoadKg is not null)?.LoadKg;
        if (byRole is not null) return byRole;
        if (item.LoadKg is not null) return item.LoadKg;
        var maxSet = item.PrescribedSets.Where(s => s.LoadKg is not null).Select(s => s.LoadKg!.Value);
        if (maxSet.Any()) return maxSet.Max();
        return item.Exercise?.DefaultLoadKg;
    }

    public static double? ComputedSetLoad(PlanSet set, double? topKg, double? oneRmKg)
    {
        if (set.LoadKg is not null) return set.LoadKg;
        if (set.LoadPercent is not null && set.PercentOf == "top" && topKg is not null)
            return RoundToHalf(topKg.Value * set.LoadPercent.Value / 100.0);
        if (set.LoadPercent is not null && set.PercentOf == "1rm" && oneRmKg is not null)
            return RoundToHalf(oneRmKg.Value * set.LoadPercent.Value / 100.0);
        return null;
    }

    public static async Task<Dictionary<int, double>> LatestMaxesAsync(AppDb db, int clientId)
    {
        var rows = await db.ClientMaxes
            .Where(m => m.ClientId == clientId)
            .OrderByDescending(m => m.MeasuredOn)
            .ThenByDescending(m => m.Id)
            .ToListAsync();
        var map = new Dictionary<int, double>();
        foreach (var m in rows)
        {
            if (!map.ContainsKey(m.ExerciseId))
                map[m.ExerciseId] = m.MaxKg;
        }
        return map;
    }
}
