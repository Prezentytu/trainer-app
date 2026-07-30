using Microsoft.EntityFrameworkCore;
using TrainerApp.Api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDb>(o => o.UseSqlite("Data Source=trainer.db"));
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    db.Database.EnsureCreated();
    Seed.Run(db);
}

// ---------- Klienci ----------

app.MapGet("/api/clients", async (AppDb db) =>
    await db.Clients
        .OrderBy(c => c.Name)
        .Select(c => new
        {
            c.Id, c.Name, c.Email, c.Note, c.CreatedAt,
            ActivePlans = c.Assignments.Count(a => a.Status == "active"),
        })
        .ToListAsync());

app.MapGet("/api/clients/{id:int}", async (int id, AppDb db) =>
{
    var client = await db.Clients
        .Include(c => c.Assignments).ThenInclude(a => a.Plan)
        .FirstOrDefaultAsync(c => c.Id == id);
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
});

app.MapPost("/api/clients", async (ClientInput input, AppDb db) =>
{
    var client = new Client { Name = input.Name, Email = input.Email, Note = input.Note };
    db.Clients.Add(client);
    await db.SaveChangesAsync();
    return Results.Created($"/api/clients/{client.Id}", client);
});

app.MapPut("/api/clients/{id:int}", async (int id, ClientInput input, AppDb db) =>
{
    var client = await db.Clients.FindAsync(id);
    if (client is null) return Results.NotFound();
    client.Name = input.Name;
    client.Email = input.Email;
    client.Note = input.Note;
    await db.SaveChangesAsync();
    return Results.Ok(client);
});

