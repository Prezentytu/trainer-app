using System.Reflection;

namespace TrainerApp.Api;

/// <summary>
/// Wersja binarki widoczna w health — SHA commita z CI albo <c>dev</c> lokalnie.
/// </summary>
public static class BuildInfo
{
    public static string Version { get; } = Resolve();

    static string Resolve()
    {
        var fromEnv = Environment.GetEnvironmentVariable("SOURCE_REVISION");
        if (!string.IsNullOrWhiteSpace(fromEnv)
            && !string.Equals(fromEnv, "unknown", StringComparison.OrdinalIgnoreCase))
            return fromEnv.Trim();

        var informational = typeof(BuildInfo).Assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion;
        if (string.IsNullOrWhiteSpace(informational))
            return "dev";

        var plus = informational.IndexOf('+');
        return plus >= 0 && plus < informational.Length - 1
            ? informational[(plus + 1)..]
            : informational;
    }
}
