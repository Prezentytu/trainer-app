using System.Security.Cryptography;
using System.Text;

namespace TrainerApp.Api;

public static class PortalPin
{
    public static bool IsValidFormat(string? pin) =>
        pin is { Length: 4 } && pin.All(char.IsDigit);

    public static (string Hash, string Salt) Hash(string pin)
    {
        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        return (Compute(salt, pin), salt);
    }

    public static bool Verify(string pin, string? hash, string? salt)
    {
        if (string.IsNullOrWhiteSpace(hash) || string.IsNullOrWhiteSpace(salt)) return false;
        var computed = Compute(salt, pin);
        var a = Encoding.UTF8.GetBytes(computed);
        var b = Encoding.UTF8.GetBytes(hash);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }

    static string Compute(string salt, string pin) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(salt + pin)));
}
