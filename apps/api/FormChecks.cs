namespace TrainerApp.Api;

public static class FormChecks
{
    public const int MaxVideoBytes = 4 * 1024 * 1024;
    public const int MaxImageBytes = 512 * 1024;

    public static IResult? Decode(FormCheckInput input, out byte[] bytes, out string contentType, out string fileName)
    {
        bytes = [];
        contentType = string.IsNullOrWhiteSpace(input.ContentType) ? "video/mp4" : input.ContentType.Trim().ToLowerInvariant();
        fileName = string.IsNullOrWhiteSpace(input.FileName) ? "form-check" : input.FileName.Trim();
        if (contentType is not ("video/mp4" or "video/webm" or "video/quicktime" or "image/jpeg" or "image/jpg" or "image/png" or "image/webp"))
            return Results.BadRequest(new { message = "Dodaj krótki film (MP4, WebM) albo zdjęcie JPEG/PNG/WebP." });
        if (contentType == "image/jpg") contentType = "image/jpeg";

        var raw = (input.FileBase64 ?? "").Trim();
        var comma = raw.IndexOf(',');
        if (raw.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma > 0)
            raw = raw[(comma + 1)..];
        try
        {
            bytes = Convert.FromBase64String(raw);
        }
        catch (FormatException)
        {
            return Results.BadRequest(new { message = "Nie udało się odczytać pliku form check." });
        }
        if (bytes.Length == 0)
            return Results.BadRequest(new { message = "Plik jest pusty." });
        var isImage = contentType.StartsWith("image/", StringComparison.Ordinal);
        var max = isImage ? MaxImageBytes : MaxVideoBytes;
        if (bytes.Length > max)
            return Results.BadRequest(new
            {
                message = isImage
                    ? "Zdjęcie jest za duże — zmniejsz je przed wysłaniem (max. 500 KB)."
                    : "Film jest za duży — nagraj krótszy klip (max. 4 MB).",
            });
        return null;
    }

    public static object Meta(LoggedExerciseFormCheck row) => new
    {
        row.Id,
        row.LoggedExerciseId,
        row.ContentType,
        row.FileName,
        row.CreatedAt,
    };
}
