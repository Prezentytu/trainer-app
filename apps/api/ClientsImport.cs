using System.Globalization;
using System.Text;

namespace TrainerApp.Api;

public static class ClientsImport
{
    public const int MaxRows = 50;

    public sealed record Row(string Name, string? Email);
    public sealed record Result(int Created, int Skipped, List<string> Errors, List<int> Ids);

    public static List<Row> Parse(string csv)
    {
        var rows = new List<Row>();
        using var reader = new StringReader(csv ?? "");
        var first = true;
        while (reader.ReadLine() is { } line)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            var parts = SplitCsvLine(line);
            if (parts.Count == 0) continue;
            var a = parts[0].Trim().Trim('"');
            var b = parts.Count > 1 ? parts[1].Trim().Trim('"') : "";
            if (first && LooksLikeHeader(a, b))
            {
                first = false;
                continue;
            }
            first = false;
            if (a.Length < 2) continue;
            var email = string.IsNullOrWhiteSpace(b) ? null : b;
            rows.Add(new Row(a, email));
        }
        return rows;
    }

    static bool LooksLikeHeader(string a, string b)
    {
        var x = a.ToLowerInvariant();
        var y = b.ToLowerInvariant();
        return x is "name" or "imię" or "imie" or "nazwa" || y is "email" or "e-mail" or "mail";
    }

    static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var sb = new StringBuilder();
        var inQuotes = false;
        foreach (var ch in line)
        {
            if (ch == '"') { inQuotes = !inQuotes; continue; }
            if (ch is ',' or ';' && !inQuotes)
            {
                result.Add(sb.ToString());
                sb.Clear();
                continue;
            }
            sb.Append(ch);
        }
        result.Add(sb.ToString());
        return result;
    }

    public static DateOnly ParseDate(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return DateOnly.FromDateTime(DateTime.UtcNow);
        if (DateOnly.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)) return d;
        if (DateOnly.TryParse(raw, new CultureInfo("pl-PL"), DateTimeStyles.None, out d)) return d;
        return DateOnly.FromDateTime(DateTime.UtcNow);
    }
}

public static class ProgressPhotos
{
    public const int MaxBytes = 512 * 1024;
    public const int MaxPerClient = 24;

    public static IResult? Decode(ProgressPhotoInput input, out byte[] bytes, out string contentType)
    {
        bytes = [];
        contentType = string.IsNullOrWhiteSpace(input.ContentType) ? "image/jpeg" : input.ContentType.Trim();
        if (contentType is not ("image/jpeg" or "image/jpg" or "image/png" or "image/webp"))
            return Results.BadRequest(new { message = "Dodaj zdjęcie JPEG, PNG albo WebP." });

        var raw = (input.ImageBase64 ?? "").Trim();
        var comma = raw.IndexOf(',');
        if (raw.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma > 0)
            raw = raw[(comma + 1)..];
        try
        {
            bytes = Convert.FromBase64String(raw);
        }
        catch (FormatException)
        {
            return Results.BadRequest(new { message = "Nie udało się odczytać zdjęcia." });
        }
        if (bytes.Length == 0)
            return Results.BadRequest(new { message = "Zdjęcie jest puste." });
        if (bytes.Length > MaxBytes)
            return Results.BadRequest(new { message = "Zdjęcie jest za duże — zmniejsz je przed wysłaniem (max. 500 KB)." });
        return null;
    }

    public static string NormalizeView(string? view) => view switch
    {
        "side" => "side",
        "back" => "back",
        "other" => "other",
        _ => "front",
    };

    public static object Meta(ClientProgressPhoto p) => new
    {
        p.Id,
        p.ClientId,
        p.TakenOn,
        p.View,
        p.Note,
        p.ContentType,
        p.CreatedAt,
    };
}
