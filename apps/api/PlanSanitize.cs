namespace TrainerApp.Api;

public static class PlanSanitize
{
    public static string? SetScheme(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var t = raw.Trim();
        return t.ToLowerInvariant() switch
        {
            "normal" or "standard" or "std" or "default" or "zampa" or "none" or "n/a" or "-" => null,
            _ => t,
        };
    }
}
