using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

public static class ChurnRadar
{
    public const int SilentDaysThreshold = 7;
    public const int NoSessionWindowDays = 14;

    public static async Task<List<object>> BuildAttentionAsync(AppDb db, int trainerId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
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
                PortalToken = c.AccessTokens
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => t.Token)
                    .FirstOrDefault(),
            })
            .ToListAsync();

        var items = new List<(int Priority, int DaysSilent, object Row)>();

        foreach (var c in clients)
        {
            if (!c.HasActivePlan)
            {
                items.Add((1, 0, new
                {
                    clientId = c.Id,
                    clientName = c.Name,
                    reason = "no_plan",
                    message = "Brak aktywnego planu",
                    daysSilent = (int?)null,
                    portalToken = c.PortalToken,
                    action = "assign_plan",
                }));
                continue;
            }

            if (c.LastCompleted is null)
            {
                items.Add((2, NoSessionWindowDays, new
                {
                    clientId = c.Id,
                    clientName = c.Name,
                    reason = "never_trained",
                    message = $"Aktywny plan, 0 treningów (okno {NoSessionWindowDays} dni)",
                    daysSilent = (int?)null,
                    portalToken = c.PortalToken,
                    action = "copy_portal_link",
                }));
                continue;
            }

            var days = today.DayNumber - c.LastCompleted.Value.DayNumber;
            if (days >= SilentDaysThreshold)
            {
                items.Add((3, days, new
                {
                    clientId = c.Id,
                    clientName = c.Name,
                    reason = "silent",
                    message = $"{days} dni bez treningu",
                    daysSilent = days,
                    portalToken = c.PortalToken,
                    action = "copy_portal_link",
                }));
            }
        }

        return items
            .OrderBy(x => x.Priority)
            .ThenByDescending(x => x.DaysSilent)
            .Take(10)
            .Select(x => x.Row)
            .ToList();
    }
}
