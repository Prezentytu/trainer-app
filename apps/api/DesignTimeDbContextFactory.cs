using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TrainerApp.Api;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDb>
{
    public AppDb CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDb>()
            .UseNpgsql("Host=localhost;Database=trainer_app;Username=postgres;Password=postgres")
            .Options;
        return new AppDb(options);
    }
}
