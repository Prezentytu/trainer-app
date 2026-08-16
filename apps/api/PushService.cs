using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebPush;

namespace TrainerApp.Api;

/// <summary>Web Push do klientów (PWA). Bez kluczy VAPID — no-op z logiem.</summary>
public sealed class PushService(AppDb db, IConfiguration config, ILogger<PushService> log)
{
    static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(config["Push:PublicKey"])
        && !string.IsNullOrWhiteSpace(config["Push:PrivateKey"]);

    public async Task<int> SendToClientAsync(
        int clientId,
        string title,
        string body,
        string? url = null,
        CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            log.LogDebug("Push: klucze VAPID nieustawione — pomijam wysyłkę do klienta {ClientId}", clientId);
            return 0;
        }

        var subs = await db.ClientPushSubscriptions
            .Where(s => s.ClientId == clientId)
            .ToListAsync(ct);
        if (subs.Count == 0) return 0;

        var publicKey = config["Push:PublicKey"]!;
        var privateKey = config["Push:PrivateKey"]!;
        var subject = config["Push:Subject"] ?? "mailto:support@workoutalchemist.app";
        var vapid = new VapidDetails(subject, publicKey, privateKey);
        var payload = JsonSerializer.Serialize(new { title, body, url = url ?? "/" }, JsonOpts);

        var client = new WebPushClient();
        var sent = 0;
        var stale = new List<ClientPushSubscription>();

        foreach (var sub in subs)
        {
            ct.ThrowIfCancellationRequested();
            var subscription = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
            try
            {
                await client.SendNotificationAsync(subscription, payload, vapid);
                sent++;
            }
            catch (WebPushException ex) when (
                ex.StatusCode is HttpStatusCode.Gone or HttpStatusCode.NotFound)
            {
                log.LogInformation("Push: usuwam wygasłą subskrypcję {Endpoint}", sub.Endpoint);
                stale.Add(sub);
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "Push: błąd wysyłki do {Endpoint}", sub.Endpoint);
            }
        }

        if (stale.Count > 0)
        {
            db.ClientPushSubscriptions.RemoveRange(stale);
            await db.SaveChangesAsync(ct);
        }

        return sent;
    }

    /// <summary>
    /// Dzienny cron: klienci z aktywnym planem, następnym dniem do zrobienia
    /// i bez ukończonej sesji dziś — push „trening czeka".
    /// </summary>
    public async Task<(int Sent, int Skipped)> SendDailyRemindersAsync(
        string webOrigin,
        CancellationToken ct = default)
    {
        if (!IsConfigured) return (0, 0);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var origin = webOrigin.TrimEnd('/');

        var candidates = await db.Clients
            .Where(c => c.PushSubscriptions.Any())
            .Where(c => c.Assignments.Any(a => a.Status == "active"))
            .Where(c => !c.Sessions.Any(s => s.Status == "completed" && s.PerformedOn == today))
            .Select(c => new
            {
                c.Id,
                c.Name,
                Token = c.AccessTokens
                    .Where(t => t.ExpiresAt == null || t.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => t.Token)
                    .FirstOrDefault(),
                AssignmentId = c.Assignments
                    .Where(a => a.Status == "active")
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => (int?)a.Id)
                    .FirstOrDefault(),
                PlanId = c.Assignments
                    .Where(a => a.Status == "active")
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => (int?)a.PlanId)
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        var sent = 0;
        var skipped = 0;

        foreach (var c in candidates)
        {
            if (string.IsNullOrEmpty(c.Token) || c.AssignmentId is null || c.PlanId is null)
            {
                skipped++;
                continue;
            }

            var completedDayIds = (await db.WorkoutSessions
                .Where(s =>
                    s.ClientId == c.Id
                    && s.AssignmentId == c.AssignmentId
                    && s.Status == "completed"
                    && s.PlanDayId != null)
                .Select(s => s.PlanDayId!.Value)
                .ToListAsync(ct)).ToHashSet();

            var planDays = await db.PlanDays
                .Where(d => d.PlanId == c.PlanId)
                .OrderBy(d => d.WeekNumber)
                .ThenBy(d => d.Order)
                .Select(d => new { d.Id, d.WeekNumber, d.DayOfWeek })
                .ToListAsync(ct);

            var hasNextDay = planDays.Any(d => !completedDayIds.Contains(d.Id));

            if (!hasNextDay && completedDayIds.Count == 0)
            {
                // Plan bez dni — pomiń
                skipped++;
                continue;
            }

            // Jest następny dzień albo plan ma dni (nawet jeśli wszystkie zrobione — nie spamuj)
            if (!hasNextDay)
            {
                skipped++;
                continue;
            }

            if (Scheduling.HasSchedule(planDays.Select(d => d.DayOfWeek)))
            {
                var assignment = await db.Assignments.AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == c.AssignmentId, ct);
                if (assignment is null)
                {
                    skipped++;
                    continue;
                }
                var (_, completionCounts) = await Sessions.NextDueDayAsync(
                    db, c.Id, assignment.Id, assignment.PlanId);
                var overrides = await db.AssignmentDayOverrides
                    .Where(o => o.AssignmentId == assignment.Id)
                    .ToDictionaryAsync(o => o.PlanDayId, o => o.Date, ct);
                if (!Scheduling.ShouldRemindToday(
                    planDays.Select(d => (d.Id, d.WeekNumber, d.DayOfWeek)).ToList(),
                    assignment.StartDate,
                    today,
                    completionCounts,
                    overrides))
                {
                    skipped++;
                    continue;
                }
            }

            var n = await SendToClientAsync(
                c.Id,
                "Trening czeka",
                $"{c.Name}, dziś masz zaplanowany trening.",
                $"{origin}/portal/{c.Token}",
                ct);
            if (n > 0) sent += n;
            else skipped++;
        }

        return (sent, skipped);
    }
}
