using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>Stripe Checkout + Customer Portal + webhook — HTTP, bez NuGet.</summary>
public sealed class BillingService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<BillingService> log)
{
    public bool StripeConfigured => !string.IsNullOrWhiteSpace(config["Stripe:SecretKey"]);

    public async Task<(bool Ok, string? CheckoutUrl, string Message)> CreateCheckoutAsync(
        Trainer trainer, string planKey, CancellationToken ct = default)
    {
        if (!StripeConfigured)
            return (false, null, "Płatności nie są jeszcze włączone. Napisz na wdrożenie, jeśli chcesz płacić już teraz.");

        var def = BillingPlans.Paid.FirstOrDefault(p => p.Key == planKey);
        if (def is null)
            return (false, null, "Wybierz plan: 15, 30 albo 50 osób.");

        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
        var secret = config["Stripe:SecretKey"]!;
        var client = httpFactory.CreateClient("stripe");
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.stripe.com/v1/checkout/sessions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secret);
        var pairs = new Dictionary<string, string>
        {
            ["mode"] = "subscription",
            ["success_url"] = $"{origin}/settings?billing=ok",
            ["cancel_url"] = $"{origin}/settings?billing=cancel",
            ["client_reference_id"] = trainer.Id.ToString(CultureInfo.InvariantCulture),
            ["metadata[trainerId]"] = trainer.Id.ToString(CultureInfo.InvariantCulture),
            ["metadata[planKey]"] = def.Key,
            ["line_items[0][quantity]"] = "1",
            ["line_items[0][price_data][currency]"] = "pln",
            ["line_items[0][price_data][unit_amount]"] = def.MonthlyGrosze.ToString(CultureInfo.InvariantCulture),
            ["line_items[0][price_data][recurring][interval]"] = "month",
            ["line_items[0][price_data][product_data][name]"] = $"RepMaxer — {def.Name}",
        };
        if (!string.IsNullOrWhiteSpace(trainer.StripeCustomerId))
            pairs["customer"] = trainer.StripeCustomerId;
        else if (!string.IsNullOrWhiteSpace(trainer.Email) && trainer.Email.Contains('@'))
            pairs["customer_email"] = trainer.Email;

