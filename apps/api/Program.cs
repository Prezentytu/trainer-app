using System.ClientModel;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.IdentityModel.Tokens;
using TrainerApp.Api;

var builder = WebApplication.CreateBuilder(args);
builder.AddOpenRouterChatClient();

var provider = builder.Configuration["Database:Provider"]
               ?? (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("Default"))
                   ? "Sqlite"
                   : "Postgres");
var connectionString = DbConnectionString.Normalize(builder.Configuration.GetConnectionString("Default"))
    is { Length: > 0 } configured
    ? configured
    : "Data Source=trainer.db";

builder.Services.AddDbContext<AppDb>(o =>
{
    if (string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase))
    {
        // Retry przy cold start Neona (scale-to-zero) — zamiast 500 pierwsze zapytanie dostaje backoff.
        o.UseNpgsql(connectionString, npg =>
        {
            npg.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(2), errorCodesToAdd: null);
            npg.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        });
    }
    else
        o.UseSqlite(connectionString, sqlite => sqlite.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
});

builder.Services.AddHostedService<WarmupService>();

var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:3000"];

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var clerkAuthority = builder.Configuration["Clerk:Authority"];
var clerkAudience = builder.Configuration["Clerk:Audience"];
if (!string.IsNullOrWhiteSpace(clerkAuthority))
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(o =>
        {
            o.Authority = clerkAuthority;
            o.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = clerkAuthority,
                // Clerk session JWT wymaga jawnego Audience (JWT template / API).
                ValidateAudience = !string.IsNullOrWhiteSpace(clerkAudience),
                ValidAudience = string.IsNullOrWhiteSpace(clerkAudience) ? null : clerkAudience,
                ValidateLifetime = true,
                NameClaimType = "sub",
            };
        });
    builder.Services.AddAuthorization();
}

