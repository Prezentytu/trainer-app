using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TrainerApp.Api;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDb>
{
    private const string LocalFallback = "Host=localhost;Database=trainer_app;Username=postgres;Password=postgres";

    public AppDb CreateDbContext(string[] args)
    {
        // Bundle migracji (CI) dostaje connection string przez zmienną środowiskową — tą samą ścieżką
        // co runtime, więc URI Neona normalizujemy tym samym kodem.
        var configured = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
                         ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default");

        var connectionString = DbConnectionString.Normalize(configured) is { Length: > 0 } normalized
            ? normalized
            : LocalFallback;

        var options = new DbContextOptionsBuilder<AppDb>()
            .UseNpgsql(connectionString)
            .Options;
        return new AppDb(options);
    }
}
