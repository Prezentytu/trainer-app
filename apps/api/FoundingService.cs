using System.Globalization;
using System.Net.Http.Headers;

namespace TrainerApp.Api;

/// <summary>
/// Zgłoszenie wdrożenia / roku z góry. Mail do trenera + foundera. Stripe Checkout 390 zł gdy jest klucz.
/// </summary>
public sealed class FoundingService(IHttpClientFactory httpFactory, IConfiguration config, EmailService email, ILogger<FoundingService> log)
{
    public const int FoundingAmountGrosze = 39000;
    public const string ContactEmail = "kontakt@repmaxer.pl";

    public bool StripeConfigured => !string.IsNullOrWhiteSpace(config["Stripe:SecretKey"]);

    public async Task<(bool Ok, string? CheckoutUrl, string Message, bool EmailSent)> ApplyAsync(
        FoundingApplyInput input, CancellationToken ct = default)
    {
        var name = (input.Name ?? "").Trim();
        var mail = (input.Email ?? "").Trim();
        var phone = string.IsNullOrWhiteSpace(input.Phone) ? null : input.Phone.Trim();
        var slot = string.IsNullOrWhiteSpace(input.PreferredSlot) ? null : input.PreferredSlot.Trim();
        if (slot is { Length: > 200 })
            slot = slot[..200];
        var track = string.Equals(input.Track, "founding", StringComparison.OrdinalIgnoreCase)
            ? "founding"
            : "whiteglove";

        if (name.Length < 2)
            return (false, null, "Podaj imię.", false);
        if (mail.Length < 5 || !mail.Contains('@'))
            return (false, null, "Podaj adres e-mail.", false);

        var founderTo = config["Email:FounderInbox"] ?? config["Email:From"];
        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
        var year = track == "founding";

        if (!string.IsNullOrWhiteSpace(founderTo) && founderTo.Contains('@'))
        {
            var toAddr = founderTo.Contains('<')
                ? founderTo[(founderTo.IndexOf('<') + 1)..].TrimEnd('>')
                : founderTo;
            await email.SendAsync(
                toAddr,
                $"Zgłoszenie {(year ? "390 zł" : "wdrożenie 0 zł")}: {name}",
                EmailService.WdrozenieFounderHtml(name, mail, phone, slot, year),
                ct);
        }

        var emailSent = false;
        if (email.IsConfigured)
        {
            var (ok, _) = await email.SendAsync(
                mail,
                year
                    ? "390 zł — rok, do 15 osób. Godzinę ustalamy w mailu"
                    : "30 minut wdrożenia — odpisz, która godzina",
                EmailService.WdrozenieTrainerHtml(name, slot, year, origin),
                ct);
            emailSent = ok;
        }

        if (year && StripeConfigured)
        {
            var checkout = await CreateCheckoutAsync(name, mail, origin, ct);
            if (checkout is not null)
                return (true, checkout, "Przejdź do płatności 390 zł.", emailSent);
            log.LogWarning("Stripe Checkout nie powiódł się — zostawiam zgłoszenie e-mailowe.");
        }

        var message = emailSent
            ? year
                ? "Napisaliśmy na ten adres. 390 zł — rok, do 15 osób. Godzinę ustalamy w mailu."
                : "Napisaliśmy na ten adres. Odpisz, która godzina Ci pasuje."
            : $"Zapisaliśmy zgłoszenie. Odpisz na {ContactEmail} i podaj dwie godziny, które Ci pasują.";
        return (true, null, message, emailSent);
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
            ["line_items[0][price_data][product_data][name]"] = "RepMaxer — rok, do 15 osób (dwa miesiące w cenie)",
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
