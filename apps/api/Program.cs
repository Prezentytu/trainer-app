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

// Zaokrąglenie do 0,5 kg (najmniejszy talerzyk).
static string NormalizeExerciseName(string? name) =>
    string.IsNullOrWhiteSpace(name) ? "" : string.Join(' ', name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));

static double RoundToHalf(double kg) => Math.Round(kg * 2, MidpointRounding.AwayFromZero) / 2;

// Ciężar bazowy „top" dla pozycji: seria top/ramp, potem ciężar pozycji, potem najcięższa seria, potem default ćwiczenia.
static double? TopLoadKg(PlanItem item)
{
    var byRole = item.PrescribedSets.FirstOrDefault(s => s.Role is "top" or "ramp" && s.LoadKg is not null)?.LoadKg;
    if (byRole is not null) return byRole;
    if (item.LoadKg is not null) return item.LoadKg;
    var maxSet = item.PrescribedSets.Where(s => s.LoadKg is not null).Select(s => s.LoadKg!.Value);
    if (maxSet.Any()) return maxSet.Max();
    return item.Exercise?.DefaultLoadKg;
}

// Wyliczony ciężar serii: bezwzględny, % od topu, albo % 1RM klienta.
static double? ComputedSetLoad(PlanSet set, double? topKg, double? oneRmKg)
{
    if (set.LoadKg is not null) return set.LoadKg;
    if (set.LoadPercent is not null && set.PercentOf == "top" && topKg is not null)
        return RoundToHalf(topKg.Value * set.LoadPercent.Value / 100.0);
    if (set.LoadPercent is not null && set.PercentOf == "1rm" && oneRmKg is not null)
        return RoundToHalf(oneRmKg.Value * set.LoadPercent.Value / 100.0);
    return null;
}

static object ItemToDto(PlanItem i, IReadOnlyDictionary<int, double>? maxesByExercise = null)
{
    var topKg = TopLoadKg(i);
    double? oneRmKg = maxesByExercise is not null && maxesByExercise.TryGetValue(i.ExerciseId, out var rm)
        ? rm
        : null;
    var measure = i.MeasureType ?? i.Exercise!.Type;
    double? itemComputed = null;
    if (i.LoadPercent is not null && oneRmKg is not null)
        itemComputed = RoundToHalf(oneRmKg.Value * i.LoadPercent.Value / 100.0);
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
            ComputedLoadKg = ComputedSetLoad(s, topKg, oneRmKg),
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

static async Task<Dictionary<int, double>> LatestMaxesAsync(AppDb db, int clientId)
{
    var rows = await db.ClientMaxes
        .Where(m => m.ClientId == clientId)
        .OrderByDescending(m => m.MeasuredOn)
        .ThenByDescending(m => m.Id)
        .ToListAsync();
    var map = new Dictionary<int, double>();
    foreach (var m in rows)
    {
        if (!map.ContainsKey(m.ExerciseId))
            map[m.ExerciseId] = m.MaxKg;
    }
    return map;
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
{
    var plans = await db.Plans
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.Exercise)
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
        .Include(p => p.Assignments)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();
    return plans.Select(p => PlanToDto(p));
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
        maxes = await LatestMaxesAsync(db, clientId.Value);
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

static WorkoutSession BuildSession(WorkoutSessionInput input) => new()
{
    ClientId = input.ClientId,
    AssignmentId = input.AssignmentId,
    PlanDayId = input.PlanDayId,
    PlanId = input.PlanId,
    PerformedOn = input.PerformedOn,
    DurationSeconds = input.DurationSeconds,
    Note = input.Note,
    Status = string.IsNullOrWhiteSpace(input.Status) ? "completed" : input.Status,
    Exercises = (input.Exercises ?? []).Select(e => new LoggedExercise
    {
        ExerciseId = e.ExerciseId,
        Order = e.Order,
        Note = e.Note,
        Sets = (e.Sets ?? []).Select(s => new LoggedSet
        {
            SetNumber = s.SetNumber,
            WeightKg = s.WeightKg,
            Reps = s.Reps,
            DurationSeconds = s.DurationSeconds,
            DistanceMeters = s.DistanceMeters,
            Rir = s.Rir,
            Rpe = s.Rpe,
            IsWarmup = s.IsWarmup,
        }).ToList(),
    }).ToList(),
};

static async Task<object?> LoadSessionDto(AppDb db, int id)
{
    var session = await db.WorkoutSessions
        .Include(s => s.Plan)
        .Include(s => s.PlanDay)
        .Include(s => s.Exercises).ThenInclude(e => e.Exercise)
        .Include(s => s.Exercises).ThenInclude(e => e.Sets)
        .FirstOrDefaultAsync(s => s.Id == id);
    if (session is null) return null;

    var historical = await db.LoggedSets
        .Include(s => s.LoggedExercise).ThenInclude(e => e!.Session)
        .Where(s => s.LoggedExercise!.Session!.ClientId == session.ClientId
                    && s.LoggedExercise.Session.Id != session.Id
                    && (s.LoggedExercise.Session.PerformedOn < session.PerformedOn
                        || (s.LoggedExercise.Session.PerformedOn == session.PerformedOn
                            && s.LoggedExercise.Session.Id < session.Id)))
        .ToListAsync();
    var prs = Stats.FindPrSets(session, historical);
    return Stats.SessionDetail(session, prs);
}

app.MapGet("/api/clients/{clientId:int}/sessions", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
    var sessions = await db.WorkoutSessions
        .Where(s => s.ClientId == clientId)
        .Include(s => s.Plan)
        .Include(s => s.PlanDay)
        .Include(s => s.Exercises).ThenInclude(e => e.Sets)
        .OrderByDescending(s => s.PerformedOn)
        .ThenByDescending(s => s.Id)
        .ToListAsync();
    return Results.Ok(sessions.Select(Stats.SessionSummary));
});

app.MapGet("/api/sessions/{id:int}", async (int id, AppDb db) =>
{
    var dto = await LoadSessionDto(db, id);
    return dto is null ? Results.NotFound() : Results.Ok(dto);
});

app.MapPost("/api/sessions/start", async (StartSessionInput input, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == input.ClientId)) return Results.NotFound();

