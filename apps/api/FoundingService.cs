using System.Globalization;
using System.Net.Http.Headers;

namespace TrainerApp.Api;

/// <summary>
/// Zgłoszenie white-glove / founding. Stripe Checkout gdy jest klucz; inaczej e-mail do founderskiego inboxu.
/// </summary>
public sealed class FoundingService(IHttpClientFactory httpFactory, IConfiguration config, EmailService email, ILogger<FoundingService> log)
{
    public const int FoundingAmountGrosze = 49000;

    public bool StripeConfigured => !string.IsNullOrWhiteSpace(config["Stripe:SecretKey"]);

    public async Task<(bool Ok, string? CheckoutUrl, string Message)> ApplyAsync(
        FoundingApplyInput input, CancellationToken ct = default)
    {
        var name = (input.Name ?? "").Trim();
        var mail = (input.Email ?? "").Trim();
        var phone = string.IsNullOrWhiteSpace(input.Phone) ? null : input.Phone.Trim();
        var track = string.Equals(input.Track, "founding", StringComparison.OrdinalIgnoreCase)
            ? "founding"
            : "whiteglove";

        if (name.Length < 2)
            return (false, null, "Podaj imię.");
        if (mail.Length < 5 || !mail.Contains('@'))
            return (false, null, "Podaj adres e-mail.");

        var founderTo = config["Email:FounderInbox"] ?? config["Email:From"];
        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
        var html = $"""
            <p>Nowe zgłoszenie RepMaxer ({track})</p>
            <p>Imię: {System.Net.WebUtility.HtmlEncode(name)}<br/>
            E-mail: {System.Net.WebUtility.HtmlEncode(mail)}<br/>
            Telefon: {System.Net.WebUtility.HtmlEncode(phone ?? "—")}</p>
            """;
        if (!string.IsNullOrWhiteSpace(founderTo) && founderTo.Contains('@'))
        {
            var toAddr = founderTo.Contains('<')
                ? founderTo[(founderTo.IndexOf('<') + 1)..].TrimEnd('>')
                : founderTo;
            await email.SendAsync(toAddr, $"Zgłoszenie {track}: {name}", html, ct);
        }

        if (track == "founding" && StripeConfigured)
        {
            var checkout = await CreateCheckoutAsync(name, mail, origin, ct);
            if (checkout is not null)
                return (true, checkout, "Przejdź do płatności 490 zł.");
            log.LogWarning("Stripe Checkout nie powiódł się — zostawiam zgłoszenie e-mailowe.");
        }

        var message = track == "founding"
            ? "Zapisaliśmy zgłoszenie founding. Oddzwonimy w sprawie 490 zł i calla wdrożenia."
            : "Zapisaliśmy Cię na wdrożenie. Oddzwonimy w jeden dzień roboczy — 10 miejsc w miesiącu.";
        return (true, null, message);
    }

    async Task<string?> CreateCheckoutAsync(string name, string emailAddr, string origin, CancellationToken ct)
    {
        var secret = config["Stripe:SecretKey"];
        if (string.IsNullOrWhiteSpace(secret)) return null;

        var client = httpFactory.CreateClient("stripe");
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.stripe.com/v1/checkout/sessions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secret);
        var pairs = new Dictionary<string, string>
        {
            ["mode"] = "payment",
            ["success_url"] = $"{origin}/wdrozenie?status=ok",
            ["cancel_url"] = $"{origin}/wdrozenie?status=cancel",
            ["customer_email"] = emailAddr,
            ["client_reference_id"] = emailAddr,
            ["line_items[0][quantity]"] = "1",
            ["line_items[0][price_data][currency]"] = "pln",
            ["line_items[0][price_data][unit_amount]"] = FoundingAmountGrosze.ToString(CultureInfo.InvariantCulture),
            ["line_items[0][price_data][product_data][name]"] = "RepMaxer Founding — 3 miesiące Solo",
            ["metadata[name]"] = name,
            ["metadata[track]"] = "founding",
        };
        req.Content = new FormUrlEncodedContent(pairs);

        try
        {
            var res = await client.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);
            if (!res.IsSuccessStatusCode)
            {
                log.LogError("Stripe Checkout {Status}: {Body}", (int)res.StatusCode, body);
                return null;
            }
            using var doc = System.Text.Json.JsonDocument.Parse(body);
            return doc.RootElement.TryGetProperty("url", out var url) ? url.GetString() : null;
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Stripe Checkout wyjątek");
            return null;
        }
    }
}
