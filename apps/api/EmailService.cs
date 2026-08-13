using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace TrainerApp.Api;

/// <summary>E-mail transakcyjny przez Resend (HTTP). Bez klucza — no-op z logiem.</summary>
public sealed class EmailService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<EmailService> log)
{
    static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public bool IsConfigured => !string.IsNullOrWhiteSpace(config["Email:ResendApiKey"]);

    public async Task<(bool Ok, string? Error)> SendAsync(string to, string subject, string html, CancellationToken ct = default)
    {
        var apiKey = config["Email:ResendApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            log.LogWarning("Email:ResendApiKey nieustawiony — pomijam wysyłkę do {To}: {Subject}", to, subject);
            return (false, "E-mail nie jest skonfigurowany (brak Email:ResendApiKey).");
        }

        var from = config["Email:From"] ?? "RepMaxer <onboarding@resend.dev>";
        var client = httpFactory.CreateClient("resend");
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        var payload = new { from, to = new[] { to }, subject, html };
        req.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOpts), Encoding.UTF8, "application/json");

        try
        {
            var res = await client.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct);
                log.LogError("Resend {Status}: {Body}", (int)res.StatusCode, body);
                return (false, "Nie udało się wysłać e-maila.");
            }
            return (true, null);
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Błąd wysyłki e-maila do {To}", to);
            return (false, "Nie udało się wysłać e-maila.");
        }
    }

    public static string PortalLinkHtml(string clientName, string portalUrl, string? intro = null) =>
        $"""
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <p>Cześć {System.Net.WebUtility.HtmlEncode(clientName)},</p>
          <p>{System.Net.WebUtility.HtmlEncode(intro ?? "Twój plan treningowy czeka.")}</p>
          <p><a href="{portalUrl}" style="display:inline-block;padding:12px 20px;background:#14b8a6;color:#04120f;text-decoration:none;border-radius:8px;font-weight:600">Otwórz trening</a></p>
          <p style="color:#666;font-size:13px">Jeśli przycisk nie działa, wklej link:<br/>{System.Net.WebUtility.HtmlEncode(portalUrl)}</p>
        </div>
        """;

    public static string ReminderHtml(string clientName, string portalUrl, string reason) =>
        PortalLinkHtml(clientName, portalUrl, reason);

    public static string TrainerReplyHtml(string firstName, string preview, string url) =>
        TrainerActionHtml(
            $"{Html(firstName)} odpisał: „{Html(preview)}”",
            "Otwórz wiadomość",
            url);

    public static string TrainerDigestHtml(int trained, int sessions, int attention, int prs, string origin) =>
        $"""
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <p>Tydzień u Twoich klientów.</p>
          <p>Trenowało {trained} {(trained == 1 ? "osoba" : "osób")} · {sessions} treningów · {prs} rekordów.</p>
          <p>W kolejce uwagi: {attention}.</p>
          <p><a href="{origin}" style="display:inline-block;padding:12px 20px;background:#0B0C0D;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Otwórz panel</a></p>
        </div>
        """;

    public static string TrainerDailySummaryHtml(int unread, IReadOnlyList<(string ClientName, string Preview)> items, string inboxUrl)
    {
        var lines = items.Count == 0
            ? ""
            : "<ul>" + string.Join("", items.Select(i =>
                $"<li><strong>{Html(i.ClientName)}</strong> — {Html(i.Preview)}</li>")) + "</ul>";
        var count = unread == 1 ? "1 nieprzeczytany sygnał" : $"{unread} nieprzeczytanych sygnałów";
        return $"""
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <p>Masz {count} od klientów.</p>
          {lines}
          <p><a href="{inboxUrl}" style="display:inline-block;padding:12px 20px;background:#0B0C0D;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Otwórz skrzynkę</a></p>
        </div>
        """;
    }

    static string TrainerActionHtml(string body, string cta, string url) =>
        $"""
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <p>{body}</p>
          <p><a href="{url}" style="display:inline-block;padding:12px 20px;background:#0B0C0D;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">{Html(cta)}</a></p>
        </div>
        """;

    static string Html(string s) => System.Net.WebUtility.HtmlEncode(s);
}