    PlanDay? day = null;
    if (input.PlanDayId is not null)
    {
        day = await db.PlanDays
            .Include(d => d.Items).ThenInclude(i => i.Exercise)
            .Include(d => d.Items).ThenInclude(i => i.PrescribedSets)
            .FirstOrDefaultAsync(d => d.Id == input.PlanDayId);
        if (day is null) return Results.NotFound();
    }

    var maxes = await LatestMaxesAsync(db, input.ClientId);
    var session = new WorkoutSession
    {
        ClientId = input.ClientId,
        AssignmentId = input.AssignmentId,
        PlanDayId = input.PlanDayId,
        PlanId = input.PlanId ?? day?.PlanId,
        PerformedOn = input.PerformedOn ?? DateOnly.FromDateTime(DateTime.UtcNow),
        Status = "in_progress",
    };

    if (day is not null)
    {
        var order = 0;
        foreach (var item in day.Items.OrderBy(i => i.Order))
        {
            maxes.TryGetValue(item.ExerciseId, out var oneRm);
            var topKg = TopLoadKg(item);
            var logged = new LoggedExercise
            {
                ExerciseId = item.ExerciseId,
                Order = order++,
                Note = item.Notes,
            };
            if (item.PrescribedSets.Count > 0)
            {
                foreach (var s in item.PrescribedSets.OrderBy(x => x.Order))
                {
                    logged.Sets.Add(new LoggedSet
                    {
                        SetNumber = s.Order,
                        WeightKg = ComputedSetLoad(s, topKg, oneRm > 0 ? oneRm : null) ?? s.LoadKg,
                        Reps = s.Reps,
                        DurationSeconds = s.DurationSeconds,
                        DistanceMeters = s.DistanceMeters,
                        Rir = s.TargetRir,
                        Rpe = s.TargetRpe,
                        IsWarmup = s.Role == "warmup" || item.IsWarmup,
                    });
                }
            }
            else
            {
                var sets = item.Sets ?? item.Exercise?.DefaultSets ?? 3;
                var load = item.LoadKg
                    ?? (item.LoadPercent is not null && oneRm > 0
                        ? RoundToHalf(oneRm * item.LoadPercent.Value / 100.0)
                        : item.Exercise?.DefaultLoadKg);
                var measure = item.MeasureType ?? item.Exercise?.Type ?? "reps";
                for (var n = 1; n <= sets; n++)
                {
                    logged.Sets.Add(new LoggedSet
                    {
                        SetNumber = n,
                        WeightKg = measure == "reps" ? load : null,
                        Reps = measure == "reps" ? (item.Reps ?? item.Exercise?.DefaultReps) : null,
                        DurationSeconds = measure == "time"
                            ? (item.RepDurationSeconds ?? item.Exercise?.DefaultRepDurationSeconds)
                            : null,
                        DistanceMeters = measure == "distance"
                            ? (item.DistanceMeters ?? item.Exercise?.DefaultDistanceMeters)
                            : null,
                        Rir = item.TargetRir,
                        Rpe = item.TargetRpe,
                        IsWarmup = item.IsWarmup,
                    });
                }
            }
            session.Exercises.Add(logged);
        }
    }

