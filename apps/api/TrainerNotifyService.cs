using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>E-mail do trenera po sesji klienta / odpowiedzi / PR.</summary>
public sealed class TrainerNotifyService(AppDb db, EmailService email, IConfiguration config)
{
    public async Task NotifySessionCompletedAsync(int sessionId, CancellationToken ct = default)
    {
        var session = await LoadSessionAsync(sessionId, ct);
        if (session?.Client?.Trainer is null) return;
        var trainer = session.Client.Trainer;
        if (!CanEmail(trainer.Email)) return;

        var origin = WebOrigin();
        var url = $"{origin}/clients/{session.ClientId}/sessions/{session.Id}";
        var first = FirstName(session.Client.Name);
        var day = session.PlanDay?.Label ?? "trening";

        if (trainer.NotifySessionComplete)
        {
            await email.SendAsync(
                trainer.Email,
                $"{first} skończył trening",
                EmailService.TrainerSessionHtml(first, day, url),
                ct);
        }

        if (!trainer.NotifyPr) return;

        var dto = await Sessions.LoadDto(db, session.Id);
        var prNames = ExtractPrNames(dto);
        if (prNames.Count == 0) return;
        var list = string.Join(", ", prNames.Take(3));
        await email.SendAsync(
            trainer.Email,
            $"{first}: nowy rekord — {list}",
            EmailService.TrainerPrHtml(first, list, url),
            ct);
    }

    public async Task NotifyClientReplyAsync(int sessionId, CancellationToken ct = default)
    {
        var session = await LoadSessionAsync(sessionId, ct);
        if (session?.Client?.Trainer is null) return;
        var trainer = session.Client.Trainer;
        if (!trainer.NotifyClientReply || !CanEmail(trainer.Email)) return;

        var origin = WebOrigin();
        var url = $"{origin}/clients/{session.ClientId}/sessions/{session.Id}";
        var first = FirstName(session.Client.Name);
        var preview = (session.ClientReply ?? "").Trim();
        if (preview.Length > 160) preview = preview[..160] + "…";
        await email.SendAsync(
            trainer.Email,
            $"{first} odpisał na komentarz",
            EmailService.TrainerReplyHtml(first, preview, url),
            ct);
    }

    Task<WorkoutSession?> LoadSessionAsync(int sessionId, CancellationToken ct) =>
        db.WorkoutSessions
            .Include(s => s.Client)
                .ThenInclude(c => c!.Trainer)
            .Include(s => s.PlanDay)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

    string WebOrigin() => (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');

    static bool CanEmail(string? addr) =>
        !string.IsNullOrWhiteSpace(addr) && addr.Contains('@') && !addr.EndsWith("@localhost", StringComparison.OrdinalIgnoreCase);

    static string FirstName(string name)
    {
        var part = name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return part.Length > 0 ? part[0] : "Klient";
    }

    static List<string> ExtractPrNames(object? dto)
    {
        var names = new List<string>();
        if (dto is null) return names;
        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(dto, new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            });
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("exercises", out var exercises))
                return names;
            foreach (var ex in exercises.EnumerateArray())
            {
                var name = ex.TryGetProperty("exerciseName", out var n) ? n.GetString() : null;
                if (!ex.TryGetProperty("sets", out var sets)) continue;
                if (sets.EnumerateArray().Any(s =>
                        s.TryGetProperty("isPr", out var pr) && pr.ValueKind == System.Text.Json.JsonValueKind.True))
                {
                    if (!string.IsNullOrWhiteSpace(name)) names.Add(name);
                }
            }
        }
        catch (Exception)
        {
            // Kształt DTO może się zmienić — brak PR w mailu nie blokuje sesji.
        }
        return names;
    }
}
