using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TrainerApp.Api;

namespace TrainerApp.Api.Tests;

/// <summary>
/// Hostuje aplikację w testach, podmieniając plikową bazę SQLite na współdzielone
/// połączenie in-memory (żyje tyle, co fabryka), więc testy nie dotykają trainer.db.
/// </summary>
public class TestWebAppFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDb>));
            if (descriptor is not null) services.Remove(descriptor);

            services.AddDbContext<AppDb>(options => options.UseSqlite(_connection));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