    db.WorkoutSessions.Add(session);
    await db.SaveChangesAsync();
    var dto = await LoadSessionDto(db, session.Id);
    return Results.Created($"/api/sessions/{session.Id}", dto);
});

app.MapPost("/api/sessions", async (WorkoutSessionInput input, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == input.ClientId)) return Results.NotFound();
    var session = BuildSession(input);
    db.WorkoutSessions.Add(session);
    await db.SaveChangesAsync();
    var dto = await LoadSessionDto(db, session.Id);
    return Results.Created($"/api/sessions/{session.Id}", dto);
});

app.MapPut("/api/sessions/{id:int}", async (int id, WorkoutSessionInput input, AppDb db) =>
{
    var session = await db.WorkoutSessions
        .Include(s => s.Exercises).ThenInclude(e => e.Sets)
        .FirstOrDefaultAsync(s => s.Id == id);
    if (session is null) return Results.NotFound();

    session.ClientId = input.ClientId;
    session.AssignmentId = input.AssignmentId;
    session.PlanDayId = input.PlanDayId;
    session.PlanId = input.PlanId;
    session.PerformedOn = input.PerformedOn;
    session.DurationSeconds = input.DurationSeconds;
    session.Note = input.Note;
    session.Status = string.IsNullOrWhiteSpace(input.Status) ? session.Status : input.Status;
    db.LoggedExercises.RemoveRange(session.Exercises);
    session.Exercises = BuildSession(input).Exercises;
    await db.SaveChangesAsync();
    return Results.Ok(await LoadSessionDto(db, session.Id));
});

