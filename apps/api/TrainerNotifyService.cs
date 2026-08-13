using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Natychmiastowy e-mail do trenera tylko przy odpowiedzi klienta.</summary>
public sealed class TrainerNotifyService(AppDb db, EmailService email, IConfiguration config)
{
    public async Task NotifyClientReplyAsync(int sessionId, CancellationToken ct = default)
    {
        var session = await db.WorkoutSessions
            .Include(s => s.Client)
                .ThenInclude(c => c!.Trainer)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);
        if (session?.Client?.Trainer is null) return;
        var trainer = session.Client.Trainer;
        if (!trainer.NotifyClientReply || !CanEmail(trainer.Email)) return;

        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
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

    static bool CanEmail(string? addr) =>
        !string.IsNullOrWhiteSpace(addr) && addr.Contains('@') && !addr.EndsWith("@localhost", StringComparison.OrdinalIgnoreCase);

    static string FirstName(string name)
    {
        var part = name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return part.Length > 0 ? part[0] : "Klient";
    }
}
