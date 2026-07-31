using Xunit;

namespace TrainerApp.Api.Tests;

public class DbConnectionStringTests
{
    [Fact]
    public void Normalize_NeonUri_ProducesAdoNetConnectionString()
    {
        var result = DbConnectionString.Normalize(
            "postgresql://neondb_owner:tajne@ep-small-hall-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require");

        Assert.Contains("Host=ep-small-hall-pooler.eu-central-1.aws.neon.tech", result);
        Assert.Contains("Database=neondb", result);
        Assert.Contains("Username=neondb_owner", result);
        Assert.Contains("Password=tajne", result);
        Assert.Contains("SSL Mode=Require", result);
        Assert.DoesNotContain("postgresql://", result);
    }

    [Fact]
    public void Normalize_HyphenatedSslModeAndChannelBinding_MapsToNpgsqlValues()
    {
        var result = DbConnectionString.Normalize(
            "postgres://user:pass@host/db?sslmode=verify-full&channel_binding=require");

        Assert.Contains("SSL Mode=VerifyFull", result);
        Assert.Contains("Channel Binding=Require", result);
    }

    [Fact]
    public void Normalize_UrlEncodedPassword_IsDecoded()
    {
        var result = DbConnectionString.Normalize("postgresql://user:p%40ss%3Aword@host:6543/db");

        Assert.Contains("Port=6543", result);
        Assert.Contains("p@ss:word", result);
    }

    [Theory]
    [InlineData("Host=localhost;Database=trainer_app;Username=postgres;Password=postgres")]
    [InlineData("Data Source=trainer.db")]
    public void Normalize_NonUriString_IsReturnedUnchanged(string connectionString)
    {
        Assert.Equal(connectionString, DbConnectionString.Normalize(connectionString));
    }

    [Fact]
    public void Normalize_NullOrBlank_ReturnsEmpty()
    {
        Assert.Equal("", DbConnectionString.Normalize(null));
        Assert.Equal("", DbConnectionString.Normalize("   "));
    }

    [Fact]
    public void Normalize_UnsupportedUriParameter_ThrowsWithHint()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            DbConnectionString.Normalize("postgresql://user:pass@host/db?nie_ma_takiego=1"));

        Assert.Contains("nie_ma_takiego", ex.Message);
    }
}
