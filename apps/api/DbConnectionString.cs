using Npgsql;

namespace TrainerApp.Api;

/// <summary>
/// Npgsql nie parsuje URI PostgreSQL (postgres://user:pass@host/db?sslmode=require) — przyjmuje wyłącznie
/// format ADO.NET „klucz=wartość". Neon (i większość hostingów) podaje URI, więc tłumaczymy go tutaj,
/// w jednym miejscu wspólnym dla runtime'u i bundle'a migracji EF.
/// </summary>
public static class DbConnectionString
{
    public static string Normalize(string? value)
    {
        var raw = value?.Trim() ?? "";
        if (!raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return raw;

        var uri = new Uri(raw);
        var builder = new NpgsqlConnectionStringBuilder { Host = uri.Host };

        if (!uri.IsDefaultPort) builder.Port = uri.Port;

        var database = uri.AbsolutePath.Trim('/');
        if (database.Length > 0) builder.Database = Uri.UnescapeDataString(database);

        var credentials = uri.UserInfo.Split(':', 2);
        if (credentials[0].Length > 0) builder.Username = Uri.UnescapeDataString(credentials[0]);
        if (credentials.Length == 2 && credentials[1].Length > 0)
            builder.Password = Uri.UnescapeDataString(credentials[1]);

        foreach (var parameter in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = parameter.Split('=', 2);
            if (parts.Length != 2) continue;
            Apply(builder, Uri.UnescapeDataString(parts[0]), Uri.UnescapeDataString(parts[1]));
        }

        return builder.ConnectionString;
    }

    private static void Apply(NpgsqlConnectionStringBuilder builder, string key, string value)
    {
        // Nazwy parametrów w URI są w konwencji libpq (snake_case), Npgsql używa własnych słów kluczowych.
        var keyword = key.ToLowerInvariant() switch
        {
            "sslmode" => "SSL Mode",
            "channel_binding" => "Channel Binding",
            "application_name" => "Application Name",
            "connect_timeout" => "Timeout",
            "options" => "Options",
            _ => key,
        };

        try
        {
            builder[keyword] = NormalizeEnumLikeValue(value);
        }
        catch (ArgumentException ex)
        {
            throw new ArgumentException(
                $"Nieobsługiwany parametr '{key}' w URI połączenia z bazą. " +
                "Usuń go z connection stringa albo podaj cały string w formacie ADO.NET (klucz=wartość).", ex);
        }
    }

    // libpq zapisuje wartości enumów z myślnikiem (verify-full), Npgsql oczekuje PascalCase (VerifyFull).
    private static string NormalizeEnumLikeValue(string value) =>
        value.Contains('-')
            ? string.Concat(value.Split('-', StringSplitOptions.RemoveEmptyEntries)
                .Select(part => char.ToUpperInvariant(part[0]) + part[1..]))
            : value;
}