app.MapDelete("/api/clients/{id:int}", async (int id, AppDb db) =>
{
    var client = await db.Clients.FindAsync(id);
    if (client is null) return Results.NotFound();
    db.Clients.Remove(client);
    await db.SaveChangesAsync();
    return Results.NoContent();
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

app.MapGet("/api/exercises", async (AppDb db) =>
    await db.Exercises.OrderBy(e => e.Name).ToListAsync());

app.MapGet("/api/exercises/{id:int}", async (int id, AppDb db) =>
{
    var exercise = await db.Exercises.FindAsync(id);
    return exercise is null ? Results.NotFound() : Results.Ok(exercise);
});

app.MapPost("/api/exercises", async (ExerciseInput input, AppDb db) =>
{
    var name = NormalizeExerciseName(input.Name);
    if (name.Length == 0) return Results.BadRequest(new { message = "Podaj nazwę ćwiczenia." });
    var duplicate = await db.Exercises.AnyAsync(e => e.Name.ToLower() == name.ToLower());
    if (duplicate) return Results.Conflict(new { message = $"Ćwiczenie „{name}” już jest w bibliotece." });

    var exercise = new Exercise();
    ApplyExerciseInput(exercise, input, name);
    db.Exercises.Add(exercise);
    await db.SaveChangesAsync();
    return Results.Created($"/api/exercises/{exercise.Id}", exercise);
});

app.MapPut("/api/exercises/{id:int}", async (int id, ExerciseInput input, AppDb db) =>
{
    var exercise = await db.Exercises.FindAsync(id);
    if (exercise is null) return Results.NotFound();

    var name = NormalizeExerciseName(input.Name);
    if (name.Length == 0) return Results.BadRequest(new { message = "Podaj nazwę ćwiczenia." });
    var duplicate = await db.Exercises.AnyAsync(e => e.Id != id && e.Name.ToLower() == name.ToLower());
    if (duplicate) return Results.Conflict(new { message = $"Ćwiczenie „{name}” już jest w bibliotece." });

    ApplyExerciseInput(exercise, input, name);
    await db.SaveChangesAsync();
    return Results.Ok(exercise);
});

app.MapDelete("/api/exercises/{id:int}", async (int id, AppDb db) =>
{
    var used = await db.PlanItems.AnyAsync(i => i.ExerciseId == id);
    if (used) return Results.Conflict(new { message = "Ćwiczenie jest używane w planie — najpierw usuń je z planów." });
    var hasMaxes = await db.ClientMaxes.AnyAsync(m => m.ExerciseId == id);
    if (hasMaxes) return Results.Conflict(new { message = "Ćwiczenie ma zapisane maxy klientów — najpierw je usuń." });
    var hasLogs = await db.LoggedExercises.AnyAsync(e => e.ExerciseId == id);
    if (hasLogs) return Results.Conflict(new { message = "Ćwiczenie ma historię treningów — nie można go usunąć." });
    var exercise = await db.Exercises.FindAsync(id);
    if (exercise is null) return Results.NotFound();
    db.Exercises.Remove(exercise);
    await db.SaveChangesAsync();
    return Results.NoContent();
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

app.MapGet("/api/plans", async (AppDb db) =>
    await db.Plans
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

app.MapGet("/api/counts", async (AppDb db) => new
{
    clients = await db.Clients.CountAsync(),
    plans = await db.Plans.CountAsync(),
    exercises = await db.Exercises.CountAsync(),
});

app.MapGet("/api/dashboard", async (AppDb db) =>
{
    var clients = await db.Clients.CountAsync();
    var plans = await db.Plans.CountAsync();
    var exercises = await db.Exercises.CountAsync();

    var recentSessions = await db.WorkoutSessions
        .Where(s => s.Status == "completed")
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

    // Ostatnie PR-y: skan ograniczony (200 serii), chronologicznie → nowy best e1RM.
    var recentSets = await db.LoggedSets
        .Where(s => !s.IsWarmup
                    && s.WeightKg != null
                    && s.Reps != null
                    && s.LoggedExercise!.Session!.Status == "completed")
        .OrderByDescending(s => s.LoggedExercise!.Session!.PerformedOn)
        .ThenByDescending(s => s.Id)
        .Take(200)
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
    var recentPrs = new List<object>();
    foreach (var row in recentSets
        .OrderBy(x => x.PerformedOn)
        .ThenBy(x => x.SessionId))
    {
        var e1 = Stats.Epley1Rm(row.WeightKg, row.Reps);
        if (e1 is null) continue;
        var key = (row.ClientId, row.ExerciseId);
        if (!best.TryGetValue(key, out var prev) || e1.Value > prev + 0.01)
        {
            best[key] = e1.Value;
            recentPrs.Add(new
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
        }
    }
    recentPrs.Reverse();
    if (recentPrs.Count > 6) recentPrs = recentPrs.Take(6).ToList();

    return Results.Ok(new
    {
        clients,
        plans,
        exercises,
        recentSessions,
        recentPrs,
    });
});

app.MapGet("/api/plans/{id:int}", async (int id, int? clientId, AppDb db) =>
{
    var plan = await db.Plans
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.Exercise)
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
        .Include(p => p.Assignments)
        .FirstOrDefaultAsync(p => p.Id == id);
    if (plan is null) return Results.NotFound();
    Dictionary<int, double>? maxes = null;
    if (clientId is not null)
        maxes = await PlanLoads.LatestMaxesAsync(db, clientId.Value);
    return Results.Ok(PlanToDto(plan, maxes));
});

app.MapPost("/api/plans", async (PlanInput input, AppDb db) =>
{
    var plan = new Plan
    {
        Name = input.Name,
        Description = input.Description,
        IsTemplate = input.IsTemplate,
        Days = (input.Days ?? []).Select(BuildDay).ToList(),
    };
    db.Plans.Add(plan);
    await db.SaveChangesAsync();
    return Results.Created($"/api/plans/{plan.Id}", new { plan.Id });
});

app.MapPut("/api/plans/{id:int}", async (int id, PlanInput input, AppDb db) =>
{
    var plan = await db.Plans.Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
        .FirstOrDefaultAsync(p => p.Id == id);
    if (plan is null) return Results.NotFound();

    plan.Name = input.Name;
    plan.Description = input.Description;
    plan.IsTemplate = input.IsTemplate;
    db.PlanDays.RemoveRange(plan.Days);   // kaskada usuwa pozycje i serie
    plan.Days = (input.Days ?? []).Select(BuildDay).ToList();
    await db.SaveChangesAsync();
    return Results.Ok(new { plan.Id });
});

app.MapPost("/api/plans/{id:int}/duplicate", async (int id, DuplicateInput input, AppDb db) =>
{
    var source = await db.Plans
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
        .FirstOrDefaultAsync(p => p.Id == id);
    if (source is null) return Results.NotFound();

    var copy = new Plan
    {
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
});

app.MapDelete("/api/plans/{id:int}", async (int id, AppDb db) =>
{
    var plan = await db.Plans.FindAsync(id);
    if (plan is null) return Results.NotFound();
    db.Plans.Remove(plan);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---------- Maxy klienta ----------

app.MapGet("/api/clients/{clientId:int}/maxes", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
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
});

app.MapPost("/api/clients/{clientId:int}/maxes", async (int clientId, ClientMaxInput input, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
    if (!await db.Exercises.AnyAsync(e => e.Id == input.ExerciseId)) return Results.NotFound();
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
});

app.MapDelete("/api/maxes/{id:int}", async (int id, AppDb db) =>
{
    var row = await db.ClientMaxes.FindAsync(id);
    if (row is null) return Results.NotFound();
    db.ClientMaxes.Remove(row);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---------- Sesje treningowe ----------

app.MapGet("/api/clients/{clientId:int}/sessions", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
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
});

app.MapGet("/api/sessions/{id:int}", async (int id, AppDb db) =>
{
    var dto = await Sessions.LoadDto(db, id);
    return dto is null ? Results.NotFound() : Results.Ok(dto);
});

app.MapPost("/api/sessions/start", async (StartSessionInput input, AppDb db) =>
{
    var (session, error) = await Sessions.StartAsync(db, input);
    if (error is not null) return error;
    var dto = await Sessions.LoadDto(db, session!.Id);
    return Results.Created($"/api/sessions/{session.Id}", dto);
});

app.MapPost("/api/sessions", async (WorkoutSessionInput input, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == input.ClientId)) return Results.NotFound();
    var session = Sessions.BuildFromInput(input);
    db.WorkoutSessions.Add(session);
    await db.SaveChangesAsync();
    var dto = await Sessions.LoadDto(db, session.Id);
    return Results.Created($"/api/sessions/{session.Id}", dto);
});

app.MapPut("/api/sessions/{id:int}", async (int id, WorkoutSessionInput input, AppDb db) =>
{
    var session = await db.WorkoutSessions
        .Include(s => s.Exercises).ThenInclude(e => e.Sets)
        .FirstOrDefaultAsync(s => s.Id == id);
    if (session is null) return Results.NotFound();
    if (session.ClientId != input.ClientId) return Results.NotFound();

    Sessions.ApplyUpdate(db, session, input);
    await db.SaveChangesAsync();
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
});

app.MapPatch("/api/sessions/{id:int}/complete", async (int id, AppDb db) =>
{
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null) return Results.NotFound();
    await Sessions.CompleteAsync(db, session);
    return Results.Ok(await Sessions.LoadDto(db, session.Id));
});

app.MapDelete("/api/sessions/{id:int}", async (int id, AppDb db) =>
{
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null) return Results.NotFound();
    db.WorkoutSessions.Remove(session);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/api/clients/{clientId:int}/exercises/{exerciseId:int}/stats", async (int clientId, int exerciseId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
    var sets = await db.LoggedSets
        .Include(s => s.LoggedExercise).ThenInclude(e => e!.Session)
        .Where(s => s.LoggedExercise!.Session!.ClientId == clientId
                    && s.LoggedExercise.ExerciseId == exerciseId
                    && s.LoggedExercise.Session.Status == "completed"
                    && !s.IsWarmup)
        .ToListAsync();

    var with1Rm = sets
        .Select(s => new
        {
            s,
            E1 = Stats.Epley1Rm(s.WeightKg, s.Reps),
            Date = s.LoggedExercise!.Session!.PerformedOn,
        })
        .Where(x => x.E1 is not null)
        .OrderBy(x => x.Date)
        .ToList();

    var estimated1Rm = with1Rm.Select(x => x.E1!.Value).DefaultIfEmpty(0).Max();
    var maxWeight = sets.Where(s => s.WeightKg is not null).OrderByDescending(s => s.WeightKg).FirstOrDefault();
    var bySession = sets.GroupBy(s => s.LoggedExercise!.WorkoutSessionId)
        .Select(g => new
        {
            Date = g.First().LoggedExercise!.Session!.PerformedOn,
            Volume = Stats.VolumeKg(g),
        })
        .OrderByDescending(x => x.Volume)
        .FirstOrDefault();

    var repMaxes = sets
        .Where(s => s.Reps is not null && s.WeightKg is not null)
        .GroupBy(s => s.Reps!.Value)
        .Select(g => new { reps = g.Key, weightKg = g.Max(x => x.WeightKg!.Value) })
        .OrderBy(x => x.reps)
        .ToList();

    var trend = with1Rm
        .GroupBy(x => x.Date)
        .Select(g => new { date = g.Key, estimated1Rm = g.Max(x => x.E1!.Value) })
        .OrderBy(x => x.date)
        .ToList();

    return Results.Ok(new
    {
        clientId,
        exerciseId,
        estimated1Rm = estimated1Rm > 0 ? estimated1Rm : (double?)null,
        maxWeightKg = maxWeight?.WeightKg,
        maxWeightDate = maxWeight?.LoggedExercise?.Session?.PerformedOn,
        maxVolumeKg = bySession?.Volume,
        maxVolumeDate = bySession?.Date,
        repMaxes,
        trend,
    });
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

app.MapGet("/api/clients/{clientId:int}/records", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
    return Results.Ok(await LoadClientRecordsAsync(db, clientId));
});

app.MapGet("/api/clients/{clientId:int}/progress", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
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
});

// ---------- Token dostępu klienta (magic-link) ----------

app.MapGet("/api/clients/{clientId:int}/access-token", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
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
});

app.MapPost("/api/clients/{clientId:int}/access-token/rotate", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
    var old = await db.ClientAccessTokens.Where(t => t.ClientId == clientId).ToListAsync();
    db.ClientAccessTokens.RemoveRange(old);
    var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
        .Replace("+", "").Replace("/", "").Replace("=", "");
    var row = new ClientAccessToken { ClientId = clientId, Token = token };
    db.ClientAccessTokens.Add(row);
    await db.SaveChangesAsync();
    return Results.Ok(new { row.Token, row.CreatedAt, row.ExpiresAt });
});

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
});

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

