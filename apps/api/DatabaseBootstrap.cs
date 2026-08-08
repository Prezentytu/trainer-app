namespace TrainerApp.Api;

/// <summary>
/// Decyzje bootstrapu bazy przy starcie hosta — wyodrębnione pod testy i czytelność Program.cs.
/// </summary>
public static class DatabaseBootstrap
{
    public static bool IsPostgres(string? provider) =>
        string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase);

    /// <summary>Na Postgresie migrujemy przy starcie tylko gdy flaga jest włączona (domyślnie CI).</summary>
    public static bool ShouldMigrateOnStartup(string? provider, bool migrateOnStartup) =>
        IsPostgres(provider) && migrateOnStartup;

    /// <summary>SQLite lokalnie seeduje synchronicznie; Postgres — w WarmupService.</summary>
    public static bool ShouldSeedSynchronously(string? provider) =>
        !IsPostgres(provider);
}