builder.Services.AddRateLimiter(o =>
{
    o.AddFixedWindowLimiter("portal", opt =>
    {
        opt.PermitLimit = 60;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    o.AddFixedWindowLimiter("founding", opt =>
    {
        opt.PermitLimit = 8;
        opt.Window = TimeSpan.FromMinutes(10);
        opt.QueueLimit = 0;
    });
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddHttpClient("resend");
builder.Services.AddHttpClient("stripe");
builder.Services.AddSingleton<EmailService>();
builder.Services.AddSingleton<FoundingService>();
builder.Services.AddScoped<PushService>();
builder.Services.AddScoped<BillingService>();
builder.Services.AddScoped<TrainerNotifyService>();
builder.Services.AddScoped<DigestService>();

var app = builder.Build();
AuthStartup.EnsureProductionAuthConfigured(app.Environment, app.Configuration);

app.Use(async (ctx, next) =>
{
    var correlationId = ctx.Request.Headers.TryGetValue("X-Correlation-Id", out var incoming)
                        && !string.IsNullOrWhiteSpace(incoming)
        ? incoming.ToString()
        : Guid.NewGuid().ToString("N");
    ctx.Response.Headers["X-Correlation-Id"] = correlationId;
    ctx.Items["CorrelationId"] = correlationId;
    using (ctx.RequestServices.GetRequiredService<ILoggerFactory>()
               .CreateLogger("Request")
               .BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
    {
        await next();
    }
});

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async ctx =>
    {
        var feature = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var ex = feature?.Error;
        var logger = ctx.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("ExceptionHandler");
        var correlationId = ctx.Items.TryGetValue("CorrelationId", out var cid) ? cid?.ToString() : null;
        logger.LogError(ex, "Unhandled exception ({CorrelationId})", correlationId);
        ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsJsonAsync(new { message = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." });
    });
});

app.UseCors();
app.UseRateLimiter();

if (!string.IsNullOrWhiteSpace(clerkAuthority))
{
    app.UseAuthentication();
    app.UseAuthorization();
}

app.Use(async (ctx, next) =>
{
    var path = ctx.Request.Path.Value ?? "";
    if (!path.StartsWith("/api/portal/", StringComparison.OrdinalIgnoreCase))
    {
        await next();
        return;
    }

    var rest = path["/api/portal/".Length..];
    if (rest.Equals("recover", StringComparison.OrdinalIgnoreCase))
    {
        await next();
        return;
    }

    var slash = rest.IndexOf('/');
    var token = slash < 0 ? rest : rest[..slash];
    var after = slash < 0 ? "" : rest[(slash + 1)..];
    if (after.Equals("unlock", StringComparison.OrdinalIgnoreCase)
        || after.Equals("pin-status", StringComparison.OrdinalIgnoreCase))
    {
        await next();
        return;
    }

    if (string.IsNullOrWhiteSpace(token))
    {
        await next();
        return;
    }

    var db = ctx.RequestServices.GetRequiredService<AppDb>();
    var access = await db.ClientAccessTokens
        .Include(t => t.Client)
        .FirstOrDefaultAsync(t => t.Token == token);
    if (access?.Client is null
        || (access.ExpiresAt is not null && access.ExpiresAt < DateTime.UtcNow)
        || string.IsNullOrEmpty(access.Client.PortalPinHash))
    {
        await next();
        return;
    }

    var pin = ctx.Request.Headers["X-Portal-Pin"].FirstOrDefault();
    if (string.IsNullOrEmpty(pin) || !PortalPin.Verify(pin, access.Client.PortalPinHash, access.Client.PortalPinSalt))
    {
        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        await ctx.Response.WriteAsJsonAsync(new { message = "Podaj PIN.", code = "pin_required" });
        return;
    }

    await next();
});

// Postgres: migracje wyłącznie w CI (efbundle), chyba że jawnie włączysz Database:MigrateOnStartup.
// Seed na Postgresie idzie w WarmupService (po starcie HTTP). SQLite lokalnie — EnsureCreated + Seed synchronicznie.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    var migrateOnStartup = app.Configuration.GetValue("Database:MigrateOnStartup", false);
    if (DatabaseBootstrap.ShouldMigrateOnStartup(provider, migrateOnStartup))
        db.Database.Migrate();
    else if (DatabaseBootstrap.ShouldSeedSynchronously(provider))
    {
        db.Database.EnsureCreated();
        Seed.Run(db);
    }
}

static Task<IResult> UnauthorizedTrainer(Exception _)
{
    // Szczegóły (np. brak claimu sub) tylko w logach endpointu — UI dostaje stały komunikat.
    return Task.FromResult(Results.Json(
        new { message = "Brak dostępu. Zaloguj się ponownie." },
        statusCode: 401));
}

// ---------- Liveness / Health / me ----------

// Always On pinguje `/` — musi być 2xx bez bazy (żeby nie trzymać Neona always-on).
app.MapGet("/", () => Results.Ok(new { service = "RepMaxer API", status = "ok", version = BuildInfo.Version }));
app.MapGet("/api/health/live", () => Results.Ok(new { status = "ok", utc = DateTime.UtcNow, version = BuildInfo.Version }));

app.MapGet("/api/health", async (AppDb db) =>
{
    var utc = DateTime.UtcNow;
    var version = BuildInfo.Version;
    try
    {
        // Readiness z pingiem DB — tylko smoke po deployu / diagnostyka, NIE Azure Health check.
        var canConnect = await db.Database.CanConnectAsync();
        if (!canConnect)
            return Results.Json(new { status = "degraded", utc, version, database = "unreachable" }, statusCode: 503);
        return Results.Ok(new { status = "ok", utc, version, database = "ok" });
    }
    catch (Exception)
    {
        return Results.Json(new { status = "degraded", utc, version, database = "error" }, statusCode: 503);
    }
});

app.MapPost("/api/cron/reminders", async (HttpContext http, IConfiguration config, PushService push) =>
{
    var expected = config["Cron:Key"];
    if (string.IsNullOrWhiteSpace(expected))
        return Results.Json(new { message = "Cron:Key nie jest skonfigurowany." }, statusCode: 503);
    if (!http.Request.Headers.TryGetValue("X-Cron-Key", out var provided)
        || !string.Equals(provided.ToString(), expected, StringComparison.Ordinal))
        return Results.Unauthorized();

    var webOrigin = (config["WEB_ORIGIN"] ?? allowedOrigins.FirstOrDefault() ?? "http://localhost:3000").TrimEnd('/');
    var (sent, skipped) = await push.SendDailyRemindersAsync(webOrigin);
    return Results.Ok(new { sent, skipped, utc = DateTime.UtcNow });
});

app.MapPost("/api/cron/digest", async (HttpContext http, IConfiguration config, DigestService digest) =>
{
    var expected = config["Cron:Key"];
    if (string.IsNullOrWhiteSpace(expected))
        return Results.Json(new { message = "Cron:Key nie jest skonfigurowany." }, statusCode: 503);
    if (!http.Request.Headers.TryGetValue("X-Cron-Key", out var provided)
        || !string.Equals(provided.ToString(), expected, StringComparison.Ordinal))
        return Results.Unauthorized();

    var (dailySent, dailySkipped) = await digest.SendDailyUnreadAsync();
    var (weeklySent, weeklySkipped) = await digest.SendWeeklyAsync();
    return Results.Ok(new
    {
        dailySent,
        dailySkipped,
        sent = weeklySent,
        skipped = weeklySkipped,
        utc = DateTime.UtcNow,
    });
});

app.MapPost("/api/founding/apply", async (FoundingApplyInput input, FoundingService founding) =>
{
    var (ok, checkoutUrl, message, emailSent) = await founding.ApplyAsync(input);
    if (!ok) return Results.Conflict(new { message });
    return Results.Ok(new { ok = true, checkoutUrl, message, emailSent });
}).RequireRateLimiting("founding");

app.MapGet("/api/me", async (HttpContext http, AppDb db, IConfiguration config, BillingService billing) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        if (trainer.ClerkUserId == TrainerAccess.LocalClerkUserId && trainer.PlanKey != BillingPlans.Dev)
        {
            trainer.PlanKey = BillingPlans.Dev;
            await db.SaveChangesAsync();
        }
        var clientCount = await db.Clients.CountAsync(c => c.TrainerId == trainer.Id);
        var plan = BillingPlans.Resolve(trainer.PlanKey);
        return Results.Ok(new
        {
            trainer.Id,
            trainer.Email,
            trainer.Name,
            trainer.ClerkUserId,
            trainer.CreatedAt,
            planKey = plan.Key,
            planName = plan.Name,
            clientCount,
            clientLimit = plan.ClientLimit,
            billingConfigured = billing.StripeConfigured,
            notifyDailySummary = trainer.NotifyDailySummary,
            notifyClientReply = trainer.NotifyClientReply,
            notifyWeeklyDigest = trainer.NotifyWeeklyDigest,
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/me/preferences", async (TrainerPreferencesInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        if (input.NotifyDailySummary is bool a) trainer.NotifyDailySummary = a;
        if (input.NotifyClientReply is bool b) trainer.NotifyClientReply = b;
        if (input.NotifyWeeklyDigest is bool d) trainer.NotifyWeeklyDigest = d;
        await db.SaveChangesAsync();
        return Results.Ok(new
        {
            notifyDailySummary = trainer.NotifyDailySummary,
            notifyClientReply = trainer.NotifyClientReply,
            notifyWeeklyDigest = trainer.NotifyWeeklyDigest,
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/billing/checkout", async (BillingCheckoutInput input, HttpContext http, AppDb db, IConfiguration config, BillingService billing) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        var (ok, url, message) = await billing.CreateCheckoutAsync(trainer, input.PlanKey);
        if (!ok) return Results.Conflict(new { message });
        return Results.Ok(new { checkoutUrl = url, message });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/billing/portal", async (HttpContext http, AppDb db, IConfiguration config, BillingService billing) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        var (ok, url, message) = await billing.CreatePortalAsync(trainer);
        if (!ok) return Results.Conflict(new { message });
        return Results.Ok(new { portalUrl = url, message });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/stripe/webhook", async (HttpContext http, BillingService billing, AppDb db) =>
    await billing.HandleWebhookAsync(http, db));

app.MapGet("/api/export", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        return Results.Ok(await ExportData.BuildAsync(db, trainerId));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/export/csv", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var csv = await ExportData.BuildCsvAsync(db, trainerId);
        return Results.Text(csv, "text/csv; charset=utf-8");
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/account", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        // Cascade: Clients → sessions/measurements/intake/tokens; Plans → days/items.
        // Ćwiczenia własne trenera: TrainerId SetNull (biblioteka wspólna zostaje).
        db.Trainers.Remove(trainer);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Klienci ----------

app.MapGet("/api/clients", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var rows = await db.Clients
            .Where(c => c.TrainerId == trainerId)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id, c.Name, c.Email, c.Note, c.CreatedAt,
                ActivePlans = c.Assignments.Count(a => a.Status == "active"),
                LastSessionOn = c.Sessions
                    .Where(s => s.Status == "completed")
                    .Max(s => (DateOnly?)s.PerformedOn),
            })
            .ToListAsync();
        var presence = await TrainerPresence.ForTrainerAsync(db, trainerId);
        return Results.Ok(rows.Select(c =>
        {
            presence.LiveByClient.TryGetValue(c.Id, out var live);
            presence.ReviewByClient.TryGetValue(c.Id, out var review);
            return new
            {
                c.Id, c.Name, c.Email, c.Note, c.CreatedAt,
                c.ActivePlans, c.LastSessionOn,
                LiveSession = TrainerPresence.LiveJson(live),
                NeedsReview = TrainerPresence.ReviewJson(review),
            };
        }));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = await db.Clients
            .Include(c => c.Assignments).ThenInclude(a => a.Plan)
            .FirstOrDefaultAsync(c => c.Id == id && c.TrainerId == trainerId);
        if (client is null) return Results.NotFound();

        var presence = await TrainerPresence.ForTrainerAsync(db, trainerId);
        presence.LiveByClient.TryGetValue(client.Id, out var live);
        presence.ReviewByClient.TryGetValue(client.Id, out var review);

        return Results.Ok(new
        {
            client.Id, client.Name, client.Email, client.Note, client.GoalWeightKg, client.CreatedAt,
            HasPortalPin = !string.IsNullOrEmpty(client.PortalPinHash),
            LiveSession = TrainerPresence.LiveJson(live),
            NeedsReview = TrainerPresence.ReviewJson(review),
            Assignments = client.Assignments
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id, a.PlanId, PlanName = a.Plan!.Name, a.StartDate, a.Status, a.Note, a.CreatedAt,
                }),
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients", async (ClientInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        var clientCount = await db.Clients.CountAsync(c => c.TrainerId == trainer.Id);
        var limit = BillingPlans.RejectIfAtLimit(trainer, clientCount);
        if (limit is not null) return limit;
        var client = new Client
        {
            TrainerId = trainer.Id,
            Name = input.Name,
            Email = input.Email,
            Note = input.Note,
            GoalWeightKg = input.GoalWeightKg,
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();
        return Results.Created($"/api/clients/{client.Id}", client);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/import", async (ClientsImportInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        var rows = ClientsImport.Parse(input.Csv ?? "");
        if (rows.Count == 0)
            return Results.BadRequest(new { message = "Wklej CSV: imię, e-mail (e-mail opcjonalny)." });
        if (rows.Count > ClientsImport.MaxRows)
            return Results.BadRequest(new { message = $"Na raz maksymalnie {ClientsImport.MaxRows} osób." });

        var created = 0;
        var skipped = 0;
        var errors = new List<string>();
        var ids = new List<int>();
        var existing = await db.Clients.Where(c => c.TrainerId == trainer.Id).Select(c => c.Name).ToListAsync();
        var names = new HashSet<string>(existing, StringComparer.OrdinalIgnoreCase);

        foreach (var row in rows)
        {
            var count = await db.Clients.CountAsync(c => c.TrainerId == trainer.Id);
            if (BillingPlans.RejectIfAtLimit(trainer, count) is not null)
            {
                errors.Add($"Zatrzymano na limicie planu ({BillingPlans.Resolve(trainer.PlanKey).ClientLimit} osób).");
                break;
            }
            if (names.Contains(row.Name))
            {
                skipped++;
                continue;
            }
            var client = new Client
            {
                TrainerId = trainer.Id,
                Name = row.Name,
                Email = row.Email,
            };
            db.Clients.Add(client);
            await db.SaveChangesAsync();
            names.Add(row.Name);
            ids.Add(client.Id);
            created++;
        }

        return Results.Ok(new { created, skipped, errors, ids });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/clients/{id:int}", async (int id, ClientInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.TrainerId == trainerId);
        if (client is null) return Results.NotFound();
        client.Name = input.Name;
        client.Email = input.Email;
        client.Note = input.Note;
        client.GoalWeightKg = input.GoalWeightKg;
        await db.SaveChangesAsync();
        return Results.Ok(client);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/clients/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.TrainerId == trainerId);
        if (client is null) return Results.NotFound();
        db.Clients.Remove(client);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{id:int}/plan-from-history", async (
    int id, PlanFromHistoryInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = await TrainerAccess.OwnedClientAsync(db, trainerId, id);
        if (client is null) return Results.NotFound();

        var sinceDays = Math.Clamp(input.SinceDays, 1, 3650);
        var since = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-sinceDays));
        var sessions = await db.WorkoutSessions
            .AsSplitQuery()
            .Where(s => s.ClientId == id && s.Status == "completed" && s.PerformedOn >= since)
            .Include(s => s.PlanDay)
            .Include(s => s.Exercises).ThenInclude(e => e.Sets)
            .Include(s => s.Exercises).ThenInclude(e => e.Exercise)
            .OrderBy(s => s.PerformedOn)
            .ToListAsync();

        var mapped = HistoryImport.FromWorkoutSessions(sessions);
        if (mapped.Count == 0)
            return Results.BadRequest(new { message = "Brak treningów w historii — wgraj je albo wpisz trening." });

        return Results.Ok(HistoryImport.Analyze(mapped, client.Name, input.TopKgDelta));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{id:int}/intake", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        var intake = await db.ClientIntakes.FirstOrDefaultAsync(i => i.ClientId == id);
        return Results.Ok(IntakeToDto(id, intake));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/clients/{id:int}/intake", async (int id, ClientIntakeInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        var intake = await UpsertIntakeAsync(db, id, input);
        return Results.Ok(IntakeToDto(id, intake));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Notatki trenera (prywatne — nigdy w /api/portal/*) ----------

static object TrainerNoteToDto(TrainerNote n) => new
{
    n.Id,
    n.ClientId,
    n.Body,
    Pinned = n.PinnedAt != null,
    n.PinnedAt,
    n.CreatedAt,
    n.UpdatedAt,
};

app.MapGet("/api/clients/{clientId:int}/notes", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var rows = await db.TrainerNotes
            .AsNoTracking()
            .Where(n => n.ClientId == clientId)
            .OrderByDescending(n => n.PinnedAt != null)
            .ThenByDescending(n => n.PinnedAt)
            .ThenByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .ToListAsync();
        return Results.Ok(rows.Select(TrainerNoteToDto));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/notes", async (
    int clientId, TrainerNoteInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var body = (input.Body ?? "").Trim();
        if (body.Length == 0)
            return Results.BadRequest(new { message = "Notatka nie może być pusta." });

        var note = new TrainerNote
        {
            ClientId = clientId,
            Body = body,
            PinnedAt = input.Pinned ? DateTime.UtcNow : null,
        };
        db.TrainerNotes.Add(note);
        await db.SaveChangesAsync();
        return Results.Created($"/api/clients/{clientId}/notes/{note.Id}", TrainerNoteToDto(note));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/clients/{clientId:int}/notes/{noteId:int}", async (
    int clientId, int noteId, TrainerNoteInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var note = await db.TrainerNotes.FirstOrDefaultAsync(n => n.Id == noteId && n.ClientId == clientId);
        if (note is null) return Results.NotFound();

        var body = (input.Body ?? "").Trim();
        if (body.Length == 0)
            return Results.BadRequest(new { message = "Notatka nie może być pusta." });

        note.Body = body;
        note.PinnedAt = input.Pinned
            ? (note.PinnedAt ?? DateTime.UtcNow)
            : null;
        note.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(TrainerNoteToDto(note));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/clients/{clientId:int}/notes/{noteId:int}", async (
    int clientId, int noteId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var note = await db.TrainerNotes.FirstOrDefaultAsync(n => n.Id == noteId && n.ClientId == clientId);
        if (note is null) return Results.NotFound();
        db.TrainerNotes.Remove(note);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/client-notes", async (
    int clientId, int? limit, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        return Results.Ok(await ClientNotes.ForClientDtoAsync(db, clientId, limit ?? 30));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Ćwiczenia ----------

static void ApplyExerciseInput(Exercise exercise, ExerciseInput input, string name)
{
    exercise.Name = name;
    exercise.Description = input.Description;
    exercise.Type = input.Type;
    exercise.DefaultSets = input.DefaultSets;
    exercise.DefaultReps = input.DefaultReps;
    exercise.DefaultRepDurationSeconds = input.DefaultRepDurationSeconds;
    exercise.DefaultDistanceMeters = input.DefaultDistanceMeters;
    exercise.DefaultRestBetweenSetsSeconds = input.DefaultRestBetweenSetsSeconds;
    exercise.DefaultLoadKg = input.DefaultLoadKg;
    exercise.Category = string.IsNullOrWhiteSpace(input.Category) ? null : input.Category.Trim();
    exercise.Pattern = string.IsNullOrWhiteSpace(input.Pattern) ? null : input.Pattern.Trim();
    exercise.IsUnilateral = input.IsUnilateral;
    exercise.Equipment = input.Equipment?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? [];
    exercise.PrimaryMuscles = input.PrimaryMuscles?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? [];
    exercise.Instructions = string.IsNullOrWhiteSpace(input.Instructions) ? null : input.Instructions.Trim();
    exercise.Media = (input.Media ?? [])
        .Where(m => !string.IsNullOrWhiteSpace(m.YoutubeId))
        .Select(m => new ExerciseMedia(
            m.YoutubeId.Trim(),
            m.Title?.Trim() ?? "",
            m.Seconds,
            string.IsNullOrWhiteSpace(m.Kind) ? "demo" : m.Kind.Trim()))
        .ToList();
}

app.MapGet("/api/exercises", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        return Results.Ok(await db.Exercises
            .Where(e => e.TrainerId == null || e.TrainerId == trainerId)
            .OrderBy(e => e.Name)
            .ToListAsync());
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/exercises/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var exercise = await db.Exercises
            .FirstOrDefaultAsync(e => e.Id == id && (e.TrainerId == null || e.TrainerId == trainerId));
        return exercise is null ? Results.NotFound() : Results.Ok(exercise);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/exercises", async (ExerciseInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var name = NormalizeExerciseName(input.Name);
        if (name.Length == 0) return Results.BadRequest(new { message = "Podaj nazwę ćwiczenia." });
        var duplicate = await db.Exercises.AnyAsync(e =>
            e.Name.ToLower() == name.ToLower() && (e.TrainerId == null || e.TrainerId == trainerId));
        if (duplicate) return Results.Conflict(new { message = $"Ćwiczenie „{name}” już jest w bibliotece." });

        var exercise = new Exercise { TrainerId = trainerId };
        ApplyExerciseInput(exercise, input, name);
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();
        return Results.Created($"/api/exercises/{exercise.Id}", exercise);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/exercises/{id:int}", async (int id, ExerciseInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var exercise = await db.Exercises.FirstOrDefaultAsync(e => e.Id == id && e.TrainerId == trainerId);
        if (exercise is null)
        {
            var shared = await db.Exercises.AnyAsync(e => e.Id == id && e.TrainerId == null);
            if (shared)
                return Results.Conflict(new { message = "Wspólnej biblioteki nie edytujesz — skopiuj ćwiczenie jako własne." });
            return Results.NotFound();
        }

        var name = NormalizeExerciseName(input.Name);
        if (name.Length == 0) return Results.BadRequest(new { message = "Podaj nazwę ćwiczenia." });
        var duplicate = await db.Exercises.AnyAsync(e =>
            e.Id != id && e.Name.ToLower() == name.ToLower() && (e.TrainerId == null || e.TrainerId == trainerId));
        if (duplicate) return Results.Conflict(new { message = $"Ćwiczenie „{name}” już jest w bibliotece." });

        ApplyExerciseInput(exercise, input, name);
        await db.SaveChangesAsync();
        return Results.Ok(exercise);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/exercises/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var exercise = await db.Exercises.FirstOrDefaultAsync(e => e.Id == id && e.TrainerId == trainerId);
        if (exercise is null)
        {
            var shared = await db.Exercises.AnyAsync(e => e.Id == id && e.TrainerId == null);
            if (shared)
                return Results.Conflict(new { message = "Wspólnej biblioteki nie usuwasz." });
            return Results.NotFound();
        }

        var used = await db.PlanItems.AnyAsync(i => i.ExerciseId == id);
        if (used) return Results.Conflict(new { message = "Ćwiczenie jest używane w planie — najpierw usuń je z planów." });
        var hasMaxes = await db.ClientMaxes.AnyAsync(m => m.ExerciseId == id);
        if (hasMaxes) return Results.Conflict(new { message = "Ćwiczenie ma zapisane maxy klientów — najpierw je usuń." });
        var hasLogs = await db.LoggedExercises.AnyAsync(e => e.ExerciseId == id);
        if (hasLogs) return Results.Conflict(new { message = "Ćwiczenie ma historię treningów — nie można go usunąć." });
        db.Exercises.Remove(exercise);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Plany ----------

static string NormalizeExerciseName(string? name) =>
    string.IsNullOrWhiteSpace(name) ? "" : string.Join(' ', name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));

static object ItemToDto(PlanItem i, IReadOnlyDictionary<int, double>? maxesByExercise = null)
{
    var exercise = i.Exercise
        ?? throw new InvalidOperationException($"PlanItem {i.Id} bez Exercise.");
    var topKg = PlanLoads.TopLoadKg(i);
    double? oneRmKg = maxesByExercise is not null && maxesByExercise.TryGetValue(i.ExerciseId, out var rm)
        ? rm
        : null;
    var measure = i.MeasureType ?? exercise.Type;
    double? itemComputed = null;
    if (i.LoadPercent is not null && oneRmKg is not null)
        itemComputed = PlanLoads.RoundToHalf(oneRmKg.Value * i.LoadPercent.Value / 100.0);
    var effectiveLoad = i.LoadKg ?? itemComputed ?? exercise.DefaultLoadKg;
    return new
    {
        i.Id, i.ExerciseId, i.Order, i.SupersetGroup, i.IsWarmup,
        ExerciseName = exercise.Name,
        ExerciseType = exercise.Type,
        MeasureType = measure,
        ExerciseDescription = exercise.Description,
        Category = exercise.Category,
        DemoYoutubeId = exercise.Media.FirstOrDefault(m => m.Kind == "demo")?.YoutubeId
            ?? exercise.Media.FirstOrDefault()?.YoutubeId,
        // Efektywne parametry: nadpisanie z planu albo default z ćwiczenia
        Sets = i.Sets ?? exercise.DefaultSets,
        Reps = i.Reps ?? exercise.DefaultReps,
        i.RepsMax,
        RepDurationSeconds = i.RepDurationSeconds ?? (measure == "time" ? exercise.DefaultRepDurationSeconds : null),
        i.RepDurationSecondsMax,
        DistanceMeters = i.DistanceMeters ?? (measure == "distance" ? exercise.DefaultDistanceMeters : null),
        i.Tempo,
        i.TargetRpe,
        i.TargetRir,
        i.SetScheme,
        RestBetweenSetsSeconds = i.RestBetweenSetsSeconds ?? exercise.DefaultRestBetweenSetsSeconds,
        i.RestAfterExerciseSeconds,
        LoadKg = effectiveLoad,
        i.LoadPercent,
        ComputedLoadKg = itemComputed,
        i.Notes,
        Overrides = new { i.MeasureType, i.Sets, i.Reps, i.RepsMax, i.RepDurationSeconds, i.RepDurationSecondsMax, i.DistanceMeters, i.RestBetweenSetsSeconds, i.LoadKg, i.LoadPercent },
        PrescribedSets = i.PrescribedSets.OrderBy(s => s.Order).Select(s => new
        {
            s.Id, s.Order, s.Reps, s.RepsMax, s.DurationSeconds, s.DistanceMeters,
            s.LoadKg, s.LoadPercent, s.PercentOf, s.TargetRpe, s.TargetRir, s.Tempo, s.Role, s.Note,
            ComputedLoadKg = PlanLoads.ComputedSetLoad(s, topKg, oneRmKg),
        }),
    };
}

static object PlanToDto(Plan plan, IReadOnlyDictionary<int, double>? maxesByExercise = null)
{
    var days = plan.Days.OrderBy(d => d.WeekNumber).ThenBy(d => d.Order).ToList();
    return new
    {
        plan.Id, plan.Name, plan.Description, plan.IsTemplate, plan.CreatedAt,
        Days = days.Select(d => new
        {
            d.Id, d.WeekNumber, d.Order, d.Label, d.Notes, d.DayOfWeek,
            Items = d.Items.OrderBy(i => i.Order).Select(i => ItemToDto(i, maxesByExercise)),
        }),
        WeeksCount = days.Select(d => d.WeekNumber).DefaultIfEmpty(0).Max(),
        DaysCount = days.Count,
        ExerciseCount = days.Sum(d => d.Items.Count),
        AssignedCount = plan.Assignments.Count(a => a.Status == "active"),
    };
}

// Budowa encji z DTO wejściowego (współdzielone przez POST/PUT/duplicate).
static PlanSet BuildSet(PlanSetInput s) => new()
{
    Order = s.Order, Reps = s.Reps, RepsMax = s.RepsMax, DurationSeconds = s.DurationSeconds,
    DistanceMeters = s.DistanceMeters, LoadKg = s.LoadKg, LoadPercent = s.LoadPercent,
    PercentOf = s.PercentOf, TargetRpe = s.TargetRpe, TargetRir = s.TargetRir, Tempo = s.Tempo, Role = s.Role, Note = s.Note,
};

static PlanItem BuildItem(PlanItemInput i) => new()
{
    ExerciseId = i.ExerciseId, Order = i.Order, SupersetGroup = i.SupersetGroup, IsWarmup = i.IsWarmup,
    MeasureType = i.MeasureType,
    Sets = i.Sets, Reps = i.Reps, RepsMax = i.RepsMax,
    RepDurationSeconds = i.RepDurationSeconds, RepDurationSecondsMax = i.RepDurationSecondsMax,
    DistanceMeters = i.DistanceMeters, Tempo = i.Tempo, TargetRpe = i.TargetRpe, TargetRir = i.TargetRir, SetScheme = PlanSanitize.SetScheme(i.SetScheme),
    RestBetweenSetsSeconds = i.RestBetweenSetsSeconds, RestAfterExerciseSeconds = i.RestAfterExerciseSeconds ?? 90,
    LoadKg = i.LoadKg, LoadPercent = i.LoadPercent, Notes = i.Notes,
    PrescribedSets = (i.PrescribedSets ?? []).Select(BuildSet).ToList(),
};

static PlanDay BuildDay(PlanDayInput d) => new()
{
    WeekNumber = d.WeekNumber, Order = d.Order, Label = d.Label, Notes = d.Notes, DayOfWeek = d.DayOfWeek,
    Items = (d.Items ?? []).Select(BuildItem).ToList(),
};

static void ApplyItem(PlanItem item, PlanItemInput i)
{
    item.ExerciseId = i.ExerciseId;
    item.Order = i.Order;
    item.SupersetGroup = i.SupersetGroup;
    item.IsWarmup = i.IsWarmup;
    item.MeasureType = i.MeasureType;
    item.Sets = i.Sets;
    item.Reps = i.Reps;
    item.RepsMax = i.RepsMax;
    item.RepDurationSeconds = i.RepDurationSeconds;
    item.RepDurationSecondsMax = i.RepDurationSecondsMax;
    item.DistanceMeters = i.DistanceMeters;
    item.Tempo = i.Tempo;
    item.TargetRpe = i.TargetRpe;
    item.TargetRir = i.TargetRir;
    item.SetScheme = PlanSanitize.SetScheme(i.SetScheme);
    item.RestBetweenSetsSeconds = i.RestBetweenSetsSeconds;
    item.RestAfterExerciseSeconds = i.RestAfterExerciseSeconds ?? 90;
    item.LoadKg = i.LoadKg;
    item.LoadPercent = i.LoadPercent;
    item.Notes = i.Notes;
}

static void MergePlanItems(AppDb db, PlanDay day, List<PlanItemInput> incoming)
{
    var existingById = day.Items.Where(i => i.Id > 0).ToDictionary(i => i.Id);
    var keepIds = new HashSet<int>();

    foreach (var iIn in incoming)
    {
        if (iIn.Id is > 0 && existingById.TryGetValue(iIn.Id.Value, out var item))
        {
            keepIds.Add(item.Id);
            ApplyItem(item, iIn);
            item.PrescribedSets.Clear();
            foreach (var s in iIn.PrescribedSets ?? [])
                item.PrescribedSets.Add(BuildSet(s));
        }
        else
        {
            day.Items.Add(BuildItem(iIn));
        }
    }

    foreach (var item in day.Items.Where(i => i.Id > 0 && !keepIds.Contains(i.Id)).ToList())
    {
        day.Items.Remove(item);
        db.PlanItems.Remove(item);
    }
}

static void MergePlanDays(AppDb db, Plan plan, List<PlanDayInput> incoming)
{
    var existingById = plan.Days.Where(d => d.Id > 0).ToDictionary(d => d.Id);
    var keepIds = new HashSet<int>();

    foreach (var dIn in incoming)
    {
        if (dIn.Id is > 0 && existingById.TryGetValue(dIn.Id.Value, out var day))
        {
            keepIds.Add(day.Id);
            day.WeekNumber = dIn.WeekNumber;
            day.Order = dIn.Order;
            day.Label = dIn.Label;
            day.Notes = dIn.Notes;
            day.DayOfWeek = dIn.DayOfWeek;
            MergePlanItems(db, day, dIn.Items ?? []);
        }
        else
        {
            plan.Days.Add(BuildDay(dIn));
        }
    }

    foreach (var day in plan.Days.Where(d => d.Id > 0 && !keepIds.Contains(d.Id)).ToList())
    {
        plan.Days.Remove(day);
        db.PlanDays.Remove(day);
    }
}

app.MapGet("/api/plans", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        return Results.Ok(await db.Plans
            .Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id, p.Name, p.Description, p.IsTemplate, p.CreatedAt,
                WeeksCount = p.Days.Select(d => (int?)d.WeekNumber).Max() ?? 0,
                DaysCount = p.Days.Count,
                ExerciseCount = p.Days.SelectMany(d => d.Items).Count(),
                AssignedCount = p.Assignments.Count(a => a.Status == "active"),
            })
            .ToListAsync());
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/counts", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        return Results.Ok(new
        {
            clients = await db.Clients.CountAsync(c => c.TrainerId == trainerId),
            plans = await db.Plans.CountAsync(p => p.TrainerId == trainerId),
            exercises = await db.Exercises.CountAsync(e => e.TrainerId == null || e.TrainerId == trainerId),
            inboxUnread = await TrainerNotifications.UnreadCountAsync(db, trainerId),
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/dashboard", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var weekStart = today.AddDays(-6);
        var prevWeekStart = today.AddDays(-13);
        var prevWeekEnd = today.AddDays(-6); // exclusive end of previous 7-day window

        var clients = await db.Clients.CountAsync(c => c.TrainerId == trainerId);
        var plans = await db.Plans.CountAsync(p => p.TrainerId == trainerId);
        var exercises = await db.Exercises.CountAsync(e => e.TrainerId == null || e.TrainerId == trainerId);

        var recentSessions = await db.WorkoutSessions
            .Where(s => s.Status == "completed" && s.Client!.TrainerId == trainerId)
            .OrderByDescending(s => s.PerformedOn)
            .ThenByDescending(s => s.Id)
            .Take(6)
            .Select(s => new
            {
                s.Id,
                s.ClientId,
                ClientName = s.Client!.Name,
                s.AssignmentId,
                s.PlanDayId,
                s.PlanId,
                PlanName = s.Plan != null ? s.Plan.Name : null,
                DayLabel = s.PlanDay != null ? s.PlanDay.Label : null,
                s.OutOfOrder,
                s.PerformedOn,
                s.DurationSeconds,
                s.Note,
                s.Status,
                s.CreatedAt,
                TotalSets = s.Exercises.SelectMany(e => e.Sets).Count(x => !x.IsWarmup),
                TotalVolumeKg = s.Exercises.SelectMany(e => e.Sets)
                    .Where(x => !x.IsWarmup && x.Completed && x.WeightKg != null && x.Reps != null)
                    .Sum(x => x.WeightKg!.Value * x.Reps!.Value),
                ExerciseCount = s.Exercises.Count,
            })
            .ToListAsync();

        var sessionsLast7Days = await db.WorkoutSessions.CountAsync(s =>
            s.Status == "completed"
            && s.Client!.TrainerId == trainerId
            && s.PerformedOn >= weekStart
            && s.PerformedOn <= today);

        var sessionsPrev7Days = await db.WorkoutSessions.CountAsync(s =>
            s.Status == "completed"
            && s.Client!.TrainerId == trainerId
            && s.PerformedOn >= prevWeekStart
            && s.PerformedOn < prevWeekEnd);

        var clientActivity = await db.Clients
            .Where(c => c.TrainerId == trainerId)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                clientId = c.Id,
                clientName = c.Name,
                sessions7d = c.Sessions.Count(s =>
                    s.Status == "completed" && s.PerformedOn >= weekStart && s.PerformedOn <= today),
                lastSessionOn = c.Sessions
                    .Where(s => s.Status == "completed")
                    .Max(s => (DateOnly?)s.PerformedOn),
                activePlans = c.Assignments.Count(a => a.Status == "active"),
                weeklyTarget = c.Assignments
                    .Where(a => a.Status == "active")
                    .Select(a => (int?)a.Plan!.Days.Count(d => d.WeekNumber == 1))
                    .FirstOrDefault(),
                portalToken = c.AccessTokens
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => t.Token)
                    .FirstOrDefault(),
            })
            .ToListAsync();

        var allSets = await db.LoggedSets
            .Where(s => !s.IsWarmup
                        && s.Completed
                        && s.WeightKg != null
                        && s.Reps != null
                        && s.LoggedExercise!.Session!.Status == "completed"
                        && s.LoggedExercise.Session.Client!.TrainerId == trainerId)
            .OrderBy(s => s.LoggedExercise!.Session!.PerformedOn)
            .ThenBy(s => s.Id)
            .Select(s => new
            {
                ClientId = s.LoggedExercise!.Session!.ClientId,
                ClientName = s.LoggedExercise.Session.Client!.Name,
                ExerciseId = s.LoggedExercise.ExerciseId,
                ExerciseName = s.LoggedExercise.Exercise!.Name,
                s.WeightKg,
                s.Reps,
                PerformedOn = s.LoggedExercise.Session.PerformedOn,
                SessionId = s.LoggedExercise.WorkoutSessionId,
            })
            .ToListAsync();

        var allPrs = new List<object>();
        var prsLast7Days = 0;
        var dashboardPeaks = Stats.PeakPerSessionExercise(
            allSets,
            s => s.SessionId,
            s => s.ExerciseId,
            s => Stats.Epley1Rm(s.WeightKg, s.Reps));
        foreach (var (row, _) in Stats.ScanPeakPrs(
            dashboardPeaks.OrderBy(s => s.PerformedOn).ThenBy(s => s.SessionId),
            s => (s.ClientId, s.ExerciseId),
            s => Stats.Epley1Rm(s.WeightKg, s.Reps)!.Value))
        {
            var e1 = Stats.Epley1Rm(row.WeightKg, row.Reps)!.Value;
            allPrs.Add(new
            {
                clientId = row.ClientId,
                clientName = row.ClientName,
                exerciseId = row.ExerciseId,
                exerciseName = row.ExerciseName,
                estimated1Rm = Stats.RoundToHalf(e1),
                weightKg = row.WeightKg,
                reps = row.Reps,
                performedOn = row.PerformedOn,
            });
            if (row.PerformedOn >= weekStart && row.PerformedOn <= today)
                prsLast7Days++;
        }
        var recentPrs = allPrs.AsEnumerable().Reverse().Take(6).ToList();

        var attention = await ChurnRadar.BuildAttentionAsync(db, trainerId);

        var fromClients = await TrainerNotifications.ListAsync(db, trainerId, unreadOnly: true, kind: null, take: 8);
        var inboxUnread = await TrainerNotifications.UnreadCountAsync(db, trainerId);

        var trainerCreatedAt = await db.Trainers
            .Where(t => t.Id == trainerId)
            .Select(t => t.CreatedAt)
            .FirstAsync();
        var firstCompletedOn = await db.WorkoutSessions
            .Where(s => s.Status == "completed" && s.Client!.TrainerId == trainerId)
            .OrderBy(s => s.PerformedOn)
            .ThenBy(s => s.Id)
            .Select(s => (DateOnly?)s.PerformedOn)
            .FirstOrDefaultAsync();
        var window14 = today.AddDays(-14);
        var clientsWithActivePlan = clientActivity.Count(c => c.activePlans > 0);
        var clientsWithSessionLast14Days = clientActivity.Count(c =>
            c.lastSessionOn != null && c.lastSessionOn >= window14);

        var presence = await TrainerPresence.ForTrainerAsync(db, trainerId);
        var liveSessions = presence.LiveByClient.Values
            .OrderByDescending(x => x.StartedAt)
            .Select(x => new
            {
                clientId = x.ClientId,
                clientName = x.ClientName,
                sessionId = x.SessionId,
                startedAt = x.StartedAt,
                doneSets = x.DoneSets,
                totalSets = x.TotalSets,
            })
            .ToList();
        var recentSessionsWithReview = recentSessions.Select(s =>
        {
            presence.ReviewBySession.TryGetValue(s.Id, out var review);
            return new
            {
                s.Id,
                s.ClientId,
                s.ClientName,
                s.AssignmentId,
                s.PlanDayId,
                s.PlanId,
                s.PlanName,
                s.DayLabel,
                s.OutOfOrder,
                s.PerformedOn,
                s.DurationSeconds,
                s.Note,
                s.Status,
                s.CreatedAt,
                s.TotalSets,
                s.TotalVolumeKg,
                s.ExerciseCount,
                NeedsReview = TrainerPresence.ReviewJson(review),
            };
        });

        return Results.Ok(new
        {
            clients,
            plans,
            exercises,
            liveSessions,
            recentSessions = recentSessionsWithReview,
            recentPrs,
            attention,
            fromClients,
            inboxUnread,
            clientActivity,
            sessionsLast7Days,
            sessionsPrev7Days,
            prsLast7Days,
            activation = new
            {
                hasCompletedSession = firstCompletedOn != null,
                firstCompletedSessionOn = firstCompletedOn,
                clientsWithActivePlan,
                clientsWithSessionLast14Days,
                trainerCreatedAt,
            },
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/inbox", async (HttpContext http, AppDb db, IConfiguration config, bool? unreadOnly, string? kind, int? take) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        return Results.Ok(await TrainerNotifications.ListAsync(
            db, trainerId, unreadOnly == true, kind, take ?? 50));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/inbox/{id:int}/read", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var ok = await TrainerNotifications.MarkReadAsync(db, trainerId, id);
        return ok ? Results.NoContent() : Results.NotFound();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/inbox/read-all", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var marked = await TrainerNotifications.MarkAllReadAsync(db, trainerId);
        return Results.Ok(new { marked });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/plans/{id:int}", async (int id, int? clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var plan = await db.Plans
            .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.Exercise)
            .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
            .Include(p => p.Assignments)
            .FirstOrDefaultAsync(p => p.Id == id && p.TrainerId == trainerId);
        if (plan is null) return Results.NotFound();
        Dictionary<int, double>? maxes = null;
        if (clientId is not null)
        {
            var ownsClient = await db.Clients.AnyAsync(c => c.Id == clientId && c.TrainerId == trainerId);
            if (!ownsClient) return Results.NotFound();
            maxes = await PlanLoads.LatestMaxesAsync(db, clientId.Value);
        }
        return Results.Ok(PlanToDto(plan, maxes));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/plans/{id:int}/muscle-volume", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var owns = await db.Plans.AnyAsync(p => p.Id == id && p.TrainerId == trainerId);
        if (!owns) return Results.NotFound();
        return Results.Ok(await Analytics.PlanMuscleVolumeAsync(db, id));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/plans", async (PlanInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var plan = new Plan
        {
            TrainerId = trainerId,
            Name = input.Name,
            Description = input.Description,
            IsTemplate = input.IsTemplate,
            Days = (input.Days ?? []).Select(BuildDay).ToList(),
        };
        db.Plans.Add(plan);
        await db.SaveChangesAsync();
        return Results.Created($"/api/plans/{plan.Id}", new { plan.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/plans/{id:int}", async (int id, PlanInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var plan = await db.Plans.Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
            .FirstOrDefaultAsync(p => p.Id == id && p.TrainerId == trainerId);
        if (plan is null) return Results.NotFound();

        plan.Name = input.Name;
        plan.Description = input.Description;
        plan.IsTemplate = input.IsTemplate;
        MergePlanDays(db, plan, input.Days ?? []);
        await db.SaveChangesAsync();
        return Results.Ok(new
        {
            plan.Id,
            days = plan.Days
                .OrderBy(d => d.WeekNumber).ThenBy(d => d.Order)
                .Select(d => new
                {
                    d.Id,
                    d.WeekNumber,
                    d.Order,
                    items = d.Items.OrderBy(i => i.Order).Select(i => new { i.Id, i.Order }),
                }),
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/plans/{id:int}/duplicate", async (int id, DuplicateInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
    var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
    var source = await db.Plans
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
        .FirstOrDefaultAsync(p => p.Id == id && p.TrainerId == trainerId);
    if (source is null) return Results.NotFound();

    var copy = new Plan
    {
        TrainerId = trainerId,
        Name = input.Name ?? $"{source.Name} (kopia)",
        Description = source.Description,
        IsTemplate = input.IsTemplate ?? source.IsTemplate,
        Days = source.Days.Select(d => new PlanDay
        {
            WeekNumber = d.WeekNumber, Order = d.Order, Label = d.Label, Notes = d.Notes, DayOfWeek = d.DayOfWeek,
            Items = d.Items.Select(i => new PlanItem
            {
                ExerciseId = i.ExerciseId, Order = i.Order, SupersetGroup = i.SupersetGroup, IsWarmup = i.IsWarmup,
                MeasureType = i.MeasureType,
                Sets = i.Sets, Reps = i.Reps, RepsMax = i.RepsMax,
                RepDurationSeconds = i.RepDurationSeconds, RepDurationSecondsMax = i.RepDurationSecondsMax,
                DistanceMeters = i.DistanceMeters, Tempo = i.Tempo, TargetRpe = i.TargetRpe, TargetRir = i.TargetRir, SetScheme = i.SetScheme,
                RestBetweenSetsSeconds = i.RestBetweenSetsSeconds, RestAfterExerciseSeconds = i.RestAfterExerciseSeconds,
                LoadKg = i.LoadKg, LoadPercent = i.LoadPercent, Notes = i.Notes,
                PrescribedSets = i.PrescribedSets.Select(s => new PlanSet
                {
                    Order = s.Order, Reps = s.Reps, RepsMax = s.RepsMax, DurationSeconds = s.DurationSeconds,
                    DistanceMeters = s.DistanceMeters, LoadKg = s.LoadKg, LoadPercent = s.LoadPercent,
                    PercentOf = s.PercentOf, TargetRpe = s.TargetRpe, TargetRir = s.TargetRir, Tempo = s.Tempo, Role = s.Role, Note = s.Note,
                }).ToList(),
            }).ToList(),
        }).ToList(),
    };
    db.Plans.Add(copy);
    await db.SaveChangesAsync();
    return Results.Created($"/api/plans/{copy.Id}", new { copy.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/plans/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var plan = await db.Plans.FirstOrDefaultAsync(p => p.Id == id && p.TrainerId == trainerId);
        if (plan is null) return Results.NotFound();
        db.Plans.Remove(plan);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Maxy klienta ----------

app.MapGet("/api/clients/{clientId:int}/maxes", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var rows = await db.ClientMaxes
            .Where(m => m.ClientId == clientId)
            .Include(m => m.Exercise)
            .OrderByDescending(m => m.MeasuredOn)
            .ThenByDescending(m => m.Id)
            .Select(m => new
            {
                m.Id, m.ClientId, m.ExerciseId, ExerciseName = m.Exercise!.Name, m.MaxKg, m.MeasuredOn, m.Note,
            })
            .ToListAsync();
        return Results.Ok(rows);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/maxes", async (int clientId, ClientMaxInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        if (!await db.Exercises.AnyAsync(e => e.Id == input.ExerciseId && (e.TrainerId == null || e.TrainerId == trainerId)))
            return Results.NotFound();
        if (input.MaxKg <= 0) return Results.BadRequest(new { message = "Max musi być większy od 0." });

        var row = new ClientMax
        {
            ClientId = clientId,
            ExerciseId = input.ExerciseId,
            MaxKg = Stats.RoundToHalf(input.MaxKg),
            MeasuredOn = input.MeasuredOn,
            Note = input.Note,
        };
        db.ClientMaxes.Add(row);
        await db.SaveChangesAsync();
        return Results.Created($"/api/maxes/{row.Id}", new { row.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/maxes/{id:int}", async (int id, ClientMaxUpdateInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var row = await TrainerAccess.OwnedMaxAsync(db, trainerId, id);
        if (row is null) return Results.NotFound();
        if (input.MaxKg <= 0) return Results.BadRequest(new { message = "Max musi być większy od 0." });
        row.MaxKg = Stats.RoundToHalf(input.MaxKg);
        row.MeasuredOn = input.MeasuredOn;
        row.Note = input.Note;
        await db.SaveChangesAsync();
        return Results.Ok(new { row.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/maxes/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var row = await TrainerAccess.OwnedMaxAsync(db, trainerId, id);
        if (row is null) return Results.NotFound();
        db.ClientMaxes.Remove(row);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Pomiary klienta ----------

app.MapGet("/api/clients/{clientId:int}/measurements", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var rows = await db.ClientMeasurements
            .Where(m => m.ClientId == clientId)
            .OrderByDescending(m => m.MeasuredOn)
            .ThenByDescending(m => m.Id)
            .Select(m => new
            {
                m.Id, m.ClientId, m.MeasuredOn, m.WeightKg, m.WaistCm, m.ChestCm, m.HipsCm, m.Note, m.CreatedAt,
            })
            .ToListAsync();
        return Results.Ok(rows);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/measurements", async (int clientId, ClientMeasurementInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        if (input.WeightKg is null && input.WaistCm is null && input.ChestCm is null && input.HipsCm is null)
            return Results.BadRequest(new { message = "Podaj co najmniej jedną wartość pomiaru." });

        var row = new ClientMeasurement
        {
            ClientId = clientId,
            MeasuredOn = input.MeasuredOn,
            WeightKg = input.WeightKg,
            WaistCm = input.WaistCm,
            ChestCm = input.ChestCm,
            HipsCm = input.HipsCm,
            Note = input.Note,
        };
        db.ClientMeasurements.Add(row);
        await db.SaveChangesAsync();
        return Results.Created($"/api/measurements/{row.Id}", new { row.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/measurements/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var row = await TrainerAccess.OwnedMeasurementAsync(db, trainerId, id);
        if (row is null) return Results.NotFound();
        db.ClientMeasurements.Remove(row);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/photos", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var rows = await db.ClientProgressPhotos
            .Where(p => p.ClientId == clientId)
            .OrderByDescending(p => p.TakenOn)
            .ThenByDescending(p => p.Id)
            .ToListAsync();
        return Results.Ok(rows.Select(ProgressPhotos.Meta));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/photos/{photoId:int}/image", async (int clientId, int photoId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var row = await db.ClientProgressPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.ClientId == clientId);
        if (row is null) return Results.NotFound();
        return Results.File(row.Bytes, row.ContentType);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/photos", async (int clientId, ProgressPhotoInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var count = await db.ClientProgressPhotos.CountAsync(p => p.ClientId == clientId);
        if (count >= ProgressPhotos.MaxPerClient)
            return Results.Conflict(new { message = $"Maksymalnie {ProgressPhotos.MaxPerClient} zdjęć na osobę." });
        var decode = ProgressPhotos.Decode(input, out var bytes, out var contentType);
        if (decode is not null) return decode;
        var row = new ClientProgressPhoto
        {
            ClientId = clientId,
            TakenOn = ClientsImport.ParseDate(input.TakenOn),
            View = ProgressPhotos.NormalizeView(input.View),
            Note = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note.Trim(),
            ContentType = contentType,
            Bytes = bytes,
        };
        db.ClientProgressPhotos.Add(row);
        await db.SaveChangesAsync();
        return Results.Created($"/api/clients/{clientId}/photos/{row.Id}", ProgressPhotos.Meta(row));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/clients/{clientId:int}/photos/{photoId:int}", async (int clientId, int photoId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var row = await db.ClientProgressPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.ClientId == clientId);
        if (row is null) return Results.NotFound();
        db.ClientProgressPhotos.Remove(row);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/sessions", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var sessions = await db.WorkoutSessions
            .Where(s => s.ClientId == clientId)
            .OrderByDescending(s => s.PerformedOn)
            .ThenByDescending(s => s.Id)
            .Select(s => new
            {
                s.Id,
                s.ClientId,
                s.AssignmentId,
                s.PlanDayId,
                s.PlanId,
                PlanName = s.Plan != null ? s.Plan.Name : null,
                DayLabel = s.PlanDay != null ? s.PlanDay.Label : null,
                s.OutOfOrder,
                s.PerformedOn,
                s.DurationSeconds,
                s.Note,
                s.FeelingScore,
                s.SleepScore,
                s.EnergyScore,
                s.Status,
                s.CreatedAt,
                s.TrainerComment,
                s.ClientReply,
                HasUnreadClientReply = s.ClientReply != null && s.ClientReply != "" && s.ClientReplyReadAt == null,
                TotalSets = s.Exercises.SelectMany(e => e.Sets).Count(x => !x.IsWarmup),
                TotalVolumeKg = s.Exercises.SelectMany(e => e.Sets)
                    .Where(x => !x.IsWarmup && x.Completed && x.WeightKg != null && x.Reps != null)
                    .Sum(x => x.WeightKg!.Value * x.Reps!.Value),
                ExerciseCount = s.Exercises.Count,
            })
            .ToListAsync();
        return Results.Ok(sessions);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/sessions/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (await TrainerAccess.OwnedSessionAsync(db, trainerId, id) is null) return Results.NotFound();
        var dto = await Sessions.LoadDto(db, id);
        return dto is null ? Results.NotFound() : Results.Ok(dto);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/sessions/{id:int}/exercises/{exId:int}/form-check", async (int id, int exId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (await TrainerAccess.OwnedSessionAsync(db, trainerId, id) is null) return Results.NotFound();
        var row = await db.LoggedExerciseFormChecks
            .FirstOrDefaultAsync(f => f.LoggedExerciseId == exId && f.LoggedExercise!.WorkoutSessionId == id);
        if (row is null) return Results.NotFound();
        return Results.File(row.Bytes, row.ContentType, row.FileName);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/sessions/start", async (StartSessionInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, input.ClientId)) return Results.NotFound();
        var (session, error) = await Sessions.StartAsync(db, input);
        if (error is not null) return error;
        var dto = await Sessions.LoadDto(db, session!.Id);
        return Results.Created($"/api/sessions/{session.Id}", dto);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/sessions", async (WorkoutSessionInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, input.ClientId)) return Results.NotFound();
        var session = Sessions.BuildFromInput(input);
        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync();
        var dto = await Sessions.LoadDto(db, session.Id);
        return Results.Created($"/api/sessions/{session.Id}", dto);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/sessions/{id:int}", async (int id, WorkoutSessionInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, input.ClientId)) return Results.NotFound();
        var session = await db.WorkoutSessions
            .Include(s => s.Exercises).ThenInclude(e => e.Sets)
            .Include(s => s.Client)
            .FirstOrDefaultAsync(s => s.Id == id && s.Client!.TrainerId == trainerId);
        if (session is null) return Results.NotFound();
        if (session.ClientId != input.ClientId) return Results.NotFound();

        var dateErr = Sessions.ValidatePerformedOn(input.PerformedOn);
        if (dateErr is not null) return dateErr;

        Sessions.ApplyUpdate(db, session, input);
        await db.SaveChangesAsync();
        return Results.Ok(await Sessions.LoadDto(db, session.Id));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPatch("/api/sessions/{id:int}/complete", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var session = await TrainerAccess.OwnedSessionAsync(db, trainerId, id);
        if (session is null) return Results.NotFound();
        await Sessions.CompleteAsync(db, session);
        return Results.Ok(await Sessions.LoadDto(db, session.Id));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPatch("/api/sessions/{id:int}/checkin", async (int id, SessionCheckinInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var session = await TrainerAccess.OwnedSessionAsync(db, trainerId, id);
        if (session is null) return Results.NotFound();
        if (session.Status != "completed")
            return Results.Conflict(new { message = "Check-in możliwy tylko po ukończeniu sesji." });
        var validation = Sessions.ValidateCheckinScores(input);
        if (validation is not null) return validation;
        await Sessions.CheckinAsync(db, session, input);
        return Results.Ok(await Sessions.LoadDto(db, session.Id));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/sessions/{id:int}/comment", async (
    int id, SessionCommentInput input, HttpContext http, AppDb db, IConfiguration config, PushService push) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var session = await TrainerAccess.OwnedSessionAsync(db, trainerId, id);
        if (session is null) return Results.NotFound();
        if (session.Status != "completed")
            return Results.Conflict(new { message = "Komentarz możliwy tylko po ukończeniu sesji." });
        var text = (input.Comment ?? "").Trim();
        if (text.Length == 0)
            return Results.BadRequest(new { message = "Komentarz nie może być pusty." });
        if (text.Length > 2000)
            return Results.BadRequest(new { message = "Komentarz max. 2000 znaków." });
        session.TrainerComment = text;
        session.TrainerCommentAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var token = await db.ClientAccessTokens
            .Where(t => t.ClientId == session.ClientId && (t.ExpiresAt == null || t.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => t.Token)
            .FirstOrDefaultAsync();
        var webOrigin = (config["WEB_ORIGIN"] ?? allowedOrigins.FirstOrDefault() ?? "http://localhost:3000").TrimEnd('/');
        var portalUrl = token is null ? webOrigin : $"{webOrigin}/portal/{token}/history";
        var preview = text.Length > 80 ? text[..80] + "…" : text;
        await push.SendToClientAsync(
            session.ClientId,
            "Komentarz od trenera",
            preview,
            portalUrl);

        return Results.Ok(await Sessions.LoadDto(db, session.Id));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/sessions/{id:int}/comment/read", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var session = await TrainerAccess.OwnedSessionAsync(db, trainerId, id);
        if (session is null) return Results.NotFound();
        if (session.ClientReply is not null)
            session.ClientReplyReadAt = DateTime.UtcNow;
        await TrainerNotifications.MarkSessionReadAsync(db, trainerId, session.Id);
        await db.SaveChangesAsync();
        return Results.Ok(await Sessions.LoadDto(db, session.Id));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/sessions/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var session = await TrainerAccess.OwnedSessionAsync(db, trainerId, id);
        if (session is null) return Results.NotFound();
        db.WorkoutSessions.Remove(session);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/exercises/{exerciseId:int}/stats", async (int clientId, int exerciseId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        return Results.Ok(await Stats.ExerciseStatsAsync(db, clientId, exerciseId));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{id:int}/exercises/last-prescription", async (
    int id, string? exerciseIds, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();

        var ids = (exerciseIds ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var n) ? n : 0)
            .Where(n => n > 0)
            .Distinct()
            .ToList();
        var items = await Sessions.LoadLastPrescriptionsAsync(db, id, ids);
        return Results.Ok(new { items });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{id:int}/exercises/{exerciseId:int}/usage", async (
    int id, int exerciseId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();

        var rows = await db.LoggedExercises
            .AsNoTracking()
            .Where(e => e.Session!.ClientId == id && e.ExerciseId == exerciseId)
            .Select(e => new
            {
                e.WorkoutSessionId,
                SetCount = e.Sets.Count,
                PerformedOn = e.Session!.PerformedOn,
            })
            .ToListAsync();

        return Results.Ok(new
        {
            sessions = rows.Select(r => r.WorkoutSessionId).Distinct().Count(),
            sets = rows.Sum(r => r.SetCount),
            firstOn = rows.Count == 0 ? (DateOnly?)null : rows.Min(r => r.PerformedOn),
            lastOn = rows.Count == 0 ? (DateOnly?)null : rows.Max(r => r.PerformedOn),
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{id:int}/exercises/{exerciseId:int}/remap", async (
    int id, int exerciseId, ExerciseRemapInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        if (input.TargetExerciseId == exerciseId)
            return Results.Conflict(new { message = "To to samo ćwiczenie — wybierz inne." });

        var sourceOk = await db.Exercises.AnyAsync(e =>
            e.Id == exerciseId && (e.TrainerId == null || e.TrainerId == trainerId));
        var targetOk = await db.Exercises.AnyAsync(e =>
            e.Id == input.TargetExerciseId && (e.TrainerId == null || e.TrainerId == trainerId));
        if (!sourceOk || !targetOk) return Results.NotFound();

        var logged = await db.LoggedExercises
            .Include(e => e.Sets)
            .Where(e => e.Session!.ClientId == id && e.ExerciseId == exerciseId)
            .ToListAsync();
        foreach (var row in logged)
            row.ExerciseId = input.TargetExerciseId;

        var maxes = await db.ClientMaxes
            .Where(m => m.ClientId == id && m.ExerciseId == exerciseId)
            .ToListAsync();
        foreach (var max in maxes)
            max.ExerciseId = input.TargetExerciseId;

        await db.SaveChangesAsync();
        return Results.Ok(new
        {
            sessions = logged.Select(e => e.WorkoutSessionId).Distinct().Count(),
            sets = logged.Sum(e => e.Sets.Count),
            maxes = maxes.Count,
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/most-improved", async (
    int clientId, int? days, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var row = await ProgressReports.MostImprovedAsync(db, clientId, days ?? 90);
        // Ok/Json(null) → puste body w Minimal API; literał JSON null dla klienta.
        return row is null
            ? Results.Content("null", "application/json")
            : Results.Ok(row);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

static async Task<object> LoadClientRecordsAsync(AppDb db, int clientId)
{
    var sets = await db.LoggedSets
        .AsNoTracking()
        .Where(s => s.LoggedExercise!.Session!.ClientId == clientId
                    && s.LoggedExercise.Session.Status == "completed"
                    && !s.IsWarmup
                    && s.Completed
                    && s.WeightKg != null
                    && s.Reps != null)
        .Select(s => new
        {
            ExerciseId = s.LoggedExercise!.ExerciseId,
            ExerciseName = s.LoggedExercise.Exercise!.Name,
            Category = s.LoggedExercise.Exercise.Category,
            s.WeightKg,
            s.Reps,
            PerformedOn = s.LoggedExercise.Session!.PerformedOn,
            SessionId = s.LoggedExercise.WorkoutSessionId,
        })
        .ToListAsync();

    return sets
        .GroupBy(s => s.ExerciseId)
        .Select(g =>
        {
            var best = g
                .Select(s => new { Set = s, E1 = Stats.Epley1Rm(s.WeightKg, s.Reps) })
                .Where(x => x.E1 is not null)
                .OrderByDescending(x => x.E1!.Value)
                .ThenByDescending(x => x.Set.PerformedOn)
                .FirstOrDefault();
            return best is null
                ? null
                : new
                {
                    Best = best,
                    Category = g.Select(s => s.Category).FirstOrDefault(c => c != null),
                    LastPerformedOn = g.Max(s => s.PerformedOn),
                    SessionCount = g.Select(s => s.SessionId).Distinct().Count(),
                };
        })
        .Where(row => row is not null)
        .Select(row => new
        {
            exerciseId = row!.Best.Set.ExerciseId,
            exerciseName = row.Best.Set.ExerciseName ?? "",
            category = row.Category,
            estimated1Rm = Stats.RoundToHalf(row.Best.E1!.Value),
            weightKg = row.Best.Set.WeightKg,
            reps = row.Best.Set.Reps,
            performedOn = row.Best.Set.PerformedOn,
            lastPerformedOn = row.LastPerformedOn,
            sessionCount = row.SessionCount,
            sessionId = row.Best.Set.SessionId,
        })
        .OrderByDescending(r => r.estimated1Rm)
        .ToList();
}

app.MapGet("/api/clients/{clientId:int}/records", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        return Results.Ok(await LoadClientRecordsAsync(db, clientId));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/progress", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var assignment = await db.Assignments
            .Include(a => a.Plan!).ThenInclude(p => p.Days)
            .Where(a => a.ClientId == clientId && a.Status == "active")
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync();
        if (assignment?.Plan is null)
            return Results.Ok(new { assignmentId = (int?)null, completed = 0, total = 0, percent = 0 });

        var total = assignment.Plan.Days.Count;
        var completed = await db.WorkoutSessions.CountAsync(s =>
            s.ClientId == clientId
            && s.AssignmentId == assignment.Id
            && s.Status == "completed");
        var percent = total > 0 ? (int)Math.Round(100.0 * Math.Min(completed, total) / total) : 0;
        var (nextDueDayId, completionCounts) = await Sessions.NextDueDayAsync(
            db, clientId, assignment.Id, assignment.PlanId);
        var overrides = await db.AssignmentDayOverrides
            .Where(o => o.AssignmentId == assignment.Id)
            .ToDictionaryAsync(o => o.PlanDayId, o => o.Date);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var hero = Scheduling.ResolveHero(
            assignment.Plan.Days
                .OrderBy(d => d.WeekNumber).ThenBy(d => d.Order)
                .Select(d => (d.Id, d.WeekNumber, d.DayOfWeek, d.Label))
                .ToList(),
            assignment.StartDate,
            today,
            completionCounts,
            overrides,
            nextDueDayId);
        return Results.Ok(new
        {
            assignmentId = assignment.Id,
            planId = assignment.PlanId,
            planName = assignment.Plan.Name,
            completed,
            total,
            percent,
            nextDay = hero is null
                ? null
                : new
                {
                    id = hero.Id,
                    label = hero.Label,
                    scheduledOn = hero.ScheduledOn,
                    movedFrom = hero.MovedFrom,
                },
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/muscle-volume", async (
    int clientId, int? weeks, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        return Results.Ok(await Analytics.ClientMuscleVolumeAsync(db, clientId, weeks ?? 4));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/trends", async (
    int clientId, int? weeks, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        return Results.Ok(await Analytics.ClientTrendsAsync(db, clientId, weeks ?? 12));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/stagnation", async (
    int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        return Results.Ok(await Stagnation.ForClientDtoAsync(db, clientId));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/progress-report", async (
    int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        return Results.Ok(await ProgressReports.BuildForClientAsync(db, clientId));
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Token dostępu klienta (magic-link) ----------

app.MapGet("/api/clients/{clientId:int}/access-token", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var existing = await db.ClientAccessTokens
            .Where(t => t.ClientId == clientId && (t.ExpiresAt == null || t.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();
        if (existing is not null)
            return Results.Ok(new { existing.Token, existing.CreatedAt, existing.ExpiresAt });

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "").Replace("/", "").Replace("=", "");
        var row = new ClientAccessToken { ClientId = clientId, Token = token };
        db.ClientAccessTokens.Add(row);
        await db.SaveChangesAsync();
        return Results.Ok(new { row.Token, row.CreatedAt, row.ExpiresAt });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/access-token/rotate", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var old = await db.ClientAccessTokens.Where(t => t.ClientId == clientId).ToListAsync();
        db.ClientAccessTokens.RemoveRange(old);
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "").Replace("/", "").Replace("=", "");
        var row = new ClientAccessToken { ClientId = clientId, Token = token };
        db.ClientAccessTokens.Add(row);
        await db.SaveChangesAsync();
        return Results.Ok(new { row.Token, row.CreatedAt, row.ExpiresAt });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/access-token/expire", async (
    int clientId, AccessTokenExpireInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var row = await db.ClientAccessTokens
            .Where(t => t.ClientId == clientId && (t.ExpiresAt == null || t.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();
        if (row is null) return Results.NotFound(new { message = "Brak aktywnego linku." });
        row.ExpiresAt = input.Days is int d && d > 0
            ? DateTime.UtcNow.AddDays(d)
            : null;
        await db.SaveChangesAsync();
        return Results.Ok(new { row.Token, row.CreatedAt, row.ExpiresAt });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/portal-pin", async (
    int clientId, PortalPinInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == clientId && c.TrainerId == trainerId);
        if (client is null) return Results.NotFound();
        if (string.IsNullOrWhiteSpace(input.Pin))
        {
            client.PortalPinHash = null;
            client.PortalPinSalt = null;
            await db.SaveChangesAsync();
            return Results.Ok(new { hasPortalPin = false });
        }
        if (!PortalPin.IsValidFormat(input.Pin))
            return Results.BadRequest(new { message = "PIN to 4 cyfry." });
        var (hash, salt) = PortalPin.Hash(input.Pin);
        client.PortalPinHash = hash;
        client.PortalPinSalt = salt;
        await db.SaveChangesAsync();
        return Results.Ok(new { hasPortalPin = true });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/send-portal-link", async (
    int clientId, SendPortalLinkInput input, HttpContext http, AppDb db, IConfiguration config,
    EmailService email) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == clientId && c.TrainerId == trainerId);
        if (client is null) return Results.NotFound();
        if (string.IsNullOrWhiteSpace(client.Email))
            return Results.Conflict(new { message = "Klient nie ma adresu e-mail." });

        var tokenRow = await db.ClientAccessTokens
            .Where(t => t.ClientId == clientId && (t.ExpiresAt == null || t.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();
        if (tokenRow is null)
        {
            tokenRow = new ClientAccessToken
            {
                ClientId = clientId,
                Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                    .Replace("+", "").Replace("/", "").Replace("=", ""),
            };
            db.ClientAccessTokens.Add(tokenRow);
            await db.SaveChangesAsync();
        }

        var webOrigin = (config["WEB_ORIGIN"] ?? allowedOrigins.FirstOrDefault() ?? "http://localhost:3000").TrimEnd('/');
        var portalUrl = $"{webOrigin}/portal/{tokenRow.Token}";
        var intro = string.IsNullOrWhiteSpace(input.Message)
            ? "Twój plan treningowy czeka."
            : input.Message!.Trim();
        var (ok, err) = await email.SendAsync(
            client.Email!,
            "Twój plan treningowy",
            EmailService.PortalLinkHtml(client.Name, portalUrl, intro));
        if (!ok) return Results.Conflict(new { message = err ?? "Nie udało się wysłać e-maila." });
        return Results.Ok(new { sent = true, to = client.Email });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{clientId:int}/send-reminder", async (
    int clientId, SendReminderInput input, HttpContext http, AppDb db, IConfiguration config,
    EmailService email, PushService push) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == clientId && c.TrainerId == trainerId);
        if (client is null) return Results.NotFound();

        var tokenRow = await db.ClientAccessTokens
            .Where(t => t.ClientId == clientId && (t.ExpiresAt == null || t.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();
        if (tokenRow is null)
            return Results.Conflict(new { message = "Brak linku portalu — najpierw wygeneruj dostęp." });

        var webOrigin = (config["WEB_ORIGIN"] ?? allowedOrigins.FirstOrDefault() ?? "http://localhost:3000").TrimEnd('/');
        var portalUrl = $"{webOrigin}/portal/{tokenRow.Token}";
        var reason = string.IsNullOrWhiteSpace(input.Message)
            ? "Przypomnienie od trenera — Twój trening czeka."
            : input.Message!.Trim();

        var emailSent = false;
        string? emailErr = null;
        if (!string.IsNullOrWhiteSpace(client.Email))
        {
            var (ok, err) = await email.SendAsync(
                client.Email!,
                "Przypomnienie o treningu",
                EmailService.ReminderHtml(client.Name, portalUrl, reason));
            emailSent = ok;
            emailErr = err;
        }

        var pushSent = await push.SendToClientAsync(
            clientId,
            "Przypomnienie o treningu",
            reason,
            portalUrl);

        if (!emailSent && pushSent == 0)
        {
            var msg = emailErr
                ?? (string.IsNullOrWhiteSpace(client.Email)
                    ? "Brak e-maila i włączonych powiadomień push u klienta."
                    : "Nie udało się wysłać przypomnienia.");
            return Results.Conflict(new { message = msg });
        }

        return Results.Ok(new
        {
            sent = true,
            to = client.Email,
            emailSent,
            pushSent,
            preview = reason,
        });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{clientId:int}/check-ins", async (int clientId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var rows = await db.ClientCheckIns
            .Where(c => c.ClientId == clientId)
            .OrderByDescending(c => c.Date)
            .Take(30)
            .Select(c => new { c.Id, c.Date, c.MoodScore, c.SleepScore, c.Note, c.CreatedAt })
            .ToListAsync();
        return Results.Ok(rows);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- Odzyskanie linku portalu (publiczne, bez tokenu) ----------

app.MapPost("/api/portal/recover", async (
    RecoverPortalLinkInput input, AppDb db, IConfiguration config, EmailService email) =>
{
    // Zawsze ten sam komunikat — bez enumeracji kont.
    const string okMessage = "Jeśli ten adres jest w systemie, wysłaliśmy link dostępu.";
    var emailAddr = (input.Email ?? "").Trim().ToLowerInvariant();
    if (emailAddr.Length == 0 || !emailAddr.Contains('@'))
        return Results.Ok(new { message = okMessage });

    var client = await db.Clients.FirstOrDefaultAsync(c =>
        c.Email != null && c.Email.ToLower() == emailAddr);
    if (client is null)
        return Results.Ok(new { message = okMessage });

    var tokenRow = await db.ClientAccessTokens
        .Where(t => t.ClientId == client.Id && (t.ExpiresAt == null || t.ExpiresAt > DateTime.UtcNow))
        .OrderByDescending(t => t.CreatedAt)
        .FirstOrDefaultAsync();
    if (tokenRow is null)
    {
        tokenRow = new ClientAccessToken
        {
            ClientId = client.Id,
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("+", "").Replace("/", "").Replace("=", ""),
        };
        db.ClientAccessTokens.Add(tokenRow);
        await db.SaveChangesAsync();
    }

    var webOrigin = (config["WEB_ORIGIN"] ?? allowedOrigins.FirstOrDefault() ?? "http://localhost:3000").TrimEnd('/');
    var portalUrl = $"{webOrigin}/portal/{tokenRow.Token}";
    await email.SendAsync(
        client.Email!,
        "Twój link do treningów",
        EmailService.PortalLinkHtml(client.Name, portalUrl, "Oto Twój dostęp do planu treningowego."));
    return Results.Ok(new { message = okMessage });
}).RequireRateLimiting("portal");

// ---------- Portal klienta (scoped po tokenie) ----------

static async Task<ClientAccessToken?> ResolvePortalToken(AppDb db, string token)
{
    var row = await db.ClientAccessTokens
        .Include(t => t.Client)
        .FirstOrDefaultAsync(t => t.Token == token);
    if (row is null) return null;
    if (row.ExpiresAt is not null && row.ExpiresAt < DateTime.UtcNow) return null;
    return row;
}

app.MapGet("/api/portal/{token}/pin-status", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    return Results.Ok(new { pinRequired = !string.IsNullOrEmpty(access.Client!.PortalPinHash) });
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/unlock", async (string token, PortalUnlockInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    if (string.IsNullOrEmpty(access.Client!.PortalPinHash))
        return Results.Ok(new { ok = true });
    if (!PortalPin.IsValidFormat(input.Pin) || !PortalPin.Verify(input.Pin, access.Client.PortalPinHash, access.Client.PortalPinSalt))
        return Results.Json(new { message = "Niepoprawny PIN.", code = "pin_required" }, statusCode: 403);
    return Results.Ok(new { ok = true });
}).RequireRateLimiting("portal");

static object IntakeToDto(int clientId, ClientIntake? i) => new
{
    clientId,
    goalType = i?.GoalType,
    goalDetails = i?.GoalDetails,
    injuries = i?.Injuries,
    pains = i?.Pains,
    chronicConditions = i?.ChronicConditions,
    medications = i?.Medications,
    workType = i?.WorkType,
    stressLevel = i?.StressLevel,
    sleepHours = i?.SleepHours,
    freeTimeActivity = i?.FreeTimeActivity,
    experienceLevel = i?.ExperienceLevel,
    pastActivities = i?.PastActivities,
    trainingHistoryNotes = i?.TrainingHistoryNotes,
    sessionsPerWeek = i?.SessionsPerWeek,
    availability = i?.Availability,
    equipment = i?.Equipment,
    updatedAt = i?.UpdatedAt,
};

static int? ClampOptional(int? value, int min, int max) =>
    value is null ? null : Math.Clamp(value.Value, min, max);

static void ApplyIntakeInput(ClientIntake row, ClientIntakeInput input)
{
    row.GoalType = input.GoalType;
    row.GoalDetails = input.GoalDetails;
    row.Injuries = input.Injuries;
    row.Pains = input.Pains;
    row.ChronicConditions = input.ChronicConditions;
    row.Medications = input.Medications;
    row.WorkType = input.WorkType;
    row.StressLevel = ClampOptional(input.StressLevel, 1, 5);
    row.SleepHours = input.SleepHours;
    row.FreeTimeActivity = input.FreeTimeActivity;
    row.ExperienceLevel = input.ExperienceLevel;
    row.PastActivities = input.PastActivities;
    row.TrainingHistoryNotes = input.TrainingHistoryNotes;
    row.SessionsPerWeek = ClampOptional(input.SessionsPerWeek, 1, 14);
    row.Availability = input.Availability;
    row.Equipment = input.Equipment;
    row.UpdatedAt = DateTime.UtcNow;
}

static async Task<ClientIntake> UpsertIntakeAsync(AppDb db, int clientId, ClientIntakeInput input)
{
    var row = await db.ClientIntakes.FirstOrDefaultAsync(i => i.ClientId == clientId);
    if (row is null)
    {
        row = new ClientIntake { ClientId = clientId };
        db.ClientIntakes.Add(row);
    }
    ApplyIntakeInput(row, input);
    await db.SaveChangesAsync();
    return row;
}

app.MapGet("/api/portal/{token}", async (string token, string? today, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access?.Client is null) return Results.NotFound(new { message = "Link jest nieaktualny." });

    var clientToday = DateOnly.TryParse(today, out var parsedToday)
        ? parsedToday
        : DateOnly.FromDateTime(DateTime.UtcNow);

    var assignment = await db.Assignments
        .Include(a => a.Plan!)
        .Where(a => a.ClientId == access.ClientId && a.Status == "active")
        .OrderByDescending(a => a.CreatedAt)
        .FirstOrDefaultAsync();

    var (freshSession, staleSessionEntity) = await Sessions.ResolveInProgressAsync(
        db, access.ClientId, clientToday);

    object? todayDto = null;
    object? week = null;
    var cycleRestart = false;
    if (assignment?.Plan is not null)
    {
        var days = await db.PlanDays
            .Where(d => d.PlanId == assignment.PlanId)
            .OrderBy(d => d.WeekNumber)
            .ThenBy(d => d.Order)
            .Select(d => new { d.Id, d.WeekNumber, d.Order, d.Label, d.Notes, d.DayOfWeek })
            .ToListAsync();

        var (nextDueDayId, completionCounts) = await Sessions.NextDueDayAsync(
            db, access.ClientId, assignment.Id, assignment.PlanId);
        var overrides = await db.AssignmentDayOverrides
            .Where(o => o.AssignmentId == assignment.Id)
            .ToDictionaryAsync(o => o.PlanDayId, o => o.Date);
        var weekCount = days.Count == 0 ? 1 : days.Max(d => d.WeekNumber);
        var minCompletions = days.Count == 0
            ? 0
            : days.Min(d => completionCounts.GetValueOrDefault(d.Id));
        var todayScheduledId = Scheduling.TodayScheduledDayId(
            days.Select(d => (d.Id, d.WeekNumber, d.DayOfWeek)).ToList(),
            assignment.StartDate,
            clientToday,
            completionCounts,
            overrides);
        var heroDayId = todayScheduledId ?? nextDueDayId;
        var nextMeta = days.FirstOrDefault(d => d.Id == heroDayId);
        var dueMeta = days.FirstOrDefault(d => d.Id == nextDueDayId);
        // Cykl domknięty: każdy dzień ma ≥1 ukończenie i wracamy do pierwszego dnia nowego obiegu.
        cycleRestart = days.Count > 0
            && minCompletions > 0
            && dueMeta != null
            && dueMeta.Id == days[0].Id
            && days.All(d => completionCounts.GetValueOrDefault(d.Id) >= minCompletions);

        // Postęp w bieżącym cyklu: ile dni ma ukończeń > minCompletions (już „zrobione" w tej rundzie).
        var completedInCycle = days.Count(d => completionCounts.GetValueOrDefault(d.Id) > minCompletions);

        // Ostatnia ukończona sesja per dzień (prefill „Powtórz” z podglądu dnia).
        var lastCompletedByDay = days.Count == 0
            ? new Dictionary<int, int>()
            : (await db.WorkoutSessions
                .Where(s => s.ClientId == access.ClientId
                            && s.AssignmentId == assignment.Id
                            && s.Status == "completed"
                            && s.PlanDayId != null)
                .GroupBy(s => s.PlanDayId!.Value)
                .Select(g => new
                {
                    DayId = g.Key,
                    SessionId = g.OrderByDescending(x => x.PerformedOn)
                        .ThenByDescending(x => x.Id)
                        .Select(x => x.Id)
                        .First(),
                })
                .ToListAsync())
                .ToDictionary(x => x.DayId, x => x.SessionId);

        week = days.Select(d =>
        {
            DateOnly? ov = overrides.TryGetValue(d.Id, out var o) ? o : null;
            var on = Scheduling.ScheduledOn(
                d.WeekNumber, d.DayOfWeek, assignment.StartDate, minCompletions, weekCount, ov);
            return new
            {
                d.Id, d.WeekNumber, d.Order, d.Label, d.DayOfWeek,
                scheduledOn = on,
                completed = completionCounts.GetValueOrDefault(d.Id) > minCompletions,
                isToday = nextMeta != null && d.Id == nextMeta.Id,
                lastCompletedSessionId = lastCompletedByDay.TryGetValue(d.Id, out var sid)
                    ? (int?)sid
                    : null,
            };
        }).ToList();

        if (nextMeta is not null)
        {
            var next = await db.PlanDays
                .Include(d => d.Items).ThenInclude(i => i.Exercise)
                .Include(d => d.Items).ThenInclude(i => i.PrescribedSets)
                .FirstAsync(d => d.Id == nextMeta.Id);
            var maxes = await PlanLoads.LatestMaxesAsync(db, access.ClientId);
            DateOnly? heroOv = overrides.TryGetValue(next.Id, out var ho) ? ho : null;
            var heroOn = Scheduling.ScheduledOn(
                next.WeekNumber, next.DayOfWeek, assignment.StartDate, minCompletions, weekCount, heroOv);
            string? movedFrom = null;
            if (heroOv is not null && next.DayOfWeek is int origDow)
            {
                var original = Scheduling.ScheduledOn(
                    next.WeekNumber, origDow, assignment.StartDate, minCompletions, weekCount, null);
                if (original is not null && original != heroOv)
                    movedFrom = Scheduling.WeekdayShort(origDow);
            }
            todayDto = new
            {
                assignmentId = assignment.Id,
                planId = assignment.PlanId,
                planName = assignment.Plan.Name,
                day = new
                {
                    next.Id, next.WeekNumber, next.Order, next.Label, next.Notes, next.DayOfWeek,
                    Items = next.Items.OrderBy(i => i.Order).Select(i => ItemToDto(i, maxes)),
                },
                scheduledOn = heroOn,
                movedFrom,
                completed = completedInCycle,
                total = days.Count,
                percent = days.Count > 0
                    ? (int)Math.Round(100.0 * completedInCycle / days.Count)
                    : 0,
                cycleRestart,
            };
        }
    }

    object? inProgressSession = freshSession is null
        ? null
        : new
        {
            freshSession.Id,
            freshSession.PlanDayId,
            freshSession.PerformedOn,
            dayLabel = freshSession.PlanDay?.Label,
            completedSets = Sessions.CountCompletedSets(freshSession),
            totalSets = Sessions.CountTotalSets(freshSession),
        };

    object? staleSession = staleSessionEntity is null
        ? null
        : new
        {
            staleSessionEntity.Id,
            staleSessionEntity.PlanDayId,
            staleSessionEntity.PerformedOn,
            dayLabel = staleSessionEntity.PlanDay?.Label,
            completedSets = Sessions.CountCompletedSets(staleSessionEntity),
            totalSets = Sessions.CountTotalSets(staleSessionEntity),
        };

    return Results.Ok(new
    {
        client = new { access.Client.Id, access.Client.Name, access.Client.GoalWeightKg },
        today = todayDto,
        week,
        inProgressSession,
        staleSession,
    });
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/days/{dayId:int}/reschedule", async (
    string token, int dayId, PlanDayRescheduleInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });

    var day = await db.PlanDays.FirstOrDefaultAsync(d => d.Id == dayId);
    if (day is null) return Results.NotFound();

    var assignment = await db.Assignments
        .Where(a => a.ClientId == access.ClientId && a.PlanId == day.PlanId && a.Status == "active")
        .OrderByDescending(a => a.CreatedAt)
        .FirstOrDefaultAsync();
    if (assignment is null) return Results.NotFound();

    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    if (input.Date < today)
        return Results.BadRequest(new { message = "Wybierz dzień od dziś." });

    var existing = await db.AssignmentDayOverrides
        .FirstOrDefaultAsync(o => o.AssignmentId == assignment.Id && o.PlanDayId == dayId);
    if (existing is null)
    {
        db.AssignmentDayOverrides.Add(new AssignmentDayOverride
        {
            AssignmentId = assignment.Id,
            PlanDayId = dayId,
            Date = input.Date,
        });
    }
    else
    {
        existing.Date = input.Date;
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { date = input.Date.ToString("yyyy-MM-dd") });
});

app.MapGet("/api/portal/{token}/days/{dayId:int}", async (string token, int dayId, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });

    var day = await db.PlanDays
        .Include(d => d.Items).ThenInclude(i => i.Exercise)
        .Include(d => d.Items).ThenInclude(i => i.PrescribedSets)
        .Include(d => d.Plan)
        .FirstOrDefaultAsync(d => d.Id == dayId);
    if (day is null) return Results.NotFound();

    var assignment = await db.Assignments
        .Where(a => a.ClientId == access.ClientId && a.PlanId == day.PlanId && a.Status == "active")
        .OrderByDescending(a => a.CreatedAt)
        .FirstOrDefaultAsync();
    if (assignment is null) return Results.NotFound();

    var (dueDayId, completionCounts) = await Sessions.NextDueDayAsync(
        db, access.ClientId, assignment.Id, assignment.PlanId);
    var days = await db.PlanDays
        .Where(d => d.PlanId == assignment.PlanId)
        .Select(d => d.Id)
        .ToListAsync();
    var minCompletions = days.Count == 0
        ? 0
        : days.Min(id => completionCounts.GetValueOrDefault(id));
    var completedInCycle = completionCounts.GetValueOrDefault(day.Id) > minCompletions;

    var lastCompletedSessionId = await db.WorkoutSessions
        .Where(s => s.ClientId == access.ClientId
                    && s.AssignmentId == assignment.Id
                    && s.PlanDayId == day.Id
                    && s.Status == "completed")
        .OrderByDescending(s => s.PerformedOn)
        .ThenByDescending(s => s.Id)
        .Select(s => (int?)s.Id)
        .FirstOrDefaultAsync();

    var maxes = await PlanLoads.LatestMaxesAsync(db, access.ClientId);
    return Results.Ok(new
    {
        assignmentId = assignment.Id,
        planId = assignment.PlanId,
        planName = day.Plan?.Name ?? "",
        day = new
        {
            day.Id, day.WeekNumber, day.Order, day.Label, day.Notes,
            Items = day.Items.OrderBy(i => i.Order).Select(i => ItemToDto(i, maxes)),
        },
        completed = completedInCycle,
        isDue = dueDayId == day.Id,
        lastCompletedSessionId,
    });
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/sessions", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });

    var sessions = await db.WorkoutSessions
        .Where(s => s.ClientId == access.ClientId && s.Status == "completed")
        .OrderByDescending(s => s.PerformedOn)
        .ThenByDescending(s => s.Id)
        .Select(s => new
        {
            s.Id,
            s.ClientId,
            s.AssignmentId,
            s.PlanDayId,
            s.PlanId,
            PlanName = s.Plan != null ? s.Plan.Name : null,
            DayLabel = s.PlanDay != null ? s.PlanDay.Label : null,
            s.OutOfOrder,
            s.PerformedOn,
            s.DurationSeconds,
            s.Note,
            s.FeelingScore,
            s.SleepScore,
            s.EnergyScore,
            s.Status,
            s.CreatedAt,
            TotalSets = s.Exercises.SelectMany(e => e.Sets).Count(x => !x.IsWarmup),
            TotalVolumeKg = s.Exercises.SelectMany(e => e.Sets)
                .Where(x => !x.IsWarmup && x.Completed && x.WeightKg != null && x.Reps != null)
                .Sum(x => x.WeightKg!.Value * x.Reps!.Value),
            ExerciseCount = s.Exercises.Count,
        })
        .ToListAsync();

    // PR-y ustanowione w danej sesji (skan chronologiczny e1RM — jeden przebieg).
    var workingSets = await db.LoggedSets
        .AsNoTracking()
        .Where(s => s.LoggedExercise!.Session!.ClientId == access.ClientId
                    && s.LoggedExercise.Session.Status == "completed"
                    && !s.IsWarmup
                    && s.Completed
                    && s.WeightKg != null
                    && s.Reps != null)
        .Select(s => new
        {
            SessionId = s.LoggedExercise!.WorkoutSessionId,
            PerformedOn = s.LoggedExercise.Session!.PerformedOn,
            ExerciseId = s.LoggedExercise.ExerciseId,
            ExerciseName = s.LoggedExercise.Exercise!.Name,
            s.WeightKg,
            s.Reps,
            s.SetNumber,
        })
        .ToListAsync();

    var prsBySession = new Dictionary<int, List<object>>();
    var portalPeaks = Stats.PeakPerSessionExercise(
        workingSets,
        s => s.SessionId,
        s => s.ExerciseId,
        s => Stats.Epley1Rm(s.WeightKg, s.Reps));
    foreach (var (row, prev) in Stats.ScanPeakPrs(
        portalPeaks.OrderBy(x => x.PerformedOn).ThenBy(x => x.SessionId),
        s => s.ExerciseId,
        s => Stats.Epley1Rm(s.WeightKg, s.Reps)!.Value))
    {
        var e1 = Stats.Epley1Rm(row.WeightKg, row.Reps)!.Value;
        if (!prsBySession.TryGetValue(row.SessionId, out var list))
        {
            list = [];
            prsBySession[row.SessionId] = list;
        }
        list.Add(new
        {
            exerciseId = row.ExerciseId,
            exerciseName = row.ExerciseName,
            weightKg = row.WeightKg,
            reps = row.Reps,
            estimated1Rm = Stats.RoundToHalf(e1),
            previousBest1Rm = prev > 0 ? Stats.RoundToHalf(prev) : (double?)null,
        });
    }

    var result = sessions.Select(s => new
    {
        s.Id,
        s.ClientId,
        s.AssignmentId,
        s.PlanDayId,
        s.PlanId,
        s.PlanName,
        s.DayLabel,
        s.PerformedOn,
        s.DurationSeconds,
        s.Note,
        s.FeelingScore,
        s.SleepScore,
        s.EnergyScore,
        s.Status,
        s.CreatedAt,
        s.TotalSets,
        s.TotalVolumeKg,
        s.ExerciseCount,
        Prs = prsBySession.TryGetValue(s.Id, out var prs) ? prs : [],
    });
    return Results.Ok(result);
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/records", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    return Results.Ok(await LoadClientRecordsAsync(db, access.ClientId));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/most-improved", async (string token, int? days, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var row = await ProgressReports.MostImprovedAsync(db, access.ClientId, days ?? 90);
    // Ok/Json(null) → puste body w Minimal API; literał JSON null dla klienta.
    return row is null
        ? Results.Content("null", "application/json")
        : Results.Ok(row);
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/exercises/{exerciseId:int}/stats", async (string token, int exerciseId, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    return Results.Ok(await Stats.ExerciseStatsAsync(db, access.ClientId, exerciseId));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/exercises", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access?.Client is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var trainerId = access.Client.TrainerId;
    var clientId = access.ClientId;

    var lastByExercise = await db.LoggedExercises
        .Where(le => le.Session!.ClientId == clientId && le.Session.Status == "completed")
        .GroupBy(le => le.ExerciseId)
        .Select(g => new { ExerciseId = g.Key, Last = g.Max(x => x.Session!.PerformedOn) })
        .ToDictionaryAsync(x => x.ExerciseId, x => (DateOnly?)x.Last);

    var rows = await db.Exercises
        .Where(e => e.TrainerId == null || e.TrainerId == trainerId)
        .OrderBy(e => e.Name)
        .ToListAsync();

    return Results.Ok(rows.Select(e => new
    {
        e.Id,
        e.TrainerId,
        e.Name,
        e.Description,
        e.Type,
        e.DefaultSets,
        e.DefaultReps,
        e.DefaultRepDurationSeconds,
        e.DefaultDistanceMeters,
        e.DefaultRestBetweenSetsSeconds,
        e.DefaultLoadKg,
        e.Category,
        e.Pattern,
        e.IsUnilateral,
        e.Equipment,
        e.PrimaryMuscles,
        e.Instructions,
        e.Media,
        LastPerformedOn = lastByExercise.TryGetValue(e.Id, out var d) ? d : null,
    }));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/measurements", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var rows = await db.ClientMeasurements
        .Where(m => m.ClientId == access.ClientId)
        .OrderByDescending(m => m.MeasuredOn)
        .ThenByDescending(m => m.Id)
        .Select(m => new
        {
            m.Id, m.ClientId, m.MeasuredOn, m.WeightKg, m.WaistCm, m.ChestCm, m.HipsCm, m.Note, m.CreatedAt,
        })
        .ToListAsync();
    return Results.Ok(rows);
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/measurements", async (string token, ClientMeasurementInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    if (input.WeightKg is null && input.WaistCm is null && input.ChestCm is null && input.HipsCm is null)
        return Results.BadRequest(new { message = "Podaj co najmniej jedną wartość pomiaru." });

    var row = new ClientMeasurement
    {
        ClientId = access.ClientId,
        MeasuredOn = input.MeasuredOn,
        WeightKg = input.WeightKg,
        WaistCm = input.WaistCm,
        ChestCm = input.ChestCm,
        HipsCm = input.HipsCm,
        Note = input.Note,
    };
    db.ClientMeasurements.Add(row);
    await TrainerNotifications.AddAsync(
        db,
        access.Client!.TrainerId,
        access.ClientId,
        TrainerNotifications.Measurement,
        row.WeightKg is double kg ? $"Nowy pomiar — {kg:0.#} kg" : "Nowy pomiar");
    await db.SaveChangesAsync();
    return Results.Created($"/api/portal/{token}/measurements/{row.Id}", new { row.Id });
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/photos", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var rows = await db.ClientProgressPhotos
        .Where(p => p.ClientId == access.ClientId)
        .OrderByDescending(p => p.TakenOn)
        .ThenByDescending(p => p.Id)
        .ToListAsync();
    return Results.Ok(rows.Select(ProgressPhotos.Meta));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/photos/{photoId:int}/image", async (string token, int photoId, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var row = await db.ClientProgressPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.ClientId == access.ClientId);
    if (row is null) return Results.NotFound();
    return Results.File(row.Bytes, row.ContentType);
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/photos", async (string token, ProgressPhotoInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var count = await db.ClientProgressPhotos.CountAsync(p => p.ClientId == access.ClientId);
    if (count >= ProgressPhotos.MaxPerClient)
        return Results.Conflict(new { message = $"Maksymalnie {ProgressPhotos.MaxPerClient} zdjęć." });
    var decode = ProgressPhotos.Decode(input, out var bytes, out var contentType);
    if (decode is not null) return decode;
    var row = new ClientProgressPhoto
    {
        ClientId = access.ClientId,
        TakenOn = ClientsImport.ParseDate(input.TakenOn),
        View = ProgressPhotos.NormalizeView(input.View),
        Note = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note.Trim(),
        ContentType = contentType,
        Bytes = bytes,
    };
    db.ClientProgressPhotos.Add(row);
    await TrainerNotifications.AddAsync(
        db,
        access.Client!.TrainerId,
        access.ClientId,
        TrainerNotifications.Photo,
        string.IsNullOrWhiteSpace(row.Note) ? "Nowe zdjęcie postępu" : row.Note);
    await db.SaveChangesAsync();
    return Results.Created($"/api/portal/{token}/photos/{row.Id}", ProgressPhotos.Meta(row));
}).RequireRateLimiting("portal");

app.MapDelete("/api/portal/{token}/photos/{photoId:int}", async (string token, int photoId, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var row = await db.ClientProgressPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.ClientId == access.ClientId);
    if (row is null) return Results.NotFound();
    db.ClientProgressPhotos.Remove(row);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/intake", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var intake = await db.ClientIntakes.FirstOrDefaultAsync(i => i.ClientId == access.ClientId);
    return Results.Ok(IntakeToDto(access.ClientId, intake));
}).RequireRateLimiting("portal");

app.MapPut("/api/portal/{token}/intake", async (string token, ClientIntakeInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var intake = await UpsertIntakeAsync(db, access.ClientId, input);
    await TrainerNotifications.AddAsync(
        db,
        access.Client!.TrainerId,
        access.ClientId,
        TrainerNotifications.Intake,
        "Wypełnił wywiad");
    await db.SaveChangesAsync();
    return Results.Ok(IntakeToDto(access.ClientId, intake));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/progress-report", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    return Results.Ok(await ProgressReports.BuildForClientAsync(db, access.ClientId));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/muscle-volume", async (string token, int? weeks, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    return Results.Ok(await Analytics.ClientMuscleVolumeAsync(db, access.ClientId, weeks ?? 4));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/trends", async (string token, int? weeks, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    return Results.Ok(await Analytics.ClientTrendsAsync(db, access.ClientId, weeks ?? 12));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/stagnation", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var items = await Stagnation.ForClientAsync(db, access.ClientId);
    if (items.Count == 0) return Results.Content("null", "application/json");
    return Results.Ok(await Stagnation.ForClientDtoAsync(db, access.ClientId));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/check-ins", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var rows = await db.ClientCheckIns
        .Where(c => c.ClientId == access.ClientId)
        .OrderByDescending(c => c.Date)
        .Take(30)
        .Select(c => new { c.Id, c.Date, c.MoodScore, c.SleepScore, c.Note, c.CreatedAt })
        .ToListAsync();
    return Results.Ok(rows);
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/check-ins", async (string token, ClientCheckInInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    foreach (var (score, label) in new[] { (input.MoodScore, "Samopoczucie"), (input.SleepScore, "Sen") })
    {
        if (score is int v && (v < 1 || v > 5))
            return Results.BadRequest(new { message = $"{label} musi być w skali 1–5." });
    }
    var date = input.Date ?? DateOnly.FromDateTime(DateTime.UtcNow);
    var existing = await db.ClientCheckIns.FirstOrDefaultAsync(c => c.ClientId == access.ClientId && c.Date == date);
    if (existing is not null)
    {
        existing.MoodScore = input.MoodScore;
        existing.SleepScore = input.SleepScore;
        existing.Note = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note.Trim();
    }
    else
    {
        existing = new ClientCheckIn
        {
            ClientId = access.ClientId,
            Date = date,
            MoodScore = input.MoodScore,
            SleepScore = input.SleepScore,
            Note = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note.Trim(),
        };
        db.ClientCheckIns.Add(existing);
    }
    await db.SaveChangesAsync();
    if (existing.MoodScore is int mood && mood <= 2)
    {
        var preview = $"Samopoczucie {mood}/5";
        if (existing.SleepScore != null) preview += $" · sen {existing.SleepScore}/5";
        if (!string.IsNullOrWhiteSpace(existing.Note)) preview += $" — {existing.Note}";
        await TrainerNotifications.AddAsync(
            db,
            access.Client!.TrainerId,
            access.ClientId,
            TrainerNotifications.LowCheckIn,
            preview,
            checkInId: existing.Id);
        await db.SaveChangesAsync();
    }
    return Results.Ok(new { existing.Id, existing.Date, existing.MoodScore, existing.SleepScore, existing.Note, existing.CreatedAt });
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/history-import", async (
    string token,
    HistoryImportRequest input,
    AppDb db,
    IChatClient chatClient,
    ILoggerFactory loggerFactory,
    CancellationToken ct) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var client = await db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == access.ClientId, ct);
    if (client is null) return Results.NotFound(new { message = "Link jest nieaktualny." });

    var library = await db.Exercises
        .Where(e => e.TrainerId == null || e.TrainerId == client.TrainerId)
        .OrderBy(e => e.Name)
        .Select(e => new { e.Id, e.Name, e.Type })
        .ToListAsync(ct);
    var libTuples = library.Select(e => (e.Id, e.Name, e.Type)).ToList();
    var logger = loggerFactory.CreateLogger("HistoryImport");
    try
    {
        var (draft, error) = await HistoryImport.ImportAsync(input, libTuples, chatClient, logger, ct);
        if (error is not null) return error;
        if (draft is null)
            return Results.Json(new { message = "Nie rozpoznałem treningów. Spróbuj inne zdjęcie albo wklej tekst." }, statusCode: 422);
        var (row, created) = await UpsertPendingHistoryImportAsync(db, access.ClientId, draft);
        await TrainerNotifications.AddAsync(
            db,
            client.TrainerId,
            access.ClientId,
            TrainerNotifications.HistoryImport,
            "Klient wrzucił zdjęcia treningów — sprawdź, czy się zgadzają.");
        await db.SaveChangesAsync(ct);
        return created
            ? Results.Created($"/api/portal/{token}/history-import", new { row.Id })
            : Results.Ok(new { row.Id });
    }
    catch (InvalidOperationException ex) when (
        ex.Message.Contains("OpenRouterApiKey", StringComparison.Ordinal)
        || ex.Message == UnavailableChatClient.Message)
    {
        return Results.Json(new { message = UnavailableChatClient.Message }, statusCode: 503);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Portal history import AI call failed");
        return Results.Json(new { message = "Nie rozpoznałem treningów. Spróbuj ponownie za chwilę." }, statusCode: 502);
    }
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/export", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var csv = await ExportData.BuildClientCsvAsync(db, access.ClientId);
    return Results.Text(csv, "text/csv; charset=utf-8");
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/maxes", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var rows = await db.ClientMaxes
        .Where(m => m.ClientId == access.ClientId)
        .OrderByDescending(m => m.MeasuredOn)
        .ThenByDescending(m => m.Id)
        .Select(m => new
        {
            m.Id, m.ExerciseId, ExerciseName = m.Exercise!.Name, m.MaxKg, m.MeasuredOn, m.Note,
        })
        .ToListAsync();
    return Results.Ok(rows);
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/history-import/pending", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var row = await db.ClientHistoryImports
        .Where(h => h.ClientId == access.ClientId && h.Status == "pending")
        .OrderByDescending(h => h.CreatedAt)
        .Select(h => new { h.Id, h.Status, h.CreatedAt })
        .FirstOrDefaultAsync();
    return Results.Ok(row);
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/sessions/{id:int}/exercises/{exId:int}/form-check", async (
    string token, int id, int exId, FormCheckInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var exercise = await db.LoggedExercises
        .Include(e => e.FormCheck)
        .Include(e => e.Session)
        .FirstOrDefaultAsync(e => e.Id == exId && e.WorkoutSessionId == id && e.Session!.ClientId == access.ClientId);
    if (exercise is null) return Results.NotFound(new { message = "Nie znaleziono ćwiczenia w tym treningu." });
    var decode = FormChecks.Decode(input, out var bytes, out var contentType, out var fileName);
    if (decode is not null) return decode;
    if (exercise.FormCheck is not null)
    {
        exercise.FormCheck.Bytes = bytes;
        exercise.FormCheck.ContentType = contentType;
        exercise.FormCheck.FileName = fileName;
        exercise.FormCheck.CreatedAt = DateTime.UtcNow;
    }
    else
    {
        exercise.FormCheck = new LoggedExerciseFormCheck
        {
            ContentType = contentType,
            FileName = fileName,
            Bytes = bytes,
        };
    }
    await db.SaveChangesAsync();
    return Results.Created(
        $"/api/portal/{token}/sessions/{id}/exercises/{exId}/form-check",
        FormChecks.Meta(exercise.FormCheck));
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/sessions/{id:int}/exercises/{exId:int}/form-check", async (
    string token, int id, int exId, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var row = await db.LoggedExerciseFormChecks
        .FirstOrDefaultAsync(f =>
            f.LoggedExerciseId == exId
            && f.LoggedExercise!.WorkoutSessionId == id
            && f.LoggedExercise.Session!.ClientId == access.ClientId);
    if (row is null) return Results.NotFound();
    return Results.File(row.Bytes, row.ContentType, row.FileName);
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/push-subscription", async (string token, PushSubscriptionInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    if (string.IsNullOrWhiteSpace(input.Endpoint) || string.IsNullOrWhiteSpace(input.P256dh) || string.IsNullOrWhiteSpace(input.Auth))
        return Results.BadRequest(new { message = "Niepełna subskrypcja push." });

    var existing = await db.ClientPushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == input.Endpoint);
    if (existing is not null)
    {
        existing.ClientId = access.ClientId;
        existing.P256dh = input.P256dh;
        existing.Auth = input.Auth;
    }
    else
    {
        db.ClientPushSubscriptions.Add(new ClientPushSubscription
        {
            ClientId = access.ClientId,
            Endpoint = input.Endpoint,
            P256dh = input.P256dh,
            Auth = input.Auth,
        });
    }
    await db.SaveChangesAsync();
    return Results.Ok(new { subscribed = true });
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/push-subscription/unsubscribe", async (string token, PushSubscriptionInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var existing = await db.ClientPushSubscriptions
        .FirstOrDefaultAsync(s => s.ClientId == access.ClientId && s.Endpoint == input.Endpoint);
    if (existing is not null)
    {
        db.ClientPushSubscriptions.Remove(existing);
        await db.SaveChangesAsync();
    }
    return Results.NoContent();
}).RequireRateLimiting("portal");

app.MapGet("/api/portal/{token}/sessions/{id:int}", async (string token, int id, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    return Results.Ok(await Sessions.LoadDto(db, id));
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/sessions/start", async (string token, StartSessionInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    input = input with { ClientId = access.ClientId };
    var (session, error) = await Sessions.StartAsync(db, input, requireDayOwnedByClient: true);
    if (error is not null) return error;
    if (session!.OutOfOrder)
    {
        await TrainerNotifications.AddAsync(
            db,
            access.Client!.TrainerId,
            access.ClientId,
            TrainerNotifications.OutOfOrder,
            "Zrobił trening poza kolejką",
            sessionId: session.Id);
        await db.SaveChangesAsync();
    }
    return Results.Created($"/api/portal/{token}/sessions/{session.Id}", await Sessions.LoadDto(db, session.Id));
}).RequireRateLimiting("portal");

app.MapPut("/api/portal/{token}/sessions/{id:int}", async (string token, int id, WorkoutSessionInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions
        .Include(s => s.Exercises).ThenInclude(e => e.Sets)
        .FirstOrDefaultAsync(s => s.Id == id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();

    input = input with { ClientId = access.ClientId };
    var dateErr = Sessions.ValidatePerformedOn(input.PerformedOn);
    if (dateErr is not null) return dateErr;

    Sessions.ApplyUpdate(db, session, input);
    if (session.Status == "completed" && !string.IsNullOrWhiteSpace(session.Note))
    {
        await TrainerNotifications.AddAsync(
            db,
            access.Client!.TrainerId,
            access.ClientId,
            TrainerNotifications.SessionNote,
            session.Note,
            sessionId: session.Id);
    }
    await db.SaveChangesAsync();
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
}).RequireRateLimiting("portal");

app.MapPatch("/api/portal/{token}/sessions/{id:int}/complete", async (string token, int id, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    await Sessions.CompleteAsync(db, session);
    if (!string.IsNullOrWhiteSpace(session.Note))
    {
        await TrainerNotifications.AddAsync(
            db,
            access.Client!.TrainerId,
            access.ClientId,
            TrainerNotifications.SessionNote,
            session.Note,
            sessionId: session.Id);
        await db.SaveChangesAsync();
    }
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
}).RequireRateLimiting("portal");

app.MapPatch("/api/portal/{token}/sessions/{id:int}/abandon", async (string token, int id, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    var (abandoned, error) = await Sessions.AbandonAsync(db, session);
    if (error is not null) return error;
    return Results.Ok(await Sessions.LoadDto(db, abandoned!.Id));
}).RequireRateLimiting("portal");

app.MapPost("/api/portal/{token}/sessions/{id:int}/comment", async (string token, int id, SessionCommentInput input, AppDb db, TrainerNotifyService notify) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    if (session.Status != "completed")
        return Results.Conflict(new { message = "Odpowiedź możliwa tylko po ukończeniu sesji." });
    if (string.IsNullOrWhiteSpace(session.TrainerComment))
        return Results.Conflict(new { message = "Brak komentarza trenera do odpowiedzi." });
    var text = (input.Comment ?? "").Trim();
    if (text.Length == 0)
        return Results.BadRequest(new { message = "Odpowiedź nie może być pusta." });
    if (text.Length > 2000)
        return Results.BadRequest(new { message = "Odpowiedź max. 2000 znaków." });
    session.ClientReply = text;
    session.ClientReplyAt = DateTime.UtcNow;
    session.ClientReplyReadAt = null;
    await TrainerNotifications.AddAsync(
        db,
        access.Client!.TrainerId,
        access.ClientId,
        TrainerNotifications.SessionReply,
        text,
        sessionId: session.Id);
    await db.SaveChangesAsync();
    await notify.NotifyClientReplyAsync(session.Id);
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
}).RequireRateLimiting("portal");

app.MapPatch("/api/portal/{token}/sessions/{id:int}/checkin", async (string token, int id, SessionCheckinInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    if (session.Status != "completed")
        return Results.Conflict(new { message = "Check-in możliwy tylko po ukończeniu sesji." });
    var validation = Sessions.ValidateCheckinScores(input);
    if (validation is not null) return validation;
    await Sessions.CheckinAsync(db, session, input);
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
}).RequireRateLimiting("portal");

// ---------- Przypisania ----------

app.MapGet("/api/assignments", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        return Results.Ok(await db.Assignments
            .Where(a => a.Client!.TrainerId == trainerId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id, a.PlanId, a.ClientId, a.StartDate, a.Status, a.Note, a.CreatedAt,
                PlanName = a.Plan!.Name,
                ClientName = a.Client!.Name,
            })
            .ToListAsync());
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/assignments", async (AssignmentInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var planExists = await db.Plans.AnyAsync(p => p.Id == input.PlanId && p.TrainerId == trainerId);
        var clientExists = await TrainerAccess.OwnsClientAsync(db, trainerId, input.ClientId);
        if (!planExists || !clientExists) return Results.NotFound();

        var duplicate = await db.Assignments.AnyAsync(a =>
            a.PlanId == input.PlanId && a.ClientId == input.ClientId && a.Status == "active");
        if (duplicate) return Results.Conflict(new { message = "Ten plan jest już aktywnie przypisany do tego klienta." });

        var assignment = new Assignment
        {
            PlanId = input.PlanId,
            ClientId = input.ClientId,
            StartDate = input.StartDate,
            Note = input.Note,
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();
        return Results.Created($"/api/assignments/{assignment.Id}", new { assignment.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPatch("/api/assignments/{id:int}/status", async (int id, StatusInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var assignment = await TrainerAccess.OwnedAssignmentAsync(db, trainerId, id);
        if (assignment is null) return Results.NotFound();
        assignment.Status = input.Status;
        await db.SaveChangesAsync();
        return Results.Ok(new { assignment.Id, assignment.Status });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapDelete("/api/assignments/{id:int}", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var assignment = await TrainerAccess.OwnedAssignmentAsync(db, trainerId, id);
        if (assignment is null) return Results.NotFound();
        db.Assignments.Remove(assignment);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

// ---------- AI ----------

app.MapPost("/api/ai/plan-import", async (
    PlanImportRequest input,
    HttpContext http,
    AppDb db,
    IConfiguration config,
    IChatClient chatClient,
    ILoggerFactory loggerFactory,
    CancellationToken ct) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var text = input.Text?.Trim() ?? "";
        if (text.Length < 10)
            return Results.BadRequest(new { message = "Wklej dłuższy tekst planu (min. kilka linii)." });
        if (text.Length > 40_000)
            return Results.BadRequest(new { message = "Tekst jest za długi (max 40 000 znaków)." });

        if (chatClient is UnavailableChatClient)
            return Results.Json(new { message = UnavailableChatClient.Message }, statusCode: 503);

        var library = await db.Exercises
            .Where(e => e.TrainerId == null || e.TrainerId == trainerId)
            .OrderBy(e => e.Name)
            .Select(e => new { e.Id, e.Name, e.Type })
            .ToListAsync(ct);

        var libTuples = library.Select(e => (e.Id, e.Name, e.Type)).ToList();
        var chunks = PlanImport.SplitWeeks(text);
        if (input.Weeks is { Count: > 0 } weeksFilter)
        {
            var wanted = weeksFilter.ToHashSet();
            chunks = chunks.Where(c => c.WeekNumber is { } w && wanted.Contains(w)).ToList();
        }

        if (chunks.Count == 0)
            return Results.Json(
                new { message = "Nie rozpoznano żadnych dni treningowych w tekście." },
                statusCode: 422);

        var logger = loggerFactory.CreateLogger("PlanImport");
        // Structured outputs (json_schema) — gdy provider odrzuci schematem (400), chunk spada na json_object.
        var schemaOptions = new ChatOptions
        {
            Temperature = 0.2f,
            ResponseFormat = ChatResponseFormat.ForJsonSchema(
                PlanImport.ResponseSchema,
                "plan_import_draft",
                "Draft planu treningowego z dniami i ćwiczeniami"),
            MaxOutputTokens = 16_000,
        };
        var jsonOptions = new ChatOptions
        {
            Temperature = 0.2f,
            ResponseFormat = ChatResponseFormat.Json,
            MaxOutputTokens = 16_000,
        };

        var parts = new (WeekChunk Chunk, PlanImportDraft? Draft, string? Error)[chunks.Count];
        using var gate = new SemaphoreSlim(3);

        async Task<(WeekChunk Chunk, PlanImportDraft? Draft, string? Error)> ImportWeekChunkAsync(WeekChunk chunk)
        {
            const int maxAttempts = 3;
            var prompt = PlanImport.BuildPrompt(chunk.Text, libTuples);
            var messages = new List<ChatMessage>
            {
                new(ChatRole.System, "Jesteś asystentem trenera personalnego. Odpowiadasz TYLKO poprawnym JSON-em, bez markdown."),
                new(ChatRole.User, prompt),
            };

            var activeOptions = schemaOptions;
            string? lastError = null;
            for (var attempt = 0; attempt < maxAttempts; attempt++)
            {
                ChatResponse response;
                try
                {
                    response = await chatClient.GetResponseAsync(messages, activeOptions, ct);
                }
                catch (ClientResultException ex) when (ex.Status == 400 &&
                    ReferenceEquals(activeOptions, schemaOptions))
                {
                    // Schemat odrzucony przez OpenRouter/Gemini → fallback na json_object.
                    logger.LogWarning(
                        "Plan import week {Week}: json_schema rejected (400), falling back to json_object. {Error}",
                        chunk.WeekNumber, ex.Message);
                    activeOptions = jsonOptions;
                    attempt--; // nie zużywaj próby na odrzucenie schematu
                    continue;
                }

                var raw = response.Text ?? "";
                var rawPreview = raw.Length > 500 ? raw[..500] : raw;

                if (response.FinishReason == ChatFinishReason.Length)
                {
                    lastError = chunk.WeekNumber is { } w
                        ? $"Odpowiedź AI dla tygodnia {w} została ucięta limitem długości."
                        : "Odpowiedź AI została ucięta limitem długości.";
                    logger.LogWarning(
                        "Plan import week {Week} attempt {Attempt}/{Max}: truncated (Length). Raw preview: {Raw}",
                        chunk.WeekNumber, attempt + 1, maxAttempts, rawPreview);
                    continue;
                }

                if (PlanImport.TryDeserializeDraft(raw, out var draft, out var parseError))
                    return (chunk, draft, null);

                lastError = chunk.WeekNumber is { } week
                    ? $"Nie udało się odczytać tygodnia {week}."
                    : "AI zwróciło nieczytelny JSON dla fragmentu planu.";
                logger.LogWarning(
                    "Plan import week {Week} attempt {Attempt}/{Max}: parse failed ({ParseError}). Finish={Finish}. Raw preview: {Raw}",
                    chunk.WeekNumber, attempt + 1, maxAttempts, parseError, response.FinishReason, rawPreview);

                if (attempt + 1 >= maxAttempts) break;

                messages.Add(new ChatMessage(ChatRole.Assistant, raw));
                messages.Add(new ChatMessage(
                    ChatRole.User,
                    $"Twój JSON był niepoprawny: {parseError}. Zwróć wyłącznie poprawiony JSON zgodny ze schematem."));
            }

            return (chunk, null, lastError ?? "Nie udało się odczytać fragmentu planu.");
        }

        try
        {
            await Task.WhenAll(chunks.Select(async (chunk, index) =>
            {
                await gate.WaitAsync(ct);
                try
                {
                    parts[index] = await ImportWeekChunkAsync(chunk);
                }
                finally
                {
                    gate.Release();
                }
            }));
        }
        catch (InvalidOperationException ex) when (
            ex.Message.Contains("OpenRouterApiKey", StringComparison.Ordinal)
            || ex.Message == UnavailableChatClient.Message)
        {
            logger.LogWarning(ex, "Plan import AI niedostępny (brak klucza lub stub)");
            return Results.Json(
                new { message = UnavailableChatClient.Message },
                statusCode: 503);
        }
        catch (Exception ex)
        {
            var root = ex is AggregateException ae
                ? ae.Flatten().InnerExceptions.FirstOrDefault() ?? ex
                : ex;
            logger.LogError(root, "Plan import AI call failed");
            return Results.Json(
                new { message = "Nie udało się połączyć z AI. Spróbuj ponownie za chwilę." },
                statusCode: 502);
        }

        var normalized = PlanImport.MergeWeekDrafts(chunks, parts, libTuples);
        if (normalized.Days is null || normalized.Days.Count == 0)
        {
            var msg = normalized.Warnings is { Count: > 0 }
                ? string.Join(" ", normalized.Warnings)
                : "Nie rozpoznano żadnych dni treningowych w tekście.";
            return Results.Json(new { message = msg }, statusCode: 422);
        }

        return Results.Ok(normalized);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/ai/history-import", async (
    HistoryImportRequest input,
    HttpContext http,
    AppDb db,
    IConfiguration config,
    IChatClient chatClient,
    ILoggerFactory loggerFactory,
    CancellationToken ct) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);

        var library = await db.Exercises
            .Where(e => e.TrainerId == null || e.TrainerId == trainerId)
            .OrderBy(e => e.Name)
            .Select(e => new { e.Id, e.Name, e.Type })
            .ToListAsync(ct);
        var libTuples = library.Select(e => (e.Id, e.Name, e.Type)).ToList();
        var logger = loggerFactory.CreateLogger("HistoryImport");
        try
        {
            var (draft, error) = await HistoryImport.ImportAsync(input, libTuples, chatClient, logger, ct);
            if (error is not null) return error;
            return Results.Ok(draft);
        }
        catch (InvalidOperationException ex) when (
            ex.Message.Contains("OpenRouterApiKey", StringComparison.Ordinal)
            || ex.Message == UnavailableChatClient.Message)
        {
            return Results.Json(new { message = UnavailableChatClient.Message }, statusCode: 503);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "History import AI call failed");
            return Results.Json(new { message = "Nie udało się połączyć z AI. Spróbuj ponownie za chwilę." }, statusCode: 502);
        }
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapGet("/api/clients/{id:int}/history-imports/pending", async (int id, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        var row = await db.ClientHistoryImports
            .Where(h => h.ClientId == id && h.Status == "pending")
            .OrderByDescending(h => h.CreatedAt)
            .FirstOrDefaultAsync();
        if (row is null) return Results.NoContent();
        var draft = JsonSerializer.Deserialize<HistoryImportDraft>(row.DraftJson, HistoryImport.JsonOptions);
        return Results.Ok(new { row.Id, draft, createdAt = row.CreatedAt });
    }
    catch (Exception ex) when (IsMissingClientHistoryImportsTable(ex))
    {
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{id:int}/history-imports", async (
    int id, HistoryImportDraft draft, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        var (row, created) = await UpsertPendingHistoryImportAsync(db, id, draft);
        await db.SaveChangesAsync();
        return created
            ? Results.Created($"/api/clients/{id}/history-imports/{row.Id}", new { row.Id })
            : Results.Ok(new { row.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPut("/api/clients/{id:int}/history-imports/{importId:int}", async (
    int id, int importId, HistoryImportDraft draft, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        var row = await db.ClientHistoryImports.FirstOrDefaultAsync(h =>
            h.Id == importId && h.ClientId == id && h.Status == "pending");
        if (row is null) return Results.NotFound();
        row.DraftJson = JsonSerializer.Serialize(draft, HistoryImport.JsonOptions);
        await db.SaveChangesAsync();
        return Results.Ok(new { row.Id });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{id:int}/history-imports/{importId:int}/dismiss", async (
    int id, int importId, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        var row = await db.ClientHistoryImports.FirstOrDefaultAsync(h => h.Id == importId && h.ClientId == id);
        if (row is null) return Results.NotFound();
        row.Status = "dismissed";
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/clients/{id:int}/history-imports/{importId:int}/apply", async (
    int id, int importId, HistoryImportApplyInput input, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, id)) return Results.NotFound();
        var row = await db.ClientHistoryImports.FirstOrDefaultAsync(h => h.Id == importId && h.ClientId == id);
        if (row is null) return Results.NotFound();

        var sessionIds = new List<int>();
        if (input.SaveHistory && input.Sessions is { Count: > 0 })
        {
            foreach (var sess in input.Sessions)
            {
                if ((sess.Exercises ?? []).Any(e => e.ExerciseId <= 0))
                    return Results.BadRequest(new { message = "Każde ćwiczenie musi być w bibliotece — zmapuj albo utwórz brakujące." });
                var built = Sessions.BuildFromInput(sess with { ClientId = id, Status = "completed" });
                foreach (var ex in built.Exercises)
                    foreach (var set in ex.Sets)
                        set.Completed = true;
                db.WorkoutSessions.Add(built);
                await db.SaveChangesAsync();
                sessionIds.Add(built.Id);
            }
        }

        var maxIds = new List<int>();
        if (input.SaveMaxes && input.Maxes is { Count: > 0 })
        {
            foreach (var m in input.Maxes)
            {
                var max = new ClientMax
                {
                    ClientId = id,
                    ExerciseId = m.ExerciseId,
                    MaxKg = m.MaxKg,
                    MeasuredOn = m.MeasuredOn,
                    Note = m.Note ?? "z historii",
                };
                db.ClientMaxes.Add(max);
                await db.SaveChangesAsync();
                maxIds.Add(max.Id);
            }
        }

        row.Status = "applied";
        await db.SaveChangesAsync();
        return Results.Ok(new { sessionIds, maxIds });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

app.MapPost("/api/ai/history-import/analyze", async (
    HistoryImportAnalyzeInput input,
    HttpContext http,
    AppDb db,
    IConfiguration config) =>
{
    try
    {
        await TrainerAccess.TrainerIdAsync(http, db, config);
        var sessions = input.Sessions ?? [];
        if (sessions.Count == 0)
            return Results.BadRequest(new { message = "Brak sesji do analizy." });
        var result = HistoryImport.Analyze(sessions, input.ClientName ?? "klient", input.TopKgDelta);
        return Results.Ok(result);
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

static async Task<(ClientHistoryImport Row, bool Created)> UpsertPendingHistoryImportAsync(
    AppDb db, int clientId, HistoryImportDraft draft)
{
    var json = JsonSerializer.Serialize(draft, HistoryImport.JsonOptions);
    var existing = await db.ClientHistoryImports
        .Where(h => h.ClientId == clientId && h.Status == "pending")
        .OrderByDescending(h => h.CreatedAt)
        .FirstOrDefaultAsync();
    if (existing is not null)
    {
        existing.DraftJson = json;
        return (existing, false);
    }

    var row = new ClientHistoryImport
    {
        ClientId = clientId,
        Status = "pending",
        DraftJson = json,
    };
    db.ClientHistoryImports.Add(row);
    return (row, true);
}

static bool IsMissingClientHistoryImportsTable(Exception ex)
{
    for (var e = (Exception?)ex; e != null; e = e.InnerException)
    {
        if (e.Message.Contains("no such table: ClientHistoryImports", StringComparison.OrdinalIgnoreCase))
            return true;
    }
    return false;
}

app.Run();

// Umożliwia hostowanie aplikacji przez WebApplicationFactory w testach integracyjnych.
public partial class Program { }