        req.Content = new FormUrlEncodedContent(pairs);
        try
        {
            var res = await client.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);
            if (!res.IsSuccessStatusCode)
            {
                log.LogError("Stripe Checkout {Status}: {Body}", (int)res.StatusCode, body);
                return (false, null, "Nie udało się otworzyć płatności. Spróbuj ponownie.");
            }
            using var doc = JsonDocument.Parse(body);
            var url = doc.RootElement.TryGetProperty("url", out var u) ? u.GetString() : null;
            if (string.IsNullOrWhiteSpace(url))
                return (false, null, "Nie udało się otworzyć płatności. Spróbuj ponownie.");
            return (true, url, "Przejdź do płatności.");
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Stripe Checkout wyjątek");
            return (false, null, "Nie udało się otworzyć płatności. Spróbuj ponownie.");
        }
    }

    public async Task<(bool Ok, string? PortalUrl, string Message)> CreatePortalAsync(
        Trainer trainer, CancellationToken ct = default)
    {
        if (!StripeConfigured)
            return (false, null, "Płatności nie są jeszcze włączone.");
        if (string.IsNullOrWhiteSpace(trainer.StripeCustomerId))
            return (false, null, "Nie ma jeszcze subskrypcji do zarządzania.");

        var origin = (config["WEB_ORIGIN"] ?? "http://localhost:3000").TrimEnd('/');
        var secret = config["Stripe:SecretKey"]!;
        var client = httpFactory.CreateClient("stripe");
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.stripe.com/v1/billing_portal/sessions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secret);
        req.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["customer"] = trainer.StripeCustomerId,
            ["return_url"] = $"{origin}/settings",
        });
        try
        {
            var res = await client.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);
            if (!res.IsSuccessStatusCode)
            {
                log.LogError("Stripe Portal {Status}: {Body}", (int)res.StatusCode, body);
                return (false, null, "Nie udało się otworzyć zarządzania subskrypcją.");
            }
            using var doc = JsonDocument.Parse(body);
            var url = doc.RootElement.TryGetProperty("url", out var u) ? u.GetString() : null;
            return url is null
                ? (false, null, "Nie udało się otworzyć zarządzania subskrypcją.")
                : (true, url, "Otwórz zarządzanie subskrypcją.");
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Stripe Portal wyjątek");
            return (false, null, "Nie udało się otworzyć zarządzania subskrypcją.");
        }
    }

    public async Task<IResult> HandleWebhookAsync(HttpContext http, AppDb db, CancellationToken ct = default)
    {
        var json = await new StreamReader(http.Request.Body).ReadToEndAsync(ct);
        var secret = config["Stripe:WebhookSecret"];
        if (!string.IsNullOrWhiteSpace(secret))
        {
            if (!http.Request.Headers.TryGetValue("Stripe-Signature", out var sig)
                || !VerifyStripeSignature(json, sig.ToString(), secret))
            {
                log.LogWarning("Stripe webhook: niepoprawny podpis.");
                return Results.Unauthorized();
            }
        }
        else if (!string.Equals(http.RequestServices.GetRequiredService<IHostEnvironment>().EnvironmentName,
                     "Development", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Json(new { message = "Stripe:WebhookSecret nie jest skonfigurowany." }, statusCode: 503);
        }

        using var doc = JsonDocument.Parse(json);
        var type = doc.RootElement.TryGetProperty("type", out var t) ? t.GetString() : null;
        if (type is null) return Results.Ok(new { received = true });

        var data = doc.RootElement.GetProperty("data").GetProperty("object");
        switch (type)
        {
            case "checkout.session.completed":
                await ApplyCheckoutCompletedAsync(db, data, ct);
                break;
            case "customer.subscription.deleted":
                await ApplySubscriptionDeletedAsync(db, data, ct);
                break;
            case "customer.subscription.updated":
                await ApplySubscriptionUpdatedAsync(db, data, ct);
                break;
        }

        return Results.Ok(new { received = true });
    }

    async Task ApplyCheckoutCompletedAsync(AppDb db, JsonElement data, CancellationToken ct)
    {
        var trainerId = ReadMetaInt(data, "trainerId")
                        ?? (data.TryGetProperty("client_reference_id", out var cref)
                            && int.TryParse(cref.GetString(), out var id) ? id : (int?)null);
        var planKey = ReadMeta(data, "planKey");
        var track = ReadMeta(data, "track");
        var customerId = data.TryGetProperty("customer", out var cust) ? cust.GetString() : null;
        var subscriptionId = data.TryGetProperty("subscription", out var sub) ? sub.GetString() : null;
        var email = data.TryGetProperty("customer_email", out var em) ? em.GetString() : null
                    ?? (data.TryGetProperty("customer_details", out var details)
                        && details.TryGetProperty("email", out var de) ? de.GetString() : null);

        Trainer? trainer = null;
        if (trainerId is int tid)
            trainer = await db.Trainers.FirstOrDefaultAsync(t => t.Id == tid, ct);
        if (trainer is null && !string.IsNullOrWhiteSpace(email))
            trainer = await db.Trainers.FirstOrDefaultAsync(t => t.Email == email, ct);
        if (trainer is null) return;

        if (string.Equals(track, "founding", StringComparison.OrdinalIgnoreCase))
            trainer.PlanKey = BillingPlans.Founding;
        else if (!string.IsNullOrWhiteSpace(planKey) && BillingPlans.IsPaidKey(planKey))
            trainer.PlanKey = planKey;
        else if (trainer.PlanKey is BillingPlans.Free or "")
            trainer.PlanKey = BillingPlans.Starter;

        if (!string.IsNullOrWhiteSpace(customerId))
            trainer.StripeCustomerId = customerId;
        if (!string.IsNullOrWhiteSpace(subscriptionId))
            trainer.StripeSubscriptionId = subscriptionId;
        await db.SaveChangesAsync(ct);
    }

    async Task ApplySubscriptionDeletedAsync(AppDb db, JsonElement data, CancellationToken ct)
    {
        var subId = data.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
        var customerId = data.TryGetProperty("customer", out var cust) ? cust.GetString() : null;
        var trainer = !string.IsNullOrWhiteSpace(subId)
            ? await db.Trainers.FirstOrDefaultAsync(t => t.StripeSubscriptionId == subId, ct)
            : null;
        trainer ??= !string.IsNullOrWhiteSpace(customerId)
            ? await db.Trainers.FirstOrDefaultAsync(t => t.StripeCustomerId == customerId, ct)
            : null;
        if (trainer is null) return;
        if (trainer.PlanKey == BillingPlans.Dev) return;
        trainer.PlanKey = BillingPlans.Free;
        trainer.StripeSubscriptionId = null;
        await db.SaveChangesAsync(ct);
    }

    async Task ApplySubscriptionUpdatedAsync(AppDb db, JsonElement data, CancellationToken ct)
    {
        var status = data.TryGetProperty("status", out var st) ? st.GetString() : null;
        if (status is "canceled" or "unpaid" or "incomplete_expired")
            await ApplySubscriptionDeletedAsync(db, data, ct);
    }

    static string? ReadMeta(JsonElement data, string key)
    {
        if (!data.TryGetProperty("metadata", out var meta) || meta.ValueKind != JsonValueKind.Object)
            return null;
        return meta.TryGetProperty(key, out var v) ? v.GetString() : null;
    }

    static int? ReadMetaInt(JsonElement data, string key)
    {
        var s = ReadMeta(data, key);
        return int.TryParse(s, out var n) ? n : null;
    }

    /// <summary>Weryfikacja t=…,v1=… (HMAC SHA256).</summary>
    public static bool VerifyStripeSignature(string payload, string header, string secret)
    {
        string? timestamp = null;
        var signatures = new List<string>();
        foreach (var part in header.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = part.Split('=', 2);
            if (kv.Length != 2) continue;
            if (kv[0] == "t") timestamp = kv[1];
            if (kv[0] == "v1") signatures.Add(kv[1]);
        }
        if (timestamp is null || signatures.Count == 0) return false;
        var signed = $"{timestamp}.{payload}";
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(signed));
        var hex = Convert.ToHexString(hash).ToLowerInvariant();
        return signatures.Any(s => CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(s), Encoding.UTF8.GetBytes(hex)));
    }
}
