namespace TrainerApp.Api;

/// <summary>
/// Walidacja konfiguracji auth przy starcie — Production bez Clerk = otwarte API.
/// </summary>
public static class AuthStartup
{
    public static void EnsureProductionAuthConfigured(IHostEnvironment env, IConfiguration config)
    {
        if (!env.IsProduction()) return;
        if (!string.IsNullOrWhiteSpace(config["Clerk:Authority"])) return;
        throw new InvalidOperationException(
            "Clerk:Authority jest wymagane w Production. Ustaw Clerk__Authority (np. https://….clerk.accounts.dev).");
    }
}