// ---------- Przypisania ----------

app.MapGet("/api/assignments", async (AppDb db) =>
    await db.Assignments
        .OrderByDescending(a => a.CreatedAt)
        .Select(a => new
        {
            a.Id, a.PlanId, a.ClientId, a.StartDate, a.Status, a.Note, a.CreatedAt,
            PlanName = a.Plan!.Name,
            ClientName = a.Client!.Name,
        })
        .ToListAsync());

app.MapPost("/api/assignments", async (AssignmentInput input, AppDb db) =>
{
    var planExists = await db.Plans.AnyAsync(p => p.Id == input.PlanId);
    var clientExists = await db.Clients.AnyAsync(c => c.Id == input.ClientId);
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
});

app.MapPatch("/api/assignments/{id:int}/status", async (int id, StatusInput input, AppDb db) =>
{
    var assignment = await db.Assignments.FindAsync(id);
    if (assignment is null) return Results.NotFound();
    assignment.Status = input.Status;
    await db.SaveChangesAsync();
    return Results.Ok(new { assignment.Id, assignment.Status });
});

app.MapDelete("/api/assignments/{id:int}", async (int id, AppDb db) =>
{
    var assignment = await db.Assignments.FindAsync(id);
    if (assignment is null) return Results.NotFound();
    db.Assignments.Remove(assignment);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

// Umożliwia hostowanie aplikacji przez WebApplicationFactory w testach integracyjnych.
public partial class Program { }
