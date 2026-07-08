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

app.MapGet("/api/exercises", async (AppDb db) =>
    await db.Exercises.OrderBy(e => e.Name).ToListAsync());

app.MapPost("/api/exercises", async (ExerciseInput input, AppDb db) =>
{
    var exercise = new Exercise
    {
        Name = input.Name,
        Description = input.Description,
        Type = input.Type,
        DefaultSets = input.DefaultSets,
        DefaultReps = input.DefaultReps,
        DefaultRepDurationSeconds = input.DefaultRepDurationSeconds,
        DefaultDistanceMeters = input.DefaultDistanceMeters,
        DefaultRestBetweenSetsSeconds = input.DefaultRestBetweenSetsSeconds,
        DefaultLoadKg = input.DefaultLoadKg,
    };
    db.Exercises.Add(exercise);
    await db.SaveChangesAsync();
    return Results.Created($"/api/exercises/{exercise.Id}", exercise);
});

app.MapPut("/api/exercises/{id:int}", async (int id, ExerciseInput input, AppDb db) =>
{
    var exercise = await db.Exercises.FindAsync(id);
    if (exercise is null) return Results.NotFound();
    exercise.Name = input.Name;
    exercise.Description = input.Description;
    exercise.Type = input.Type;
    exercise.DefaultSets = input.DefaultSets;
    exercise.DefaultReps = input.DefaultReps;
    exercise.DefaultRepDurationSeconds = input.DefaultRepDurationSeconds;
    exercise.DefaultDistanceMeters = input.DefaultDistanceMeters;
    exercise.DefaultRestBetweenSetsSeconds = input.DefaultRestBetweenSetsSeconds;
    exercise.DefaultLoadKg = input.DefaultLoadKg;
    await db.SaveChangesAsync();
    return Results.Ok(exercise);
});

app.MapDelete("/api/exercises/{id:int}", async (int id, AppDb db) =>
{
    var used = await db.PlanItems.AnyAsync(i => i.ExerciseId == id);
    if (used) return Results.Conflict(new { message = "Ćwiczenie jest używane w planie — najpierw usuń je z planów." });
    var exercise = await db.Exercises.FindAsync(id);
    if (exercise is null) return Results.NotFound();
    db.Exercises.Remove(exercise);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---------- Plany ----------

// Zaokrąglenie do 0,5 kg (najmniejszy talerzyk).
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

// Wyliczony ciężar serii: bezwzględny, albo % od topu tej pozycji. Baza "1rm" wymaga kontekstu klienta (osobny spec) → null.
static double? ComputedSetLoad(PlanSet set, double? topKg)
{
    if (set.LoadKg is not null) return set.LoadKg;
    if (set.LoadPercent is not null && set.PercentOf == "top" && topKg is not null)
        return RoundToHalf(topKg.Value * set.LoadPercent.Value / 100.0);
    return null;
}

static object ItemToDto(PlanItem i)
{
    var topKg = TopLoadKg(i);
    return new
    {
        i.Id, i.ExerciseId, i.Order, i.SupersetGroup,
        ExerciseName = i.Exercise!.Name,
        ExerciseType = i.Exercise.Type,
        ExerciseDescription = i.Exercise.Description,
        // Efektywne parametry: nadpisanie z planu albo default z ćwiczenia
        Sets = i.Sets ?? i.Exercise.DefaultSets,
        Reps = i.Reps ?? i.Exercise.DefaultReps,
        i.RepsMax,
        RepDurationSeconds = i.RepDurationSeconds ?? i.Exercise.DefaultRepDurationSeconds,
        i.RepDurationSecondsMax,
        DistanceMeters = i.DistanceMeters ?? i.Exercise.DefaultDistanceMeters,
        i.Tempo,
        i.TargetRpe,
        i.TargetRir,
        i.SetScheme,
        RestBetweenSetsSeconds = i.RestBetweenSetsSeconds ?? i.Exercise.DefaultRestBetweenSetsSeconds,
        i.RestAfterExerciseSeconds,
        LoadKg = i.LoadKg ?? i.Exercise.DefaultLoadKg,
        i.Notes,
        Overrides = new { i.Sets, i.Reps, i.RepsMax, i.RepDurationSeconds, i.RepDurationSecondsMax, i.DistanceMeters, i.RestBetweenSetsSeconds, i.LoadKg },
        PrescribedSets = i.PrescribedSets.OrderBy(s => s.Order).Select(s => new
        {
            s.Id, s.Order, s.Reps, s.RepsMax, s.DurationSeconds, s.DistanceMeters,
            s.LoadKg, s.LoadPercent, s.PercentOf, s.TargetRpe, s.TargetRir, s.Tempo, s.Role, s.Note,
            ComputedLoadKg = ComputedSetLoad(s, topKg),
        }),
    };
}

static object PlanToDto(Plan plan)
{
    var days = plan.Days.OrderBy(d => d.WeekNumber).ThenBy(d => d.Order).ToList();
    return new
    {
        plan.Id, plan.Name, plan.Description, plan.IsTemplate, plan.CreatedAt,
        Days = days.Select(d => new
        {
            d.Id, d.WeekNumber, d.Order, d.Label, d.Notes,
            Items = d.Items.OrderBy(i => i.Order).Select(ItemToDto),
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
    ExerciseId = i.ExerciseId, Order = i.Order, SupersetGroup = i.SupersetGroup,
    Sets = i.Sets, Reps = i.Reps, RepsMax = i.RepsMax,
    RepDurationSeconds = i.RepDurationSeconds, RepDurationSecondsMax = i.RepDurationSecondsMax,
    DistanceMeters = i.DistanceMeters, Tempo = i.Tempo, TargetRpe = i.TargetRpe, TargetRir = i.TargetRir, SetScheme = i.SetScheme,
    RestBetweenSetsSeconds = i.RestBetweenSetsSeconds, RestAfterExerciseSeconds = i.RestAfterExerciseSeconds ?? 90,
    LoadKg = i.LoadKg, Notes = i.Notes,
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
    return plans.Select(PlanToDto);
});

app.MapGet("/api/plans/{id:int}", async (int id, AppDb db) =>
{
    var plan = await db.Plans
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.Exercise)
        .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
        .Include(p => p.Assignments)
        .FirstOrDefaultAsync(p => p.Id == id);
    return plan is null ? Results.NotFound() : Results.Ok(PlanToDto(plan));
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
                ExerciseId = i.ExerciseId, Order = i.Order, SupersetGroup = i.SupersetGroup,
                Sets = i.Sets, Reps = i.Reps, RepsMax = i.RepsMax,
                RepDurationSeconds = i.RepDurationSeconds, RepDurationSecondsMax = i.RepDurationSecondsMax,
                DistanceMeters = i.DistanceMeters, Tempo = i.Tempo, TargetRpe = i.TargetRpe, TargetRir = i.TargetRir, SetScheme = i.SetScheme,
                RestBetweenSetsSeconds = i.RestBetweenSetsSeconds, RestAfterExerciseSeconds = i.RestAfterExerciseSeconds,
                LoadKg = i.LoadKg, Notes = i.Notes,
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
