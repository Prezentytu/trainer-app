using System.ClientModel;
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
        o.UseNpgsql(connectionString);
    else
        o.UseSqlite(connectionString);
});

var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:3000"];

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var clerkAuthority = builder.Configuration["Clerk:Authority"];
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
                ValidateAudience = false,
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
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddHttpClient("resend");
builder.Services.AddSingleton<EmailService>();
builder.Services.AddScoped<PushService>();

var app = builder.Build();
app.UseCors();
app.UseRateLimiter();

if (!string.IsNullOrWhiteSpace(clerkAuthority))
{
    app.UseAuthentication();
    app.UseAuthorization();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    if (string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase))
        db.Database.Migrate();
    else
        db.Database.EnsureCreated();
    Seed.Run(db);
}

static async Task<IResult> UnauthorizedTrainer(Exception ex) =>
    Results.Json(new { message = ex.Message }, statusCode: 401);

// ---------- Health / me ----------

app.MapGet("/api/health", async (AppDb db) =>
{
    var utc = DateTime.UtcNow;
    try
    {
        // Lekki ping DB — budzi też Neon autosuspend i wykrywa martwą bazę.
        var canConnect = await db.Database.CanConnectAsync();
        if (!canConnect)
            return Results.Json(new { status = "degraded", utc, database = "unreachable" }, statusCode: 503);
        return Results.Ok(new { status = "ok", utc, database = "ok" });
    }
    catch (Exception)
    {
        return Results.Json(new { status = "degraded", utc, database = "error" }, statusCode: 503);
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

app.MapGet("/api/me", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainer = await TrainerAccess.RequireTrainerAsync(http, db, config);
        return Results.Ok(new { trainer.Id, trainer.Email, trainer.Name, trainer.ClerkUserId, trainer.CreatedAt });
    }
    catch (UnauthorizedAccessException ex) { return await UnauthorizedTrainer(ex); }
});

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

// ---------- Klienci ----------

app.MapGet("/api/clients", async (HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        return Results.Ok(await db.Clients
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
            .ToListAsync());
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

        return Results.Ok(new
        {
            client.Id, client.Name, client.Email, client.Note, client.CreatedAt,
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
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        var client = new Client { TrainerId = trainerId, Name = input.Name, Email = input.Email, Note = input.Note };
        db.Clients.Add(client);
        await db.SaveChangesAsync();
        return Results.Created($"/api/clients/{client.Id}", client);
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
    var topKg = PlanLoads.TopLoadKg(i);
    double? oneRmKg = maxesByExercise is not null && maxesByExercise.TryGetValue(i.ExerciseId, out var rm)
        ? rm
        : null;
    var measure = i.MeasureType ?? i.Exercise!.Type;
    double? itemComputed = null;
    if (i.LoadPercent is not null && oneRmKg is not null)
        itemComputed = PlanLoads.RoundToHalf(oneRmKg.Value * i.LoadPercent.Value / 100.0);
    var effectiveLoad = i.LoadKg ?? itemComputed ?? i.Exercise.DefaultLoadKg;
    return new
    {
        i.Id, i.ExerciseId, i.Order, i.SupersetGroup, i.IsWarmup,
        ExerciseName = i.Exercise!.Name,
        ExerciseType = i.Exercise.Type,
        MeasureType = measure,
        ExerciseDescription = i.Exercise.Description,
        Category = i.Exercise.Category,
        DemoYoutubeId = i.Exercise.Media.FirstOrDefault(m => m.Kind == "demo")?.YoutubeId
            ?? i.Exercise.Media.FirstOrDefault()?.YoutubeId,
        // Efektywne parametry: nadpisanie z planu albo default z ćwiczenia
        Sets = i.Sets ?? i.Exercise.DefaultSets,
        Reps = i.Reps ?? i.Exercise.DefaultReps,
        i.RepsMax,
        RepDurationSeconds = i.RepDurationSeconds ?? (measure == "time" ? i.Exercise.DefaultRepDurationSeconds : null),
        i.RepDurationSecondsMax,
        DistanceMeters = i.DistanceMeters ?? (measure == "distance" ? i.Exercise.DefaultDistanceMeters : null),
        i.Tempo,
        i.TargetRpe,
        i.TargetRir,
        i.SetScheme,
        RestBetweenSetsSeconds = i.RestBetweenSetsSeconds ?? i.Exercise.DefaultRestBetweenSetsSeconds,
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
            d.Id, d.WeekNumber, d.Order, d.Label, d.Notes,
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
    DistanceMeters = i.DistanceMeters, Tempo = i.Tempo, TargetRpe = i.TargetRpe, TargetRir = i.TargetRir, SetScheme = i.SetScheme,
    RestBetweenSetsSeconds = i.RestBetweenSetsSeconds, RestAfterExerciseSeconds = i.RestAfterExerciseSeconds ?? 90,
    LoadKg = i.LoadKg, LoadPercent = i.LoadPercent, Notes = i.Notes,
    PrescribedSets = (i.PrescribedSets ?? []).Select(BuildSet).ToList(),
};

static PlanDay BuildDay(PlanDayInput d) => new()
{
    WeekNumber = d.WeekNumber, Order = d.Order, Label = d.Label, Notes = d.Notes,
    Items = (d.Items ?? []).Select(BuildItem).ToList(),
};

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
                s.PerformedOn,
                s.DurationSeconds,
                s.Note,
                s.Status,
                s.CreatedAt,
                TotalSets = s.Exercises.SelectMany(e => e.Sets).Count(x => !x.IsWarmup),
                TotalVolumeKg = s.Exercises.SelectMany(e => e.Sets)
                    .Where(x => !x.IsWarmup && x.WeightKg != null && x.Reps != null)
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

        var best = new Dictionary<(int ClientId, int ExerciseId), double>();
        var allPrs = new List<object>();
        var prsLast7Days = 0;
        foreach (var row in allSets)
        {
            var e1 = Stats.Epley1Rm(row.WeightKg, row.Reps);
            if (e1 is null) continue;
            var key = (row.ClientId, row.ExerciseId);
            if (!best.TryGetValue(key, out var prev) || e1.Value > prev + 0.01)
            {
                best[key] = e1.Value;
                allPrs.Add(new
                {
                    clientId = row.ClientId,
                    clientName = row.ClientName,
                    exerciseId = row.ExerciseId,
                    exerciseName = row.ExerciseName,
                    estimated1Rm = e1.Value,
                    weightKg = row.WeightKg,
                    reps = row.Reps,
                    performedOn = row.PerformedOn,
                });
                if (row.PerformedOn >= weekStart && row.PerformedOn <= today)
                    prsLast7Days++;
            }
        }
        var recentPrs = allPrs.AsEnumerable().Reverse().Take(6).ToList();

        var attention = await ChurnRadar.BuildAttentionAsync(db, trainerId);

        return Results.Ok(new
        {
            clients,
            plans,
            exercises,
            recentSessions,
            recentPrs,
            attention,
            clientActivity,
            sessionsLast7Days,
            sessionsPrev7Days,
            prsLast7Days,
        });
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
        db.PlanDays.RemoveRange(plan.Days);   // kaskada usuwa pozycje i serie
        plan.Days = (input.Days ?? []).Select(BuildDay).ToList();
        await db.SaveChangesAsync();
        return Results.Ok(new { plan.Id });
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
            WeekNumber = d.WeekNumber, Order = d.Order, Label = d.Label, Notes = d.Notes,
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

// ---------- Sesje treningowe ----------

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
                    .Where(x => !x.IsWarmup && x.WeightKg != null && x.Reps != null)
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

app.MapGet("/api/clients/{clientId:int}/most-improved", async (
    int clientId, int? days, HttpContext http, AppDb db, IConfiguration config) =>
{
    try
    {
        var trainerId = await TrainerAccess.TrainerIdAsync(http, db, config);
        if (!await TrainerAccess.OwnsClientAsync(db, trainerId, clientId)) return Results.NotFound();
        var row = await ProgressReports.MostImprovedAsync(db, clientId, days ?? 90);
        return Results.Ok(row);
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
                    && s.WeightKg != null
                    && s.Reps != null)
        .Select(s => new
        {
            ExerciseId = s.LoggedExercise!.ExerciseId,
            ExerciseName = s.LoggedExercise.Exercise!.Name,
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
                .Select(s => new { Set = s, E1 = Stats.Epley1Rm(s.WeightKg, s.Reps)!.Value })
                .OrderByDescending(x => x.E1)
                .ThenByDescending(x => x.Set.PerformedOn)
                .First();
            return new
            {
                exerciseId = g.Key,
                exerciseName = best.Set.ExerciseName ?? "",
                estimated1Rm = best.E1,
                weightKg = best.Set.WeightKg,
                reps = best.Set.Reps,
                performedOn = best.Set.PerformedOn,
                sessionId = best.Set.SessionId,
            };
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
        return Results.Ok(new
        {
            assignmentId = assignment.Id,
            planId = assignment.PlanId,
            planName = assignment.Plan.Name,
            completed,
            total,
            percent,
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

app.MapGet("/api/portal/{token}", async (string token, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access?.Client is null) return Results.NotFound(new { message = "Link jest nieaktualny." });

    var assignment = await db.Assignments
        .Include(a => a.Plan!)
        .Where(a => a.ClientId == access.ClientId && a.Status == "active")
        .OrderByDescending(a => a.CreatedAt)
        .FirstOrDefaultAsync();

    var completedDayIds = assignment is null
        ? new HashSet<int>()
        : (await db.WorkoutSessions
            .Where(s => s.ClientId == access.ClientId && s.AssignmentId == assignment.Id && s.Status == "completed" && s.PlanDayId != null)
            .Select(s => s.PlanDayId!.Value)
            .ToListAsync()).ToHashSet();

    var inProgress = await db.WorkoutSessions
        .Where(s => s.ClientId == access.ClientId && s.Status == "in_progress")
        .OrderByDescending(s => s.Id)
        .Select(s => new { s.Id, s.PlanDayId, s.PerformedOn })
        .FirstOrDefaultAsync();

    object? today = null;
    object? week = null;
    if (assignment?.Plan is not null)
    {
        var days = await db.PlanDays
            .Where(d => d.PlanId == assignment.PlanId)
            .OrderBy(d => d.WeekNumber)
            .ThenBy(d => d.Order)
            .Select(d => new { d.Id, d.WeekNumber, d.Order, d.Label, d.Notes })
            .ToListAsync();

        var nextMeta = days.FirstOrDefault(d => !completedDayIds.Contains(d.Id)) ?? days.LastOrDefault();
        week = days.Select(d => new
        {
            d.Id, d.WeekNumber, d.Order, d.Label,
            completed = completedDayIds.Contains(d.Id),
            isToday = nextMeta != null && d.Id == nextMeta.Id,
        }).ToList();

        if (nextMeta is not null)
        {
            var next = await db.PlanDays
                .Include(d => d.Items).ThenInclude(i => i.Exercise)
                .Include(d => d.Items).ThenInclude(i => i.PrescribedSets)
                .FirstAsync(d => d.Id == nextMeta.Id);
            var maxes = await PlanLoads.LatestMaxesAsync(db, access.ClientId);
            today = new
            {
                assignmentId = assignment.Id,
                planId = assignment.PlanId,
                planName = assignment.Plan.Name,
                day = new
                {
                    next.Id, next.WeekNumber, next.Order, next.Label, next.Notes,
                    Items = next.Items.OrderBy(i => i.Order).Select(i => ItemToDto(i, maxes)),
                },
                completed = completedDayIds.Count,
                total = days.Count,
                percent = days.Count > 0
                    ? (int)Math.Round(100.0 * Math.Min(completedDayIds.Count, days.Count) / days.Count)
                    : 0,
            };
        }
    }

    return Results.Ok(new
    {
        client = new { access.Client.Id, access.Client.Name },
        today,
        week,
        inProgressSession = inProgress,
    });
});

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
                .Where(x => !x.IsWarmup && x.WeightKg != null && x.Reps != null)
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

    var best = new Dictionary<int, double>();
    var prsBySession = new Dictionary<int, List<object>>();
    foreach (var row in workingSets
        .OrderBy(x => x.PerformedOn)
        .ThenBy(x => x.SessionId)
        .ThenBy(x => x.SetNumber))
    {
        var e1 = Stats.Epley1Rm(row.WeightKg, row.Reps);
        if (e1 is null) continue;
        if (!best.TryGetValue(row.ExerciseId, out var prev) || e1.Value > prev + 0.01)
        {
            best[row.ExerciseId] = e1.Value;
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
                estimated1Rm = e1.Value,
            });
        }
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
});

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
    return Results.Ok(row);
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
    await db.SaveChangesAsync();
    return Results.Created($"/api/portal/{token}/measurements/{row.Id}", new { row.Id });
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
    return Results.Ok(new { existing.Id, existing.Date, existing.MoodScore, existing.SleepScore, existing.Note, existing.CreatedAt });
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
});

app.MapPost("/api/portal/{token}/sessions/start", async (string token, StartSessionInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    input = input with { ClientId = access.ClientId };
    var (session, error) = await Sessions.StartAsync(db, input, requireDayOwnedByClient: true);
    if (error is not null) return error;
    return Results.Created($"/api/portal/{token}/sessions/{session!.Id}", await Sessions.LoadDto(db, session.Id));
});

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
    await db.SaveChangesAsync();
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
});

app.MapPatch("/api/portal/{token}/sessions/{id:int}/complete", async (string token, int id, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    await Sessions.CompleteAsync(db, session);
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
});

app.MapPost("/api/portal/{token}/sessions/{id:int}/comment", async (string token, int id, SessionCommentInput input, AppDb db) =>
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
    await db.SaveChangesAsync();
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
});

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
        catch (InvalidOperationException ex) when (ex.Message.Contains("OpenRouterApiKey", StringComparison.Ordinal))
        {
            return Results.Json(new { message = ex.Message }, statusCode: 503);
        }
        catch (Exception ex)
        {
            var root = ex is AggregateException ae
                ? ae.Flatten().InnerExceptions.FirstOrDefault() ?? ex
                : ex;
            logger.LogError(root, "Plan import AI call failed");
            return Results.Json(
                new { message = $"Nie udało się połączyć z AI: {root.Message}" },
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

app.Run();

// Umożliwia hostowanie aplikacji przez WebApplicationFactory w testach integracyjnych.
public partial class Program { }
