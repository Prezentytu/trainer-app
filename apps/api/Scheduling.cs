namespace TrainerApp.Api;

/// <summary>Harmonogram hybrydowy: zalecany dzień tygodnia + elastyczna kolejka.</summary>
public static class Scheduling
{
    public static int IsoDayOfWeek(DateOnly date)
    {
        var d = (int)date.DayOfWeek;
        return d == 0 ? 7 : d;
    }

    public static DateOnly MondayOf(DateOnly date) => date.AddDays(1 - IsoDayOfWeek(date));

    public static string WeekdayName(int iso) => iso switch
    {
        1 => "Poniedziałek",
        2 => "Wtorek",
        3 => "Środa",
        4 => "Czwartek",
        5 => "Piątek",
        6 => "Sobota",
        7 => "Niedziela",
        _ => "",
    };

    public static string WeekdayShort(int iso) => iso switch
    {
        1 => "pn",
        2 => "wt",
        3 => "śr",
        4 => "czw",
        5 => "pt",
        6 => "sob",
        7 => "nd",
        _ => "",
    };

    public static DateOnly? ScheduledOn(
        int weekNumber,
        int? dayOfWeek,
        DateOnly startDate,
        int cycleIndex,
        int weekCount,
        DateOnly? overrideDate)
    {
        if (overrideDate is not null) return overrideDate;
        if (dayOfWeek is null or < 1 or > 7) return null;
        var weeks = Math.Max(1, weekCount);
        var monday = MondayOf(startDate);
        return monday.AddDays(cycleIndex * weeks * 7 + (weekNumber - 1) * 7 + (dayOfWeek.Value - 1));
    }

    public static int? TodayScheduledDayId(
        IReadOnlyList<(int Id, int WeekNumber, int? DayOfWeek)> days,
        DateOnly startDate,
        DateOnly today,
        IReadOnlyDictionary<int, int> completionCounts,
        IReadOnlyDictionary<int, DateOnly> overrides)
    {
        if (days.Count == 0) return null;
        if (!days.Any(d => d.DayOfWeek != null || overrides.ContainsKey(d.Id))) return null;
        var weekCount = days.Max(d => d.WeekNumber);
        var min = days.Min(d => completionCounts.GetValueOrDefault(d.Id));
        foreach (var d in days)
        {
            if (completionCounts.GetValueOrDefault(d.Id) > min) continue;
            DateOnly? ov = overrides.TryGetValue(d.Id, out var o) ? o : null;
            var date = ScheduledOn(d.WeekNumber, d.DayOfWeek, startDate, min, weekCount, ov);
            if (date == today) return d.Id;
        }
        return null;
    }

    public static bool HasSchedule(IEnumerable<int?> dayOfWeeks) =>
        dayOfWeeks.Any(d => d is >= 1 and <= 7);

    public static bool ShouldRemindToday(
        IReadOnlyList<(int Id, int WeekNumber, int? DayOfWeek)> days,
        DateOnly startDate,
        DateOnly today,
        IReadOnlyDictionary<int, int> completionCounts,
        IReadOnlyDictionary<int, DateOnly> overrides)
    {
        if (!HasSchedule(days.Select(d => d.DayOfWeek))) return true;
        return TodayScheduledDayId(days, startDate, today, completionCounts, overrides) != null;
    }

    public static ScheduleHero? ResolveHero(
        IReadOnlyList<(int Id, int WeekNumber, int? DayOfWeek, string Label)> days,
        DateOnly startDate,
        DateOnly today,
        IReadOnlyDictionary<int, int> completionCounts,
        IReadOnlyDictionary<int, DateOnly> overrides,
        int? nextDueDayId)
    {
        if (days.Count == 0) return null;
        var todayId = TodayScheduledDayId(
            days.Select(d => (d.Id, d.WeekNumber, d.DayOfWeek)).ToList(),
            startDate,
            today,
            completionCounts,
            overrides);
        var heroId = todayId ?? nextDueDayId;
        if (heroId is null) return null;
        var hero = days.FirstOrDefault(d => d.Id == heroId.Value);
        if (hero.Id != heroId.Value) return null;
        var weekCount = days.Max(d => d.WeekNumber);
        var min = days.Min(d => completionCounts.GetValueOrDefault(d.Id));
        DateOnly? ov = overrides.TryGetValue(hero.Id, out var o) ? o : null;
        var on = ScheduledOn(hero.WeekNumber, hero.DayOfWeek, startDate, min, weekCount, ov);
        string? movedFrom = null;
        if (ov is not null && hero.DayOfWeek is int origDow)
        {
            var original = ScheduledOn(hero.WeekNumber, origDow, startDate, min, weekCount, null);
            if (original is not null && original != ov)
                movedFrom = WeekdayShort(origDow);
        }
        return new ScheduleHero(hero.Id, hero.Label, on, movedFrom);
    }
}

public sealed record ScheduleHero(int Id, string Label, DateOnly? ScheduledOn, string? MovedFrom);