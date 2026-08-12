using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

public static class ChurnRadar
{
    public const int SilentDaysThreshold = 7;
    public const int NoSessionWindowDays = 14;
    public const int ComplianceWindowDays = 14;

    public static async Task<List<object>> BuildAttentionAsync(AppDb db, int trainerId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var windowStart = today.AddDays(-ComplianceWindowDays);

        var clients = await db.Clients
            .Where(c => c.TrainerId == trainerId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                HasActivePlan = c.Assignments.Any(a => a.Status == "active"),
                LastCompleted = c.Sessions
                    .Where(s => s.Status == "completed")
                    .Max(s => (DateOnly?)s.PerformedOn),
                CompletedInWindow = c.Sessions.Count(s =>
                    s.Status == "completed" && s.PerformedOn >= windowStart),
                PlannedDaysPerWeek = c.Assignments
                    .Where(a => a.Status == "active")
                    .SelectMany(a => a.Plan!.Days)
                    .Where(d => d.WeekNumber == 1)
                    .Select(d => d.Id)
                    .Distinct()
                    .Count(),
                AvgRecentFeeling = c.Sessions
                    .Where(s => s.Status == "completed" && s.FeelingScore != null)
                    .OrderByDescending(s => s.PerformedOn)
                    .ThenByDescending(s => s.Id)
                    .Take(3)
                    .Select(s => (double?)s.FeelingScore)
                    .Average(),
                LastCheckIn = c.CheckIns.Max(x => (DateOnly?)x.Date),
                PortalToken = c.AccessTokens
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => t.Token)
                    .FirstOrDefault(),
            })
            .ToListAsync();

        var items = new List<(int Priority, int DaysSilent, object Row)>();

        foreach (var c in clients)
        {
            var plannedPerWeek = Math.Max(c.PlannedDaysPerWeek, 0);
            var expectedInWindow = plannedPerWeek > 0
                ? (int)Math.Round(plannedPerWeek * (ComplianceWindowDays / 7.0))
                : 0;
            int? compliancePct = expectedInWindow > 0
                ? (int)Math.Round(100.0 * Math.Min(c.CompletedInWindow, expectedInWindow) / expectedInWindow)
                : null;

            if (!c.HasActivePlan)
            {
                items.Add((1, 0, AttentionRow(
                    c.Id, c.Name, "no_plan", "Brak aktywnego planu",
                    null, compliancePct, c.PortalToken, "assign_plan",
                    c.CompletedInWindow, expectedInWindow)));
                continue;
            }

            if (c.LastCompleted is null)
            {
                items.Add((2, NoSessionWindowDays, AttentionRow(
                    c.Id, c.Name, "never_trained",
                    $"Aktywny plan, 0 treningów (okno {NoSessionWindowDays} dni)",
                    null, compliancePct, c.PortalToken, "copy_portal_link",
                    c.CompletedInWindow, expectedInWindow)));
                continue;
            }

            var days = today.DayNumber - c.LastCompleted.Value.DayNumber;
            if (days >= SilentDaysThreshold)
            {
                items.Add((3, days, AttentionRow(
                    c.Id, c.Name, "silent",
                    $"{days} dni bez treningu",
                    days, compliancePct, c.PortalToken, "copy_portal_link",
                    c.CompletedInWindow, expectedInWindow)));
                continue;
            }

            if (c.AvgRecentFeeling is double feeling && feeling < 2.5)
            {
                items.Add((4, (int)Math.Round((2.5 - feeling) * 10), AttentionRow(
                    c.Id, c.Name, "low_wellness",
                    $"Niskie samopoczucie po treningach (śr. {feeling:0.#}/5)",
                    null, compliancePct, c.PortalToken, "copy_portal_link",
                    c.CompletedInWindow, expectedInWindow)));
                continue;
            }

            // Cisza w check-inach przy aktywnym planie (bez ciszy treningowej)
            if (c.LastCheckIn is null || today.DayNumber - c.LastCheckIn.Value.DayNumber >= SilentDaysThreshold)
            {
                var checkInDays = c.LastCheckIn is null
                    ? (int?)null
                    : today.DayNumber - c.LastCheckIn.Value.DayNumber;
                if (checkInDays is null || checkInDays >= SilentDaysThreshold)
                {
                    // Tylko gdy brak jakiegokolwiek check-inu od progu — nie spamuj listy
                    if (c.LastCheckIn is not null && checkInDays >= SilentDaysThreshold + 7)
                    {
                        items.Add((5, checkInDays.Value, AttentionRow(
                            c.Id, c.Name, "no_checkin",
                            $"{checkInDays} dni bez check-inu",
                            checkInDays, compliancePct, c.PortalToken, "copy_portal_link",
                            c.CompletedInWindow, expectedInWindow)));
                    }
                }
            }

            // Niska compliance przy niedawnej aktywności
            if (compliancePct is int pct && pct < 50 && days < SilentDaysThreshold)
            {
                items.Add((6, 100 - pct, AttentionRow(
                    c.Id, c.Name, "low_compliance",
                    $"{c.CompletedInWindow} z {expectedInWindow} treningów (ostatnie {ComplianceWindowDays} dni)",
                    days, compliancePct, c.PortalToken, "copy_portal_link",
                    c.CompletedInWindow, expectedInWindow)));
            }

            // Zastój siłowy — tylko gdy klient nadal trenuje (nie dubluj ciszy)
            if (days < SilentDaysThreshold)
            {
                var stagnations = await Stagnation.ForClientAsync(db, c.Id);
                if (stagnations.Count > 0)
                {
                    var top = stagnations[0];
                    var msg = top.Reason == "volume_drop"
                        ? $"Zastój: {top.ExerciseName} (spadek tonażu)"
                        : $"Zastój: {top.ExerciseName} (brak progresu e1RM)";
                    items.Add((7, stagnations.Count, AttentionRow(
                        c.Id, c.Name, "stagnation", msg,
                        days, compliancePct, c.PortalToken, "copy_portal_link",
                        c.CompletedInWindow, expectedInWindow)));
                }
            }
        }

        return items
            .OrderBy(x => x.Priority)
            .ThenByDescending(x => x.DaysSilent)
            .Take(10)
            .Select(x => x.Row)
            .ToList();
    }

    static object AttentionRow(
        int clientId, string clientName, string reason, string message,
        int? daysSilent, int? compliancePct, string? portalToken, string action,
        int completedInWindow = 0, int expectedInWindow = 0) => new
    {
        clientId,
        clientName,
        reason,
        message,
        daysSilent,
        compliancePct,
        completedInWindow = expectedInWindow > 0 ? completedInWindow : (int?)null,
        expectedInWindow = expectedInWindow > 0 ? expectedInWindow : (int?)null,
        portalToken,
        action,
    };
}