app.MapPatch("/api/sessions/{id:int}/complete", async (int id, AppDb db) =>
{
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null) return Results.NotFound();
    session.Status = "completed";
    if (session.DurationSeconds is null)
        session.DurationSeconds = (int)Math.Max(60, (DateTime.UtcNow - session.CreatedAt).TotalSeconds);
    await db.SaveChangesAsync();
    return Results.Ok(await LoadSessionDto(db, session.Id));
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

app.MapGet("/api/clients/{clientId:int}/records", async (int clientId, AppDb db) =>
{
    if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return Results.NotFound();
    var sets = await db.LoggedSets
        .Include(s => s.LoggedExercise).ThenInclude(e => e!.Exercise)
        .Include(s => s.LoggedExercise).ThenInclude(e => e!.Session)
        .Where(s => s.LoggedExercise!.Session!.ClientId == clientId
                    && s.LoggedExercise.Session.Status == "completed"
                    && !s.IsWarmup
                    && s.WeightKg != null
                    && s.Reps != null)
        .ToListAsync();

    var records = sets
        .GroupBy(s => s.LoggedExercise!.ExerciseId)
        .Select(g =>
        {
            var best = g
                .Select(s => new { Set = s, E1 = Stats.Epley1Rm(s.WeightKg, s.Reps)!.Value })
                .OrderByDescending(x => x.E1)
                .First();
            return new
            {
                exerciseId = g.Key,
                exerciseName = best.Set.LoggedExercise!.Exercise?.Name ?? "",
                estimated1Rm = best.E1,
                weightKg = best.Set.WeightKg,
                reps = best.Set.Reps,
                performedOn = best.Set.LoggedExercise.Session!.PerformedOn,
            };
        })
        .OrderByDescending(r => r.estimated1Rm)
        .ToList();
    return Results.Ok(records);
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
        .Include(a => a.Plan!).ThenInclude(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.Exercise)
        .Include(a => a.Plan!).ThenInclude(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
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
    if (assignment?.Plan is not null)
    {
        var days = assignment.Plan.Days.OrderBy(d => d.WeekNumber).ThenBy(d => d.Order).ToList();
        var next = days.FirstOrDefault(d => !completedDayIds.Contains(d.Id)) ?? days.LastOrDefault();
        if (next is not null)
        {
            var maxes = await LatestMaxesAsync(db, access.ClientId);
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
        inProgressSession = inProgress,
    });
});

app.MapGet("/api/portal/{token}/sessions/{id:int}", async (string token, int id, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    return Results.Ok(await LoadSessionDto(db, id));
});

app.MapPost("/api/portal/{token}/sessions/start", async (string token, StartSessionInput input, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    input = input with { ClientId = access.ClientId };
    // Reuse trainer start endpoint logic by calling the same builder path inline:
    if (input.PlanDayId is not null && !await db.PlanDays.AnyAsync(d => d.Id == input.PlanDayId))
        return Results.NotFound();

    PlanDay? day = null;
    if (input.PlanDayId is not null)
    {
        day = await db.PlanDays
            .Include(d => d.Items).ThenInclude(i => i.Exercise)
            .Include(d => d.Items).ThenInclude(i => i.PrescribedSets)
            .FirstOrDefaultAsync(d => d.Id == input.PlanDayId);
    }

    var maxes = await LatestMaxesAsync(db, access.ClientId);
    var session = new WorkoutSession
    {
        ClientId = access.ClientId,
        AssignmentId = input.AssignmentId,
        PlanDayId = input.PlanDayId,
        PlanId = input.PlanId ?? day?.PlanId,
        PerformedOn = input.PerformedOn ?? DateOnly.FromDateTime(DateTime.UtcNow),
        Status = "in_progress",
    };

    if (day is not null)
    {
        var order = 0;
        foreach (var item in day.Items.OrderBy(i => i.Order))
        {
            maxes.TryGetValue(item.ExerciseId, out var oneRm);
            var topKg = TopLoadKg(item);
            var logged = new LoggedExercise { ExerciseId = item.ExerciseId, Order = order++, Note = item.Notes };
            if (item.PrescribedSets.Count > 0)
            {
                foreach (var s in item.PrescribedSets.OrderBy(x => x.Order))
                {
                    logged.Sets.Add(new LoggedSet
                    {
                        SetNumber = s.Order,
                        WeightKg = ComputedSetLoad(s, topKg, oneRm > 0 ? oneRm : null) ?? s.LoadKg,
                        Reps = s.Reps,
                        DurationSeconds = s.DurationSeconds,
                        DistanceMeters = s.DistanceMeters,
                        Rir = s.TargetRir,
                        Rpe = s.TargetRpe,
                        IsWarmup = s.Role == "warmup" || item.IsWarmup,
                    });
                }
            }
            else
            {
                var sets = item.Sets ?? item.Exercise?.DefaultSets ?? 3;
                var load = item.LoadKg
                    ?? (item.LoadPercent is not null && oneRm > 0
                        ? RoundToHalf(oneRm * item.LoadPercent.Value / 100.0)
                        : item.Exercise?.DefaultLoadKg);
                var measure = item.MeasureType ?? item.Exercise?.Type ?? "reps";
                for (var n = 1; n <= sets; n++)
                {
                    logged.Sets.Add(new LoggedSet
                    {
                        SetNumber = n,
                        WeightKg = measure == "reps" ? load : null,
                        Reps = measure == "reps" ? (item.Reps ?? item.Exercise?.DefaultReps) : null,
                        DurationSeconds = measure == "time"
                            ? (item.RepDurationSeconds ?? item.Exercise?.DefaultRepDurationSeconds)
                            : null,
                        DistanceMeters = measure == "distance"
                            ? (item.DistanceMeters ?? item.Exercise?.DefaultDistanceMeters)
                            : null,
                        Rir = item.TargetRir,
                        Rpe = item.TargetRpe,
                        IsWarmup = item.IsWarmup,
                    });
                }
            }
            session.Exercises.Add(logged);
        }
    }

    db.WorkoutSessions.Add(session);
    await db.SaveChangesAsync();
    return Results.Created($"/api/portal/{token}/sessions/{session.Id}", await LoadSessionDto(db, session.Id));
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
    session.AssignmentId = input.AssignmentId;
    session.PlanDayId = input.PlanDayId;
    session.PlanId = input.PlanId;
    session.PerformedOn = input.PerformedOn;
    session.DurationSeconds = input.DurationSeconds;
    session.Note = input.Note;
    session.Status = string.IsNullOrWhiteSpace(input.Status) ? session.Status : input.Status;
    db.LoggedExercises.RemoveRange(session.Exercises);
    session.Exercises = BuildSession(input).Exercises;
    await db.SaveChangesAsync();
    return Results.Ok(await LoadSessionDto(db, session.Id));
});

app.MapPatch("/api/portal/{token}/sessions/{id:int}/complete", async (string token, int id, AppDb db) =>
{
    var access = await ResolvePortalToken(db, token);
    if (access is null) return Results.NotFound(new { message = "Link jest nieaktualny." });
    var session = await db.WorkoutSessions.FindAsync(id);
    if (session is null || session.ClientId != access.ClientId) return Results.NotFound();
    session.Status = "completed";
    if (session.DurationSeconds is null)
        session.DurationSeconds = (int)Math.Max(60, (DateTime.UtcNow - session.CreatedAt).TotalSeconds);
    await db.SaveChangesAsync();
    return Results.Ok(await LoadSessionDto(db, session.Id));
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
