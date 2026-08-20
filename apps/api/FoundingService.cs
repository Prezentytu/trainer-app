using System.Globalization;
using System.Net.Http.Headers;

namespace TrainerApp.Api;

/// <summary>
/// Zgłoszenie wdrożenia. Mail do trenera + foundera. Stripe Checkout 390 / 2 900 zł gdy jest klucz.
/// </summary>
public sealed class FoundingService(IHttpClientFactory httpFactory, IConfiguration config, EmailService email, ILogger<FoundingService> log)
{
    public const int WdrozenieAmountGrosze = 39000;
    public const int PersonalAmountGrosze = 290000;
    public const int FoundingAmountGrosze = WdrozenieAmountGrosze;
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
        var howYouWork = string.IsNullOrWhiteSpace(input.HowYouWork) ? null : input.HowYouWork.Trim();
        if (howYouWork is { Length: > 400 })
            howYouWork = howYouWork[..400];
        var track = NormalizeTrack(input.Track);

        if (name.Length < 2)
            return (false, null, "Podaj imię.", false);
        if (mail.Length < 5 || !mail.Contains('@'))
            return (false, null, "Podaj adres e-mail.", false);

        var founderTo = config["Email:FounderInbox"] ?? config["Email:From"];
        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
        var paid = track is "founding" or "personal";
        var amount = track == "personal" ? PersonalAmountGrosze : WdrozenieAmountGrosze;

        if (!string.IsNullOrWhiteSpace(founderTo) && founderTo.Contains('@'))
        {
            var toAddr = founderTo.Contains('<')
                ? founderTo[(founderTo.IndexOf('<') + 1)..].TrimEnd('>')
                : founderTo;
            await email.SendAsync(
                toAddr,
                $"Zgłoszenie {OfferLabel(track)}: {name}",
                EmailService.WdrozenieFounderHtml(name, mail, phone, slot, track, howYouWork),
                ct);
        }

        var emailSent = false;
        if (email.IsConfigured)
        {
            var (ok, _) = await email.SendAsync(
                mail,
                paid
                    ? $"{OfferLabel(track)} — godzinę ustalamy w mailu"
                    : "Pierwszy raport — dołącz arkusz albo zrzuty",
                EmailService.WdrozenieTrainerHtml(name, slot, track, origin),
                ct);
            emailSent = ok;
        }

        if (paid && StripeConfigured)
        {
            var checkout = await CreateCheckoutAsync(name, mail, origin, track, amount, ct);
            if (checkout is not null)
                return (true, checkout, $"Przejdź do płatności {amount / 100} zł.", emailSent);
            log.LogWarning("Stripe Checkout nie powiódł się — zostawiam zgłoszenie e-mailowe.");
        }

        var message = emailSent
            ? paid
                ? $"Napisaliśmy na ten adres. {OfferLabel(track)}. Godzinę ustalamy w mailu."
                : "Napisaliśmy na ten adres. Odpisz i dołącz arkusz albo zrzuty. Raport wraca w 24 godziny."
            : paid
                ? $"{OfferLabel(track)}. Zapisaliśmy zgłoszenie. Odpisz na {ContactEmail} i podaj dwie godziny, które Ci pasują."
                : $"Zapisaliśmy zgłoszenie. Odpisz na {ContactEmail} i dołącz arkusz albo zrzuty.";
        return (true, null, message, emailSent);
    }

    static string NormalizeTrack(string? track)
    {
        if (string.Equals(track, "personal", StringComparison.OrdinalIgnoreCase))
            return "personal";
        if (string.Equals(track, "founding", StringComparison.OrdinalIgnoreCase))
            return "founding";
        return "whiteglove";
    }

    static string OfferLabel(string track) => track switch
    {
        "personal" => "2 900 zł — wdrożenie osobiste",
        "founding" => "390 zł — wdrożenie 14 dni",
        _ => "pierwszy raport",
    };

    async Task<string?> CreateCheckoutAsync(
        string name, string emailAddr, string origin, string track, int amountGrosze, CancellationToken ct)
    {
        var secret = config["Stripe:SecretKey"];
        if (string.IsNullOrWhiteSpace(secret)) return null;

        var product = track == "personal"
            ? "RepMaxer — wdrożenie osobiste"
            : "RepMaxer — wdrożenie 14 dni";

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
            ["line_items[0][price_data][unit_amount]"] = amountGrosze.ToString(CultureInfo.InvariantCulture),
            ["line_items[0][price_data][product_data][name]"] = product,
            ["metadata[name]"] = name,
            ["metadata[track]"] = track,
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
