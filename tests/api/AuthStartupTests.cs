using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TrainerApp.Api;
using Xunit;

namespace TrainerApp.Api.Tests;

public class AuthStartupTests
{
    [Fact]
    public void Production_without_Clerk_Authority_throws()
    {
        var env = new StubHostEnvironment { EnvironmentName = Environments.Production };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Clerk:Authority"] = "" })
            .Build();

        var ex = Assert.Throws<InvalidOperationException>(
            () => AuthStartup.EnsureProductionAuthConfigured(env, config));
        Assert.Contains("Clerk:Authority", ex.Message);
    }

    [Fact]
    public void Production_with_Clerk_Authority_ok()
    {
        var env = new StubHostEnvironment { EnvironmentName = Environments.Production };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Clerk:Authority"] = "https://example.clerk.accounts.dev",
            })
            .Build();

        AuthStartup.EnsureProductionAuthConfigured(env, config);
    }

    [Fact]
    public void Development_without_Clerk_Authority_ok()
    {
        var env = new StubHostEnvironment { EnvironmentName = Environments.Development };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Clerk:Authority"] = "" })
            .Build();

        AuthStartup.EnsureProductionAuthConfigured(env, config);
    }

    sealed class StubHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "TrainerApp.Api.Tests";
        public string ContentRootPath { get; set; } = ".";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
