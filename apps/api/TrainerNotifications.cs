using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Trwały dziennik sygnałów od klientów — skrzynka trenera.</summary>
public static class TrainerNotifications
{
    public const string SessionNote = "session_note";
    public const string SessionReply = "session_reply";
    public const string LowCheckIn = "low_checkin";
    public const string OutOfOrder = "out_of_order";
    public const string HistoryImport = "history_import";
    public const string Photo = "photo";
    public const string Measurement = "measurement";
    public const string Intake = "intake";

    public static string ClipPreview(string text, int max = 120)
    {
        var t = text.Trim().Replace('\n', ' ');
        return t.Length <= max ? t : t[..(max - 1)] + "…";
    }

    public static async Task AddAsync(
        AppDb db,
        int trainerId,
        int clientId,
        string kind,
        string preview,
        int? sessionId = null,
        int? checkInId = null,
        CancellationToken ct = default)
    {
        preview = ClipPreview(preview);
        var existing = await FindUnreadDuplicateAsync(db, trainerId, clientId, kind, sessionId, checkInId, ct);
        if (existing is not null)
        {
            existing.Preview = preview;
            existing.CreatedAt = DateTime.UtcNow;
            return;
        }

        db.TrainerNotifications.Add(new TrainerNotification
        {
            TrainerId = trainerId,
            ClientId = clientId,
            Kind = kind,
            SessionId = sessionId,
            CheckInId = checkInId,
            Preview = preview,
        });
    }

    static async Task<TrainerNotification?> FindUnreadDuplicateAsync(
        AppDb db,
        int trainerId,
        int clientId,
        string kind,
        int? sessionId,
        int? checkInId,
        CancellationToken ct)
    {
        var q = db.TrainerNotifications.Where(n =>
            n.TrainerId == trainerId && n.Kind == kind && n.ReadAt == null);

        if (kind is SessionNote or SessionReply or OutOfOrder)
        {
            if (sessionId is null) return null;
            return await q.FirstOrDefaultAsync(n => n.SessionId == sessionId, ct);
        }

        if (kind == LowCheckIn)
        {
            if (checkInId is null) return null;
            return await q.FirstOrDefaultAsync(n => n.CheckInId == checkInId, ct);
        }

        if (kind is HistoryImport or Intake)
            return await q.FirstOrDefaultAsync(n => n.ClientId == clientId, ct);

        return null;
    }

    public static object ToDto(TrainerNotification n, string clientName) => new
    {
        id = n.Id,
        kind = n.Kind,
        clientId = n.ClientId,
        clientName,
        sessionId = n.SessionId,
        checkInId = n.CheckInId,
        preview = n.Preview,
        at = n.CreatedAt,
        unread = n.ReadAt == null,
        readAt = n.ReadAt,
    };

    public static async Task<List<object>> ListAsync(
        AppDb db,
        int trainerId,
        bool unreadOnly,
        string? kind,
        int take,
        CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 100);
        var readSince = DateTime.UtcNow.AddDays(-30);

        var q = db.TrainerNotifications
            .Where(n => n.TrainerId == trainerId)
            .Where(n => unreadOnly
                ? n.ReadAt == null
                : n.ReadAt == null || n.CreatedAt >= readSince);

        if (!string.IsNullOrWhiteSpace(kind) && kind != "all")
        {
            if (kind == "rest")
            {
                q = q.Where(n =>
                    n.Kind == OutOfOrder || n.Kind == HistoryImport || n.Kind == Intake);
            }
            else
            {
                var k = kind;
                q = q.Where(n => n.Kind == k);
            }
        }

        var rows = await q
            .OrderByDescending(n => n.ReadAt == null)
            .ThenByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new { n, ClientName = n.Client!.Name })
            .ToListAsync(ct);

        return rows.Select(r => ToDto(r.n, r.ClientName)).ToList();
    }

    public static Task<int> UnreadCountAsync(AppDb db, int trainerId, CancellationToken ct = default) =>
        db.TrainerNotifications.CountAsync(n => n.TrainerId == trainerId && n.ReadAt == null, ct);

    public static async Task<bool> MarkReadAsync(AppDb db, int trainerId, int id, CancellationToken ct = default)
    {
        var row = await db.TrainerNotifications
            .FirstOrDefaultAsync(n => n.Id == id && n.TrainerId == trainerId, ct);
        if (row is null) return false;
        if (row.ReadAt == null)
            row.ReadAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public static async Task<int> MarkAllReadAsync(AppDb db, int trainerId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await db.TrainerNotifications
            .Where(n => n.TrainerId == trainerId && n.ReadAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadAt, now), ct);
    }

    public static async Task MarkSessionReadAsync(AppDb db, int trainerId, int sessionId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        await db.TrainerNotifications
            .Where(n =>
                n.TrainerId == trainerId
                && n.SessionId == sessionId
                && n.ReadAt == null
                && (n.Kind == SessionNote || n.Kind == SessionReply))
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadAt, now), ct);
    }
}
