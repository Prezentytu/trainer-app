using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

public static class TrainerInbox
{
    public static async Task<List<object>> BuildAsync(AppDb db, int trainerId, int take, DateOnly weekStart, DateOnly today)
    {
        static string ClipPreview(string text, int max = 120)
        {
            var t = text.Trim().Replace('\n', ' ');
            return t.Length <= max ? t : t[..(max - 1)] + "…";
        }

        var rows = new List<(string Kind, int ClientId, string ClientName, int? SessionId, int? CheckInId, string Preview, DateTime At, bool Unread)>();

        var unreadReplies = await db.WorkoutSessions
            .Where(s =>
                s.Client!.TrainerId == trainerId
                && s.ClientReply != null
                && s.ClientReply != "")
            .OrderByDescending(s => s.ClientReplyAt ?? s.CreatedAt)
            .Take(take)
            .Select(s => new
            {
                s.ClientId,
                ClientName = s.Client!.Name,
                s.Id,
                Preview = s.ClientReply!,
                At = s.ClientReplyAt ?? s.CreatedAt,
                Unread = s.ClientReplyReadAt == null,
            })
            .ToListAsync();
        foreach (var r in unreadReplies)
            rows.Add(("session_reply", r.ClientId, r.ClientName, r.Id, null, ClipPreview(r.Preview), r.At, r.Unread));

        var unansweredNotes = await db.WorkoutSessions
            .Where(s =>
                s.Client!.TrainerId == trainerId
                && s.Status == "completed"
                && s.Note != null
                && s.Note != ""
                && s.TrainerComment == null
                && s.PerformedOn >= weekStart
                && s.PerformedOn <= today)
            .OrderByDescending(s => s.PerformedOn)
            .ThenByDescending(s => s.Id)
            .Take(take)
            .Select(s => new
            {
                s.ClientId,
                ClientName = s.Client!.Name,
                s.Id,
                Preview = s.Note!,
                s.CreatedAt,
            })
            .ToListAsync();
        foreach (var n in unansweredNotes)
            rows.Add(("session_note", n.ClientId, n.ClientName, n.Id, null, ClipPreview(n.Preview), n.CreatedAt, true));

        var lowCheckIns = await db.ClientCheckIns
            .Where(c =>
                c.Client!.TrainerId == trainerId
                && c.Date >= weekStart
                && c.Date <= today
                && c.MoodScore != null
                && c.MoodScore <= 2)
            .OrderByDescending(c => c.Date)
            .ThenByDescending(c => c.Id)
            .Take(take)
            .Select(c => new
            {
                c.ClientId,
                ClientName = c.Client!.Name,
                c.Id,
                c.MoodScore,
                c.SleepScore,
                c.Note,
                c.CreatedAt,
            })
            .ToListAsync();
        foreach (var c in lowCheckIns)
        {
            var preview = $"Samopoczucie {c.MoodScore}/5";
            if (c.SleepScore != null) preview += $" · sen {c.SleepScore}/5";
            if (!string.IsNullOrWhiteSpace(c.Note)) preview += $" — {c.Note}";
            rows.Add(("low_checkin", c.ClientId, c.ClientName, null, c.Id, ClipPreview(preview), c.CreatedAt, true));
        }

        var outOfOrderSessions = await db.WorkoutSessions
            .Where(s =>
                s.Client!.TrainerId == trainerId
                && s.OutOfOrder
                && s.Status == "completed"
                && s.PerformedOn >= weekStart
                && s.PerformedOn <= today)
            .OrderByDescending(s => s.PerformedOn)
            .ThenByDescending(s => s.Id)
            .Take(take)
            .Select(s => new
            {
                s.ClientId,
                ClientName = s.Client!.Name,
                s.Id,
                DayLabel = s.PlanDay != null ? s.PlanDay.Label : null,
                s.PerformedOn,
                s.CreatedAt,
            })
            .ToListAsync();
        foreach (var s in outOfOrderSessions)
        {
            var label = string.IsNullOrWhiteSpace(s.DayLabel) ? "trening" : s.DayLabel!;
            var preview = $"Zrobił {label} poza kolejką — {s.PerformedOn:yyyy-MM-dd}";
            rows.Add(("out_of_order", s.ClientId, s.ClientName, s.Id, null, ClipPreview(preview), s.CreatedAt, true));
        }

        try
        {
            var pendingHistory = await db.ClientHistoryImports
                .Where(h => h.Client!.TrainerId == trainerId && h.Status == "pending")
                .OrderByDescending(h => h.CreatedAt)
                .Take(take)
                .Select(h => new { h.ClientId, ClientName = h.Client!.Name, h.CreatedAt })
                .ToListAsync();
            foreach (var h in pendingHistory)
                rows.Add(("history_import", h.ClientId, h.ClientName, null, null, "Klient wrzucił zdjęcia treningów — sprawdź, czy się zgadzają.", h.CreatedAt, true));
        }
        catch
        {
            // SQLite bez tabeli — panel ma działać.
        }

        return rows
            .OrderByDescending(x => x.Unread)
            .ThenByDescending(x => x.At)
            .Take(take)
            .Select(x => (object)new
            {
                kind = x.Kind,
                clientId = x.ClientId,
                clientName = x.ClientName,
                sessionId = x.SessionId,
                checkInId = x.CheckInId,
                preview = x.Preview,
                at = x.At,
                unread = x.Unread,
            })
            .ToList();
    }
}
