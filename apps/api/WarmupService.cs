using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>
/// Po starcie hosta (nie blokując gotowości HTTP) buduje model EF, otwiera jedno
/// połączenie do puli i — na Postgresie — odpala idempotentny Seed poza ścieżką krytyczną.
/// </summary>
public sealed class WarmupService(
    IServiceProvider services,
    IConfiguration config,
    ILogger<WarmupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Oddaj sterowanie, żeby Kestrel mógł zacząć nasłuchiwać zanim rozgrzejemy EF/DB.
        await Task.Yield();

        try
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();

            _ = db.Model;
            await db.Database.OpenConnectionAsync(stoppingToken);
            await db.Database.CloseConnectionAsync();

            var provider = config["Database:Provider"];
            if (string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase))
                Seed.Run(db);

            logger.LogInformation("Warmup zakończony (model EF + połączenie DB).");
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // shutdown
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Warmup nie powiódł się — pierwszy request użytkownika rozgrzeje kontekst.");
        }
    }
}
